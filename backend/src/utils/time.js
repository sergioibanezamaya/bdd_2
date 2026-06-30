/**
 * =====================================================================
 * utils/time.js — Helpers para fechas y horas
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Trabaja con horas locales (America/Argentina/Buenos_Aires por defecto)
 * porque el consultorio maneja turnos en hora local.
 * =====================================================================
 */

const TZ = process.env.TZ || 'America/Argentina/Buenos_Aires';

/**
 * Convierte un string "HH:MM" a minutos desde 00:00.
 * @param {string} hhmm
 * @returns {number}
 */
export function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convierte minutos desde 00:00 a "HH:MM".
 * @param {number} minutes
 * @returns {string}
 */
export function minutesToHhmm(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Suma minutos a un "HH:MM" y devuelve "HH:MM".
 * @param {string} hhmm
 * @param {number} minutes
 * @returns {string}
 */
export function addMinutes(hhmm, minutes) {
  return minutesToHhmm(hhmmToMinutes(hhmm) + minutes);
}

/**
 * Devuelve el inicio del día (00:00:00) de una fecha en zona local.
 * @param {Date|string} fecha
 */
export function startOfDay(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Devuelve el final del día (23:59:59.999) de una fecha en zona local.
 * @param {Date|string} fecha
 */
export function endOfDay(fecha) {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Devuelve el día de la semana (0=domingo, 6=sábado) de una fecha local.
 */
export function getLocalDayOfWeek(fecha) {
  return new Date(fecha).getDay();
}

/**
 * Formatea una fecha como YYYY-MM-DD (string).
 */
export function formatYMD(fecha) {
  const d = new Date(fecha);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Construye un Date a partir de un YYYY-MM-DD + "HH:MM" en hora local.
 * Devuelve un Date que, cuando se formatea UTC, representa ese momento local.
 */
export function buildLocalDateTime(ymd, hhmm) {
  const [y, m, d] = ymd.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export { TZ };