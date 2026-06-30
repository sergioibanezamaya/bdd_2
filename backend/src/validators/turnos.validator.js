/**
 * =====================================================================
 * validators/turnos.validator.js — Reglas express-validator para turnos
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 * =====================================================================
 */

import { body } from 'express-validator';

const isObjectId = (v) => /^[a-f\d]{24}$/i.test(v);

export const crearTurnoValidator = [
  body('pacienteId')
    .notEmpty().withMessage('pacienteId es obligatorio')
    .custom(isObjectId).withMessage('pacienteId debe ser un ObjectId válido'),
  body('tratamientoId')
    .notEmpty().withMessage('tratamientoId es obligatorio')
    .custom(isObjectId).withMessage('tratamientoId debe ser un ObjectId válido'),
  body('fecha')
    .notEmpty().withMessage('fecha es obligatoria')
    .isISO8601().withMessage('fecha inválida'),
  body('horaInicio')
    .notEmpty().withMessage('horaInicio es obligatoria')
    .matches(/^\d{2}:\d{2}$/).withMessage('horaInicio debe tener formato HH:MM'),
  body('observaciones')
    .optional()
    .isLength({ max: 500 }).withMessage('Observaciones máximo 500 caracteres'),
];

export const cancelarTurnoValidator = [
  body('motivo')
    .optional()
    .isLength({ max: 300 }).withMessage('Motivo máximo 300 caracteres'),
];