/**
 * components/LoginForm.jsx — Pantalla de ingreso por DNI
 *
 * Flujo:
 *   1) Usuario ingresa DNI.
 *   2) onSubmit(dni) llama a /portal/login.
 *   3) Si exists:true → guarda paciente y redirige a /home.
 *   4) Si exists:false → el padre cambia a RegistroForm con DNI precargado.
 */

import React, { useState } from 'react';

export default function LoginForm({ onLogin, error, loading }) {
  const [dni, setDni] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = dni.trim();
    if (!/^\d{7,8}$/.test(trimmed)) return; // el padre validará igual
    onLogin(trimmed);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🦷</div>
        <h1 className="login-title">Portal del Paciente</h1>
        <p className="login-subtitle">Ingresá tu DNI para continuar</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="dni">DNI</label>
            <input
              id="dni"
              type="text"
              inputMode="numeric"
              pattern="\d{7,8}"
              maxLength={8}
              autoComplete="off"
              autoFocus
              placeholder="40123456"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              required
            />
            <span className="form-help">Solo dígitos, 7 u 8 caracteres.</span>
          </div>

          {error && <div className="alert alert-error">{error.message}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Buscando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}