/**
 * =====================================================================
 * controllers/portal.controller.js — Endpoints del Portal del Paciente
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Este controller es DELGADO. Reutiliza la lógica existente:
 *   - crearPaciente (de pacientes.controller) para registro, manteniendo
 *     la regla TP de deduplicación por DNI/teléfono.
 *   - listarTurnos (de turnos.controller) para "mis turnos".
 *
 * Decisión de seguridad: el "login" del portal es solo pedir DNI.
 * Si existe, devuelve los datos del paciente. Si no, lo dice. No hay
 * contraseñas, JWT ni rate-limit. Es un TP universitario — se documenta
 * en docs/09-portal-paciente.md.
 *
 * Acciones de turno desde el portal:
 *   - crearTurnoPortal: el paciente pide un turno nuevo (estado Pendiente).
 *   - cancelarTurnoPortal: el paciente cancela SU turno.
 *   - cambiarTurnoPortal: el paciente mueve SU turno a otra fecha/hora.
 *
 * Todos validan que el DNI del body coincida con el dueño del turno.
 * =====================================================================
 */

import Paciente from '../models/Paciente.js';
import Turno from '../models/Turno.js';
import Tratamiento from '../models/Tratamiento.js';
import { AppError } from '../middlewares/errorHandler.js';
import { addMinutes } from '../utils/time.js';
import { crearPaciente } from './pacientes.controller.js';
import { listarTurnos } from './turnos.controller.js';
import * as calendarService from '../services/calendarService.js';

// Alias de pago configurable por .env (default: richipai)
const ALIAS_PAGO = process.env.ALIAS_PAGO || 'richipai';
const TITULAR_PAGO = process.env.ALIAS_PAGO_TITULAR || 'Consultorio Odontológico';

// Límite del comprobante en base64. ~500KB ≈ 670KB en base64.
const MAX_COMPROBANTE_BYTES = 500 * 1024;

/**
 * Normaliza el método de pago recibido del frontend.
 * - null / undefined / '' → null
 * - 'Efectivo' / 'Transferencia' → mismo string
 * - Otros → null (no se rechaza, simplemente se ignora)
 */
function normalizarMetodoPago(valor) {
  if (valor === 'Efectivo' || valor === 'Transferencia') return valor;
  return null;
}

/**
 * Valida y normaliza el comprobante de pago (base64).
 * Devuelve { comprobantePago, comprobanteMimeType } o lanza AppError.
 */
function normalizarComprobante(base64Str, mimeType) {
  if (!base64Str) return { comprobantePago: null, comprobanteMimeType: null };
  // Quitar prefijo "data:image/...;base64," si viene incluido
  let limpio = base64Str;
  let mime = mimeType || 'image/jpeg';
  const match = /^data:([^;]+);base64,(.+)$/.exec(base64Str);
  if (match) {
    mime = match[1];
    limpio = match[2];
  }
  // Validar tamaño aproximado (base64 es ~4/3 del original)
  const tamano = Math.ceil(limpio.length * 0.75);
  if (tamano > MAX_COMPROBANTE_BYTES) {
    throw new AppError(
      `La imagen del comprobante es muy grande (${Math.round(tamano / 1024)}KB). Máximo permitido: ${Math.round(MAX_COMPROBANTE_BYTES / 1024)}KB. Comprimila antes de subirla.`,
      400,
      'COMPROBANTE_TOO_LARGE'
    );
  }
  return { comprobantePago: limpio, comprobanteMimeType: mime };
}

/**
 * POST /api/portal/login
 * Body: { dni }
 *
 * Respuesta exitosa:
 *   - Si existe:  { ok: true, exists: true,  data: paciente }
 *   - Si NO:      { ok: true, exists: false }
 *
 * No es 404 cuando NO existe: es una respuesta esperada del flujo
 * "paciente nuevo → auto-registro".
 */
