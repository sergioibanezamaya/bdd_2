/**
 * =====================================================================
 * validators/consultas.validator.js — Reglas express-validator para consultas
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 * =====================================================================
 */

import { body } from 'express-validator';

const isObjectId = (v) => /^[a-f\d]{24}$/i.test(v);

export const crearConsultaValidator = [
  body('pacienteId')
    .notEmpty().withMessage('pacienteId es obligatorio')
    .custom(isObjectId).withMessage('pacienteId debe ser un ObjectId válido'),
  body('turnoId')
    .optional({ values: 'falsy' })
    .custom(isObjectId).withMessage('turnoId debe ser un ObjectId válido'),
  body('diagnostico')
    .trim()
    .notEmpty().withMessage('El diagnóstico es obligatorio')
    .isLength({ max: 500 }).withMessage('Diagnóstico máximo 500 caracteres'),
  body('observaciones')
    .optional()
    .isLength({ max: 1000 }).withMessage('Observaciones máximo 1000 caracteres'),
  body('tratamientoId')
    .notEmpty().withMessage('tratamientoId es obligatorio')
    .custom(isObjectId).withMessage('tratamientoId debe ser un ObjectId válido'),
  body('requiereOperacion')
    .notEmpty().withMessage('requiereOperacion es obligatorio')
    .isBoolean().withMessage('requiereOperacion debe ser boolean'),
  body('altaMedica')
    .notEmpty().withMessage('altaMedica es obligatorio')
    .isBoolean().withMessage('altaMedica debe ser boolean'),
];

export const actualizarConsultaValidator = [
  body('diagnostico').optional().trim().isLength({ max: 500 }),
  body('observaciones').optional().isLength({ max: 1000 }),
  body('requiereOperacion').optional().isBoolean(),
  body('altaMedica').optional().isBoolean(),
];