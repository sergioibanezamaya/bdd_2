/**
 * =====================================================================
 * controllers/turnos.controller.js — Lógica CRUD de turnos
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Este controller concentra el flujo crítico:
 *
 *   confirmarPago(req, res)
 *     1. Busca el turno y valida estado.
 *     2. Cambia estado a "Confirmado" en Mongo.
 *     3. Crea evento en Google Calendar (con rollback si falla).
 *     4. Envía email al paciente (sin rollback si falla).
 *     5. Devuelve respuesta final.
 *
 * Si Calendar/email no están configurados, el sistema funciona en
 * "modo degradado" (warning en la respuesta, no falla).
 * =====================================================================
 */

import Turno from '../models/Turno.js';
import Paciente from '../models/Paciente.js';
import Tratamiento from '../models/Tratamiento.js';
import { AppError } from '../middlewares/errorHandler.js';
import { hhmmToMinutes, addMinutes, startOfDay, endOfDay } from '../utils/time.js';

// Servicios externos (modo degradado si fallan o no están configurados)
import * as calendarService from '../services/calendarService.js';
import * as emailService from '../services/emailService.js';
import { CalendarDisabledError } from '../services/calendarService.js';
import { MailDisabledError } from '../services/emailService.js';

/**
 * Auto-sweep: marca como `Atendido` todos los turnos en estado
 * `Confirmado` cuya fecha ya pasó. Best-effort: si falla, log warn
 * y la lista sigue funcionando.
 *
 * Esto evita que el odontólogo tenga que acordarse de marcar cada
 * turno pasado. Los turnos `Pendiente` (no pagados/no confirmados)
 * NO se tocan — el paciente nunca confirmó.
 */
export async function marcarVencidos() {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const resultado = await Turno.updateMany(
      {
        estado: 'Confirmado',
        fecha: { $lt: hoy },
      },
      { $set: { estado: 'Atendido' } }
    );
    if (resultado.modifiedCount > 0) {
      console.log(`🕐 Auto-sweep: ${resultado.modifiedCount} turno(s) confirmado(s) vencido(s) → Atendido`);
    }
    return resultado.modifiedCount;
  } catch (err) {
    console.warn('⚠️  Auto-sweep de turnos vencidos falló:', err.message);
    return 0;
  }
}

/**
 * GET /api/turnos
 * Filtros: ?estado=&paciente=&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 *
 * Antes de listar, corre el sweep de vencidos (no bloquea si falla).
 */
