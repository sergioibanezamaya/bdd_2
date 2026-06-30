/**
 * components/TurnoCardPaciente.jsx — Tarjeta de turno para el paciente
 *
 * Muestra datos clave + método de pago + estado del pago + precio.
 * Botón "Cancelar" si está Pendiente/Confirmado.
 * Los turnos Atendidos/Cancelados no se pueden cancelar.
 */

import React from 'react';
import { formatFechaLarga, formatMoneda } from '../utils/format.js';

const ESTADO_BADGE = {
  Pendiente: 'badge-pendiente',
  Confirmado: 'badge-confirmado',
  Cancelado: 'badge-cancelado',
  Atendido: 'badge-atendido',
};

const METODO_LABEL = {
  Efectivo: '💵 Efectivo',
  Transferencia: '🏦 Transferencia',
};

export default function TurnoCardPaciente({ turno, onCancelar }) {
  const puedeCancelar = ['Pendiente', 'Confirmado'].includes(turno.estado);
  const tratamientoNombre = turno.tratamiento?.nombre || 'Consulta';
  const tratamiento = turno.tratamiento || {};
  const metodo = turno.metodoPago;
  const transferencia = metodo === 'Transferencia';

  let pagoLabel = null;
  if (metodo) {
    if (transferencia) {
      pagoLabel = turno.pagoConfirmado
        ? '✓ Pago confirmado'
        : '⌛ Pago a confirmar por el consultorio';
    } else if (metodo === 'Efectivo') {
      pagoLabel = turno.pagoConfirmado
        ? '✓ Pagado'
        : 'A pagar en consultorio';
    }
  }

  return (
    <div className="turno-card-paciente">
      <div className="top">
        <div>
          <div className="tratamiento">{tratamientoNombre}</div>
          <div className="fecha">
            {formatFechaLarga(turno.fecha)} · {turno.horario?.horaInicio} – {turno.horario?.horaFin}
          </div>
        </div>
        <span className={`badge ${ESTADO_BADGE[turno.estado] || ''}`}>
          {turno.estado}
        </span>
      </div>

      {(metodo || tratamiento.precioReferencia != null) && (
        <div style={{ marginTop: 8, fontSize: '0.88rem' }}>
          {metodo && (
            <span style={{ marginRight: 12 }}>
              <strong>{METODO_LABEL[metodo] || metodo}</strong>
            </span>
          )}
          {tratamiento.precioReferencia != null && (
            <span style={{ marginRight: 12 }}>
              💰 <strong>{formatMoneda(tratamiento.precioReferencia)}</strong>
            </span>
          )}
        </div>
      )}
      {pagoLabel && (
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
          {pagoLabel}
        </p>
      )}
      {turno.observaciones && (
        <p className="muted" style={{ margin: '8px 0 0', fontSize: '0.88rem' }}>
          📝 {turno.observaciones}
        </p>
      )}
      {puedeCancelar && (
        <div className="actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onCancelar(turno)}
          >
            Cancelar turno
          </button>
        </div>
      )}
    </div>
  );
}