/**
 * components/MiPerfil.jsx — Ver datos del paciente (solo lectura por ahora)
 *
 * En este TP el paciente no edita sus datos desde el portal
 * (se mantienen desde el panel del odontólogo). Esto es solo info.
 */

import React from 'react';
import { formatFechaCorta } from '../utils/format.js';

const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
    <span className="muted">{label}</span>
    <strong style={{ textAlign: 'right' }}>{value || '—'}</strong>
  </div>
);

export default function MiPerfil({ paciente }) {
  if (!paciente) return null;
  return (
    <div className="portal-card">
      <h2>Mis datos</h2>
      <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 10px' }}>
        Si necesitás modificar algo, contactá al consultorio.
      </p>
      <Row label="Nombre" value={paciente.nombre} />
      <Row label="Apellido" value={paciente.apellido} />
      <Row label="DNI" value={paciente.dni} />
      <Row label="Teléfono" value={paciente.telefono} />
      <Row label="Email" value={paciente.email} />
      <Row label="Fecha de nacimiento" value={formatFechaCorta(paciente.fechaNacimiento)} />
      <Row label="Obra social" value={paciente.obraSocial} />
    </div>
  );
}