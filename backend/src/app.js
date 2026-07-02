/**
 * =====================================================================
 * app.js — Configuración de Express
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Define middlewares globales, monta las rutas y configura el handler
 * de errores. NO arranca el servidor (eso lo hace server.js).
 * =====================================================================
 */

import express from 'express';
import cors from 'cors';
import pacientesRoutes from './routes/pacientes.routes.js';
import tratamientosRoutes from './routes/tratamientos.routes.js';
import turnosRoutes from './routes/turnos.routes.js';
import consultasRoutes from './routes/consultas.routes.js';
import disponibilidadRoutes from './routes/disponibilidad.routes.js';
import agregacionesRoutes from './routes/agregaciones.routes.js';
import googleRoutes from './routes/google.routes.js';
import portalRoutes from './routes/portal.routes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// =====================================================================
// Middlewares globales
// =====================================================================

// CORS: aceptar UNA lista de orígenes separados por coma (CSV) por si en el
// futuro se agregan otros frontends. Con la unificación del portal embebido
// en /frontend, alcanza con http://localhost:5173; el CSV se conserva
// para no romper deploys que aún tengan configurados varios orígenes.
// Ejemplo: CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir herramientas sin origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
}));

// Parser JSON con límite ampliado para payloads con observaciones largas
app.use(express.json({ limit: '1mb' }));

// Logger simple para desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// =====================================================================
// Health check (para verificar que el server está vivo)
// =====================================================================
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'turnos-odontologia', timestamp: new Date().toISOString() });
});

// =====================================================================
// Rutas de la API
// =====================================================================
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/tratamientos', tratamientosRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
app.use('/api/agregaciones', agregacionesRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/portal', portalRoutes);

// =====================================================================
// 404 — Ruta no encontrada
// =====================================================================
app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// =====================================================================
// Handler global de errores (debe ir al final)
// =====================================================================
app.use(errorHandler);

export default app;