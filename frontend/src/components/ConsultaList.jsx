/**
 * components/ConsultaList.jsx — Lista de consultas del paciente
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
import { formatFechaLarga } from '../utils/format.js';

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
          <th>¿Operación?</th>
          <th>Alta</th>
        </tr>
      </thead>
      <tbody>
        {consultas.map((c) => (
          <tr key={c._id || c.id}>
            <td>{formatFechaLarga(c.fecha)}</td>
            <td>{c.tratamiento?.nombre || '—'}</td>
            <td>{c.diagnostico}</td>
            <td>{c.requiereOperacion ? 'Sí' : 'No'}</td>
            <td>{c.altaMedica ? 'Sí' : 'No'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}