/**
 * pages/LoginPage.jsx — Pantalla inicial del portal
 *
 * Maneja el flujo:
 *   - Ingreso DNI → busca en BD.
 *   - Si existe: redirige a /home.
 *   - Si NO existe: muestra PacienteForm con DNI precargado.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm.jsx';
import PacienteForm from '../components/PacienteForm.jsx';
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
        setDniIngresado(dni); // abre PacienteForm en modo registro
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
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">📝</div>
          <h1 className="login-title">Crear cuenta</h1>
          <p className="login-subtitle">
            Tu DNI no está registrado. Completá tus datos para empezar.
          </p>
          <PacienteForm
            dniInicial={dniIngresado}
            onRegistrar={handleRegistrar}
            onCancel={handleCancelRegistro}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  return <LoginForm onLogin={handleLogin} error={error} loading={loading} />;
}
