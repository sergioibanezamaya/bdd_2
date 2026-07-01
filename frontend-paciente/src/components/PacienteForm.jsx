/**
 * components/PacienteForm.jsx — Formulario de auto-registro del paciente
 *
 * Es la versión específica del portal del paciente del PacienteForm del
 * odontólogo. Mantiene los mismos campos y el mismo estilo visual para
 * que el paciente vea la misma UI.
 *
 * El DNI viene precargado (vino del LoginForm). El paciente completa
 * los 6 campos restantes. Reutiliza las validaciones del backend
 * (crearPacienteValidator): DNI 7-8 dígitos, email válido, fecha no
 * futura, etc.
 */
import React, { useState } from 'react';
import { portalApi } from '../api/client.js';

const INITIAL = (dni) => ({
  dni: dni || '',
  nombre: '',
  apellido: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  obraSocial: '',
});

export default function PacienteForm({ dniInicial, onRegistrar, onCancel, loading }) {
  const [form, setForm] = useState(() => INITIAL(dniInicial));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onRegistrar({
        ...form,
        dni: form.dni.trim(),
        email: form.email.trim().toLowerCase(),
      });
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const disabled = loading || saving;

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="dni">DNI</label>
        <input id="dni" type="text" value={form.dni} disabled />
      </div>

      <div className="form-group">
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre" type="text" autoComplete="given-name" required
          value={form.nombre} onChange={set('nombre')} disabled={disabled}
          minLength={2} maxLength={60}
        />
      </div>

      <div className="form-group">
        <label htmlFor="apellido">Apellido</label>
        <input
          id="apellido" type="text" autoComplete="family-name" required
          value={form.apellido} onChange={set('apellido')} disabled={disabled}
          minLength={2} maxLength={60}
        />
      </div>

      <div className="form-group">
        <label htmlFor="telefono">Teléfono</label>
        <input
          id="telefono" type="tel" autoComplete="tel" required
          placeholder="+54 11 5555-1234"
          value={form.telefono} onChange={set('telefono')} disabled={disabled}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email" type="email" autoComplete="email" required
          placeholder="tu@email.com"
          value={form.email} onChange={set('email')} disabled={disabled}
        />
        <span className="form-help">Acá te llega la confirmación del turno.</span>
      </div>

      <div className="form-group">
        <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
        <input
          id="fechaNacimiento" type="date" required max={new Date().toISOString().slice(0, 10)}
          value={form.fechaNacimiento} onChange={set('fechaNacimiento')} disabled={disabled}
        />
      </div>

      <div className="form-group">
        <label htmlFor="obraSocial">Obra social</label>
        <input
          id="obraSocial" type="text" required
          placeholder="OSDE, Swiss Medical, Particular..."
          value={form.obraSocial} onChange={set('obraSocial')} disabled={disabled}
          maxLength={80}
        />
      </div>

      {error && (
        <div className="alert alert-error">
          {error.message || 'No se pudo crear la cuenta.'}
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-full" disabled={disabled}>
        {saving ? 'Creando...' : 'Crear cuenta'}
      </button>

      {onCancel && (
        <button
          type="button" className="btn btn-outline btn-full mt-2"
          onClick={onCancel} disabled={disabled}
        >
          Volver
        </button>
      )}
    </form>
  );
}
