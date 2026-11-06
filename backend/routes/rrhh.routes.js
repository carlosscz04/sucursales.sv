// ============================================================================
// RUTAS DE RECURSOS HUMANOS Y NÓMINA QUINCENAL
// Desarrollado por: Integrante 4 (feature/backend-rrhh-nomina)
// ============================================================================

import { Router } from "express";
import { guardarDatosSucursal } from "../data/database.js";
import { soloGerencia } from "./auth.routes.js";
import { calcularPlanillaEmpleado } from "../services/nomina.service.js";

const router = Router();

// Bloque 1: GET /api/rrhh/empleados - Obtener lista de empleados
router.get("/empleados", soloGerencia, (req, res) => {
  res.json(req.datosSucursal.empleados);
});

// Bloque 2: POST /api/rrhh/empleados - Agregar nuevo empleado
router.post("/empleados", soloGerencia, (req, res) => {
  const { empleados } = req.datosSucursal;
  const { nombre, cargo, salarioQuincenal } = req.body;
  const nombreNormalizado = typeof nombre === "string" ? nombre.trim() : "";
  const cargoNormalizado = typeof cargo === "string" ? cargo.trim() : "";
  const salario = Number(salarioQuincenal);
  if (!nombreNormalizado || !cargoNormalizado || !Number.isFinite(salario) || salario <= 0) {
    return res.status(400).json({ mensaje: "Ingresa el nombre, cargo y un salario quincenal válido mayor que cero." });
  }

  const nuevo = {
    id: `EMP-${Date.now()}-${empleados.length}`,
    sucursalId: req.sucursalId,
    nombre: nombreNormalizado,
    cargo: cargoNormalizado,
    salarioQuincenal: Number(salario.toFixed(2))
  };
  empleados.push(nuevo);
  try {
    guardarDatosSucursal(req.sucursalId);
  } catch (error) {
    empleados.pop();
    console.error(error);
    return res.status(500).json({ mensaje: "No se pudo guardar el empleado de esta sucursal." });
  }
  res.status(201).json({ mensaje: "Empleado registrado exitosamente", empleado: nuevo });
});

// Bloque 3: GET /api/rrhh/planilla - Generar planilla quincenal calculada
router.get("/planilla", (req, res) => {
  if (req.usuario.rol !== "admin") {
    return res.status(403).json({ mensaje: "Solo el gerente de esta sucursal puede consultar la planilla." });
  }
  const { empleados } = req.datosSucursal;
  const planillaCalculada = empleados.map(emp => calcularPlanillaEmpleado(emp));
  
  const totales = planillaCalculada.reduce((acc, curr) => {
    acc.totalBruto += curr.salarioBruto;
    acc.totalISSS += curr.isss;
    acc.totalAFP += curr.afp;
    acc.totalISR += curr.isr;
    acc.totalNeto += curr.salarioNeto;
    return acc;
  }, { totalBruto: 0, totalISSS: 0, totalAFP: 0, totalISR: 0, totalNeto: 0 });

  res.json({
    detalles: planillaCalculada,
    resumenGlobal: {
      totalBruto: Number(totales.totalBruto.toFixed(2)),
      totalISSS: Number(totales.totalISSS.toFixed(2)),
      totalAFP: Number(totales.totalAFP.toFixed(2)),
      totalISR: Number(totales.totalISR.toFixed(2)),
      totalNeto: Number(totales.totalNeto.toFixed(2))
    }
  });
});

export default router;
