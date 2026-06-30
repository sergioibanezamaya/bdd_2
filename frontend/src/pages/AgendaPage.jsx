/**
 * pages/AgendaPage.jsx — Pantalla 3: Agenda con agregaciones
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 *
 * Layout 2 columnas:
 *   Izquierda  → turnos del día seleccionado (lista)
 *   Derecha    → panel con agregaciones MongoDB
 */
import { useState, useEffect, useMemo } from 'react';
import { turnosApi, agregacionesApi } from '../api/client.js';
import TurnoCard from '../components/TurnoCard.jsx';
import TurnoForm from '../components/TurnoForm.jsx';
import { formatFechaLarga, nombreMes } from '../utils/format.js';

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AgendaPage() {
  const [fecha, setFecha] = useState(todayYMD());
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [turnoPrecargado, setTurnoPrecargado] = useState(null);

  // Agregaciones
  const [turnosPorMes, setTurnosPorMes] = useState([]);
  const [topTratamientos, setTopTratamientos] = useState([]);
  const [porObraSocial, setPorObraSocial] = useState([]);
  const [tasa, setTasa] = useState(null);

  // Cargar turnos del día
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError(null);
    turnosApi.listar({ desde: fecha, hasta: fecha })
      .then((res) => { if (!cancel) setTurnos(res.data); })
      .catch((e) => { if (!cancel) setError(e.message); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [fecha]);

  // Cargar agregaciones (1 vez)
  useEffect(() => {
    Promise.all([
      agregacionesApi.turnosPorMes(),
      agregacionesApi.tratamientosFrecuentes(),
      agregacionesApi.pacientesPorObraSocial(),
      agregacionesApi.tasaConfirmacion(),
    ]).then(([m, t, o, ta]) => {
      setTurnosPorMes(m.data);
      setTopTratamientos(t.data);
      setPorObraSocial(o.data);
      setTasa(ta.data);
    }).catch((e) => console.warn('Error cargando agregaciones:', e.message));
  }, []);

  function handleSlotClick(slot) {
    setTurnoPrecargado({
      pacienteId: '',
      tratamientoId: '',
      fecha,
      horaInicio: slot,
      observaciones: '',
    });
    setShowForm(true);
  }

  async function handleTurnoChanged() {
    const res = await turnosApi.listar({ desde: fecha, hasta: fecha });
    setTurnos(res.data);
  }

  const slotsDelDia = useMemo(() => {
    const slots = [];
    for (let h = 8; h < 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

  const turnosPorHora = useMemo(() => {
    const map = new Map();
    for (const t of turnos) {
      const h = t.horario?.horaInicio;
      if (h) map.set(h, t);
    }
    return map;
  }, [turnos]);

  const maxMes = Math.max(1, ...turnosPorMes.map((m) => m.total));
  const maxTop = Math.max(1, ...topTratamientos.map((t) => t.cantidad));
  const maxOS = Math.max(1, ...porObraSocial.map((o) => o.cantidad));

  return (
    <div>
      <div className="page-header">
        <h1>Agenda</h1>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>

      <div className="agenda-layout">
        {/* Columna izquierda: agenda del día */}
        <div>
          <h2 style={{ marginTop: 0 }}>{formatFechaLarga(fecha)}</h2>
          {loading && <p className="loading">Cargando...</p>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="card" style={{ padding: 0 }}>
            {slotsDelDia.map((slot) => {
              const t = turnosPorHora.get(slot);
              if (t) {
                return (
                  <div key={slot} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: '#f0f7ff' }}>
                    <strong>{slot}</strong> —{' '}
                    {t.paciente?.apellido}, {t.paciente?.nombre} · {t.tratamiento?.nombre} ·{' '}
                    <span className={`badge badge-${t.estado.toLowerCase()}`}>{t.estado}</span>
                  </div>
                );
              }
              return (
                <div key={slot} style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
                  <button className="slot-btn" style={{ width: '100%' }} onClick={() => handleSlotClick(slot)}>
                    {slot} — click para crear turno
                  </button>
                </div>
              );
            })}
          </div>

          {turnos.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3>Turnos del día</h3>
              {turnos.map((t) => (
                <TurnoCard key={t._id || t.id} turno={t} onChange={handleTurnoChanged} />
              ))}
            </div>
          )}
        </div>

        {/* Columna derecha: agregaciones */}
        <div className="agenda-summary">
          <div className="summary-card">
            <h3>Turnos por mes (últimos 12)</h3>
            {turnosPorMes.length === 0 ? (
              <p className="muted">Sin datos aún.</p>
            ) : turnosPorMes.map((m) => (
              <div key={`${m.year}-${m.month}`} className="bar-row">
                <span style={{ width: 60 }}>{nombreMes(m.month)}/{String(m.year).slice(2)}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(m.total / maxMes) * 100}%` }} />
                </div>
                <span style={{ width: 28, textAlign: 'right' }}>{m.total}</span>
              </div>
            ))}
          </div>

          <div className="summary-card">
            <h3>Tasa de confirmación</h3>
            {tasa && (
              <>
                <p style={{ fontSize: '1.8rem', margin: '4px 0', fontWeight: 600 }}>
                  {(tasa.tasaConfirmacion * 100).toFixed(1)}%
                </p>
                <p className="muted" style={{ margin: 0 }}>
                  {tasa.confirmados} de {tasa.total} turnos confirmados
                </p>
              </>
            )}
          </div>

          <div className="summary-card">
            <h3>Top tratamientos (consultas)</h3>
            {topTratamientos.length === 0 ? (
              <p className="muted">Sin consultas registradas.</p>
            ) : topTratamientos.map((t) => (
              <div key={t.tratamientoId} className="bar-row">
                <span style={{ width: 90 }}>{t.tratamiento}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(t.cantidad / maxTop) * 100}%` }} />
                </div>
                <span style={{ width: 28, textAlign: 'right' }}>{t.cantidad}</span>
              </div>
            ))}
          </div>

          <div className="summary-card">
            <h3>Pacientes por obra social</h3>
            {porObraSocial.length === 0 ? (
              <p className="muted">Sin datos.</p>
            ) : porObraSocial.map((o) => (
              <div key={o.obraSocial} className="bar-row">
                <span style={{ width: 110 }}>{o.obraSocial}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(o.cantidad / maxOS) * 100}%` }} />
                </div>
                <span style={{ width: 28, textAlign: 'right' }}>{o.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <TurnoForm
          turnoInicial={turnoPrecargado}
          onClose={() => { setShowForm(false); setTurnoPrecargado(null); }}
          onSaved={() => { setShowForm(false); setTurnoPrecargado(null); handleTurnoChanged(); }}
        />
      )}
    </div>
  );
}