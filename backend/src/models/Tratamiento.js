/**
 * =====================================================================
 * models/Tratamiento.js — Esquema Mongoose para `tratamientos`
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Colección independiente. El odontólogo (o personal de secretaría)
 * da de alta los tratamientos que ofrece el consultorio.
 * Su `duracionMin` se usa para calcular la disponibilidad horaria.
 * =====================================================================
 */

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const tratamientoSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      unique: true,
      trim: true,
      maxlength: [80, 'El nombre no puede superar 80 caracteres'],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [300, 'La descripción no puede superar 300 caracteres'],
    },
    duracionMin: {
      type: Number,
      required: [true, 'La duración es obligatoria'],
      min: [15, 'La duración mínima es 15 minutos'],
      max: [480, 'La duración máxima es 8 horas (480 min)'],
    },
    precioReferencia: {
      type: Number,
      min: [0, 'El precio no puede ser negativo'],
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'tratamientos',
  }
);

tratamientoSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Tratamiento = model('Tratamiento', tratamientoSchema);

export default Tratamiento;