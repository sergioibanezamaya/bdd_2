/**
 * pages/MiTurnoPage.jsx — Vista "Mi Turno" del paciente
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 *
 * Lee el paciente de localStorage y consulta sus turnos. Muestra el
 * próximo turno Pendiente/Confirmado, o un cartel "Libre" si no tiene.
 *
 * Acciones:
 *   - Si está Libre: botón "Solicitar turno".
 *   - Si tiene turno: botones "Cancelar turno" y "Cambiar turno".
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '../api/client.js';
import { PACIENTE_KEY } from './PacienteLoginPage.jsx';
import { formatFechaLarga, formatHora } from '../utils/format.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function MiTurnoPage() {
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(PACIENTE_KEY);
    if (!raw) {
      navigate('/portal', { replace: true });
      return;
    }
    try {
      const p = JSON.parse(raw);
      setPaciente(p);
      cargarTurnos(p.dni);
    } catch {
      navigate('/portal', { replace: true });
    }
  }, [navigate]);

  async function cargarTurnos(dni) {
    setLoading(true);
    setError(null);
    try {
      const res = await portalApi.misTurnos(dni);
      setTurnos(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(PACIENTE_KEY);
    navigate('/portal', { replace: true });
  }

  function handleSolicitar() {
    navigate('/solicitar-turno', { state: { turno: null } });
  }

  function handleCambiar() {
    navigate('/solicitar-turno', { state: { turno: proximoTurno } });
  }

  async function handleCancelarConfirmado() {
    setShowCancelDialog(false);
    if (!proximoTurno) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await portalApi.cancelarTurno(proximoTurno._id || proximoTurno.id, {
        dni: paciente.dni,
      });
      await cargarTurnos(paciente.dni);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Próximo turno: el primero con estado Pendiente/Confirmado
  // en una fecha >= hoy, ordenado por fecha/hora ascendente.
  const proximoTurno = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return turnos
      .filter((t) => ['Pendiente', 'Confirmado'].includes(t.estado))
      .filter((t) => new Date(t.fecha) >= hoy)
      .sort((a, b) => {
        const fa = new Date(a.fecha).getTime();
        const fb = new Date(b.fecha).getTime();
        if (fa !== fb) return fa - fb;
        return (a.horario?.horaInicio || '').localeCompare(b.horario?.horaInicio || '');
      })[0] || null;
  }, [turnos]);

  if (!paciente) return null;

  return (
    <div className="portal-wrap">
      <div className="portal-card">
        <div className="portal-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0 }}>Hola, {paciente.nombre} 👋</h1>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                DNI {paciente.dni} · {paciente.email}
              </p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>

        {loading && <p className="loading">Cargando tus turnos...</p>}
        {error && <div className="alert alert-error">{error}</div>}
        {actionError && <div className="alert alert-error">{actionError}</div>}

        {!loading && !error && (
          <>
            {proximoTurno ? (
              <div className="turno-card-libre">
                <div className="libre-badge">🗓 Tenés un turno próximo</div>
                <h2 style={{ marginTop: 12 }}>
                  Turno para: {formatFechaLarga(proximoTurno.fecha)}
                </h2>
                <p style={{ fontSize: '1.2rem', margin: '8px 0' }}>
                  ⏰ <strong>{formatHora(proximoTurno.horario?.horaInicio)} hs</strong>
                  {' · '}
                  {proximoTurno.tratamiento?.nombre || 'Consulta'}
                </p>
                <p>
                  Estado:{' '}
                  <span className={`badge badge-${proximoTurno.estado.toLowerCase()}`}>
                    {proximoTurno.estado}
                  </span>
                </p>
                {proximoTurno.observaciones && (
                  <p className="muted" style={{ fontSize: '0.9rem' }}>
                    <strong>Observaciones:</strong> {proximoTurno.observaciones}
                  </p>
                )}

                <div className="flex-gap mt-2" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleCambiar}
                    disabled={actionLoading}
                  >
                    🔄 Cambiar turno
                  </button>
                  <button
                    className="btn btn-danger btn-outline"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={actionLoading}
                  >
                    ✖ Cancelar turno
                  </button>
                </div>
              </div>
            ) : (
              <div className="turno-card-libre">
                <div className="libre-badge libre">🟢 Libre</div>
                <h2 style={{ marginTop: 12 }}>No tenés turnos pendientes</h2>
                <p className="muted" style={{ margin: '8px 0 16px' }}>
                  Podés pedir un turno cuando quieras.
                </p>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSolicitar}
                >
                  📅 Solicitar turno
                </button>
              </div>
            )}

            {turnos.length > 0 && (
              <details style={{ marginTop: 24 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                  Ver todos mis turnos ({turnos.length})
                </summary>
                <div style={{ marginTop: 12 }}>
                  {turnos
                    .slice()
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map((t) => (
                      <div key={t._id || t.id} className="card" style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <strong>{formatFechaLarga(t.fecha)}</strong>
                            {' · '}
                            {formatHora(t.horario?.horaInicio)} hs
                          </div>
                          <span className={`badge badge-${t.estado.toLowerCase()}`}>{t.estado}</span>
                        </div>
                        <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>
                          {t.tratamiento?.nombre || 'Consulta'}
                        </p>
                      </div>
                    ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>

      {showCancelDialog && (
        <ConfirmDialog
          title="Cancelar turno"
          message={`¿Estás seguro que querés cancelar tu turno del ${proximoTurno ? formatFechaLarga(proximoTurno.fecha) : ''} a las ${proximoTurno ? formatHora(proximoTurno.horario?.horaInicio) : ''} hs? Esta acción se puede revertir solo contactando al consultorio.`}
          confirmText="Sí, cancelar"
          confirmClass="btn-danger"
          onConfirm={handleCancelarConfirmado}
          onCancel={() => setShowCancelDialog(false)}
        />
      )}
    </div>
  );
}