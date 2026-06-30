/**
 * pages/PerfilPage.jsx — Página con los datos del paciente
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import MiPerfil from '../components/MiPerfil.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function PerfilPage() {
  const { paciente } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <h1 className="portal-title">Mi perfil</h1>
      <MiPerfil paciente={paciente} />

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