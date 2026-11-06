import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import {
  crearDatosSucursal,
  descartarDatosSucursal,
  guardarDatosSucursal,
  guardarSucursales,
  guardarUsuarios,
  obtenerDatosSucursal,
  sucursales,
  usuarios
} from "../data/database.js";
import { abrirTurnoCaja, cerrarTurnoCaja } from "../services/caja.service.js";

const router = Router();
const sesiones = new Map();
const HASH_BYTES = 64;
const DEPARTAMENTOS = new Set([
  "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán", "La Libertad", "La Paz",
  "La Unión", "Morazán", "San Miguel", "San Salvador", "San Vicente",
  "Santa Ana", "Sonsonate", "Usulután"
]);

function respuestaUsuario(usuario) {
  const { username, nombre, rol, sucursalId } = usuario;
  return { username, nombre, rol, sucursalId };
}

function normalizarCredenciales({ username, password, nombre }) {
  const nombreNormalizado = typeof nombre === "string" ? nombre.trim() : "";
  const usuarioNormalizado = typeof username === "string" ? username.trim().toLowerCase() : "";

  if (!nombreNormalizado || !/^[a-z0-9._-]{3,30}$/.test(usuarioNormalizado)) {
    const error = new Error("Ingresa el nombre y un usuario de 3 a 30 caracteres (letras, números, punto, guion o guion bajo).");
    error.status = 400;
    throw error;
  }
  if (typeof password !== "string" || password.length < 8) {
    const error = new Error("La contraseña debe tener al menos 8 caracteres.");
    error.status = 400;
    throw error;
  }
  return { nombre: nombreNormalizado, username: usuarioNormalizado, password };
}

function validarMontoInicial(value) {
  const monto = Number(value);
  if (value === "" || !Number.isFinite(monto) || monto < 0) {
    const error = new Error("El monto inicial debe ser un número válido igual o mayor que cero.");
    error.status = 400;
    throw error;
  }
  return monto;
}

function normalizarSucursal({ nombre, departamento, municipio }) {
  const sucursal = {
    nombre: typeof nombre === "string" ? nombre.trim() : "",
    departamento: typeof departamento === "string" ? departamento.trim() : "",
    municipio: typeof municipio === "string" ? municipio.trim() : ""
  };
  if (!sucursal.nombre || sucursal.nombre.length > 100
    || !DEPARTAMENTOS.has(sucursal.departamento)
    || !sucursal.municipio || sucursal.municipio.length > 100) {
    const error = new Error("Ingresa el nombre, departamento y municipio de la sucursal.");
    error.status = 400;
    throw error;
  }
  return sucursal;
}

function registrarSucursal(sucursal, credenciales, montoInicial) {
  if (sucursales.some(item =>
    item.nombre.toLowerCase() === sucursal.nombre.toLowerCase()
      && item.departamento === sucursal.departamento
      && item.municipio.toLowerCase() === sucursal.municipio.toLowerCase()
  )) {
    const error = new Error("Ya existe una sucursal con ese nombre y ubicación.");
    error.status = 409;
    throw error;
  }

  const nuevaSucursal = { id: randomUUID(), ...sucursal, creadaEn: new Date().toISOString() };
  const usuario = {
    ...credenciales,
    rol: "admin",
    sucursalId: nuevaSucursal.id,
    salt: randomBytes(16).toString("hex"),
    passwordHash: ""
  };
  usuario.passwordHash = scryptSync(usuario.password, usuario.salt, HASH_BYTES).toString("hex");
  delete usuario.password;

  sucursales.push(nuevaSucursal);
  usuarios.push(usuario);
  try {
    crearDatosSucursal(nuevaSucursal.id);
    guardarUsuarios();
    guardarSucursales();
  } catch (error) {
    usuarios.splice(usuarios.indexOf(usuario), 1);
    sucursales.splice(sucursales.indexOf(nuevaSucursal), 1);
    try {
      guardarUsuarios();
      guardarSucursales();
      descartarDatosSucursal(nuevaSucursal.id);
    } catch (rollbackError) {
      console.error("No se pudo completar la reversión del registro de sucursal.", rollbackError);
    }
    throw error;
  }
  return { sucursal: nuevaSucursal, usuario, turno: null };
}

function iniciarSesion(usuario, montoInicial, res) {
  const datosSucursal = obtenerDatosSucursal(usuario.sucursalId);
  const turnoActivo = datosSucursal.turnosCaja.find(turno => turno.estado === "ABIERTO");
  let turno;
  let reanudado = false;

  if (turnoActivo) {
    if (turnoActivo.cajero !== usuario.nombre) {
      const error = new Error(`La caja sigue abierta por ${turnoActivo.cajero}. Cierra ese turno antes de iniciar otro.`);
      error.status = 409;
      throw error;
    }
    turno = turnoActivo;
    reanudado = true;
  } else {
    turno = abrirTurnoCaja(datosSucursal, usuario.sucursalId, usuario.nombre, montoInicial, () => guardarDatosSucursal(usuario.sucursalId));
  }

  const token = randomBytes(32).toString("hex");
  const sesion = respuestaUsuario(usuario);
  sesiones.set(token, sesion);
  return res.json({
    token,
    usuario: sesion,
    sucursal: sucursales.find(item => item.id === usuario.sucursalId),
    turno,
    reanudado
  });
}

function autenticar(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  const usuario = token && sesiones.get(token);
  if (!usuario || !sucursales.some(sucursal => sucursal.id === usuario.sucursalId)) {
    return res.status(401).json({ mensaje: "La sesión expiró o no es válida. Inicia sesión nuevamente." });
  }
  req.usuario = usuario;
  req.sucursalId = usuario.sucursalId;
  try {
    req.datosSucursal = obtenerDatosSucursal(usuario.sucursalId);
  } catch (error) {
    return res.status(500).json({ mensaje: "No se pudieron cargar los datos de la sucursal." });
  }
  req.tokenSesion = token;
  next();
}

