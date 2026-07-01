/**
 * =====================================================================
 * services/disponibilidadService.js — Algoritmo de slots libres
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Calcula los horarios disponibles para una fecha y duración dadas,
 * cruzando los slots base del consultorio contra los turnos ya reservados.
 *
 * Reglas:
 *   - Solo días laborables (lun-vie por defecto).
 *   - Granularidad base: 30 minutos.
 *   - Si la fecha es HOY, descartar slots pasados (< ahora + 30 min).
 *   - Duración efectiva: la del Tratamiento, o 30 min por defecto.
 *   - Un slot está libre si ningún turno reservado se solapa con
 *     [slotInicio, slotInicio + duracionMin).
 *   - Se devuelven TODOS los slots del día con un flag `ocupado: boolean`
 *     y `libreHasta: HH:MM` (cuándo termina la disponibilidad del doctor
 *     si se eligiera ese slot).
 * =====================================================================
 */

import Turno from '../models/Turno.js';
import Tratamiento from '../models/Tratamiento.js';
import {
  generarSlotsBase,
  DIAS_LABORABLES,
  SLOT_MINUTOS,
} from '../utils/slots.js';
import {
  hhmmToMinutes,
  minutesToHhmm,
  getLocalDayOfWeek,
  buildLocalDateTime,
} from '../utils/time.js';

/**
 * Devuelve la lista completa de slots del día, con flag `ocupado` y
 * `libreHasta` (cuándo termina la disponibilidad si se eligiera).
 *
 * @param {string} ymd - Fecha en formato YYYY-MM-DD
 * @param {number} duracionMin - Duración total del turno en minutos
 * @returns {Promise<Array<{ hora: string, ocupado: boolean, motivo?: string, libreHasta?: string }>>}
 */
export async function obtenerSlotsCompletos(ymd, duracionMin) {
  // 1) Validar día laborable
  const fecha = buildLocalDateTime(ymd, '00:00');
  const dow = getLocalDayOfWeek(fecha);
  if (!DIAS_LABORABLES.includes(dow)) {
    return [];
  }

  // 2) Slots base
  const slotsBase = generarSlotsBase();
  const ahora = new Date();
  const margenMs = 30 * 60 * 1000;

  // 3) Traer turnos reservados ese día
  const inicioDia = new Date(fecha);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(fecha);
  finDia.setHours(23, 59, 59, 999);

  const reservados = await Turno.find(
    {
      fecha: { $gte: inicioDia, $lte: finDia },
      estado: { $in: ['Pendiente', 'Confirmado'] },
    },
    { 'horario.horaInicio': 1, 'horario.horaFin': 1 }
  );

  // 4) Construir la lista completa con flags
  const cierreMin = hhmmToMinutes('20:00');
  const resultado = slotsBase.map((slot) => {
    const slotInicio = hhmmToMinutes(slot);
    const slotFin = slotInicio + duracionMin;
    const slotDate = buildLocalDateTime(ymd, slot);

    // Pasado: ya pasó la hora + margen
    if (slotDate.getTime() <= ahora.getTime() + margenMs) {
      return { hora: slot, ocupado: true, motivo: 'pasado' };
    }

    // Fuera del horario de cierre
    if (slotFin > cierreMin) {
      return { hora: slot, ocupado: true, motivo: 'fuera-de-horario' };
    }

    // Verificar solapamiento con turnos reservados
    let ocupadoPor = null;
    for (const t of reservados) {
      const tInicio = hhmmToMinutes(t.horario.horaInicio);
      const tFin = hhmmToMinutes(t.horario.horaFin);
      if (slotInicio < tFin && slotFin > tInicio) {
        ocupadoPor = t;
        break;
      }
    }

    if (ocupadoPor) {
      return { hora: slot, ocupado: true, motivo: 'turno-activo' };
    }

    // Libre: hasta qué hora está libre el doctor
    return {
      hora: slot,
      ocupado: false,
      libreHasta: minutesToHhmm(slotFin),
    };
  });

  return resultado;
}

/**
 * Devuelve sólo los slots libres (compatibilidad con consumidores previos).
 * @param {string} ymd
 * @param {number} duracionMin
 * @returns {Promise<string[]>}
 */
export async function obtenerSlotsLibres(ymd, duracionMin) {
  const completos = await obtenerSlotsCompletos(ymd, duracionMin);
  return completos.filter((s) => !s.ocupado).map((s) => s.hora);
}

/**
 * GET /api/disponibilidad?fecha=YYYY-MM-DD&tratamientoId=...
 * Resuelve la duración efectiva (la del tratamiento si existe).
 *
 * Respuesta:
 *   {
 *     ok: true,
 *     data: {
 *       fecha,
 *       duracionMin,
 *       tratamiento,
 *       slotsLibres: [...],   // sólo los libres (compatibilidad)
 *       slots: [...],          // todos con flag ocupado
 *     }
 *   }
 */
export async function getDisponibilidad(req, res, next) {
  try {
    const { fecha, tratamientoId } = req.query;

    if (!fecha) {
      return res.status(400).json({ ok: false, error: 'Parámetro `fecha` es obligatorio (YYYY-MM-DD)' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ ok: false, error: 'Formato de fecha inválido, usar YYYY-MM-DD' });
    }

    let duracionMin = SLOT_MINUTOS;
    let tratamientoNombre = null;

    if (tratamientoId) {
      const t = await Tratamiento.findById(tratamientoId);
      if (t) {
        duracionMin = t.duracionMin;
        tratamientoNombre = t.nombre;
      }
    }

    const slotsCompletos = await obtenerSlotsCompletos(fecha, duracionMin);
    const slotsLibres = slotsCompletos.filter((s) => !s.ocupado).map((s) => s.hora);

    res.json({
      ok: true,
      data: {
        fecha,
        duracionMin,
        tratamiento: tratamientoNombre,
        slotsLibres,
        slots: slotsCompletos,
      },
    });
  } catch (err) {
    next(err);
  }
}
