/**
 * components/DisponibilidadGrid.jsx — Grilla de slots libres
 *
 * Props:
 *   - slots: array de strings HH:MM
 *   - loading, error
 *   - selectedSlot: string | null
 *   - onSelectSlot(slot)
 */
import React from 'react';

export default function DisponibilidadGrid({
  slots,
  loading,
  error,
  selectedSlot,
  onSelectSlot,
}) {
  if (loading) {
    return <div className="loading">Buscando horarios disponibles...</div>;
  }
  if (error) {
    return <div className="alert alert-error">{error.message}</div>;
  }
  if (!slots.length) {
    return (
      <div className="empty">
        <div className="big">No hay horarios libres</div>
        <div>Probá con otra fecha o tratamiento.</div>
      </div>
    );
  }
  return (
    <div className="slots-grid">
      {slots.map((s) => (
        <button
          key={s}
          type="button"
          className={`slot-btn ${s === selectedSlot ? 'selected' : ''}`}
          onClick={() => onSelectSlot(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}