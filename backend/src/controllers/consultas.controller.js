/**
 * =====================================================================
 * controllers/consultas.controller.js — CRUD de consultas (historial clínico)
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 * =====================================================================
 */

import Consulta from '../models/Consulta.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * GET /api/consultas?pacienteId=...
 * Devuelve el historial clínico de un paciente, ordenado cronológicamente.
 */
export async function listarConsultas(req, res, next) {
  try {
    const filter = {};
    if (req.query.pacienteId) filter.paciente = req.query.pacienteId;
    const consultas = await Consulta.find(filter)
      .populate('paciente', 'nombre apellido dni')
      .populate('tratamiento', 'nombre duracionMin')
      .populate('turno', 'fecha horario estado')
      .sort({ fecha: -1 });
    res.json({ ok: true, data: consultas });
  } catch (err) {
    next(err);
  }
}

export async function obtenerConsulta(req, res, next) {
  try {
    const consulta = await Consulta.findById(req.params.id)
      .populate('paciente', 'nombre apellido dni')
      .populate('tratamiento', 'nombre duracionMin')
      .populate('turno', 'fecha horario estado');
    if (!consulta) throw new AppError('Consulta no encontrada', 404, 'NOT_FOUND');
    res.json({ ok: true, data: consulta });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/consultas
 * Body: { pacienteId, turnoId?, diagnostico, observaciones, tratamientoId,
 *         requiereOperacion, altaMedica }
 */
export async function crearConsulta(req, res, next) {
  try {
    const { pacienteId, turnoId, tratamientoId, ...rest } = req.body;
    const payload = {
      paciente: pacienteId,
      turno: turnoId || null,
      tratamiento: tratamientoId,
      ...rest,
    };
    const nueva = await Consulta.create(payload);
    // Si viene de un turno atendido, marcar el turno como Atendido
    if (turnoId) {
      const Turno = (await import('../models/Turno.js')).default;
      await Turno.findByIdAndUpdate(turnoId, { estado: 'Atendido' });
    }
    const populated = await Consulta.findById(nueva._id)
      .populate('paciente', 'nombre apellido dni')
      .populate('tratamiento', 'nombre duracionMin')
      .populate('turno', 'fecha horario estado');
    res.status(201).json({ ok: true, data: populated });
  } catch (err) {
    next(err);
  }
}

export async function actualizarConsulta(req, res, next) {
  try {
    const actualizada = await Consulta.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!actualizada) throw new AppError('Consulta no encontrada', 404, 'NOT_FOUND');
    res.json({ ok: true, data: actualizada });
  } catch (err) {
    next(err);
  }
}

export async function eliminarConsulta(req, res, next) {
  try {
    const eliminada = await Consulta.findByIdAndDelete(req.params.id);
    if (!eliminada) throw new AppError('Consulta no encontrada', 404, 'NOT_FOUND');
    res.json({ ok: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
}