/**
 * utils/format.js — Helpers de formateo
 * Portal del Paciente — TP Base de Datos II
 */

const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/** Fecha larga tipo "lunes, 29 de junio de 2026" */
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

/** Fecha corta tipo "29/06/2026" */
export function formatFechaCorta(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Devuelve YYYY-MM-DD (para inputs <input type="date"> y para enviar al backend) */
export function formatFechaInput(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Devuelve "hoy" en formato YYYY-MM-DD (zona local) */
export function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function nombreMes(mes) {
  return MESES[mes - 1] || '';
}

export function formatMoneda(value) {
  if (value == null) return '';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}