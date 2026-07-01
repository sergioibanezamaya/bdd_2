/**
 * components/ConsultaList.jsx — Lista de consultas del paciente
 */
import { formatFechaLarga } from '../utils/format.js';

function estadoConsultaLabel(c) {
  if (c.altaMedica) return { texto: '✅ Alta médica', clase: 'estado-alta' };
  if (c.requiereOperacion) return { texto: '🔪 Requiere operación', clase: 'estado-operacion' };
  return { texto: '🟡 En curso', clase: 'estado-curso' };
}

export default function ConsultaList({ consultas }) {
  if (consultas.length === 0) {
    return <p className="empty">Sin consultas registradas para este paciente.</p>;
  }
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tratamiento</th>
          <th>Diagnóstico</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {consultas.map((c) => {
          const est = estadoConsultaLabel(c);
          return (
            <tr key={c._id || c.id}>
              <td>{formatFechaLarga(c.fecha)}</td>
              <td>{c.tratamiento?.nombre || '—'}</td>
              <td>{c.diagnostico}</td>
              <td>
                <span className={`badge ${est.clase}`}>{est.texto}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
