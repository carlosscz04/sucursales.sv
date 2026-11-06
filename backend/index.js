// ============================================================================
// SERVIDOR PRINCIPAL DE EXPRESS - RESTAURANTE ORÍGENES SV
// Desarrollado por: Integrante 1 (feature/backend-core-pos)
// Configura los middlewares globales, rutas API y el puerto de escucha.
// ============================================================================

import express from "express";
import cors from "cors";

// Importación de módulos de rutas por área funcional
import posRoutes from "./routes/pos.routes.js";
import inventarioRoutes from "./routes/inventario.routes.js";
import comprasRoutes from "./routes/compras.routes.js";
import cajaRoutes from "./routes/caja.routes.js";
import rrhhRoutes from "./routes/rrhh.routes.js";
import authRoutes, { autenticar } from "./routes/auth.routes.js";

const app = express();
const PORT = 3000;

// Bloque 1: Middlewares globales (Parsing de JSON y CORS)
app.use(cors());
app.use(express.json());

// Bloque 2: Registro de Endpoints de la API REST
app.use("/api/auth", authRoutes);
app.use("/api", autenticar);
app.use("/api/pos", posRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/caja", cajaRoutes);
app.use("/api/rrhh", rrhhRoutes);

// Bloque 3: Ruta raíz de prueba de funcionamiento
app.get("/", (req, res) => {
  res.json({ app: "ERP-POS Restaurante Orígenes SV", estado: "Servidor Activo", puerto: PORT });
});

// Bloque 4: Encendido del Servidor en el Puerto 3000
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
