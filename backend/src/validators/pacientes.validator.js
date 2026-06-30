/**
 * =====================================================================
 * validators/pacientes.validator.js — Reglas express-validator para pacientes
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Notas:
 *   - NO usamos `.normalizeEmail()` porque puede reescribir el email
 *     (ej: agregar "+tag") y romper el regex `^\S+@\S+\.\S+$` del modelo.
 *     El modelo tiene `lowercase: true`, así que solo hacemos `.trim()`.
 *   - `fechaNacimiento` se valida como YYYY-MM-DD (formato del input date
 *     del frontend) para ser predecible con `<input type="date">`.
 * =====================================================================
 */

import { body } from 'express-validator';

export const crearPacienteValidator = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 60 }).withMessage('Nombre entre 2 y 60 caracteres'),
  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es obligatorio')
    .isLength({ min: 2, max: 60 }).withMessage('Apellido entre 2 y 60 caracteres'),
  body('dni')
    .trim()
    .notEmpty().withMessage('El DNI es obligatorio')
    .matches(/^\d{7,8}$/).withMessage('El DNI debe tener 7 u 8 dígitos (sin puntos)'),
  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es obligatorio')
    .matches(/^[\d+\-\s]{8,20}$/).withMessage('Formato de teléfono inválido'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido'),
  body('fechaNacimiento')
    .trim()
    .notEmpty().withMessage('La fecha de nacimiento es obligatoria')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha de nacimiento debe ser YYYY-MM-DD')
    .custom((v) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) throw new Error('Fecha inválida');
      if (d > new Date()) throw new Error('La fecha de nacimiento no puede ser futura');
      return true;
    }),
  body('obraSocial')
    .trim()
    .notEmpty().withMessage('La obra social es obligatoria')
    .isLength({ max: 80 }).withMessage('Obra social: máximo 80 caracteres'),
];

export const actualizarPacienteValidator = [
  body('nombre').optional().trim().isLength({ min: 2, max: 60 }),
  body('apellido').optional().trim().isLength({ min: 2, max: 60 }),
  body('telefono').optional().trim().matches(/^[\d+\-\s]{8,20}$/),
  body('email').optional().trim().isEmail(),
  body('fechaNacimiento')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha de nacimiento debe ser YYYY-MM-DD')
    .custom((v) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) throw new Error('Fecha inválida');
      if (d > new Date()) throw new Error('La fecha de nacimiento no puede ser futura');
      return true;
    }),
  body('obraSocial').optional().trim().isLength({ max: 80 }),
  // DNI NO se puede modificar (es la clave de negocio)
];