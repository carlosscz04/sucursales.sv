// ============================================================================
// RUTAS DE APERTURA, ARQUEO Y CIERRE DE CAJA
// Desarrollado por: Integrante 3 (feature/backend-compras-caja)
// Controla los flujos de efectivo, tarjetas y Bitcoin/Chivo Wallet por turno.
// ============================================================================

import { Router } from "express";
import { guardarDatosSucursal } from "../data/database.js";
import { abrirTurnoCaja, cerrarTurnoCaja } from "../services/caja.service.js";
import { soloGerencia } from "./auth.routes.js";

const router = Router();

// Bloque 1: GET /api/caja/turno-activo - Consultar estado del turno actual
router.get("/turno-activo", (req, res) => {
  const turno = req.datosSucursal.turnosCaja.find(t => t.estado === "ABIERTO");
  res.json(turno || null);
});

// Bloque 2: POST /api/caja/aperturar - Aperturar un nuevo turno de caja
router.post("/aperturar", soloGerencia, (req, res) => {
  const cajero = req.usuario.nombre;
  const montoInicial = Number(req.body.montoInicial);

  if (req.body.montoInicial === "" || !Number.isFinite(montoInicial) || montoInicial < 0) {
    return res.status(400).json({ mensaje: "El monto inicial debe ser un número válido igual o mayor que cero." });
  }

  try {
    const turno = abrirTurnoCaja(
      req.datosSucursal,
      req.sucursalId,
      cajero,
      montoInicial,
      () => guardarDatosSucursal(req.sucursalId)
    );
    return res.status(201).json({ mensaje: "Turno de caja aperturado correctamente", turno });
  } catch (error) {
    return res.status(error.status || 500).json({ mensaje: error.message });
  }
});

router.get("/turnos", soloGerencia, (req, res) => {
  res.json([...req.datosSucursal.turnosCaja].reverse());
});

// Bloque 3: POST /api/caja/cerrar - Cuadre y cierre del turno de caja
router.post("/cerrar", soloGerencia, (req, res) => {
  try {
    return res.json({
      mensaje: "Turno de caja cerrado correctamente",
      resumenCierre: cerrarTurnoCaja(
        req.datosSucursal,
        req.body.efectivoContado,
        () => guardarDatosSucursal(req.sucursalId)
      )
    });
  } catch (error) {
    return res.status(error.status || 500).json({ mensaje: error.message });
  }
});

export default router;
