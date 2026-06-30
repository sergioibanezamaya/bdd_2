/**
 * pages/PacientesPage.jsx — Pantalla 1: Pacientes (CRUD)
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
import { useState } from 'react';
import { usePacientes } from '../hooks/usePacientes.js';
import { pacientesApi } from '../api/client.js';
import PacienteForm from '../components/PacienteForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { formatFechaCorta } from '../utils/format.js';

export default function PacientesPage() {
  const { data, loading, error, reload } = usePacientes();
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    await reload(q);
  }

  async function handleSaved(result) {
    setShowForm(false);
    setEditando(null);
    if (result.existed) {
      // No recargar; el paciente ya estaba. Solo cerramos.
      alert('Paciente ya registrado: se reutilizó el existente.');
    }
    await reload();
  }

  async function handleDelete() {
    try {
      setDeleteError(null);
      await pacientesApi.eliminar(showDelete._id || showDelete.id);
      setShowDelete(null);
      await reload();
    } catch (e) {
      setDeleteError(e.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Pacientes</h1>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setShowForm(true); }}>
          + Nuevo paciente
        </button>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="flex-gap">
          <input
            type="search"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" type="submit">Buscar</button>
          {q && <button type="button" className="btn btn-outline" onClick={() => { setQ(''); reload(''); }}>Limpiar</button>}
        </form>
      </div>

      {loading && <p className="loading">Cargando pacientes...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && data.length === 0 && (
        <div className="empty">No hay pacientes registrados. Creá el primero con "+ Nuevo paciente".</div>
      )}

      {data.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Apellido, Nombre</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Obra Social</th>
              <th>F. Nacimiento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p._id || p.id}>
                <td><strong>{p.apellido}, {p.nombre}</strong></td>
                <td>{p.dni}</td>
                <td>{p.telefono}</td>
                <td>{p.email}</td>
                <td>{p.obraSocial}</td>
                <td>{formatFechaCorta(p.fechaNacimiento)}</td>
                <td className="flex-gap">
                  <button className="btn btn-sm btn-outline" onClick={() => { setEditando(p); setShowForm(true); }}>Editar</button>
                  <button className="btn btn-sm btn-danger" onClick={() => setShowDelete(p)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <PacienteForm
          paciente={editando}
          onClose={() => { setShowForm(false); setEditando(null); }}
          onSaved={handleSaved}
        />
      )}

      {showDelete && (
        <ConfirmDialog
          title="Eliminar paciente"
          message={`¿Eliminar a ${showDelete.apellido}, ${showDelete.nombre}? Esta acción no se puede deshacer (solo se permite si no tiene turnos futuros).`}
          confirmText="Eliminar"
          confirmClass="btn-danger"
          onConfirm={handleDelete}
          onCancel={() => { setShowDelete(null); setDeleteError(null); }}
        />
      )}
      {deleteError && (
        <div className="alert alert-error" style={{ marginTop: 10 }}>{deleteError}</div>
      )}
    </div>
  );
}