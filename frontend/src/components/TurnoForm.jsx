/**
 * components/TurnoForm.jsx — Formulario para crear un turno
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
import { useState, useEffect } from 'react';
import { pacientesApi, tratamientosApi, turnosApi } from '../api/client.js';
import DisponibilidadGrid from './DisponibilidadGrid.jsx';

function todayYMD() {
  // Usamos los métodos locales de Date para evitar inconsistencias
  // de timezone que ocurren con `toISOString().slice(0,10)`.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TurnoForm({ turnoInicial, onClose, onSaved }) {
  const [pacientes, setPacientes] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);
  const [pacienteId, setPacienteId] = useState(turnoInicial?.pacienteId || '');
  const [tratamientoId, setTratamientoId] = useState(turnoInicial?.tratamientoId || '');
  // Inicializamos con la fecha recibida (si viene) o hoy, evaluado cada render
  // para evitar que un `min` muy viejo quede fijo cuando cambia el día.
  const [fecha, setFecha] = useState(turnoInicial?.fecha || todayYMD());
  const [horaInicio, setHoraInicio] = useState(turnoInicial?.horaInicio || '');
  const [observaciones, setObservaciones] = useState(turnoInicial?.observaciones || '');
  const [metodoPago, setMetodoPago] = useState(turnoInicial?.metodoPago || '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([pacientesApi.listar(), tratamientosApi.listar()])
      .then(([p, t]) => {
        setPacientes(p.data);
        setTratamientos(t.data);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!horaInicio) {
      setError('Seleccioná un horario disponible');
      return;
    }
    // Validación manual de fecha: no permitir fechas pasadas
    const hoy = todayYMD();
    if (fecha < hoy) {
      setError(`La fecha no puede ser anterior a hoy (${hoy})`);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const result = await turnosApi.crear({
        pacienteId,
        tratamientoId,
        fecha,
        horaInicio,
        observaciones,
        metodoPago: metodoPago || undefined,
      });
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
          <h2>Nuevo turno</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Paciente *</label>
              <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} required>
                <option value="">— Seleccionar —</option>
                {pacientes.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.apellido}, {p.nombre} (DNI {p.dni})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tratamiento *</label>
              <select value={tratamientoId} onChange={(e) => setTratamientoId(e.target.value)} required>
                <option value="">— Seleccionar —</option>
                {tratamientos.map((t) => (
                  <option key={t._id || t.id} value={t._id || t.id}>
                    {t.nombre} ({t.duracionMin} min)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha *</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => { setFecha(e.target.value); setHoraInicio(''); }}
                required
                min={todayYMD()}
              />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input type="text" value={horaInicio} placeholder="Elegí de la grilla" readOnly />
            </div>
            <div className="form-group full">
              <label>Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                maxLength={500}
                rows={2}
              />
            </div>
            <div className="form-group full">
              <label>Método de pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                disabled={saving}
              >
                <option value="">— Sin especificar —</option>
                <option value="Efectivo">💵 Efectivo (en el consultorio)</option>
                <option value="Transferencia">🏦 Transferencia bancaria (sin comprobante desde el consultorio)</option>
              </select>
              <small className="muted">
                Si el paciente reservó por el portal, este método se puede sobrescribir.
              </small>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12, background: '#fafbfc' }}>
            <strong>Horarios disponibles</strong>
            <DisponibilidadGrid
              fecha={fecha}
              tratamientoId={tratamientoId}
              onSelect={setHoraInicio}
              slotSeleccionado={horaInicio}
            />
          </div>

          <div className="flex-gap mt-2" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !horaInicio}>
              {saving ? 'Creando...' : 'Crear turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}