/**
 * components/ConsultaForm.jsx — Formulario de consulta clínica
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
import { useState, useEffect } from 'react';
import { consultasApi, tratamientosApi, turnosApi } from '../api/client.js';

export default function ConsultaForm({ pacienteId, onClose, onSaved }) {
  const [tratamientos, setTratamientos] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [form, setForm] = useState({
    turnoId: '',
    diagnostico: '',
    observaciones: '',
    tratamientoId: '',
    requiereOperacion: false,
    altaMedica: false,
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      tratamientosApi.listar(),
      turnosApi.listar({ paciente: pacienteId }),
    ]).then(([t, tu]) => {
      setTratamientos(t.data);
      // Solo turnos Confirmados o Atendidos (no pendientes)
      setTurnos(tu.data.filter((x) => ['Confirmado', 'Atendido'].includes(x.estado)));
    }).catch((e) => setError(e.message));
  }, [pacienteId]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        pacienteId,
        diagnostico: form.diagnostico,
        observaciones: form.observaciones,
        tratamientoId: form.tratamientoId,
        requiereOperacion: form.requiereOperacion,
        altaMedica: form.altaMedica,
      };
      if (form.turnoId) payload.turnoId = form.turnoId;
      const result = await consultasApi.crear(payload);
      onSaved(result);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nueva consulta</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full">
              <label>Turno asociado (opcional)</label>
              <select name="turnoId" value={form.turnoId} onChange={handleChange}>
                <option value="">— Sin turno asociado —</option>
                {turnos.map((t) => (
                  <option key={t._id || t.id} value={t._id || t.id}>
                    {new Date(t.fecha).toLocaleDateString('es-AR')} {t.horario?.horaInicio} · {t.estado} · {t.tratamiento?.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group full">
              <label>Diagnóstico *</label>
              <textarea name="diagnostico" value={form.diagnostico} onChange={handleChange} required maxLength={500} rows={2} />
            </div>
            <div className="form-group full">
              <label>Observaciones</label>
              <textarea name="observaciones" value={form.observaciones} onChange={handleChange} maxLength={1000} rows={3} />
            </div>
            <div className="form-group full">
              <label>Tratamiento aplicado *</label>
              <select name="tratamientoId" value={form.tratamientoId} onChange={handleChange} required>
                <option value="">— Seleccionar —</option>
                {tratamientos.map((t) => (
                  <option key={t._id || t.id} value={t._id || t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <div className="checkbox-group">
                <input type="checkbox" id="reqOp" name="requiereOperacion" checked={form.requiereOperacion} onChange={handleChange} />
                <label htmlFor="reqOp" style={{ marginBottom: 0 }}>¿Requiere operación?</label>
              </div>
            </div>
            <div className="form-group">
              <div className="checkbox-group">
                <input type="checkbox" id="alta" name="altaMedica" checked={form.altaMedica} onChange={handleChange} />
                <label htmlFor="alta" style={{ marginBottom: 0 }}>¿Alta médica?</label>
              </div>
            </div>
          </div>

          <div className="flex-gap mt-2" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar consulta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}