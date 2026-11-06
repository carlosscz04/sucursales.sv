// ============================================================================
// RUTAS DE VENTAS Y FACTURACIÓN (POS)
// Desarrollado por: Integrante 1 (feature/backend-core-pos)
// Procesa órdenes de venta, calcula el 13% de IVA y genera comprobantes legalmente válidos.
// ============================================================================

import { Router } from "express";
import { guardarDatosSucursal } from "../data/database.js";
import { verificarStockDisponible, descontarInventarioPorVenta } from "../services/recetas.service.js";

const router = Router();

// Bloque 1: GET /api/pos/productos - Obtener catálogo de productos activos
router.get("/productos", (req, res) => {
  res.json(req.datosSucursal.productos);
});

// Bloque 2: POST /api/pos/ventas - Procesar una nueva venta
router.post("/ventas", (req, res) => {
  const datosSucursal = req.datosSucursal;
  const { productos, turnosCaja } = datosSucursal;
  const { tipoDocumento, cliente, nitNrf, items, metodoPago } = req.body;

  // 1. Validar que exista un turno de caja abierto
  const turnoActivo = turnosCaja.find(t => t.estado === "ABIERTO");
  if (!turnoActivo) {
    return res.status(400).json({ mensaje: "No hay un turno de caja abierto. Aperture caja antes de vender." });
  }

  // 2. Validar que la orden contenga ítems
  if (!items || items.length === 0) {
    return res.status(400).json({ mensaje: "El carrito de compras está vacío." });
  }
  if (!Array.isArray(items) || items.some(item =>
    !productos.some(producto => producto.id === item.productoId)
      || !Number.isFinite(Number(item.cantidad))
      || Number(item.cantidad) <= 0
  )) {
    return res.status(400).json({ mensaje: "El carrito contiene productos o cantidades no válidas." });
  }
  if (!["Efectivo", "Tarjeta", "Bitcoin/Chivo"].includes(metodoPago)) {
    return res.status(400).json({ mensaje: "Selecciona un método de pago válido." });
  }
  if (tipoDocumento !== "CCF" && tipoDocumento !== "Consumidor Final") {
    return res.status(400).json({ mensaje: "Selecciona un tipo de comprobante válido." });
  }

  // 3. Validar disponibilidad en inventario
  const cheqStock = verificarStockDisponible(items, datosSucursal);
  if (!cheqStock.valido) {
    return res.status(400).json({ mensaje: "Stock insuficiente para procesar la orden", detalles: cheqStock.errores });
  }

  // 4. Calcular Subtotal, IVA 13% y Total según tipo de documento
  let subtotal = 0;
  const itemsDetalle = items.map(it => {
    const p = productos.find(prod => prod.id === it.productoId);
    const totalLinea = Number((p.precio * it.cantidad).toFixed(2));
    subtotal += totalLinea;
    return {
      productoId: p.id,
      nombre: p.nombre,
      precioUnitario: p.precio,
      cantidad: it.cantidad,
      totalLinea
    };
  });

  const TASA_IVA = 0.13;
  let iva = 0;
  let total = 0;

  if (tipoDocumento === "CCF") {
    // Crédito Fiscal: Subtotal neto + IVA 13% adicionado
    iva = Number((subtotal * TASA_IVA).toFixed(2));
    total = Number((subtotal + iva).toFixed(2));
  } else {
    // Consumidor Final: El precio ya incluye IVA
    total = Number(subtotal.toFixed(2));
    subtotal = Number((total / (1 + TASA_IVA)).toFixed(2));
    iva = Number((total - subtotal).toFixed(2));
  }

  const estadoAnterior = structuredClone(datosSucursal);

  // 5. Asignar correlativo legal
  let numeroDocumento = "";
  if (tipoDocumento === "CCF") {
    numeroDocumento = `CCF-001-${datosSucursal.correlativoCCF++}`;
  } else {
    numeroDocumento = `FAC-001-${datosSucursal.correlativoFactura++}`;
  }

  // 6. Realizar el descuento real del inventario
  descontarInventarioPorVenta(items, datosSucursal);

  // 7. Registrar la venta en la caja del turno activo
  if (metodoPago === "Efectivo") turnoActivo.ventasEfectivo += total;
  else if (metodoPago === "Tarjeta") turnoActivo.ventasTarjeta += total;
  else if (metodoPago === "Bitcoin/Chivo") turnoActivo.ventasBitcoin += total;
  // 8. Guardar la venta en la base de datos
  const nuevaVenta = {
    id: `VTA-${Date.now()}`,
    numeroDocumento,
    tipoDocumento,
    cliente: cliente || "Cliente General",
    nitNrf: nitNrf || "N/A",
    fecha: new Date().toISOString(),
    items: itemsDetalle,
    subtotal,
    iva,
    total,
    metodoPago,
    cajero: turnoActivo.cajero,
    sucursalId: req.sucursalId
  };

  datosSucursal.ventas.push(nuevaVenta);
  try {
    guardarDatosSucursal(req.sucursalId);
  } catch (error) {
    Object.assign(datosSucursal, estadoAnterior);
    console.error(error);
    return res.status(500).json({ mensaje: "No se pudo guardar la venta de esta sucursal." });
  }
  res.status(201).json({ mensaje: "Venta procesada exitosamente", venta: nuevaVenta });
});

// Bloque 3: GET /api/pos/ventas - Historial de ventas
router.get("/ventas", (req, res) => {
  if (req.usuario.rol !== "admin") {
    return res.status(403).json({ mensaje: "Solo el gerente de esta sucursal puede consultar el historial de ventas." });
  }
  res.json(req.datosSucursal.ventas);
});

export default router;
