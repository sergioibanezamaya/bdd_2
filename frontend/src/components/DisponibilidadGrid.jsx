/**
 * components/DisponibilidadGrid.jsx — Grilla de slots
 *
 * Muestra todos los slots del día. Los libres son seleccionables; los
 * ocupados aparecen en rojo con tooltip indicando por qué.
 *
 * TP Base de Datos II
 */
import { useDisponibilidad } from '../hooks/useDisponibilidad.js';

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

export default function DisponibilidadGrid({ fecha, tratamientoId, onSelect, slotSeleccionado }) {
  const { slotsCompletos, loading, error, meta } = useDisponibilidad(fecha, tratamientoId);

  if (!fecha) {
    return <p className="muted">Seleccioná una fecha y un tratamiento para ver la disponibilidad.</p>;
  }
  if (loading) return <p className="muted">Buscando horarios disponibles...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  if (slotsCompletos.length === 0) {
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
        {slotsCompletos.map((s) => {
          if (s.ocupado) {
            return (
              <button
                type="button"
                key={s.hora}
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
              type="button"
              key={s.hora}
              className={`slot-btn ${s.hora === slotSeleccionado ? 'selected' : ''}`}
              onClick={() => onSelect(s.hora)}
              title={`Libre hasta las ${s.libreHasta} hs`}
            >
              {s.hora}
            </button>
          );
        })}
      </div>
      <p className="muted" style={{ marginTop: 10, fontSize: '0.85rem' }}>
        🟦 Azul = seleccionado &nbsp; 🟥 Rojo = ocupado (no se puede reservar)
      </p>
    </div>
  );
}
