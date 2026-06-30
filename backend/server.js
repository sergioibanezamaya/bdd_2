/**
 * =====================================================================
 * server.js — Punto de entrada del backend
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Responsabilidad:
 *   - Cargar variables de entorno (.env).
 *   - Conectar a MongoDB.
 *   - Levantar el servidor Express.
 *   - Manejar errores fatales de arranque.
 * =====================================================================
 */

import 'dotenv/config';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 3000;

/**
 * Arranca la aplicación:
 *   1. Conecta a MongoDB.
 *   2. Si la conexión es exitosa, levanta Express.
 *   3. Si falla, termina el proceso con código de error.
 */
async function start() {
  try {
    await connectDB();
    console.log('✅ MongoDB conectado correctamente');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error.message);
    process.exit(1);
  }
}

// Capturar errores no manejados a nivel de proceso
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

start();