function soloGerencia(req, res, next) {
  if (req.usuario.rol !== "admin") {
    return res.status(403).json({ mensaje: "Solo el gerente de esta sucursal puede realizar esta operación." });
  }
  next();
}

function manejarError(res, error) {
  if (error.status) return res.status(error.status).json({ mensaje: error.message });
  console.error(error);
  return res.status(500).json({ mensaje: "No se pudo completar la operación." });
}

router.get("/status", (_req, res) => {
  res.json({ configurado: sucursales.length > 0 });
});

router.get("/sucursales", (_req, res) => {
  res.json(sucursales.map(({ id, nombre, departamento, municipio }) => ({
    id,
    nombre,
    departamento,
    municipio
  })));
});

router.post("/setup", (req, res) => {
  if (sucursales.length > 0 || usuarios.length > 0) {
    return res.status(409).json({ mensaje: "La configuración inicial ya fue completada." });
  }

  try {
    const ubicacion = normalizarSucursal(req.body.sucursal || {});
    const credenciales = normalizarCredenciales(req.body);
    const montoInicial = validarMontoInicial(req.body.montoInicial);
    const creado = registrarSucursal(ubicacion, credenciales, montoInicial);
    return iniciarSesion(creado.usuario, montoInicial, res);
  } catch (error) {
    return manejarError(res, error);
  }
});

router.post("/sucursales", autenticar, soloGerencia, (req, res) => {
  try {
    const ubicacion = normalizarSucursal(req.body.sucursal || {});
    const credenciales = normalizarCredenciales(req.body.gerente || {});
    const creado = registrarSucursal(ubicacion, credenciales, null);
    return res.status(201).json({
      mensaje: "Sucursal registrada con inventario independiente y cuenta gerente.",
      sucursal: creado.sucursal,
      gerente: respuestaUsuario(creado.usuario)
    });
  } catch (error) {
    return manejarError(res, error);
  }
});

router.post("/login", (req, res) => {
  const username = typeof req.body.username === "string" ? req.body.username.trim().toLowerCase() : "";
  const password = req.body.password;
  const { sucursalId, rol } = req.body;
  if (typeof password !== "string" || !["admin", "cajero"].includes(rol) || typeof sucursalId !== "string") {
    return res.status(400).json({ mensaje: "Selecciona la sucursal, el rol e ingresa tus credenciales." });
  }

  const usuario = usuarios.find(item =>
    item.username === username && item.sucursalId === sucursalId && item.rol === rol
  );
  if (!usuario) return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos para la sucursal y rol seleccionados." });

  const passwordHash = scryptSync(password, usuario.salt, HASH_BYTES);
  const hashGuardado = Buffer.from(usuario.passwordHash, "hex");
  if (hashGuardado.length !== HASH_BYTES || !timingSafeEqual(passwordHash, hashGuardado)) {
    return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos para la sucursal y rol seleccionados." });
  }

  try {
    iniciarSesion(usuario, validarMontoInicial(req.body.montoInicial), res);
  } catch (error) {
    return manejarError(res, error);
  }
});

router.get("/session", autenticar, (req, res) => {
  res.json({
    usuario: req.usuario,
    sucursal: sucursales.find(item => item.id === req.sucursalId),
    turno: req.datosSucursal.turnosCaja.find(turno => turno.estado === "ABIERTO") || null
  });
});

router.get("/users", autenticar, soloGerencia, (req, res) => {
  res.json(usuarios.filter(usuario => usuario.sucursalId === req.sucursalId).map(respuestaUsuario));
});

router.post("/users", autenticar, soloGerencia, (req, res) => {
  try {
    const { nombre, username, password } = normalizarCredenciales(req.body);
    if (usuarios.some(usuario => usuario.sucursalId === req.sucursalId && usuario.username === username)) {
      return res.status(409).json({ mensaje: "Ese nombre de usuario ya está registrado en esta sucursal." });
    }

    const usuario = {
      nombre,
      username,
      rol: "cajero",
      sucursalId: req.sucursalId,
      salt: randomBytes(16).toString("hex"),
      passwordHash: ""
    };
    usuario.passwordHash = scryptSync(password, usuario.salt, HASH_BYTES).toString("hex");
    usuarios.push(usuario);
    try {
      guardarUsuarios();
    } catch (error) {
      usuarios.pop();
      throw error;
    }
    return res.status(201).json({
      mensaje: "Cuenta de cajero creada correctamente para esta sucursal.",
      usuario: respuestaUsuario(usuario)
    });
  } catch (error) {
    return manejarError(res, error);
  }
});

router.post("/logout", autenticar, (req, res) => {
  try {
    const turnoActivo = req.datosSucursal.turnosCaja.find(turno => turno.estado === "ABIERTO");
    let resumenCierre = null;
    if (turnoActivo) {
      if (turnoActivo.cajero !== req.usuario.nombre) {
        return res.status(409).json({ mensaje: "El turno abierto pertenece a otro cajero y no puede cerrarse desde esta sesión." });
      }
      resumenCierre = cerrarTurnoCaja(
        req.datosSucursal,
        req.body.efectivoContado,
        () => guardarDatosSucursal(req.sucursalId)
      );
    }

    sesiones.delete(req.tokenSesion);
    res.json({
      mensaje: "Sesión cerrada correctamente.",
      resumenCierre
    });
  } catch (error) {
    return manejarError(res, error);
  }
});

export { autenticar, soloGerencia };
export default router;
