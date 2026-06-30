/**
 * components/NuevoTurnoForm.jsx — Form de reserva de turno
 *
 * 1) Elige tratamiento (se muestra el precio de referencia al lado).
 * 2) Elige fecha futura.
 * 3) Ve grilla de slots libres.
 * 4) Elige método de pago (Efectivo / Transferencia).
 *    - Si es Transferencia: muestra alias + titular + monto a transferir
 *      y pide subir el comprobante (imagen base64, máx 500KB).
 * 5) Click en slot + submit → POST /portal/turnos.
 *
 * Al crear el turno exitosamente, redirige a /home con flag turnoCreado.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { tratamientosApi, portalApi } from '../api/client.js';
import { useDisponibilidad } from '../hooks/useDisponibilidad.js';
import { formatFechaLarga, formatMoneda, todayYMD } from '../utils/format.js';
import DisponibilidadGrid from './DisponibilidadGrid.jsx';

// Tamaño máximo permitido para el comprobante (debe coincidir con backend)
const MAX_COMPROBANTE_BYTES = 500 * 1024;

export default function NuevoTurnoForm({ paciente }) {
  const navigate = useNavigate();
  const [tratamientos, setTratamientos] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [tratamientoId, setTratamientoId] = useState('');
  const [fecha, setFecha] = useState(todayYMD());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  // Pago
  const [metodoPago, setMetodoPago] = useState('');
  const [aliasPago, setAliasPago] = useState({ alias: 'richipai', titular: 'IBAÑEZ AMAYA SERGIO ESTEBAN' });
  const [comprobanteBase64, setComprobanteBase64] = useState('');
  const [comprobanteMime, setComprobanteMime] = useState('');
  const [comprobantePreview, setComprobantePreview] = useState('');

  const { slots, loading: loadingSlots, error: errorSlots } = useDisponibilidad(fecha, tratamientoId);

  // Cargar tratamientos + alias de pago al montar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [txRes, aliasRes] = await Promise.all([
          tratamientosApi.listar(),
          portalApi.getAliasPago().catch(() => ({ data: { alias: 'richipai', titular: 'IBAÑEZ AMAYA SERGIO ESTEBAN' } })),
        ]);
        if (cancelled) return;
        const activos = (txRes.data || []).filter((t) => t.activo !== false);
        setTratamientos(activos);
        if (activos.length && !tratamientoId) setTratamientoId(activos[0].id);
        if (aliasRes?.data) setAliasPago(aliasRes.data);
      } catch (err) {
        if (!cancelled) setSubmitError(err);
      } finally {
        if (!cancelled) setLoadingTx(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar fecha o tratamiento, resetear slot seleccionado
  useEffect(() => {
    setSelectedSlot(null);
  }, [fecha, tratamientoId]);

  // Tratamiento seleccionado (para mostrar precio y monto)
  const tratamientoSel = useMemo(
    () => tratamientos.find((t) => (t.id || t._id) === tratamientoId) || null,
    [tratamientos, tratamientoId]
  );

  function handleComprobante(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSubmitError(new Error('El comprobante tiene que ser una imagen (PNG, JPG, etc.)'));
      return;
    }
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setSubmitError(
        new Error(
          `La imagen es muy grande (${Math.round(file.size / 1024)}KB). Máximo ${Math.round(MAX_COMPROBANTE_BYTES / 1024)}KB. Comprimila antes de subirla.`
        )
      );
      return;
    }
    setSubmitError(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setSubmitError(new Error('Elegí un horario'));
      return;
    }
    if (!metodoPago) {
      setSubmitError(new Error('Elegí un método de pago'));
      return;
    }
    if (metodoPago === 'Transferencia' && !comprobanteBase64) {
      setSubmitError(new Error('Si elegís transferencia, tenés que adjuntar el comprobante'));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await portalApi.crearTurno({
        dni: paciente.dni,
        tratamientoId,
        fecha,
        horaInicio: selectedSlot,
        observaciones: observaciones || '',
        metodoPago,
        comprobantePago: comprobanteBase64 || undefined,
        comprobanteMimeType: comprobanteBase64 ? comprobanteMime || 'image/jpeg' : undefined,
      });
      // Volver al home, el padre recarga la lista
      navigate('/home', { state: { turnoCreado: true } });
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTx) {
    return <div className="loading">Cargando tratamientos...</div>;
  }
  if (!tratamientos.length) {
    return (
      <div className="empty">
        <div className="big">No hay tratamientos disponibles</div>
        <div>Contactá al consultorio.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="portal-card">
        <div className="form-group">
          <label htmlFor="tratamiento">Tratamiento</label>
          <select
            id="tratamiento" value={tratamientoId}
            onChange={(e) => setTratamientoId(e.target.value)}
            disabled={submitting}
          >
            {tratamientos.map((t) => (
              <option key={t.id || t._id} value={t.id || t._id}>
                {t.nombre} ({t.duracionMin} min)
                {t.precioReferencia != null ? ` — ${formatMoneda(t.precioReferencia)}` : ''}
              </option>
            ))}
          </select>
          {tratamientoSel && (
            <span className="form-help">
              {tratamientoSel.precioReferencia != null
                ? <>Precio de referencia: <strong>{formatMoneda(tratamientoSel.precioReferencia)}</strong></>
                : <>Precio: <strong>a consultar con el odontólogo</strong></>}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="fecha">Fecha</label>
          <input
            id="fecha" type="date" required
            min={todayYMD()}
            value={fecha} onChange={(e) => setFecha(e.target.value)}
            disabled={submitting}
          />
          <span className="form-help">{formatFechaLarga(fecha)}</span>
        </div>

        <div className="form-group">
          <label htmlFor="metodoPago">Método de pago</label>
          <select
            id="metodoPago"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            disabled={submitting}
            required
          >
            <option value="">— Seleccionar —</option>
            <option value="Efectivo">💵 Efectivo (en el consultorio)</option>
            <option value="Transferencia">🏦 Transferencia bancaria</option>
          </select>
        </div>

        {metodoPago === 'Transferencia' && (
          <div className="form-group">
            <div className="alert alert-info" style={{ marginBottom: 8 }}>
              💸 Transferí al alias{' '}
              <strong style={{ fontSize: '1.1rem' }}>{aliasPago.alias}</strong>
              {aliasPago.titular && (
                <> (titular: <strong>{aliasPago.titular}</strong>)</>
              )}
              <br />
              {tratamientoSel?.precioReferencia != null ? (
                <>Monto a transferir: <strong>{formatMoneda(tratamientoSel.precioReferencia)}</strong></>
              ) : (
                <>Monto: <strong>a consultar con el odontólogo</strong></>
              )}
              <br />
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
                disabled={submitting}
              />
            )}
            <span className="form-help">
              Formato: PNG, JPG. Tamaño máximo: {Math.round(MAX_COMPROBANTE_BYTES / 1024)}KB.
            </span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="observaciones">Observaciones (opcional)</label>
          <textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            maxLength={500}
            rows={2}
            disabled={submitting}
            placeholder="Contale al odontólogo si tenés alguna molestia o aclaración..."
          />
        </div>
      </div>

      <div className="portal-card">
        <h2>Elegí un horario</h2>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>
          Turnos disponibles de 30 minutos. Tocá el horario que prefieras.
        </p>
        <DisponibilidadGrid
          slots={slots}
          loading={loadingSlots}
          error={errorSlots}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
        />
      </div>

      {submitError && (
        <div className="alert alert-error">
          {submitError.message}
        </div>
      )}

      <button
        type="submit"
        className="cta-primary"
        disabled={!selectedSlot || !metodoPago || submitting || (metodoPago === 'Transferencia' && !comprobanteBase64)}
      >
        {submitting
          ? 'Reservando...'
          : selectedSlot
            ? `Reservar ${selectedSlot} hs`
            : 'Elegí un horario'}
      </button>
    </form>
  );
}