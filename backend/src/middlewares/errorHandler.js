/**
 * =====================================================================
 * middlewares/errorHandler.js — Handler global de errores
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Captura cualquier error lanzado por los controllers/services
 * y devuelve una respuesta JSON uniforme con el código HTTP apropiado.
 *
 * Distingue entre:
 *   - Errores de validación de express-validator (HTTP 400)
 *   - Errores personalizados con .statusCode (ej. 404, 409)
 *   - Errores de Mongoose (CastError, ValidationError, duplicate key)
 *   - Errores genéricos (HTTP 500)
 * =====================================================================
 */

/**
 * Errores personalizados del dominio.
 * Cualquier controller puede hacer: throw new AppError('mensaje', 409)
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, _req, res, _next) {
  // Loggear siempre para debugging
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // 1) Errores de validación de express-validator
  //    Estos llegan con .name = 'ValidationError' y una función .array()
  if (err.name === 'ValidationError' && typeof err.array === 'function') {
    const details = err.array().map((e) => ({ field: e.path, message: e.msg }));
    return res.status(400).json({ ok: false, error: 'Datos inválidos', code: 'VALIDATION_ERROR', details });
  }

  // 1b) Errores de validación de Mongoose (Schema validation)
  //     Tienen .name = 'ValidationError' y .errors como objeto (NO función .array())
  if (err.name === 'ValidationError' && err.errors && !Array.isArray(err.errors)) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ ok: false, error: 'Datos inválidos', code: 'VALIDATION_ERROR', details });
  }

  // 2) Errores personalizados del dominio (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ ok: false, error: err.message, code: err.code });
  }

  // 3) CastError de Mongoose (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      ok: false,
      error: `ID inválido: ${err.value}`,
      code: 'CAST_ERROR',
    });
  }

  // 4) Duplicate key (índice único violado)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    return res.status(409).json({
      ok: false,
      error: `Ya existe un registro con ese(s) valor(es) en: ${field}`,
      code: 'DUPLICATE_KEY',
    });
  }

  // 5) Error genérico (500). Siempre devolver code para que el frontend lo muestre.
  res.status(err.statusCode || 500).json({
    ok: false,
    error: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_ERROR',
  });
}