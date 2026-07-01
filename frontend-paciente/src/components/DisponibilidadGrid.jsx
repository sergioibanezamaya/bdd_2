/**
 * components/DisponibilidadGrid.jsx — Grilla de slots
 *
 * Muestra todos los slots del día. Los libres son seleccionables; los
 * ocupados aparecen en rojo.
 *
 * Props:
 *   - slotsCompletos: array de { hora, ocupado, motivo?, libreHasta? }
 *   - loading, error
 *   - selectedSlot: string | null
 *   - onSelectSlot(slot)
 */
import React from 'react';

function motivoLabel(motivo) {
  switch (motivo) {
    case 'pasado':
      return 'Horario pasado';
    case 'turno-activo':
      return 'Ocupado por otro turno';
    case 'fuera-de-horario':
      return 'Fuera del horario de atención';
    default:
      return 'No disponible';
  }
}

export default function DisponibilidadGrid({
  slotsCompletos,
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
  if (!slotsCompletos || slotsCompletos.length === 0) {
    return (
      <div className="empty">
        <div className="big">No hay horarios libres</div>
        <div>Probá con otra fecha o tratamiento.</div>
      </div>
    );
  }
  return (
    <div>
      <div className="slots-grid">
        {slotsCompletos.map((s) => {
          if (s.ocupado) {
            return (
              <button
                key={s.hora}
                type="button"
                className="slot-btn slot-btn-occupied"
                disabled
                title={motivoLabel(s.motivo)}
              >
                {s.hora}
              </button>
            );
          }
          return (
            <button
              key={s.hora}
              type="button"
              className={`slot-btn ${s.hora === selectedSlot ? 'selected' : ''}`}
              onClick={() => onSelectSlot(s.hora)}
              title={`Libre hasta las ${s.libreHasta} hs`}
            >
              {s.hora}
            </button>
          );
        })}
      </div>
      <p className="muted" style={{ marginTop: 10, fontSize: '0.85rem' }}>
        🟦 Azul = seleccionado &nbsp; 🟥 Rojo = ocupado
      </p>
    </div>
  );
}
