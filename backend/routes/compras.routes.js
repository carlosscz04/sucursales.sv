// ============================================================================
// RUTAS DE COMPRAS Y PROVEEDORES (CUENTAS POR PAGAR)
// Desarrollado por: Integrante 3 (feature/backend-compras-caja)
// Permite registrar facturas de compra de insumos, aumentando stock y afectando costos.
// ============================================================================

import { Router } from "express";
import { guardarDatosSucursal } from "../data/database.js";
import { soloGerencia } from "./auth.routes.js";

const router = Router();

// Bloque 1: GET /api/compras - Listar compras registradas
router.get("/", soloGerencia, (req, res) => {
  res.json(req.datosSucursal.compras);
});

// Bloque 2: POST /api/compras - Registrar compra de insumos/productos
router.post("/", soloGerencia, (req, res) => {
  const { compras, insumos } = req.datosSucursal;
  const { proveedor, numFactura, items, fecha, fechaVencimiento } = req.body;

  if (typeof proveedor !== "string" || !proveedor.trim()
    || typeof numFactura !== "string" || !numFactura.trim()) {
    return res.status(400).json({ mensaje: "El proveedor y el número de factura son obligatorios." });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ mensaje: "Debe incluir al menos un ítem en la compra." });
  }

  if (compras.some(compra =>
    compra.proveedor.trim().toLowerCase() === proveedor.trim().toLowerCase()
      && compra.numFactura.trim().toLowerCase() === numFactura.trim().toLowerCase()
  )) {
    return res.status(409).json({ mensaje: "Ya existe una factura con ese número para este proveedor." });
  }

  const itemsValidados = [];
  for (const item of items) {
    const cantidad = Number(item.cantidad);
    const costoUnitario = Number(item.costoUnitario);
    if (!Number.isFinite(cantidad) || cantidad <= 0
      || !Number.isFinite(costoUnitario) || costoUnitario < 0) {
      return res.status(400).json({ mensaje: "Cada ítem debe tener una cantidad y un costo válidos." });
    }

    if (item.tipo === "insumo") {
      const insumoBase = insumos.find(i => i.id === item.id);
      if (!insumoBase) {
        return res.status(400).json({ mensaje: `El insumo ${item.id || ""} no existe.` });
      }
      itemsValidados.push({
        tipo: "insumo",
        id: insumoBase.id,
        nombre: insumoBase.nombre,
        cantidad,
        costoUnitario
      });
    } else if (item.tipo === "gasto" && typeof item.nombre === "string" && item.nombre.trim()) {
      itemsValidados.push({
        tipo: "gasto",
        categoria: typeof item.categoria === "string" && item.categoria.trim() ? item.categoria.trim() : "Otros",
        nombre: item.nombre.trim(),
        cantidad,
        costoUnitario
      });
    } else {
      return res.status(400).json({ mensaje: "Cada línea debe ser un insumo registrado o un gasto con descripción." });
    }
  }

  const totalCompra = itemsValidados.reduce((total, item) => total + item.cantidad * item.costoUnitario, 0);
  const totalCostos = itemsValidados
    .filter(item => item.tipo === "insumo")
    .reduce((total, item) => total + item.cantidad * item.costoUnitario, 0);
  const totalGastos = totalCompra - totalCostos;

  const nuevaCompra = {
    id: `CMP-${Date.now()}`,
    sucursalId: req.sucursalId,
    proveedor: proveedor.trim(),
    numFactura: numFactura.trim(),
    fecha: fecha || new Date().toISOString(),
    fechaVencimiento: fechaVencimiento || null,
    items: itemsValidados.map(item => ({
      ...item,
      subtotal: Number((item.cantidad * item.costoUnitario).toFixed(2))
    })),
    totalCompra: Number(totalCompra.toFixed(2)),
    totalCostos: Number(totalCostos.toFixed(2)),
    totalGastos: Number(totalGastos.toFixed(2)),
    estadoPago: "Pendiente de Pago (CXP)"
  };

  const estadoAnterior = structuredClone(req.datosSucursal);

  // Aplicar existencias y costo promedio solo después de validar toda la factura.
  for (const item of itemsValidados) {
    if (item.tipo === "insumo") {
      const insumoBase = insumos.find(insumo => insumo.id === item.id);
      const valorExistencia = insumoBase.stock * insumoBase.costoUnitario;
      const nuevaExistencia = insumoBase.stock + item.cantidad;
      insumoBase.stock = nuevaExistencia;
      insumoBase.costoUnitario = Number(
        ((valorExistencia + item.cantidad * item.costoUnitario) / nuevaExistencia).toFixed(4)
      );
    }
  }

  compras.push(nuevaCompra);
  try {
    guardarDatosSucursal(req.sucursalId);
  } catch (error) {
    Object.assign(req.datosSucursal, estadoAnterior);
    console.error(error);
    return res.status(500).json({ mensaje: "No se pudo guardar la factura de compra." });
  }
  res.status(201).json({
    mensaje: "Factura registrada; inventario y cuentas por pagar actualizados.",
    compra: nuevaCompra
  });
});

export default router;
