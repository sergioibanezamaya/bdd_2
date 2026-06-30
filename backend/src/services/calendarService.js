/**
 * =====================================================================
 * services/calendarService.js — Integración con Google Calendar
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Funciones:
 *   - crearEvento(turno): crea un evento en el calendario configurado
 *     y devuelve el eventId (para guardar en Turno.calendarEventId).
 *   - eliminarEvento(eventId): borra el evento.
 *
 * Si Google Calendar NO está configurado (no hay credentials.json,
 * o faltan variables de entorno), las funciones lanzan un error
 * con código `CALENDAR_DISABLED` que el controller maneja como
 * modo degradado.
 * =====================================================================
 */

import { calendar, authStatus } from '../config/googleCalendar.js';
import { buildLocalDateTime } from '../utils/time.js';

export class CalendarDisabledError extends Error {
  constructor(message = 'Google Calendar no está configurado') {
    super(message);
    this.code = 'CALENDAR_DISABLED';
  }
}

/**
 * Crea un evento en Google Calendar para el turno dado.
 * @param {Object} turno - Documento Turno (con paciente y tratamiento populados)
 * @returns {Promise<string>} eventId
 */
export async function crearEvento(turno) {
  if (!authStatus.enabled) {
    throw new CalendarDisabledError();
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  // Construir fechas en formato RFC3339 con offset local (-03:00 Argentina)
  const tzOffset = '-03:00';
  const startDateTime = buildLocalDateTime(
    turno.fecha.toISOString().slice(0, 10),
    turno.horario.horaInicio
  );
  const endDateTime = buildLocalDateTime(
    turno.fecha.toISOString().slice(0, 10),
    turno.horario.horaFin
  );

  const startISO = `${formatLocal(startDateTime)}${tzOffset}`;
  const endISO = `${formatLocal(endDateTime)}${tzOffset}`;

  const pacienteNombre = `${turno.paciente?.nombre || ''} ${turno.paciente?.apellido || ''}`.trim();
  const tratamientoNombre = turno.tratamiento?.nombre || 'Consulta';
  const dni = turno.paciente?.dni || '';
  const telefono = turno.paciente?.telefono || '';

  const event = {
    summary: `Turno: ${pacienteNombre} — ${tratamientoNombre}`,
    description:
      `Paciente: ${pacienteNombre}\n` +
      `DNI: ${dni}\n` +
      `Teléfono: ${telefono}\n` +
      `Tratamiento: ${tratamientoNombre}\n` +
      `Estado: ${turno.estado}`,
    start: { dateTime: startISO },
    end: { dateTime: endISO },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 },
      ],
    },
  };

  const res = await calendar.events.insert({
    calendarId,
    resource: event,
    sendUpdates: 'none',
  });

  return res.data.id;
}

/**
 * Elimina un evento del calendario por su ID.
 * @param {string} eventId
 */
export async function eliminarEvento(eventId) {
  if (!authStatus.enabled) {
    throw new CalendarDisabledError();
  }
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  await calendar.events.delete({ calendarId, eventId });
}

/**
 * Devuelve "YYYY-MM-DDTHH:MM:SS" en hora local (sin offset).
 */
function formatLocal(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}