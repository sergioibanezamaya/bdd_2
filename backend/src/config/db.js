/**
 * =====================================================================
 * config/db.js — Conexión a MongoDB con Mongoose
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Centraliza la conexión para poder reutilizarla y testearla.
 * Lee la URI desde process.env.MONGODB_URI.
 * =====================================================================
 */

import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

/**
 * Conecta a MongoDB usando la URI configurada.
 * @throws Error si no se puede conectar.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está definida en .env');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log(`📦 Base de datos: ${mongoose.connection.name}`);
}

/**
 * Cierra la conexión (útil para tests o apagado limpio).
 */
export async function disconnectDB() {
  await mongoose.disconnect();
}