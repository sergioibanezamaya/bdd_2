/**
 * components/RegistroForm.jsx — Auto-registro del paciente nuevo
 *
 * El DNI llega precargado (vino del LoginForm). El paciente completa
 * los 6 campos restantes. Reutiliza las validaciones del backend
 * (crearPacienteValidator): DNI 7-8 dígitos, email válido, fecha no
 * futura, etc.
 */

import React, { useState } from 'react';

const INITIAL = (dni) => ({
  dni: dni || '',
  nombre: '',
  apellido: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  obraSocial: '',
});

export default function RegistroForm({ dniInicial, onRegistrar, onCancel, loading }) {
  const [form, setForm] = useState(() => INITIAL(dniInicial));
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await onRegistrar(form);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">📝</div>
        <h1 className="login-title">Crear cuenta</h1>
        <p className="login-subtitle">
          Tu DNI no está registrado. Completá tus datos para empezar.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="dni">DNI</label>
            <input id="dni" type="text" value={form.dni} disabled />
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre" type="text" autoComplete="given-name" required
              value={form.nombre} onChange={set('nombre')} disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="apellido">Apellido</label>
            <input
              id="apellido" type="text" autoComplete="family-name" required
              value={form.apellido} onChange={set('apellido')} disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono" type="tel" autoComplete="tel" required
              placeholder="+54 11 5555-1234"
              value={form.telefono} onChange={set('telefono')} disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" autoComplete="email" required
              placeholder="tu@email.com"
              value={form.email} onChange={set('email')} disabled={loading}
            />
            <span className="form-help">Acá te llega la confirmación del turno.</span>
          </div>

          <div className="form-group">
            <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
            <input
              id="fechaNacimiento" type="date" required max="2026-06-28"
              value={form.fechaNacimiento} onChange={set('fechaNacimiento')} disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="obraSocial">Obra social</label>
            <input
              id="obraSocial" type="text" required
              placeholder="OSDE, Swiss Medical, Particular..."
              value={form.obraSocial} onChange={set('obraSocial')} disabled={loading}
            />
          </div>

          {error && (
            <div className="alert alert-error">
              {error.message || 'No se pudo crear la cuenta.'}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>

          <button
            type="button" className="btn btn-outline btn-full mt-2"
            onClick={onCancel} disabled={loading}
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  );
}