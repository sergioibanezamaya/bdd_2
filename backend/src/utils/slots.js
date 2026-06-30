/**
 * =====================================================================
 * utils/slots.js — Generador de slots de tiempo
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Define el horario del consultorio y genera los slots base
 * sobre los que se aplica el algoritmo de disponibilidad.
 * =====================================================================
 */

// Constantes del consultorio (pueden moverse a .env si se requiere)
export const HORA_APERTURA = '08:00';
export const HORA_CIERRE = '20:00';
export const SLOT_MINUTOS = 30; // granularidad base
export const DIAS_LABORABLES = [1, 2, 3, 4, 5]; // lunes a viernes (0=domingo)

import { hhmmToMinutes, minutesToHhmm } from './time.js';

/**
 * Genera todos los slots base entre apertura y cierre.
 * Ej: con SLOT_MINUTOS=30 y 08:00-20:00 → ["08:00","08:30",...,"19:30"]
 * (el último slot es HORA_CIERRE - SLOT_MINUTOS)
 */
export function generarSlotsBase(apertura = HORA_APERTURA, cierre = HORA_CIERRE, paso = SLOT_MINUTOS) {
  const slots = [];
  const inicio = hhmmToMinutes(apertura);
  const fin = hhmmToMinutes(cierre);
  for (let m = inicio; m + paso <= fin; m += paso) {
    slots.push(minutesToHhmm(m));
  }
  return slots;
}