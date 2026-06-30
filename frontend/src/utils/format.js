/**
 * utils/format.js — Helpers de formateo
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */

const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/**
 * Formatea una fecha (Date o string YYYY-MM-DD) en formato local largo.
 */
export function formatFechaLarga(value) {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatFechaCorta(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatFechaInput(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatHora(value) {
  if (!value) return '';
  return value;
}

export function formatMoneda(value) {
  if (value == null) return '';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}

export function nombreMes(mes) {
  return MESES[mes - 1] || '';
}