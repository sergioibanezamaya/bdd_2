/**
 * =====================================================================
 * controllers/tratamientos.controller.js — CRUD de tratamientos
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 * =====================================================================
 */

import Tratamiento from '../models/Tratamiento.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * GET /api/tratamientos
 * Por defecto devuelve solo los activos (?todos=true para incluir inactivos).
 */
export async function listarTratamientos(req, res, next) {
  try {
    const filter = req.query.todos === 'true' ? {} : { activo: true };
    const tratamientos = await Tratamiento.find(filter).sort({ nombre: 1 });
    res.json({ ok: true, data: tratamientos });
  } catch (err) {
    next(err);
  }
}

export async function crearTratamiento(req, res, next) {
  try {
    const nuevo = await Tratamiento.create(req.body);
    res.status(201).json({ ok: true, data: nuevo });
  } catch (err) {
    next(err);
  }
}

export async function actualizarTratamiento(req, res, next) {
  try {
    const actualizado = await Tratamiento.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!actualizado) throw new AppError('Tratamiento no encontrado', 404, 'NOT_FOUND');
    res.json({ ok: true, data: actualizado });
  } catch (err) {
    next(err);
  }
}