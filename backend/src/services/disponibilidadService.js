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
  formatYMD,
} from '../utils/time.js';

/**
 * Devuelve los slots libres para una fecha y duración determinadas.
 * @param {string} ymd - Fecha en formato YYYY-MM-DD
 * @param {number} duracionMin - Duración total del turno en minutos
 * @returns {Promise<string[]>} Array de strings "HH:MM"
 */
export async function obtenerSlotsLibres(ymd, duracionMin) {
  // 1) Validar día laborable
  // Construimos un Date local para getDay()
  const fecha = buildLocalDateTime(ymd, '00:00');
  const dow = getLocalDayOfWeek(fecha);
  if (!DIAS_LABORABLES.includes(dow)) {
    return [];
  }

  // 2) Slots base
  const slotsBase = generarSlotsBase();

  // 3) Si es hoy, descartar slots pasados
  const ahora = new Date();
  const slotsFiltradosPorHora = slotsBase.filter((slot) => {
    const slotDate = buildLocalDateTime(ymd, slot);
    // Margen de 30 minutos para crear el turno con anticipación
    return slotDate.getTime() > ahora.getTime() + 30 * 60 * 1000;
  });

  // 4) Traer turnos reservados ese día
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

  // 5) Filtrar slots que no se solapan con ningún reservado
  const libres = slotsFiltradosPorHora.filter((slot) => {
    const nuevoInicio = hhmmToMinutes(slot);
    const nuevoFin = nuevoInicio + duracionMin;

    // Verificar que el slot + duración no supere el cierre
    const cierreMin = hhmmToMinutes('20:00');
    if (nuevoFin > cierreMin) return false;

    // Verificar no-solapamiento con cada turno reservado
    for (const t of reservados) {
      const tInicio = hhmmToMinutes(t.horario.horaInicio);
      const tFin = hhmmToMinutes(t.horario.horaFin);
      // Solapan si: nuevoInicio < tFin && nuevoFin > tInicio
      if (nuevoInicio < tFin && nuevoFin > tInicio) {
        return false;
      }
    }
    return true;
  });

  return libres;
}

/**
 * GET /api/disponibilidad?fecha=YYYY-MM-DD&tratamientoId=...
 * Resuelve la duración efectiva (la del tratamiento si existe).
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

    const slots = await obtenerSlotsLibres(fecha, duracionMin);
    res.json({
      ok: true,
      data: {
        fecha,
        duracionMin,
        tratamiento: tratamientoNombre,
        slotsLibres: slots,
      },
    });
  } catch (err) {
    next(err);
  }
}