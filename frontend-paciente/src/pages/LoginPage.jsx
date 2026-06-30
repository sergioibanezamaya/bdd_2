/**
 * pages/LoginPage.jsx — Pantalla inicial del portal
 *
 * Maneja el flujo:
 *   - Ingreso DNI → busca en BD.
 *   - Si existe: redirige a /home.
 *   - Si NO existe: muestra RegistroForm con DNI precargado.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm.jsx';
import RegistroForm from '../components/RegistroForm.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, registro } = useAuth();
  const [dniIngresado, setDniIngresado] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (dni) => {
    setError(null);
    setLoading(true);
    try {
      const res = await login(dni);
      if (res.exists) {
        navigate('/home', { replace: true });
      } else {
        setDniIngresado(dni); // abre RegistroForm
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrar = async (datos) => {
    await registro(datos);
    navigate('/home', { replace: true });
  };

  const handleCancelRegistro = () => {
    setDniIngresado(null);
    setError(null);
  };

  if (dniIngresado) {
    return (
      <RegistroForm
        dniInicial={dniIngresado}
        onRegistrar={handleRegistrar}
        onCancel={handleCancelRegistro}
      />
    );
  }

  return <LoginForm onLogin={handleLogin} error={error} loading={loading} />;
}