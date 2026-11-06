// ============================================================================
// RUTAS DE INVENTARIOS Y ALERTAS DE STOCK MÍNIMO
// Desarrollado por: Integrante 2 (feature/backend-inventario-recetas)
// ============================================================================

import { Router } from "express";
import { soloGerencia } from "./auth.routes.js";

const router = Router();

// Bloque 1: GET /api/inventario/insumos - Consultar insumos y materias primas
router.get("/insumos", soloGerencia, (req, res) => {
  res.json(req.datosSucursal.insumos);
});

// Bloque 2: GET /api/inventario/alertas - Obtener alertas de insumos y reventa bajo stock mínimo
router.get("/alertas", soloGerencia, (req, res) => {
  const { insumos, productos } = req.datosSucursal;
  const insumosAlertas = insumos.filter(i => i.stock <= i.stockMinimo);
  const reventaAlertas = productos.filter(p => p.tipo === "reventa" && p.stock <= p.stockMinimo);

  res.json({
    insumosBajoStock: insumosAlertas,
    reventaBajoStock: reventaAlertas,
    totalAlertas: insumosAlertas.length + reventaAlertas.length
  });
});

export default router;
