/**
 * components/MisTurnosList.jsx — Lista de turnos del paciente + cancelar
 *
 * Usa useMisTurnos (hook). Maneja el flujo de cancelación con
 * ConfirmDialog.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TurnoCardPaciente from './TurnoCardPaciente.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { turnosApi } from '../api/client.js';
import { useMisTurnos } from '../hooks/useMisTurnos.js';

export default function MisTurnosList({ paciente, onChange }) {
  const navigate = useNavigate();
  const { turnos, loading, error, reload } = useMisTurnos(paciente);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleCancelar = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      await turnosApi.cancelar(cancelTarget.id, 'Cancelado por el paciente desde el portal');
      setCancelTarget(null);
      await reload();
      if (onChange) onChange();
    } catch (err) {
      setCancelError(err);
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading && !turnos.length) {
    return <div className="loading">Cargando tus turnos...</div>;
  }
  if (error && !turnos.length) {
    return <div className="alert alert-error">{error.message}</div>;
  }
  if (!turnos.length) {
    return (
      <div className="empty">
        <div className="big">Todavía no tenés turnos</div>
        <div>Reservá tu primer turno para empezar.</div>
        <button
          type="button"
          className="cta-primary mt-2"
          onClick={() => navigate('/reservar')}
        >
          Sacar turno
        </button>
      </div>
    );
  }

  return (
    <>
      {error && <div className="alert alert-error">{error.message}</div>}
      {turnos.map((t) => (
        <TurnoCardPaciente
          key={t.id}
          turno={t}
          onCancelar={(turno) => {
            setCancelError(null);
            setCancelTarget(turno);
          }}
        />
      ))}

      <ConfirmDialog
        open={!!cancelTarget}
        title="¿Cancelar este turno?"
        message={
          cancelTarget
            ? `${cancelTarget.tratamiento?.nombre || 'Consulta'} · ${cancelTarget.horario?.horaInicio} hs. Si te arrepentís, podés sacar otro.`
            : ''
        }
        confirmText={cancelLoading ? 'Cancelando...' : 'Sí, cancelar'}
        cancelText="Volver"
        variant="danger"
        onConfirm={handleCancelar}
        onCancel={() => !cancelLoading && setCancelTarget(null)}
      />

      {cancelError && (
        <div className="alert alert-error mt-2">
          {cancelError.message || 'No se pudo cancelar el turno.'}
        </div>
      )}
    </>
  );
}