export async function loginPorDni(req, res, next) {
  try {
    const { dni } = req.body;
    const paciente = await Paciente.findOne({ dni });
    if (!paciente) {
      return res.json({ ok: true, exists: false });
    }
    res.json({ ok: true, exists: true, data: paciente });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/portal/registro
 * Body: { dni, nombre, apellido, telefono, email, fechaNacimiento, obraSocial }
 *
 * Delega en crearPaciente. Si el DNI ya existía, devuelve existed:true
 * y el frontend lo trata como un login exitoso.
 */
export async function registroPortal(req, res, next) {
  // Reutilizamos exactamente la lógica de crearPaciente (incluida
  // deduplicación por DNI/teléfono). No reinventamos nada.
  return crearPaciente(req, res, next);
}

/**
 * GET /api/portal/mis-turnos?dni=40123456
 *
 * 1) Busca el paciente por DNI.
 * 2) Llama a listarTurnos(req, res) con req.query.paciente = paciente._id
 *    (así reuse el populate + orden + filtro de fecha).
 *
 * Si el DNI no existe, devuelve 404 con NOT_FOUND.
 */
export async function misTurnos(req, res, next) {
  try {
    const { dni } = req.query;
    if (!dni) {
      throw new AppError('Falta el parámetro dni', 400, 'MISSING_DNI');
    }

    const paciente = await Paciente.findOne({ dni });
    if (!paciente) {
      throw new AppError('Paciente no encontrado', 404, 'NOT_FOUND');
    }

    // Reusamos listarTurnos(req, res). Truco: mutamos req.query.paciente
    // para que el controller existente haga el filtro correcto.
    req.query.paciente = paciente._id.toString();
    return listarTurnos(req, res, next);
  } catch (err) {
    next(err);
  }
}

// =====================================================================
// Acciones de turno (paciente se autogestiona)
// =====================================================================

/**
 * GET /api/portal/alias-pago
 * Devuelve el alias y titular configurados para pagos por transferencia.
 */
export async function getAliasPago(_req, res) {
  res.json({
    ok: true,
    data: {
      alias: ALIAS_PAGO,
      titular: TITULAR_PAGO,
    },
  });
}

/**
 * POST /api/portal/turnos
 * Body: { dni, tratamientoId, fecha (YYYY-MM-DD), horaInicio (HH:MM),
 *         observaciones?, metodoPago?, comprobantePago? (base64), comprobanteMimeType? }
 *
 * Reglas:
 *   - El DNI debe existir.
 *   - El paciente NO puede tener ya un turno Pendiente/Confirmado.
 *   - El slot debe estar libre (anti-solapamiento).
 *   - Si metodoPago = 'Transferencia' y comprobantePago está ausente → error.
 *
 * Devuelve 201 con el turno creado.
 */
export async function crearTurnoPortal(req, res, next) {
  try {
    const { dni, tratamientoId, fecha, horaInicio, observaciones } = req.body;
    const metodoPago = normalizarMetodoPago(req.body.metodoPago);
    const { comprobantePago, comprobanteMimeType } = normalizarComprobante(
      req.body.comprobantePago,
      req.body.comprobanteMimeType
    );

    // Si eligió Transferencia sin comprobante, rechazar
    if (metodoPago === 'Transferencia' && !comprobantePago) {
      throw new AppError(
        'Si elegís transferencia, tenés que adjuntar el comprobante.',
        400,
        'COMPROBANTE_REQUIRED'
      );
    }

    const paciente = await Paciente.findOne({ dni });
    if (!paciente) throw new AppError('Paciente no encontrado', 404, 'NOT_FOUND');

    const tratamiento = await Tratamiento.findById(tratamientoId);
    if (!tratamiento) throw new AppError('Tratamiento no encontrado', 404, 'TREATMENT_NOT_FOUND');

    // Validar que no tenga ya un turno activo
    const yaActivo = await Turno.findOne({
      paciente: paciente._id,
      estado: { $in: ['Pendiente', 'Confirmado'] },
    });
    if (yaActivo) {
      throw new AppError(
        'Ya tenés un turno activo. Cancelá o cambiá el actual antes de pedir uno nuevo.',
        409,
        'PATIENT_HAS_ACTIVE_TURNO'
      );
    }

    const duracionMin = tratamiento.duracionMin;
    const horaFin = addMinutes(horaInicio, duracionMin);

    // Anti-solapamiento
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
        `El horario ${horaInicio}–${horaFin} ya está ocupado`,
        409,
        'SLOT_OCUPADO'
      );
    }

    const turno = await Turno.create({
      paciente: paciente._id,
      tratamiento: tratamientoId,
      fecha: new Date(fecha),
      horario: { horaInicio, horaFin },
      duracionMin,
      estado: 'Pendiente',
      pagoConfirmado: false,
      observaciones: observaciones || '',
      metodoPago,
      comprobantePago,
      comprobanteMimeType,
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
 * PATCH /api/portal/turnos/:id/cancelar
 * Body: { dni, motivo? }
 *
 * El paciente cancela SU turno. Verifica que el DNI sea el dueño.
 */
export async function cancelarTurnoPortal(req, res, next) {
  try {
    const { dni, motivo } = req.body;
    const paciente = await Paciente.findOne({ dni });
    if (!paciente) throw new AppError('Paciente no encontrado', 404, 'NOT_FOUND');

    const turno = await Turno.findById(req.params.id);
    if (!turno) throw new AppError('Turno no encontrado', 404, 'NOT_FOUND');

    // Verificar dueño
    if (turno.paciente.toString() !== paciente._id.toString()) {
      throw new AppError('No podés cancelar un turno que no es tuyo', 403, 'NOT_OWNER');
    }
    if (turno.estado === 'Cancelado') {
      throw new AppError('El turno ya está cancelado', 409, 'ALREADY_CANCELLED');
    }
    if (turno.estado === 'Atendido') {
      throw new AppError('El turno ya fue atendido y no puede cancelarse', 409, 'ALREADY_ATTENDED');
    }

    // Best-effort: eliminar evento de Calendar si existe
    if (turno.calendarEventId) {
      try {
        await calendarService.eliminarEvento(turno.calendarEventId);
      } catch (calErr) {
        console.warn('⚠️  No se pudo eliminar el evento de Calendar:', calErr.message);
      }
      turno.calendarEventId = null;
    }

    turno.estado = 'Cancelado';
    if (motivo) {
      turno.observaciones = (turno.observaciones || '') + `\n[CANCELADO POR PACIENTE] ${motivo}`.trim();
    }
    await turno.save();

    const populated = await Turno.findById(turno._id)
      .populate('paciente', 'nombre apellido dni telefono email')
      .populate('tratamiento', 'nombre duracionMin precioReferencia');

    res.json({ ok: true, data: populated });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/portal/turnos/:id/cambiar
 * Body: { dni, fecha (YYYY-MM-DD), horaInicio (HH:MM), tratamientoId? }
 *
 * Mueve el turno existente a otra fecha/hora (mantiene el mismo _id).
 * Si se cambia tratamiento, actualiza la duración.
 */
export async function cambiarTurnoPortal(req, res, next) {
  try {
    const { dni, fecha, horaInicio, tratamientoId } = req.body;
    const paciente = await Paciente.findOne({ dni });
    if (!paciente) throw new AppError('Paciente no encontrado', 404, 'NOT_FOUND');

    const turno = await Turno.findById(req.params.id);
    if (!turno) throw new AppError('Turno no encontrado', 404, 'NOT_FOUND');

    // Verificar dueño
    if (turno.paciente.toString() !== paciente._id.toString()) {
      throw new AppError('No podés modificar un turno que no es tuyo', 403, 'NOT_OWNER');
    }
    if (!['Pendiente', 'Confirmado'].includes(turno.estado)) {
      throw new AppError(
        `No se puede cambiar un turno en estado "${turno.estado}"`,
        409,
        'INVALID_STATE_FOR_CHANGE'
      );
    }

    // Resolver tratamiento (mantiene el actual si no se pasa uno nuevo)
    const tratamiento = tratamientoId
      ? await Tratamiento.findById(tratamientoId)
      : await Tratamiento.findById(turno.tratamiento);
    if (!tratamiento) throw new AppError('Tratamiento no encontrado', 404, 'TREATMENT_NOT_FOUND');

    const duracionMin = tratamiento.duracionMin;
    const horaFin = addMinutes(horaInicio, duracionMin);

    // Anti-solapamiento (excluyendo este mismo turno)
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);

    const conflicto = await Turno.findOne({
      _id: { $ne: turno._id },
      fecha: { $gte: inicio, $lte: fin },
      estado: { $in: ['Pendiente', 'Confirmado'] },
      'horario.horaInicio': { $lt: horaFin },
      'horario.horaFin': { $gt: horaInicio },
    });
    if (conflicto) {
      throw new AppError(
        `El horario ${horaInicio}–${horaFin} ya está ocupado`,
        409,
        'SLOT_OCUPADO'
      );
    }

    // Aplicar cambios
    turno.fecha = new Date(fecha);
    turno.horario = { horaInicio, horaFin };
    turno.duracionMin = duracionMin;
    if (tratamientoId) turno.tratamiento = tratamiento._id;

    // Si el paciente está cambiando método de pago o subiendo comprobante
    if (req.body.metodoPago !== undefined) {
      const metodoPago = normalizarMetodoPago(req.body.metodoPago);
      const { comprobantePago, comprobanteMimeType } = normalizarComprobante(
        req.body.comprobantePago,
        req.body.comprobanteMimeType
      );
      if (metodoPago === 'Transferencia' && !comprobantePago && !turno.comprobantePago) {
        throw new AppError(
          'Si elegís transferencia, tenés que adjuntar el comprobante.',
          400,
          'COMPROBANTE_REQUIRED'
        );
      }
      turno.metodoPago = metodoPago;
      if (comprobantePago) {
        turno.comprobantePago = comprobantePago;
        turno.comprobanteMimeType = comprobanteMimeType;
      }
    }

    // Best-effort: actualizar Calendar. Si falla, continuamos.
    if (turno.calendarEventId) {
      try {
        await calendarService.eliminarEvento(turno.calendarEventId);
        turno.calendarEventId = null;
      } catch (calErr) {
        console.warn('⚠️  No se pudo actualizar Calendar al cambiar turno:', calErr.message);
      }
    }

    await turno.save();

    const populated = await Turno.findById(turno._id)
      .populate('paciente', 'nombre apellido dni telefono email')
      .populate('tratamiento', 'nombre duracionMin precioReferencia');

    res.json({ ok: true, data: populated });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/portal/turnos/:id/comprobante
 * Body: { dni, metodoPago, comprobantePago (base64), comprobanteMimeType? }
 *
 * El paciente sube (o reemplaza) el comprobante de su turno.
 * Útil cuando eligió el método después o cuando quiere actualizar el comprobante.
 */
export async function subirComprobantePortal(req, res, next) {
  try {
    const { dni } = req.body;
    const paciente = await Paciente.findOne({ dni });
    if (!paciente) throw new AppError('Paciente no encontrado', 404, 'NOT_FOUND');

    const turno = await Turno.findById(req.params.id);
    if (!turno) throw new AppError('Turno no encontrado', 404, 'NOT_FOUND');

    if (turno.paciente.toString() !== paciente._id.toString()) {
      throw new AppError('No podés modificar un turno que no es tuyo', 403, 'NOT_OWNER');
    }
    if (['Cancelado', 'Atendido'].includes(turno.estado)) {
      throw new AppError(
        `No se puede subir comprobante a un turno en estado "${turno.estado}"`,
        409,
        'INVALID_STATE_FOR_UPLOAD'
      );
    }

    const metodoPago = normalizarMetodoPago(req.body.metodoPago ?? turno.metodoPago);
    const { comprobantePago, comprobanteMimeType } = normalizarComprobante(
      req.body.comprobantePago,
      req.body.comprobanteMimeType
    );

    if (!comprobantePago) {
      throw new AppError('Tenés que adjuntar la imagen del comprobante', 400, 'COMPROBANTE_REQUIRED');
    }

    turno.metodoPago = metodoPago || 'Transferencia';
    turno.comprobantePago = comprobantePago;
    turno.comprobanteMimeType = comprobanteMimeType;
    await turno.save();

    const populated = await Turno.findById(turno._id)
      .populate('paciente', 'nombre apellido dni telefono email')
      .populate('tratamiento', 'nombre duracionMin precioReferencia');

    res.json({ ok: true, data: populated });
  } catch (err) {
    next(err);
  }
}
