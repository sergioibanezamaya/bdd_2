/**
 * =====================================================================
 * middlewares/validate.js — Helper para express-validator
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Ejecuta las validaciones definidas en el array `validations`.
 * Si hay errores, responde HTTP 400 con el detalle.
 * Si todo pasa, continúa al siguiente middleware.
 * =====================================================================
 */

import { validationResult } from 'express-validator';

/**
 * Factory: crea un middleware que corre las validaciones indicadas.
 * @param {Array} validations - Array de middlewares de express-validator
 */
export const validate = (validations) => async (req, res, next) => {
  // Ejecutar todas las validaciones en paralelo
  await Promise.all(validations.map((v) => v.run(req)));

  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Pasar al handler de errores con la info estructurada
  const err = new Error('Datos inválidos');
  err.name = 'ValidationError';
  err.statusCode = 400;
  err.array = () => errors.array();
  next(err);
};