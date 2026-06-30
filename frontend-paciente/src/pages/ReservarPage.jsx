/**
 * pages/ReservarPage.jsx — Página para sacar un turno nuevo
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import NuevoTurnoForm from '../components/NuevoTurnoForm.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function ReservarPage() {
  const { paciente } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <h1 className="portal-title">Sacar turno</h1>
      <p className="portal-subtitle">Elegí el tratamiento, día y horario.</p>
      <NuevoTurnoForm paciente={paciente} />

      <button
        type="button"
        className="btn btn-outline btn-full mt-2"
        onClick={() => navigate('/home')}
      >
        Volver
      </button>
    </>
  );
}