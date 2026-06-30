/**
 * pages/ConsultasPage.jsx — Pantalla 4: Historial clínico
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
import { useState, useEffect } from 'react';
import { pacientesApi } from '../api/client.js';
import { useConsultas } from '../hooks/useConsultas.js';
import ConsultaForm from '../components/ConsultaForm.jsx';
import ConsultaList from '../components/ConsultaList.jsx';

export default function ConsultasPage() {
  const [pacientes, setPacientes] = useState([]);
  const [pacienteId, setPacienteId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { data, loading, error, reload } = useConsultas(pacienteId || null);

  useEffect(() => {
    pacientesApi.listar().then((res) => setPacientes(res.data)).catch(() => {});
  }, []);

  const pacienteSel = pacientes.find((p) => (p._id || p.id) === pacienteId);

  return (
    <div>
      <div className="page-header">
        <h1>Consultas (Historial Clínico)</h1>
        {pacienteId && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nueva consulta
          </button>
        )}
      </div>

      <div className="card">
        <label><strong>Paciente:</strong></label>
        <select
          value={pacienteId}
          onChange={(e) => setPacienteId(e.target.value)}
          style={{ width: '100%', marginTop: 8 }}
        >
          <option value="">— Seleccionar paciente —</option>
          {pacientes.map((p) => (
            <option key={p._id || p.id} value={p._id || p.id}>
              {p.apellido}, {p.nombre} — DNI {p.dni}
            </option>
          ))}
        </select>
      </div>

      {pacienteSel && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{pacienteSel.apellido}, {pacienteSel.nombre}</h2>
          <p className="muted" style={{ margin: 0 }}>
            DNI {pacienteSel.dni} · {pacienteSel.email} · {pacienteSel.obraSocial}
          </p>
        </div>
      )}

      {pacienteId && loading && <p className="loading">Cargando historial...</p>}
      {pacienteId && error && <div className="alert alert-error">{error}</div>}
      {pacienteId && !loading && <ConsultaList consultas={data} />}

      {!pacienteId && <p className="empty">Seleccioná un paciente para ver su historial clínico.</p>}

      {showForm && (
        <ConsultaForm
          pacienteId={pacienteId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload(); }}
        />
      )}
    </div>
  );
}