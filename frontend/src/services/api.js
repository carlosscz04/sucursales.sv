// ============================================================================
// SERVICIO DE COMUNICACIÓN API CON EL BACKEND (FETCH + PROMESAS)
// Desarrollado para interactuar con la API REST de Express
// ============================================================================

const BASE_URL = "/api";

async function request(endpoint, options = {}) {
  const token = sessionStorage.getItem("authToken");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) sessionStorage.removeItem("authToken");
    throw new Error(data.mensaje || "Error en la petición al servidor");
  }
  return data;
}

export const getAuthStatus = () => request("/auth/status");
export const getSucursales = () => request("/auth/sucursales");
export const getCurrentSession = () => request("/auth/session");
export const clearAuthToken = () => sessionStorage.removeItem("authToken");
export const login = async (username, password, montoInicial, sucursalId, rol) => {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password, montoInicial, sucursalId, rol })
  });
  sessionStorage.setItem("authToken", data.token);
  return data;
};
export const setupAccount = async (credentials) => {
  const data = await request("/auth/setup", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
  sessionStorage.setItem("authToken", data.token);
  return data;
};
export const registrarSucursal = (datos) => request("/auth/sucursales", {
  method: "POST",
  body: JSON.stringify(datos)
});
export const logout = (efectivoContado) => request("/auth/logout", {
  method: "POST",
  body: JSON.stringify({ efectivoContado })
});
export const getUsers = () => request("/auth/users");
export const createUser = (user) => request("/auth/users", {
  method: "POST",
  body: JSON.stringify(user)
});

// 1. Endpoints POS
export const getProductos = () => request("/pos/productos");
export const procesarVenta = (datosVenta) => request("/pos/ventas", { method: "POST", body: JSON.stringify(datosVenta) });
export const getHistorialVentas = () => request("/pos/ventas");

// 2. Endpoints Inventario
export const getInsumos = () => request("/inventario/insumos");
export const getAlertasStock = () => request("/inventario/alertas");

// 3. Endpoints Compras
export const getCompras = () => request("/compras");
export const registrarCompra = (datosCompra) => request("/compras", { method: "POST", body: JSON.stringify(datosCompra) });

// 4. Endpoints Caja
export const getTurnoActivo = () => request("/caja/turno-activo");
export const getTurnosCaja = () => request("/caja/turnos");
export const aperturarCaja = (cajero, montoInicial) => request("/caja/aperturar", { method: "POST", body: JSON.stringify({ cajero, montoInicial }) });
export const cerrarCaja = (efectivoContado) => request("/caja/cerrar", { method: "POST", body: JSON.stringify({ efectivoContado }) });

// 5. Endpoints RRHH & Planilla
export const getEmpleados = () => request("/rrhh/empleados");
export const registrarEmpleado = (empleado) => request("/rrhh/empleados", { method: "POST", body: JSON.stringify(empleado) });
export const getPlanilla = () => request("/rrhh/planilla");
