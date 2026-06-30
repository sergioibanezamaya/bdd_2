/**
 * pages/HomePage.jsx — Pantalla principal post-login
 *
 * "Hola, {nombre}" + lista de turnos + CTA "Reservar turno".
 * Si el paciente volvió de reservar (location.state.turnoCreado),
 * muestra un alert de éxito.
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MisTurnosList from '../components/MisTurnosList.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function HomePage() {
  const { paciente, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreatedAlert, setShowCreatedAlert] = useState(
    !!location.state?.turnoCreado
  );

  useEffect(() => {
    if (showCreatedAlert) {
      const t = setTimeout(() => setShowCreatedAlert(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showCreatedAlert]);

  return (
    <>
      {showCreatedAlert && (
        <div className="alert alert-success">
          ¡Listo! Tu turno quedó reservado en estado <strong>Pendiente</strong>.
          Te avisaremos por email cuando se confirme.
        </div>
      )}

      <h1 className="portal-title">Hola, {paciente?.nombre} 👋</h1>
      <p className="portal-subtitle">
        Acá podés ver tus turnos y reservar uno nuevo.
      </p>

      <MisTurnosList paciente={paciente} />

      <hr className="divider" />

      <button
        type="button"
        className="cta-primary"
        onClick={() => navigate('/reservar')}
      >
        + Sacar turno nuevo
      </button>

      <button
        type="button"
        className="btn btn-outline btn-full mt-2"
        onClick={() => navigate('/perfil')}
      >
        Ver mis datos
      </button>
    </>
  );
}