/**
 * api/client.js — Funciones fetch agrupadas por recurso
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 *
 * Centraliza todas las llamadas al backend.
 * La URL base es /api (Vite hace proxy hacia http://localhost:3000).
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
// Pacientes
// =====================================================================
export const pacientesApi = {
  listar: (q = '') => request(`/pacientes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  obtener: (id) => request(`/pacientes/${id}`),
  crear: (body) => request('/pacientes', { method: 'POST', body: JSON.stringify(body) }),
  actualizar: (id, body) => request(`/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminar: (id) => request(`/pacientes/${id}`, { method: 'DELETE' }),
};

// =====================================================================
// Tratamientos
// =====================================================================
export const tratamientosApi = {
  listar: () => request('/tratamientos'),
  crear: (body) => request('/tratamientos', { method: 'POST', body: JSON.stringify(body) }),
  actualizar: (id, body) => request(`/tratamientos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
};

// =====================================================================
// Turnos
// =====================================================================
export const turnosApi = {
  listar: (filtros = {}) => {
    const qs = new URLSearchParams(filtros).toString();
    return request(`/turnos${qs ? `?${qs}` : ''}`);
  },
  obtener: (id) => request(`/turnos/${id}`),
  crear: (body) => request('/turnos', { method: 'POST', body: JSON.stringify(body) }),
  confirmarPago: (id) => request(`/turnos/${id}/confirmar-pago`, { method: 'PATCH' }),
  cancelar: (id, motivo = '') =>
    request(`/turnos/${id}/cancelar`, { method: 'PATCH', body: JSON.stringify({ motivo }) }),
  atender: (id) => request(`/turnos/${id}/atender`, { method: 'PATCH' }),
  eliminar: (id) => request(`/turnos/${id}`, { method: 'DELETE' }),
};

// =====================================================================
// Consultas
// =====================================================================
export const consultasApi = {
  listar: (pacienteId) => request(`/consultas${pacienteId ? `?pacienteId=${pacienteId}` : ''}`),
  obtener: (id) => request(`/consultas/${id}`),
  crear: (body) => request('/consultas', { method: 'POST', body: JSON.stringify(body) }),
  actualizar: (id, body) => request(`/consultas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminar: (id) => request(`/consultas/${id}`, { method: 'DELETE' }),
};

// =====================================================================
// Disponibilidad
// =====================================================================
export const disponibilidadApi = {
  consultar: (fecha, tratamientoId = '') => {
    const qs = new URLSearchParams({ fecha });
    if (tratamientoId) qs.set('tratamientoId', tratamientoId);
    return request(`/disponibilidad?${qs}`);
  },
};

// =====================================================================
// Agregaciones
// =====================================================================
export const agregacionesApi = {
  turnosPorMes: () => request('/agregaciones/turnos-por-mes'),
  tratamientosFrecuentes: () => request('/agregaciones/tratamientos-mas-frecuentes'),
  pacientesPorObraSocial: () => request('/agregaciones/pacientes-por-obra-social'),
  tasaConfirmacion: () => request('/agregaciones/tasa-confirmacion'),
};

// =====================================================================
// Google Calendar status
// =====================================================================
export const googleApi = {
  status: () => request('/google/status'),
};

// =====================================================================
// Portal del Paciente (endpoints públicos, sin auth)
// =====================================================================
export const portalApi = {
  /**
   * POST /api/portal/login
   * Body: { dni }
   * Respuesta: { ok, exists: boolean, data?: paciente }
   */
  loginPorDni: (dni) => request('/portal/login', { method: 'POST', body: JSON.stringify({ dni }) }),
  /**
   * POST /api/portal/registro
   * Body: { nombre, apellido, dni, telefono, email, fechaNacimiento, obraSocial }
   * Reutiliza el controller de crearPaciente. Si el DNI ya existía, devuelve existed:true.
   */
  registrar: (body) => request('/portal/registro', { method: 'POST', body: JSON.stringify(body) }),
  /**
   * GET /api/portal/mis-turnos?dni=40123456
   * Devuelve los turnos del paciente identificado por DNI.
   */
  misTurnos: (dni) => request(`/portal/mis-turnos?dni=${encodeURIComponent(dni)}`),
  /**
   * GET /api/portal/alias-pago
   * Devuelve el alias y titular para pagos por transferencia.
   */
  getAliasPago: () => request('/portal/alias-pago'),
  /**
   * POST /api/portal/turnos
   * Body: { dni, tratamientoId, fecha, horaInicio, observaciones?, metodoPago?, comprobantePago? (base64), comprobanteMimeType? }
   */
  crearTurno: (body) => request('/portal/turnos', { method: 'POST', body: JSON.stringify(body) }),
  /**
   * PATCH /api/portal/turnos/:id/cancelar
   * Body: { dni, motivo? }
   */
  cancelarTurno: (id, body) =>
    request(`/portal/turnos/${id}/cancelar`, { method: 'PATCH', body: JSON.stringify(body) }),
  /**
   * PATCH /api/portal/turnos/:id/cambiar
   * Body: { dni, fecha, horaInicio, tratamientoId?, metodoPago?, comprobantePago?, comprobanteMimeType? }
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