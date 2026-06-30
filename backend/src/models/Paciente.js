/**
 * =====================================================================
 * models/Paciente.js — Esquema Mongoose para la colección `pacientes`
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Reglas de negocio aplicadas a nivel modelo:
 *   - DNI y teléfono son únicos (defensa en profundidad).
 *   - El controller hace una búsqueda previa por DNI/teléfono y
 *     REUTILIZA el registro existente (requisito del TP).
 *   - Email se almacena en minúsculas.
 *   - Fecha de nacimiento no puede ser futura.
 * =====================================================================
 */

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const pacienteSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [60, 'El nombre no puede superar 60 caracteres'],
    },
    apellido: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
      minlength: [2, 'El apellido debe tener al menos 2 caracteres'],
      maxlength: [60, 'El apellido no puede superar 60 caracteres'],
    },
    dni: {
      type: String,
      required: [true, 'El DNI es obligatorio'],
      unique: true,
      trim: true,
      match: [/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos'],
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono es obligatorio'],
      unique: true,
      trim: true,
      match: [/^[\d+\-\s]{8,20}$/, 'Formato de teléfono inválido'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido'],
    },
    fechaNacimiento: {
      type: Date,
      required: [true, 'La fecha de nacimiento es obligatoria'],
      validate: {
        validator: (v) => v <= new Date(),
        message: 'La fecha de nacimiento no puede ser futura',
      },
    },
    obraSocial: {
      type: String,
      required: [true, 'La obra social es obligatoria'],
      trim: true,
      maxlength: [80, 'La obra social no puede superar 80 caracteres'],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automáticos
    collection: 'pacientes',
  }
);

// =====================================================================
// Índices
// =====================================================================
// DNI y teléfono ya tienen `unique: true` (crea índice único).
// Añadimos un índice compuesto para los listados ordenados por apellido.
pacienteSchema.index({ apellido: 1, nombre: 1 });

// =====================================================================
// Método de instancia: nombre completo
// =====================================================================
pacienteSchema.virtual('nombreCompleto').get(function () {
  return `${this.apellido}, ${this.nombre}`;
});

// Configurar toJSON para incluir virtuals y limpiar _id/v
pacienteSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Paciente = model('Paciente', pacienteSchema);

export default Paciente;