export async function listarTurnos(req, res, next) {
  try {
    // Auto-sweep best-effort
    await marcarVencidos();

    const filter = {};
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.paciente) filter.paciente = req.query.paciente;
    if (req.query.desde || req.query.hasta) {
      filter.fecha = {};
      if (req.query.desde) filter.fecha.$gte = startOfDay(req.query.desde);
      if (req.query.hasta) filter.fecha.$lte = endOfDay(req.query.hasta);
    }

    const turnos = await Turno.find(filter)
      .populate('paciente', 'nombre apellido dni telefono email')
      .populate('tratamiento', 'nombre duracionMin precioReferencia')
      .sort({ fecha: 1, 'horario.horaInicio': 1 });

    res.json({ ok: true, data: turnos });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/turnos/:id
 */
export async function obtenerTurno(req, res, next) {
  try {
    const turno = await Turno.findById(req.params.id)
      .populate('paciente', 'nombre apellido dni telefono email obraSocial')
      .populate('tratamiento', 'nombre duracionMin precioReferencia');
    if (!turno) throw new AppError('Turno no encontrado', 404, 'NOT_FOUND');
    res.json({ ok: true, data: turno });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/turnos
 * Body: { pacienteId, tratamientoId, fecha (YYYY-MM-DD), horaInicio (HH:MM), observaciones? }
 *
 * Crea el turno en estado Pendiente, validando que no haya solapamiento.
 * La duración se obtiene del Tratamiento.
 */
export async function crearTurno(req, res, next) {
  try {
    const { pacienteId, tratamientoId, fecha, horaInicio, observaciones } = req.body;

    // 1) Validar referencias
    const [paciente, tratamiento] = await Promise.all([
      Paciente.findById(pacienteId),
      Tratamiento.findById(tratamientoId),
    ]);
    if (!paciente) throw new AppError('Paciente no encontrado', 404, 'PATIENT_NOT_FOUND');
    if (!tratamiento) throw new AppError('Tratamiento no encontrado', 404, 'TREATMENT_NOT_FOUND');

    const duracionMin = tratamiento.duracionMin;
    const horaFin = addMinutes(horaInicio, duracionMin);

    // 2) Validar no-solapamiento con turnos Pendientes/Confirmados
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);

    const conflicto = await Turno.findOne({
      fecha: { $gte: inicio, $lte: fin },
      estado: { $in: ['Pendiente', 'Confirmado'] },
      'horario.horaInicio': { $lt: horaFin },
      'horario.horaFin': { $gt: horaInicio },
    });
    if (conflicto) {
      throw new AppError(
        `El horario ${horaInicio}–${horaFin} ya está ocupado por otro turno`,
        409,
        'SLOT_OCUPADO'
      );
    }

    // 3) Crear turno
    const turno = await Turno.create({
      paciente: pacienteId,
      tratamiento: tratamientoId,
      fecha: new Date(fecha),
      horario: { horaInicio, horaFin },
      duracionMin,
      estado: 'Pendiente',
      pagoConfirmado: false,
      observaciones: observaciones || '',
    });

    const populated = await Turno.findById(turno._id)
      .populate('paciente', 'nombre apellido dni telefono email')
      .populate('tratamiento', 'nombre duracionMin precioReferencia');

    res.status(201).json({ ok: true, data: populated });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/turnos/:id/confirmar-pago
 *
 * Flujo crítico. Ver diagrama en docs/08-flujo-del-sistema.md.
 *
 * Pasos:
 *   1) Buscar turno. 404 si no existe. 409 si ya está confirmado/cancelado.
 *   2) Actualizar estado en Mongo (Pendiente → Confirmado).
 *   3) Crear evento en Google Calendar.
 *      - Éxito → guardar calendarEventId.
 *      - Fallo → ROLLBACK estado=Pendiente + HTTP 502.
 *   4) Enviar email de confirmación.
 *      - Fallo → NO se hace rollback. HTTP 200 con warning.
 */
