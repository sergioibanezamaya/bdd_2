/**
 * =====================================================================
 * validators/portal.validator.js — Validaciones para el portal del paciente
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * El portal es simple: el paciente entra con DNI. Si no existe, completa
 * el resto. Reutilizamos `crearPacienteValidator` para el registro (mismas
 * reglas: DNI 7-8 dígitos, email válido, fecha no futura, etc.).
 * =====================================================================
 */

import { body } from 'express-validator';
import { crearPacienteValidator } from './pacientes.validator.js';

/**
 * POST /api/portal/login — solo pide DNI
 */
export const portalLoginValidator = [
  body('dni')
    .trim()
    .notEmpty().withMessage('El DNI es obligatorio')
    .matches(/^\d{7,8}$/).withMessage('El DNI debe tener 7 u 8 dígitos'),
];

/**
 * POST /api/portal/registro — mismas reglas que crearPaciente.
 * Lo exponemos con otro nombre para que las rutas del portal sean legibles.
 */
export const portalRegistroValidator = crearPacienteValidator;
