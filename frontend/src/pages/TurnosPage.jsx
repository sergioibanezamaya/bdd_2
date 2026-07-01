/**
 * pages/TurnosPage.jsx — Pantalla 2: Turnos (CRUD + flujo confirmar-pago)
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 *
 * Tiene un segmented control "Activos" / "Historial":
 *   - Activos: muestra Pendientes y Confirmados
 *   - Historial: muestra Atendidos (que son los que se atendieron, ya pasaron
 *     la consulta o el auto-sweep los marcó)
 *   - Selector de estado individual para ver Cancelados o filtrar más fino
 */
import { useState, useMemo } from 'react';
import { useTurnos } from '../hooks/useTurnos.js';
import TurnoForm from '../components/TurnoForm.jsx';
import TurnoCard from '../components/TurnoCard.jsx';
import { formatFechaLarga } from '../utils/format.js';

const VISTA = {
  ACTIVOS: 'activos',
  HISTORIAL: 'historial',
};

const ESTADOS_INDIVIDUAL = ['Todos', 'Pendiente', 'Confirmado', 'Cancelado', 'Atendido'];

export default function TurnosPage() {
  const [vista, setVista] = useState(VISTA.ACTIVOS);
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Construir filtros combinados: rango de la vista + estado individual
  const filtros = useMemo(() => {
    if (vista === VISTA.ACTIVOS) {
      if (filtroEstado === 'Todos') return { estado: ['Pendiente', 'Confirmado'] };
      return { estado: filtroEstado };
    }
    // Historial: por defecto Atendido, pero se puede filtrar más fino
    if (filtroEstado === 'Todos') return { estado: 'Atendido' };
    return { estado: filtroEstado };
  }, [vista, filtroEstado]);

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
    return Array.from(map.entries()).sort(([a], [b]) => {
      // Activos: orden ascendente (más próximos primero).
      // Historial: orden descendente (más recientes primero).
      return vista === VISTA.ACTIVOS ? a.localeCompare(b) : b.localeCompare(a);
    });
  }, [data, vista]);

  async function handleChanged() {
    await reload();
  }

  function handleCambiarVista(nueva) {
    setVista(nueva);
    setFiltroEstado('Todos');
  }

  const tituloVacio =
    vista === VISTA.ACTIVOS
      ? 'No hay turnos activos.'
      : 'No hay turnos en el historial.';

  return (
    <div>
      <div className="page-header">
        <h1>Turnos</h1>
        {vista === VISTA.ACTIVOS && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nuevo turno
          </button>
        )}
      </div>

      <div className="card">
        <div className="segmented-control" role="tablist" aria-label="Vista de turnos">
          <button
            type="button"
            role="tab"
            aria-selected={vista === VISTA.ACTIVOS}
            className={`segmented-option ${vista === VISTA.ACTIVOS ? 'active' : ''}`}
            onClick={() => handleCambiarVista(VISTA.ACTIVOS)}
          >
            🟢 Activos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={vista === VISTA.HISTORIAL}
            className={`segmented-option ${vista === VISTA.HISTORIAL ? 'active' : ''}`}
            onClick={() => handleCambiarVista(VISTA.HISTORIAL)}
          >
            📋 Historial
          </button>
        </div>

        <div className="flex-gap mt-2">
          <label style={{ margin: 0 }}><strong>Estado:</strong></label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            {ESTADOS_INDIVIDUAL.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {loading && <p className="loading">Cargando turnos...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && data.length === 0 && (
        <div className="empty">{tituloVacio}</div>
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
