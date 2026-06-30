/**
 * components/DisponibilidadGrid.jsx — Grilla de slots libres
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
import { useDisponibilidad } from '../hooks/useDisponibilidad.js';

export default function DisponibilidadGrid({ fecha, tratamientoId, onSelect, slotSeleccionado }) {
  const { slots, loading, error, meta } = useDisponibilidad(fecha, tratamientoId);

  if (!fecha) {
    return <p className="muted">Seleccioná una fecha y un tratamiento para ver la disponibilidad.</p>;
  }
  if (loading) return <p className="muted">Buscando horarios disponibles...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  if (slots.length === 0) {
    return (
      <div className="empty">
        <p>No hay horarios disponibles para esta fecha{tratamientoId ? '' : ' (sin tratamiento seleccionado)'}.</p>
        {meta.tratamiento && <p className="muted">Tratamiento: {meta.tratamiento} ({meta.duracionMin} min)</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="muted">
        Duración: <strong>{meta.duracionMin} min</strong>
        {meta.tratamiento && <> · Tratamiento: <strong>{meta.tratamiento}</strong></>}
      </p>
      <div className="slots-grid">
        {slots.map((slot) => (
          <button
            type="button"
            key={slot}
            className={`slot-btn ${slot === slotSeleccionado ? 'selected' : ''}`}
            onClick={() => onSelect(slot)}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}