/**
 * pages/SolicitarTurnoPage.jsx — Pantalla para que el paciente
 * solicite un turno nuevo o cambie uno existente.
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 *
 * Incluye selección de método de pago (Efectivo / Transferencia) y,
 * si es transferencia, subida de comprobante (imagen).
 *
 * Recibe por `state` (react-router) el turno a cambiar (si lo hay).
 * Si lo hay, llama a `cambiarTurno`; si no, llama a `crearTurno`.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tratamientosApi, portalApi } from '../api/client.js';
import DisponibilidadGrid from '../components/DisponibilidadGrid.jsx';
import { PACIENTE_KEY } from './PacienteLoginPage.jsx';
import { formatMoneda } from '../utils/format.js';

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Tamaño máximo permitido para el comprobante (debe coincidir con backend)
const MAX_COMPROBANTE_BYTES = 500 * 1024;

export default function SolicitarTurnoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const turnoACambiar = location.state?.turno || null;

  const [paciente, setPaciente] = useState(null);
  const [tratamientos, setTratamientos] = useState([]);
  const [tratamientoId, setTratamientoId] = useState(turnoACambiar?.tratamiento?._id || turnoACambiar?.tratamiento || '');
  const [fecha, setFecha] = useState(todayYMD());
  const [horaInicio, setHoraInicio] = useState('');
  const [observaciones, setObservaciones] = useState('');
  // Pago
  const [metodoPago, setMetodoPago] = useState(turnoACambiar?.metodoPago || '');
  const [comprobanteBase64, setComprobanteBase64] = useState('');
  const [comprobanteMime, setComprobanteMime] = useState('');
  const [comprobantePreview, setComprobantePreview] = useState('');
  const [aliasPago, setAliasPago] = useState({ alias: 'richipai', titular: '' });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(PACIENTE_KEY);
    if (!raw) {
      navigate('/portal', { replace: true });
      return;
    }
    try {
      setPaciente(JSON.parse(raw));
    } catch {
      navigate('/portal', { replace: true });
    }
    Promise.all([
      tratamientosApi.listar(),
      portalApi.getAliasPago().catch(() => ({ data: { alias: 'richipai', titular: '' } })),
    ]).then(([t, a]) => {
      setTratamientos(t.data);
      if (a?.data) setAliasPago(a.data);
    }).catch((e) => setError(e.message));
  }, [navigate]);

  // Tratamiento seleccionado (para mostrar precio)
  const tratamientoSel = useMemo(
    () => tratamientos.find((t) => (t._id || t.id) === tratamientoId) || null,
    [tratamientos, tratamientoId]
  );

  function handleComprobante(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El comprobante tiene que ser una imagen (PNG, JPG, etc.)');
      return;
    }
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setError(
        `La imagen es muy grande (${Math.round(file.size / 1024)}KB). Máximo ${Math.round(MAX_COMPROBANTE_BYTES / 1024)}KB. Comprimila antes de subirla.`
      );
      return;
    }
    setError(null);
    setComprobanteMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setComprobantePreview(dataUrl);
      // Guardamos el string base64 SIN el prefijo "data:image/...;base64,"
      const base64 = dataUrl.split(',')[1] || dataUrl;
      setComprobanteBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  function quitarComprobante() {
    setComprobanteBase64('');
    setComprobanteMime('');
    setComprobantePreview('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!horaInicio) {
      setError('Elegí un horario de la grilla');
      return;
    }
    if (!tratamientoId) {
      setError('Elegí un tratamiento');
      return;
    }
    if (metodoPago === 'Transferencia' && !comprobanteBase64 && !turnoACambiar?.comprobantePago) {
      setError('Si elegís transferencia, tenés que adjuntar el comprobante');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body = {
        dni: paciente.dni,
        fecha,
        horaInicio,
        tratamientoId,
      };
      // Observaciones solo al crear (no al cambiar)
      if (!turnoACambiar && observaciones) body.observaciones = observaciones;
      // Pago
      if (metodoPago) body.metodoPago = metodoPago;
      if (comprobanteBase64) {
        body.comprobantePago = comprobanteBase64;
        body.comprobanteMimeType = comprobanteMime || 'image/jpeg';
      }
      if (turnoACambiar) {
        await portalApi.cambiarTurno(turnoACambiar._id || turnoACambiar.id, body);
      } else {
        await portalApi.crearTurno(body);
      }
      navigate('/mi-turno');
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

  if (!paciente) return null;

  const titulo = turnoACambiar ? 'Cambiar turno' : 'Solicitar turno';

  return (
    <div className="portal-wrap">
      <div className="portal-card" style={{ maxWidth: 720 }}>
        <div className="portal-header">
          <span className="portal-logo">📅</span>
          <h1 style={{ margin: 0 }}>{titulo}</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Elegí el tratamiento, la fecha, el horario y cómo vas a pagar.
          </p>
          {turnoACambiar && (
            <p className="muted" style={{ margin: '8px 0 0', fontSize: '0.85rem' }}>
              Turno actual: <strong>{turnoACambiar.tratamiento?.nombre || 'Consulta'}</strong> ·{' '}
              Se va a mover a la nueva fecha que elijas.
            </p>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Tratamiento *</label>
              <select
                value={tratamientoId}
                onChange={(e) => setTratamientoId(e.target.value)}
                required
              >
                <option value="">— Seleccionar —</option>
                {tratamientos.map((t) => (
                  <option key={t._id || t.id} value={t._id || t.id}>
                    {t.nombre} ({t.duracionMin} min){t.precioReferencia ? ` — ${formatMoneda(t.precioReferencia)}` : ''}
                  </option>
                ))}
              </select>
              {tratamientoSel && (
                <small className="muted">
                  {tratamientoSel.precioReferencia
                    ? <>Precio de referencia: <strong>{formatMoneda(tratamientoSel.precioReferencia)}</strong></>
                    : <>Precio: <strong>a consultar con el odontólogo</strong></>}
                </small>
              )}
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

            <div className="form-group full">
              <label>Método de pago *</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                required
              >
                <option value="">— Seleccionar —</option>
                <option value="Efectivo">Efectivo (en el consultorio)</option>
                <option value="Transferencia">Transferencia bancaria</option>
              </select>
            </div>

            {metodoPago === 'Transferencia' && (
              <div className="form-group full">
                <div className="alert alert-info" style={{ marginBottom: 8 }}>
                  💸 Transferí al alias <strong style={{ fontSize: '1.1rem' }}>{aliasPago.alias}</strong>
                  {aliasPago.titular && <> (titular: {aliasPago.titular})</>}}.
                  Adjuntá el comprobante abajo.
                </div>
                <label>Comprobante de transferencia *</label>
                {comprobantePreview ? (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={comprobantePreview}
                      alt="comprobante"
                      style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={quitarComprobante}>
                        Quitar imagen
                      </button>
                    </div>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleComprobante}
                    style={{ marginTop: 4 }}
                  />
                )}
                <small className="muted">
                  Formato: PNG, JPG. Tamaño máximo: {Math.round(MAX_COMPROBANTE_BYTES / 1024)}KB.
                </small>
              </div>
            )}

            {!turnoACambiar && (
              <div className="form-group full">
                <label>Observaciones (opcional)</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Contale al odontólogo si tenés alguna molestia o aclaración..."
                />
              </div>
            )}
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

          <div className="flex-gap mt-2" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/mi-turno')}
            >
              Volver
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !horaInicio || !tratamientoId || !metodoPago}>
              {saving ? 'Enviando...' : turnoACambiar ? 'Confirmar cambio' : 'Solicitar turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}