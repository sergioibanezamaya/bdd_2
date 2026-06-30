/**
 * =====================================================================
 * utils/seed.js — Script de carga inicial de tratamientos
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Inserta los tratamientos base del consultorio si la colección
 * está vacía. Es idempotente: si ya existen, no duplica.
 *
 * Uso:  npm run seed
 * =====================================================================
 */

import 'dotenv/config';
import { connectDB, disconnectDB } from '../config/db.js';
import Tratamiento from '../models/Tratamiento.js';

const tratamientosIniciales = [
  {
    nombre: 'Limpieza',
    descripcion: 'Limpieza dental profesional con profilaxis.',
    duracionMin: 30,
    precioReferencia: null, // Se trata con el odontólogo
  },
  {
    nombre: 'Conducto',
    descripcion: 'Tratamiento de conducto (endodoncia).',
    duracionMin: 60,
    precioReferencia: null, // Se trata con el odontólogo
  },
  {
    nombre: 'Extracción',
    descripcion: 'Extracción de pieza dental simple.',
    duracionMin: 45,
    precioReferencia: null, // Se trata con el odontólogo
  },
  {
    nombre: 'Ortodoncia',
    descripcion: 'Consulta y ajuste de ortodoncia.',
    duracionMin: 60,
    precioReferencia: null, // Se trata con el odontólogo
  },
  {
    nombre: 'Consulta general',
    descripcion: 'Revisión general y diagnóstico.',
    duracionMin: 30,
    precioReferencia: 14000,
  },
  {
    nombre: 'Blanqueamiento',
    descripcion: 'Tratamiento estético de blanqueamiento dental.',
    duracionMin: 90,
    precioReferencia: 60000,
  },
];

async function seed() {
  try {
    await connectDB();
    console.log('🌱 Ejecutando seed de tratamientos...');

    let insertados = 0;
    let actualizados = 0;
    for (const t of tratamientosIniciales) {
      const existente = await Tratamiento.findOne({ nombre: t.nombre });
      if (!existente) {
        await Tratamiento.create(t);
        insertados += 1;
        console.log(`   + ${t.nombre} (${t.duracionMin} min) — $${t.precioReferencia ?? 'a consultar'}`);
      } else {
        // Actualizar precio si cambió
        if (existente.precioReferencia !== t.precioReferencia) {
          existente.precioReferencia = t.precioReferencia;
          existente.duracionMin = t.duracionMin;
          existente.descripcion = t.descripcion;
          await existente.save();
          actualizados += 1;
          console.log(`   ↻ ${t.nombre} — precio actualizado a $${t.precioReferencia ?? 'a consultar'}`);
        } else {
          console.log(`   = ${t.nombre} (sin cambios)`);
        }
      }
    }

    console.log(`✅ Seed finalizado. Tratamientos nuevos: ${insertados}, actualizados: ${actualizados}`);
    const total = await Tratamiento.countDocuments();
    console.log(`📊 Total de tratamientos en la base: ${total}`);
  } catch (error) {
    console.error('❌ Error en seed:', error.message);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seed();