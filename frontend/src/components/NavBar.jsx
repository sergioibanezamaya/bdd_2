/**
 * components/NavBar.jsx — Barra de navegación superior
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 */
import { NavLink } from 'react-router-dom';
import { PACIENTE_KEY } from '../pages/PacienteLoginPage.jsx';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const [pacienteLogueado, setPacienteLogueado] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(PACIENTE_KEY);
    if (raw) {
      try {
        setPacienteLogueado(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  function handleLogoutPaciente() {
    localStorage.removeItem(PACIENTE_KEY);
    setPacienteLogueado(null);
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="logo">🦷</span>
        <span>Consultorio Odontológico</span>
      </div>
      <nav className="navbar-links">
        <NavLink to="/pacientes" className={({ isActive }) => (isActive ? 'active' : '')}>
          Pacientes
        </NavLink>
        <NavLink to="/turnos" className={({ isActive }) => (isActive ? 'active' : '')}>
          Turnos
        </NavLink>
        <NavLink to="/agenda" className={({ isActive }) => (isActive ? 'active' : '')}>
          Agenda
        </NavLink>
        <NavLink to="/consultas" className={({ isActive }) => (isActive ? 'active' : '')}>
          Consultas
        </NavLink>
        <span className="navbar-divider" />
        {pacienteLogueado ? (
          <>
            <NavLink to="/mi-turno" className={({ isActive }) => (isActive ? 'active' : '')}>
              Mi turno
            </NavLink>
            <button
              type="button"
              onClick={handleLogoutPaciente}
              className="navbar-logout"
              title="Cerrar sesión de paciente"
            >
              Salir ({pacienteLogueado.nombre})
            </button>
          </>
        ) : (
          <NavLink to="/portal" className={({ isActive }) => (isActive ? 'active' : '')}>
            Portal Paciente
          </NavLink>
        )}
      </nav>
    </header>
  );
}