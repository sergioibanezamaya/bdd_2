/**
 * =====================================================================
 * controllers/pacientes.controller.js — Lógica CRUD de pacientes
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Regla clave del TP:
 *   "No permitir pacientes duplicados utilizando DNI o teléfono.
 *    Si un paciente ya existe, reutilizar el mismo registro."
 *
 * Estrategia: antes de insertar, hacer findOne({ $or: [{dni},{telefono}] }).
 * Si existe, devolver el existente con flag existed=true (HTTP 200).
 * =====================================================================
 */

import Paciente from '../models/Paciente.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * GET /api/pacientes
 * Query opcional: ?q=texto → busca por nombre, apellido o DNI.
 */
export async function listarPacientes(req, res, next) {
  try {
    const { q } = req.query;
    const filter = {};
    if (q && q.trim()) {
      const re = new RegExp(q.trim(), 'i');
      filter.$or = [
        { nombre: re },
        { apellido: re },
        { dni: re },
      ];
    }
    const pacientes = await Paciente.find(filter).sort({ apellido: 1, nombre: 1 });
    res.json({ ok: true, data: pacientes });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/pacientes/:id
 */
export async function obtenerPaciente(req, res, next) {
  try {
    const paciente = await Paciente.findById(req.params.id);
    if (!paciente) throw new AppError('Paciente no encontrado', 404, 'NOT_FOUND');
    res.json({ ok: true, data: paciente });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/pacientes
 * Body: { nombre, apellido, dni, telefono, email, fechaNacimiento, obraSocial }
 *
 * Si ya existe un paciente con el mismo DNI o teléfono, lo REUTILIZA
 * y responde con existed:true (no crea duplicado).
 */
export async function crearPaciente(req, res, next) {
  try {
    const { dni, telefono } = req.body;

    // 1) Buscar duplicado por DNI o teléfono
    const existente = await Paciente.findOne({
      $or: [{ dni }, { telefono }],
    });

    if (existente) {
      return res.status(200).json({
        ok: true,
        existed: true,
        message: 'El paciente ya estaba registrado. Se reutilizó el registro existente.',
        data: existente,
      });
    }

    // 2) Crear nuevo
    const nuevo = await Paciente.create(req.body);
    res.status(201).json({
      ok: true,
      existed: false,
      message: 'Paciente creado correctamente',
      data: nuevo,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/pacientes/:id
 * No permite modificar el DNI (es la clave de identificación del TP).
 */
export async function actualizarPaciente(req, res, next) {
  try {
    // Bloquear modificación de DNI
    if (req.body.dni !== undefined) delete req.body.dni;

    const actualizado = await Paciente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!actualizado) throw new AppError('Paciente no encontrado', 404, 'NOT_FOUND');
    res.json({ ok: true, data: actualizado });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/pacientes/:id
 * Solo se permite borrar si no tiene turnos futuros en Pendiente/Confirmado.
 * Para mantener simplicidad, esta regla se valida en el controller.
 */
export async function eliminarPaciente(req, res, next) {
  try {
    // Verificar turnos futuros
    const Turno = (await import('../models/Turno.js')).default;
    const ahora = new Date();
    const turnosFuturos = await Turno.countDocuments({
      paciente: req.params.id,
      fecha: { $gte: ahora },
      estado: { $in: ['Pendiente', 'Confirmado'] },
    });
    if (turnosFuturos > 0) {
      throw new AppError(
        `No se puede eliminar: el paciente tiene ${turnosFuturos} turno(s) futuro(s) activo(s)`,
        409,
        'HAS_FUTURE_TURNOS'
      );
    }

    const eliminado = await Paciente.findByIdAndDelete(req.params.id);
    if (!eliminado) throw new AppError('Paciente no encontrado', 404, 'NOT_FOUND');
    res.json({ ok: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
}