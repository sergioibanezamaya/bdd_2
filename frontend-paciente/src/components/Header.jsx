/**
 * components/Header.jsx — Cabecera del portal (con saludo + logout)
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ paciente, onLogout }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión?')) {
      onLogout();
      navigate('/login');
    }
  };

  return (
    <header className="portal-header">
      <div className="brand">
        <span className="logo">🦷</span>
        <span>Consultorio</span>
      </div>
      {paciente && (
        <div className="user-block">
          <span>Hola, <strong>{paciente.nombre}</strong></span>
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            Salir
          </button>
        </div>
      )}
    </header>
  );
}