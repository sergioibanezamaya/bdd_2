/**
 * components/PacienteForm.jsx — Formulario de alta/edición de paciente
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
import { useState, useEffect } from 'react';
import { pacientesApi } from '../api/client.js';

const VACIO = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  obraSocial: '',
};

export default function PacienteForm({ paciente, onClose, onSaved }) {
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (paciente) {
      const f = { ...paciente };
      if (f.fechaNacimiento) {
        const d = new Date(f.fechaNacimiento);
        f.fechaNacimiento = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      setForm(f);
    } else {
      setForm(VACIO);
    }
    setError(null);
  }, [paciente]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      let result;
      if (paciente) {
        result = await pacientesApi.actualizar(paciente._id || paciente.id, form);
      } else {
        result = await pacientesApi.crear(form);
      }
      onSaved(result);
    } catch (e2) {
      if (e2.details) {
        setError(e2.details.map((d) => `${d.field}: ${d.message}`).join(' | '));
      } else {
        setError(e2.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{paciente ? 'Editar paciente' : 'Nuevo paciente'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required minLength={2} maxLength={60} />
            </div>
            <div className="form-group">
              <label>Apellido *</label>
              <input name="apellido" value={form.apellido} onChange={handleChange} required minLength={2} maxLength={60} />
            </div>
            <div className="form-group">
              <label>DNI * {paciente && '(no editable)'}</label>
              <input
                name="dni"
                value={form.dni}
                onChange={handleChange}
                required
                pattern="[0-9]{7,8}"
                disabled={!!paciente}
              />
            </div>
            <div className="form-group">
              <label>Teléfono *</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Fecha de nacimiento *</label>
              <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} required max={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="form-group full">
              <label>Obra social *</label>
              <input name="obraSocial" value={form.obraSocial} onChange={handleChange} required maxLength={80} />
            </div>
          </div>

          <div className="flex-gap mt-2" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}