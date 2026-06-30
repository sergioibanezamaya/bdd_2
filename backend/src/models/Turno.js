/**
 * =====================================================================
 * models/Turno.js — Esquema Mongoose para la colección `turnos`
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Ciclo de vida del turno (estado):
 *   Pendiente  → creado, esperando confirmación de pago
 *   Confirmado → pago confirmado por el odontólogo (evento Calendar OK)
 *   Cancelado  → cancelado por paciente o consultorio (se elimina evento)
 *   Atendido   → el paciente fue atendido (consulta registrada)
 *
 * Validación anti-solapamiento:
 *   El controller busca turnos con [inicio, fin) que se solapen
 *   con el nuevo turno antes de insertar.
 * =====================================================================
 */

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// Sub-esquema embebido para los horarios del turno.
// Usamos strings "HH:MM" para serialización simple hacia el frontend.
const horarioSchema = new Schema(
  {
    horaInicio: { type: String, required: true, match: [/^\d{2}:\d{2}$/, 'horaInicio debe ser HH:MM'] },
    horaFin:    { type: String, required: true, match: [/^\d{2}:\d{2}$/, 'horaFin debe ser HH:MM'] },
  },
  { _id: false }
);

const turnoSchema = new Schema(
  {
    paciente: {
      type: Schema.Types.ObjectId,
      ref: 'Paciente',
      required: [true, 'El paciente es obligatorio'],
    },
    tratamiento: {
      type: Schema.Types.ObjectId,
      ref: 'Tratamiento',
      required: [true, 'El tratamiento es obligatorio'],
    },
    odontologo: {
      type: String,
      trim: true,
      default: 'Dr. Default',
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
    },
    horario: {
      type: horarioSchema,
      required: true,
    },
    duracionMin: {
      type: Number,
      required: [true, 'La duración es obligatoria'],
      min: [15, 'Duración mínima 15 min'],
      max: [240, 'Duración máxima 4 horas'],
    },
    estado: {
      type: String,
      enum: {
        values: ['Pendiente', 'Confirmado', 'Cancelado', 'Atendido'],
        message: 'Estado inválido: {VALUE}',
      },
      default: 'Pendiente',
      required: true,
    },
    pagoConfirmado: {
      type: Boolean,
      default: false,
    },
    // ID del evento en Google Calendar (sparse: solo se setea cuando existe)
    calendarEventId: {
      type: String,
      default: null,
    },
    observaciones: {
      type: String,
      trim: true,
      maxlength: [500, 'Las observaciones no pueden superar 500 caracteres'],
    },
    // ============== Pago ==============
    metodoPago: {
      type: String,
      enum: {
        values: ['Efectivo', 'Transferencia'],
        message: 'Método de pago inválido: {VALUE}',
      },
      default: null,
    },
    // Comprobante en Base64 (solo si metodoPago = 'Transferencia').
    // Guardamos también el mime-type para poder renderizarlo en <img>.
    comprobantePago: {
      type: String,
      default: null,
    },
    comprobanteMimeType: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'turnos',
  }
);

// =====================================================================
// Índices
// =====================================================================
// Búsquedas por fecha + horario (para anti-solapamiento y agenda)
turnoSchema.index({ fecha: 1, 'horario.horaInicio': 1 });
// Filtros por paciente y estado
turnoSchema.index({ paciente: 1 });
turnoSchema.index({ estado: 1 });

// =====================================================================
// Virtuales de conveniencia
// =====================================================================
turnoSchema.virtual('horaInicio').get(function () {
  return this.horario?.horaInicio;
});
turnoSchema.virtual('horaFin').get(function () {
  return this.horario?.horaFin;
});

turnoSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Turno = model('Turno', turnoSchema);

export default Turno;