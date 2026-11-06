// ============================================================================
// BASE DE DATOS EN MEMORIA - RESTAURANTE ORÍGENES SV
// Desarrollado por: Integrante 2 (feature/backend-inventario-recetas)
// Este archivo simula la persistencia de datos para insumos, productos, ventas,
// compras, turnos de caja y empleados.
// ============================================================================

import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDirectory = fileURLToPath(new URL(".", import.meta.url));
const branchesDirectory = join(dataDirectory, "sucursales");

function loadJson(fileName, fallback) {
  try {
    const targetPath = isAbsolute(fileName) ? fileName : join(dataDirectory, fileName);
    return JSON.parse(readFileSync(targetPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function saveJson(filePath, data) {
  const temporaryPath = `${filePath}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(data, null, 2));
  renameSync(temporaryPath, filePath);
}

function filePath(fileName) {
  return join(dataDirectory, fileName);
}

const sucursalesGuardadas = loadJson("sucursales.json", []);
const usuariosGuardados = loadJson("usuarios-sucursales.json", []);
if (!Array.isArray(sucursalesGuardadas) || !Array.isArray(usuariosGuardados)) {
  throw new Error("Los archivos de sucursales o usuarios tienen un formato inválido.");
}

export const sucursales = sucursalesGuardadas;
export const usuarios = usuariosGuardados;
export const guardarSucursales = () => saveJson(filePath("sucursales.json"), sucursales);
export const guardarUsuarios = () => saveJson(filePath("usuarios-sucursales.json"), usuarios);

// 1. Insumos o Materias Primas (Inventario de insumos)
const insumosBase = [
  { id: "INS-01", nombre: "Café Especialidad (g)", stock: 5000, unidad: "g", stockMinimo: 1000, costoUnitario: 0.02 },
  { id: "INS-02", nombre: "Leche Entera (ml)", stock: 20000, unidad: "ml", stockMinimo: 5000, costoUnitario: 0.0015 },
  { id: "INS-03", nombre: "Vaso 16oz (unidad)", stock: 300, unidad: "unidad", stockMinimo: 50, costoUnitario: 0.10 },
  { id: "INS-04", nombre: "Tapadera 16oz (unidad)", stock: 300, unidad: "unidad", stockMinimo: 50, costoUnitario: 0.03 },
  { id: "INS-05", nombre: "Viñeta Orígenes (unidad)", stock: 500, unidad: "unidad", stockMinimo: 100, costoUnitario: 0.02 },
  { id: "INS-06", nombre: "Jarabe de Caramelo (ml)", stock: 2000, unidad: "ml", stockMinimo: 400, costoUnitario: 0.01 },
  { id: "INS-07", nombre: "Polvo de Chocolate (g)", stock: 1500, unidad: "g", stockMinimo: 300, costoUnitario: 0.015 },
  { id: "INS-08", nombre: "Pan Croissant (unidad)", stock: 40, unidad: "unidad", stockMinimo: 10, costoUnitario: 0.50 },
  { id: "INS-09", nombre: "Jamón de Pavo (g)", stock: 2000, unidad: "g", stockMinimo: 500, costoUnitario: 0.008 },
  { id: "INS-10", nombre: "Queso Mozzarella (g)", stock: 2000, unidad: "g", stockMinimo: 500, costoUnitario: 0.007 },
];

// 2. Catálogo de Productos a la Venta (Mínimo 12 productos elaborados + reventa)
const productosBase = [
  // Productos Elaborados (Poseen Receta)
  { id: "PROD-01", nombre: "Latte Grande 16oz", precio: 3.75, tipo: "elaborado", categoria: "Bebidas Calientes", receta: [
    { insumoId: "INS-01", cantidad: 18 }, // 18g café
    { insumoId: "INS-02", cantidad: 250 }, // 250ml leche
    { insumoId: "INS-03", cantidad: 1 }, // 1 vaso
    { insumoId: "INS-04", cantidad: 1 }, // 1 tapadera
    { insumoId: "INS-05", cantidad: 1 }  // 1 viñeta
  ]},
  { id: "PROD-02", nombre: "Espresso Doble", precio: 2.25, tipo: "elaborado", categoria: "Bebidas Calientes", receta: [
    { insumoId: "INS-01", cantidad: 18 },
    { insumoId: "INS-05", cantidad: 1 }
  ]},
  { id: "PROD-03", nombre: "Cappuccino 16oz", precio: 3.50, tipo: "elaborado", categoria: "Bebidas Calientes", receta: [
    { insumoId: "INS-01", cantidad: 18 },
    { insumoId: "INS-02", cantidad: 200 },
    { insumoId: "INS-03", cantidad: 1 },
    { insumoId: "INS-04", cantidad: 1 },
    { insumoId: "INS-05", cantidad: 1 }
  ]},
  { id: "PROD-04", nombre: "Caramel Macchiato Helado", precio: 4.25, tipo: "elaborado", categoria: "Bebidas Frías", receta: [
    { insumoId: "INS-01", cantidad: 18 },
    { insumoId: "INS-02", cantidad: 220 },
    { insumoId: "INS-06", cantidad: 30 }, // 30ml caramelo
    { insumoId: "INS-03", cantidad: 1 },
    { insumoId: "INS-04", cantidad: 1 },
    { insumoId: "INS-05", cantidad: 1 }
  ]},
  { id: "PROD-05", nombre: "Mocha Caliente 16oz", precio: 4.00, tipo: "elaborado", categoria: "Bebidas Calientes", receta: [
    { insumoId: "INS-01", cantidad: 18 },
    { insumoId: "INS-02", cantidad: 200 },
    { insumoId: "INS-07", cantidad: 25 }, // 25g chocolate
    { insumoId: "INS-03", cantidad: 1 },
    { insumoId: "INS-04", cantidad: 1 },
    { insumoId: "INS-05", cantidad: 1 }
  ]},
  { id: "PROD-06", nombre: "Cold Brew Artesanal", precio: 3.75, tipo: "elaborado", categoria: "Bebidas Frías", receta: [
    { insumoId: "INS-01", cantidad: 30 },
    { insumoId: "INS-03", cantidad: 1 },
    { insumoId: "INS-04", cantidad: 1 },
    { insumoId: "INS-05", cantidad: 1 }
  ]},
  { id: "PROD-07", nombre: "Croissant Jamón y Queso", precio: 3.50, tipo: "elaborado", categoria: "Repostería & Comida", receta: [
    { insumoId: "INS-08", cantidad: 1 },
    { insumoId: "INS-09", cantidad: 40 },
    { insumoId: "INS-10", cantidad: 30 }
  ]},
  { id: "PROD-08", nombre: "Americano 16oz", precio: 2.50, tipo: "elaborado", categoria: "Bebidas Calientes", receta: [
    { insumoId: "INS-01", cantidad: 18 },
    { insumoId: "INS-03", cantidad: 1 },
    { insumoId: "INS-04", cantidad: 1 },
    { insumoId: "INS-05", cantidad: 1 }
  ]},
  { id: "PROD-09", nombre: "Flat White 8oz", precio: 3.25, tipo: "elaborado", categoria: "Bebidas Calientes", receta: [
    { insumoId: "INS-01", cantidad: 18 },
    { insumoId: "INS-02", cantidad: 150 }
  ]},
  { id: "PROD-10", nombre: "Latte Frío de Vainilla", precio: 4.10, tipo: "elaborado", categoria: "Bebidas Frías", receta: [
    { insumoId: "INS-01", cantidad: 18 },
    { insumoId: "INS-02", cantidad: 220 },
    { insumoId: "INS-03", cantidad: 1 },
    { insumoId: "INS-04", cantidad: 1 },
    { insumoId: "INS-05", cantidad: 1 }
  ]},
  { id: "PROD-11", nombre: "Muffin de Chispas", precio: 2.25, tipo: "elaborado", categoria: "Repostería & Comida", receta: [
    { insumoId: "INS-07", cantidad: 15 }
  ]},
  { id: "PROD-12", nombre: "Panini de Pavo Especial", precio: 4.75, tipo: "elaborado", categoria: "Repostería & Comida", receta: [
    { insumoId: "INS-09", cantidad: 60 },
    { insumoId: "INS-10", cantidad: 40 }
  ]},

  // Productos de Reventa (Sin Receta, Stock Directo)
  { id: "PROD-13", nombre: "Agua Embotellada 600ml", precio: 1.25, tipo: "reventa", categoria: "Reventa", stock: 50, stockMinimo: 10 },
  { id: "PROD-14", nombre: "Soda en Lata 355ml", precio: 1.50, tipo: "reventa", categoria: "Reventa", stock: 40, stockMinimo: 10 },
  { id: "PROD-15", nombre: "Bolsa Café en Grano 500g", precio: 12.00, tipo: "reventa", categoria: "Reventa", stock: 15, stockMinimo: 5 }
];

const datosPorSucursal = new Map();

function crearDatosInicialesSucursal() {
  return {
    insumos: structuredClone(insumosBase),
    productos: structuredClone(productosBase),
    ventas: [],
    correlativoFactura: 1001,
    correlativoCCF: 501,
    compras: [],
    turnosCaja: [],
    empleados: []
  };
}

function rutaDatosSucursal(sucursalId) {
  return join(branchesDirectory, `${sucursalId}.json`);
}

export function obtenerDatosSucursal(sucursalId) {
  if (typeof sucursalId !== "string" || !/^[0-9a-f-]{36}$/i.test(sucursalId)
    || !sucursales.some(sucursal => sucursal.id === sucursalId)) {
    throw new Error("La sucursal de la sesión ya no existe.");
  }
  if (!datosPorSucursal.has(sucursalId)) {
    const datos = loadJson(rutaDatosSucursal(sucursalId), crearDatosInicialesSucursal());
    if (!datos || !Array.isArray(datos.insumos) || !Array.isArray(datos.productos)
      || !Array.isArray(datos.ventas) || !Array.isArray(datos.compras)
      || !Array.isArray(datos.turnosCaja) || !Array.isArray(datos.empleados)) {
      throw new Error(`Los datos de la sucursal ${sucursalId} tienen un formato inválido.`);
    }
    datosPorSucursal.set(sucursalId, datos);
  }
  return datosPorSucursal.get(sucursalId);
}

export function guardarDatosSucursal(sucursalId) {
  const datos = obtenerDatosSucursal(sucursalId);
  mkdirSync(branchesDirectory, { recursive: true });
  saveJson(rutaDatosSucursal(sucursalId), datos);
}

export function crearDatosSucursal(sucursalId) {
  if (datosPorSucursal.has(sucursalId)) {
    throw new Error("La sucursal ya tiene datos inicializados.");
  }
  const datos = crearDatosInicialesSucursal();
  datosPorSucursal.set(sucursalId, datos);
  try {
    guardarDatosSucursal(sucursalId);
  } catch (error) {
    datosPorSucursal.delete(sucursalId);
    throw error;
  }
}

export function descartarDatosSucursal(sucursalId) {
  datosPorSucursal.delete(sucursalId);
  for (const path of [rutaDatosSucursal(sucursalId), `${rutaDatosSucursal(sucursalId)}.tmp`]) {
    try {
      unlinkSync(path);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}
