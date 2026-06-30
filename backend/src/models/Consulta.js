/**
 * =====================================================================
 * models/Consulta.js — Esquema Mongoose para la colección `consultas`
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Historial clínico del paciente. Cada consulta puede vincularse a un
 * turno (opcional) e indica el tratamiento aplicado, si requiere
 * operación futura y si se dio el alta médica.
 * =====================================================================
 */

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const consultaSchema = new Schema(
  {
    paciente: {
      type: Schema.Types.ObjectId,
      ref: 'Paciente',
      required: [true, 'El paciente es obligatorio'],
      index: true,
    },
    turno: {
      type: Schema.Types.ObjectId,
      ref: 'Turno',
      default: null,
    },
    fecha: {
      type: Date,
      default: Date.now,
      required: true,
    },
    diagnostico: {
      type: String,
      required: [true, 'El diagnóstico es obligatorio'],
      trim: true,
      maxlength: [500, 'El diagnóstico no puede superar 500 caracteres'],
    },
    observaciones: {
      type: String,
      trim: true,
      maxlength: [1000, 'Las observaciones no pueden superar 1000 caracteres'],
    },
    tratamiento: {
      type: Schema.Types.ObjectId,
      ref: 'Tratamiento',
      required: [true, 'El tratamiento aplicado es obligatorio'],
    },
    requiereOperacion: {
      type: Boolean,
      required: [true, 'Indicar si requiere operación'],
      default: false,
    },
    altaMedica: {
      type: Boolean,
      required: [true, 'Indicar si se dio el alta médica'],
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'consultas',
  }
);

// Índice compuesto para historial cronológico por paciente
consultaSchema.index({ paciente: 1, fecha: -1 });

consultaSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Consulta = model('Consulta', consultaSchema);

export default Consulta;