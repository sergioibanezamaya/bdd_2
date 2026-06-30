/**
 * pages/TurnosPage.jsx — Pantalla 2: Turnos (CRUD + flujo confirmar-pago)
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
import { useState, useMemo } from 'react';
import { useTurnos } from '../hooks/useTurnos.js';
import TurnoForm from '../components/TurnoForm.jsx';
import TurnoCard from '../components/TurnoCard.jsx';
import { formatFechaLarga } from '../utils/format.js';

const ESTADOS = ['Todos', 'Pendiente', 'Confirmado', 'Cancelado', 'Atendido'];

export default function TurnosPage() {
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const filtros = useMemo(() => {
    const f = {};
    if (filtroEstado !== 'Todos') f.estado = filtroEstado;
    return f;
  }, [filtroEstado]);

  const { data, loading, error, reload } = useTurnos(filtros);
  const [showForm, setShowForm] = useState(false);

  // Agrupar por fecha
  const grupos = useMemo(() => {
    const map = new Map();
    for (const t of data) {
      const key = new Date(t.fecha).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  async function handleChanged() {
    await reload();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Turnos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nuevo turno</button>
      </div>

      <div className="card">
        <div className="flex-gap">
          <label style={{ margin: 0 }}><strong>Estado:</strong></label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {loading && <p className="loading">Cargando turnos...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && data.length === 0 && (
        <div className="empty">No hay turnos {filtroEstado !== 'Todos' ? `en estado "${filtroEstado}"` : ''}.</div>
      )}

      {grupos.map(([fecha, turnos]) => (
        <section key={fecha}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--muted)', marginTop: 24, marginBottom: 8 }}>
            {formatFechaLarga(fecha)}
          </h2>
          {turnos.map((t) => (
            <TurnoCard key={t._id || t.id} turno={t} onChange={handleChanged} />
          ))}
        </section>
      ))}

      {showForm && (
        <TurnoForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload(); }}
        />
      )}
    </div>
  );
}