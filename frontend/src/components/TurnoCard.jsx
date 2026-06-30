/**
 * components/TurnoCard.jsx — Tarjeta de un turno con acciones
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
import { useState } from 'react';
import { turnosApi } from '../api/client.js';
import ConfirmDialog from './ConfirmDialog.jsx';
import ComprobanteViewer from './ComprobanteViewer.jsx';
import { formatFechaCorta, formatMoneda } from '../utils/format.js';

const BADGE_CLASS = {
  Pendiente: 'badge-pendiente',
  Confirmado: 'badge-confirmado',
  Cancelado: 'badge-cancelado',
  Atendido: 'badge-atendido',
};

export default function TurnoCard({ turno, onChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAtender, setShowAtender] = useState(false);
  const [showComprobante, setShowComprobante] = useState(false);
  const [warning, setWarning] = useState(null);

  async function handleConfirmar() {
    setShowConfirm(false);
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const res = await turnosApi.confirmarPago(turno._id || turno.id);
      onChange(res.data);
      if (res.warnings && res.warnings.email) setWarning(res.warnings.email);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelar() {
    setShowCancel(false);
    setLoading(true);
    setError(null);
    try {
      const res = await turnosApi.cancelar(turno._id || turno.id);
      onChange(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar() {
    setShowDelete(false);
    setLoading(true);
    setError(null);
    try {
      await turnosApi.eliminar(turno._id || turno.id);
      onChange(null); // null = se borró, que el padre recargue la lista
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAtender() {
    setShowAtender(false);
    setLoading(true);
    setError(null);
    try {
      const res = await turnosApi.atender(turno._id || turno.id);
      onChange(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const estado = turno.estado;
  const paciente = turno.paciente;
  const tratamiento = turno.tratamiento;

  return (
    <div className="card">
      {error && <div className="alert alert-error">{error}</div>}
      {warning && <div className="alert alert-warning">⚠️ {warning}</div>}

      <div className="flex-between mb-2">
        <div>
          <h3 style={{ margin: 0 }}>
            {paciente?.apellido}, {paciente?.nombre}
          </h3>
          <p className="muted" style={{ margin: '4px 0' }}>
            DNI {paciente?.dni} · Tel {paciente?.telefono}
          </p>
        </div>
        <span className={`badge ${BADGE_CLASS[estado]}`}>{estado}</span>
      </div>

      <p>
        <strong>Tratamiento:</strong> {tratamiento?.nombre}
        {tratamiento?.duracionMin && ` (${tratamiento.duracionMin} min)`}
        {tratamiento?.precioReferencia != null && (
          <span style={{ marginLeft: 8, color: '#198754', fontWeight: 600 }}>
            · {formatMoneda(tratamiento.precioReferencia)}
          </span>
        )}
      </p>

      {(turno.metodoPago || turno.comprobantePago) && (
        <p style={{ margin: '4px 0' }}>
          <strong>Pago:</strong>{' '}
          {turno.metodoPago === 'Efectivo' && '💵 Efectivo'}
          {turno.metodoPago === 'Transferencia' && (
            <>🏦 Transferencia {turno.pagoConfirmado ? '· ✓ confirmado' : '· ⌛ a confirmar'}</>
          )}
          {!turno.metodoPago && <span className="muted">Sin método</span>}
          {turno.metodoPago === 'Transferencia' && turno.comprobantePago && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ marginLeft: 8 }}
              onClick={() => setShowComprobante(true)}
            >
              📎 Ver comprobante
            </button>
          )}
        </p>
      )}
      <p>
        <strong>Fecha:</strong> {formatFechaCorta(turno.fecha)} ·{' '}
        <strong>Hora:</strong> {turno.horario?.horaInicio || turno.horaInicio} a {turno.horario?.horaFin || turno.horaFin} hs
      </p>
      {turno.observaciones && (
        <p className="muted" style={{ fontSize: '0.9rem' }}>
          <strong>Obs:</strong> {turno.observaciones}
        </p>
      )}
      {turno.calendarEventId ? (
        <p className="muted" style={{ fontSize: '0.8rem' }}>
          📅 Calendar: <code>{turno.calendarEventId.substring(0, 12)}...</code>
        </p>
      ) : estado === 'Confirmado' ? (
        <p className="muted" style={{ fontSize: '0.8rem', color: '#856404' }}>
          ⚠️ Sin evento en Calendar (modo degradado)
        </p>
      ) : null}

      <div className="flex-gap mt-2">
        {estado === 'Pendiente' && (
          <>
            <button className="btn btn-success btn-sm" disabled={loading} onClick={() => setShowConfirm(true)}>
              Confirmar pago
            </button>
            <button className="btn btn-danger btn-sm btn-outline" disabled={loading} onClick={() => setShowCancel(true)}>
              Cancelar
            </button>
          </>
        )}
        {estado === 'Confirmado' && (
          <>
            <button className="btn btn-primary btn-sm" disabled={loading} onClick={() => setShowAtender(true)}>
              ✓ Marcar como atendido
            </button>
            <button className="btn btn-danger btn-sm btn-outline" disabled={loading} onClick={() => setShowCancel(true)}>
              Cancelar turno
            </button>
          </>
        )}
        {estado === 'Cancelado' && (
          <button className="btn btn-danger btn-sm" disabled={loading} onClick={() => setShowDelete(true)}>
            Eliminar
          </button>
        )}
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Confirmar pago"
          message="Esto cambiará el estado del turno a Confirmado, creará un evento en Google Calendar y enviará un email al paciente. ¿Continuar?"
          onConfirm={handleConfirmar}
          onCancel={() => setShowConfirm(false)}
          confirmText="Confirmar pago"
          confirmClass="btn-success"
        />
      )}
      {showCancel && (
        <ConfirmDialog
          title="Cancelar turno"
          message="El turno se marcará como Cancelado y se eliminará el evento de Calendar (si existe). ¿Continuar?"
          onConfirm={handleCancelar}
          onCancel={() => setShowCancel(false)}
          confirmText="Sí, cancelar"
          confirmClass="btn-danger"
        />
      )}
      {showDelete && (
        <ConfirmDialog
          title="Eliminar turno cancelado"
          message="Este turno ya está cancelado y se borrará definitivamente. Esta acción no se puede deshacer. ¿Continuar?"
          onConfirm={handleEliminar}
          onCancel={() => setShowDelete(false)}
          confirmText="Sí, eliminar"
          confirmClass="btn-danger"
        />
      )}
      {showAtender && (
        <ConfirmDialog
          title="Marcar como atendido"
          message="¿Confirmás que el paciente fue atendido? El turno pasará a estado Atendido. Esta acción no se puede deshacer."
          onConfirm={handleAtender}
          onCancel={() => setShowAtender(false)}
          confirmText="Sí, atendido"
          confirmClass="btn-primary"
        />
      )}

      {showComprobante && (
        <ComprobanteViewer
          base64={turno.comprobantePago}
          mimeType={turno.comprobanteMimeType}
          onClose={() => setShowComprobante(false)}
        />
      )}
    </div>
  );
}