export async function confirmarPago(req, res, next) {
  let turnoOriginal;
  try {
    // 1) Buscar y validar
    turnoOriginal = await Turno.findById(req.params.id)
      .populate('paciente')
      .populate('tratamiento');

    if (!turnoOriginal) throw new AppError('Turno no encontrado', 404, 'NOT_FOUND');
    if (['Confirmado', 'Cancelado', 'Atendido'].includes(turnoOriginal.estado)) {
      throw new AppError(
        `El turno ya está en estado "${turnoOriginal.estado}" y no puede confirmarse`,
        409,
        'INVALID_STATE_TRANSITION'
      );
    }

    // 2) Marcar como Confirmado
    turnoOriginal.estado = 'Confirmado';
    turnoOriginal.pagoConfirmado = true;
    await turnoOriginal.save();

    const warnings = {};

    // 3) Crear evento en Google Calendar
    // - Si Calendar NO está configurado (CalendarDisabledError): modo degradado,
    //   continuar sin rollback y devolver warning.
    // - Si Calendar está configurado pero falla la llamada: ROLLBACK + 502.
    try {
      const eventId = await calendarService.crearEvento(turnoOriginal);
      turnoOriginal.calendarEventId = eventId;
      await turnoOriginal.save();
    } catch (calErr) {
      if (calErr instanceof CalendarDisabledError) {
        // Modo degradado: Calendar no está configurado. No es un fallo.
        warnings.calendar = 'Google Calendar no configurado. El turno queda confirmado sin evento en Calendar.';
        console.warn('⚠️  Calendar en modo degradado:', calErr.message);
      } else {
        // Error real: hacemos rollback.
        console.error('❌ Fallo Google Calendar, haciendo rollback:', calErr.message);
        turnoOriginal.estado = 'Pendiente';
        turnoOriginal.pagoConfirmado = false;
        await turnoOriginal.save();
        return res.status(502).json({
          ok: false,
          error: 'No se pudo crear el evento en Google Calendar. Turno revertido a Pendiente.',
          code: 'CALENDAR_FAILED',
          detail: calErr.message,
        });
      }
    }

    // 4) Enviar email (sin rollback si falla)
    try {
      await emailService.enviarConfirmacion(turnoOriginal);
    } catch (mailErr) {
      if (mailErr instanceof MailDisabledError) {
        warnings.email = 'Email no configurado. El paciente no recibió la confirmación.';
      } else {
        warnings.email = `No se pudo enviar el email: ${mailErr.message}`;
      }
      console.warn('⚠️  Email no enviado:', mailErr.message);
    }

    // 5) Respuesta exitosa
    res.json({
      ok: true,
      data: turnoOriginal,
      ...(Object.keys(warnings).length > 0 && { warnings }),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/turnos/:id/cancelar
 * Cambia estado a Cancelado y elimina el evento de Calendar si existe.
 */
export async function cancelarTurno(req, res, next) {
  try {
    const turno = await Turno.findById(req.params.id)
      .populate('paciente')
      .populate('tratamiento');

    if (!turno) throw new AppError('Turno no encontrado', 404, 'NOT_FOUND');
    if (turno.estado === 'Cancelado') {
      throw new AppError('El turno ya está cancelado', 409, 'ALREADY_CANCELLED');
    }

    // Eliminar evento de Calendar si existe
    if (turno.calendarEventId) {
      try {
        await calendarService.eliminarEvento(turno.calendarEventId);
      } catch (calErr) {
        console.warn('⚠️  No se pudo eliminar el evento de Calendar:', calErr.message);
      }
      turno.calendarEventId = null;
    }

    turno.estado = 'Cancelado';
    if (req.body && req.body.motivo) {
      turno.observaciones = (turno.observaciones || '') + `\n[CANCELADO] ${req.body.motivo}`.trim();
    }
    await turno.save();

    res.json({ ok: true, data: turno });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/turnos/:id/atender
 * Cambia estado a Atendido (cuando el paciente concurrió y se registró consulta).
 */
export async function atenderTurno(req, res, next) {
  try {
    const turno = await Turno.findByIdAndUpdate(
      req.params.id,
      { estado: 'Atendido' },
      { new: true }
    ).populate('paciente tratamiento');
    if (!turno) throw new AppError('Turno no encontrado', 404, 'NOT_FOUND');
    res.json({ ok: true, data: turno });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/turnos/:id
 * Permitido si el turno está en estado Pendiente o Cancelado.
 * - Si tiene calendarEventId, intenta eliminarlo de Calendar (best-effort).
 */
export async function eliminarTurno(req, res, next) {
  try {
    const turno = await Turno.findById(req.params.id);
    if (!turno) throw new AppError('Turno no encontrado', 404, 'NOT_FOUND');
    if (!['Pendiente', 'Cancelado'].includes(turno.estado)) {
      throw new AppError(
        `Solo se pueden eliminar turnos en estado Pendiente o Cancelado (actual: ${turno.estado})`,
        409,
        'INVALID_STATE_FOR_DELETE'
      );
    }

    // Best-effort: limpiar evento de Calendar si existe
    if (turno.calendarEventId) {
      try {
        await calendarService.eliminarEvento(turno.calendarEventId);
      } catch (calErr) {
        console.warn('⚠️  No se pudo eliminar el evento de Calendar al borrar turno:', calErr.message);
      }
    }

    await Turno.findByIdAndDelete(req.params.id);
    res.json({ ok: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
}