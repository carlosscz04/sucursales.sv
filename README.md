# ☕ ERP y POS - Restaurante Orígenes SV
Sistema de Gestión Empresarial y Punto de Venta para Restaurante Orígenes SV (El Salvador).

## 👥 División del Trabajo en Equipo (8 Integrantes)

| Integrante | Rol | Rama Git | Archivos de Trabajo |
|---|---|---|---|
| **Integrante 1** | Backend Core & POS API | `feature/backend-core-pos` | `backend/index.js`, `backend/routes/pos.routes.js` |
| **Integrante 2** | Backend Inventarios y Recetas | `feature/backend-inventario-recetas` | `backend/data/database.js`, `backend/services/recetas.service.js`, `backend/routes/inventario.routes.js` |
| **Integrante 3** | Backend Compras y Caja | `feature/backend-compras-caja` | `backend/routes/compras.routes.js`, `backend/routes/caja.routes.js` |
| **Integrante 4** | Backend RRHH y Nómina SV | `feature/backend-rrhh-nomina` | `backend/services/nomina.service.js`, `backend/routes/rrhh.routes.js` |
| **Integrante 5** | Frontend POS (Ventas UI) | `feature/frontend-pos-ui` | `frontend/src/pages/POSPage.jsx`, `frontend/src/components/POSModal.jsx` |
| **Integrante 6** | Frontend Inventarios UI | `feature/frontend-inventario-ui` | `frontend/src/pages/InventarioPage.jsx`, `frontend/src/pages/ComprasPage.jsx` |
| **Integrante 7** | Frontend Caja UI | `feature/frontend-caja-ui` | `frontend/src/pages/CajaPage.jsx`, `frontend/src/components/Navbar.jsx` |
| **Integrante 8** | Frontend RRHH UI | `feature/frontend-rrhh-ui` | `frontend/src/pages/RRHHPage.jsx`, `frontend/src/components/PlanillaModal.jsx` |

## 🚀 Instrucciones de Ejecución

### Backend (Puerto 3000)
```bash
cd backend
npm install
npm run dev
```

### Frontend (Puerto 5173)
```bash
cd frontend
npm install
npm run dev
```

## Acceso, caja e historial

- En el primer inicio, crea la cuenta administradora con nombre, usuario y contraseña. La contraseña debe tener al menos 8 caracteres.
- En una instalación sin sucursales, registra la primera sucursal (departamento y municipio) y crea su cuenta de gerente. En los siguientes ingresos, primero selecciona la sucursal y el rol (gerente o cajero).
- Cada inicio de sesión pide el fondo inicial y abre el turno de caja dentro de la sucursal seleccionada.
- La cuenta administradora puede crear cuentas individuales para los cajeros desde **Usuarios**.
- El gerente también puede registrar sucursales adicionales desde **Usuarios**, creando para cada una su cuenta gerente inicial. Cada gerente y cajero solo pertenece a una sucursal.
- Los cajeros solo tienen acceso al POS y a sus operaciones de cobro. La autorización se valida también en la API, no solo ocultando opciones de pantalla.
- El administrador registra al personal desde **RRHH & Planilla**, asignando el sueldo bruto quincenal; ISSS, AFP, ISR y salario neto se calculan automáticamente. Solo el administrador puede registrar empleados y crear cuentas de cajero.
- Al cerrar sesión, ingresa el efectivo contado para cerrar el turno y guardar el arqueo. También puedes consultar los turnos anteriores en **Caja & Flujos**.
- Al procesar una venta se muestra el comprobante emitido. El apartado **Facturas / CCF** permite consultar el historial y el detalle de cada comprobante mientras el servidor está activo.
- En **Compras (CXP)** puedes registrar facturas con varias líneas de insumos y gastos, indicar vencimiento y consultar el saldo pendiente. Las líneas de insumos actualizan existencias y costo promedio; los gastos se registran sin alterar el inventario.
- Los servicios de la API requieren una sesión iniciada. Las sucursales se guardan en `backend/data/sucursales.json`, las cuentas con hash de contraseña y `sucursalId` en `backend/data/usuarios-sucursales.json`, y cada sucursal tiene su archivo independiente en `backend/data/sucursales/<sucursalId>.json` para ventas, caja, inventario, compras y empleados.
- Los archivos locales con datos operativos están excluidos de Git. Las cuentas y empleados de la instalación anterior no se migran automáticamente: la primera configuración crea una sucursal nueva, según la opción de inicio limpio seleccionada.

Esta persistencia local está pensada para ejecutar la aplicación en una sola instancia. Para uso en producción con varias cajas o equipos, conviene migrar los datos a una base de datos compartida.
