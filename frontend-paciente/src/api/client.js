/**
 * api/client.js — Funciones fetch agrupadas por recurso
 * Portal del Paciente — TP Base de Datos II
 *
 * La URL base es /api (Vite hace proxy hacia http://localhost:3000).
 * Centraliza TODAS las llamadas al backend.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || `HTTP ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.code = data.code;
    error.details = data.details;
    throw error;
  }
  return data;
}

// =====================================================================
// Portal del paciente (auth simple por DNI)
// =====================================================================
export const portalApi = {
  /** POST /api/portal/login → { ok, exists, data? } */
  login: (dni) => request('/portal/login', { method: 'POST', body: JSON.stringify({ dni }) }),
  /** POST /api/portal/registro → { ok, existed, data } */
  registro: (body) => request('/portal/registro', { method: 'POST', body: JSON.stringify(body) }),
  /** GET /api/portal/mis-turnos?dni=... → { ok, data: [turnos] } */
  misTurnos: (dni) => request(`/portal/mis-turnos?dni=${encodeURIComponent(dni)}`),
  /** GET /api/portal/alias-pago → { ok, data: { alias, titular } } */
  getAliasPago: () => request('/portal/alias-pago'),
  /**
   * POST /api/portal/turnos
   * Body: { dni, tratamientoId, fecha, horaInicio, observaciones?,
   *         metodoPago?, comprobantePago? (base64), comprobanteMimeType? }
   */
  crearTurno: (body) => request('/portal/turnos', { method: 'POST', body: JSON.stringify(body) }),
  /**
   * PATCH /api/portal/turnos/:id/cambiar
   * Body: { dni, fecha, horaInicio, tratamientoId?, metodoPago?,
   *         comprobantePago?, comprobanteMimeType? }
   */
  cambiarTurno: (id, body) =>
    request(`/portal/turnos/${id}/cambiar`, { method: 'PATCH', body: JSON.stringify(body) }),
  /**
   * PATCH /api/portal/turnos/:id/comprobante
   * Body: { dni, metodoPago, comprobantePago (base64), comprobanteMimeType? }
   */
  subirComprobante: (id, body) =>
    request(`/portal/turnos/${id}/comprobante`, { method: 'PATCH', body: JSON.stringify(body) }),
};

// =====================================================================
// Tratamientos (para selector en /reservar)
// =====================================================================
export const tratamientosApi = {
  listar: () => request('/tratamientos'),
};

// =====================================================================
// Turnos (el paciente solo puede crear y cancelar)
// =====================================================================
export const turnosApi = {
  crear: (body) => request('/turnos', { method: 'POST', body: JSON.stringify(body) }),
  cancelar: (id, motivo = '') =>
    request(`/turnos/${id}/cancelar`, { method: 'PATCH', body: JSON.stringify({ motivo }) }),
};

// =====================================================================
// Disponibilidad
// =====================================================================
export const disponibilidadApi = {
  consultar: (fecha, tratamientoId) => {
    const qs = new URLSearchParams({ fecha });
    if (tratamientoId) qs.set('tratamientoId', tratamientoId);
    return request(`/disponibilidad?${qs}`);
  },
};