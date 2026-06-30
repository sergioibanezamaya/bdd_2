/**
 * App.jsx — Router + guards de auth
 *
 * Rutas:
 *   /              → redirect a /home si logueado, si no /login
 *   /login         → LoginPage (público)
 *   /home          → HomePage (requiere paciente)
 *   /reservar      → ReservarPage (requiere paciente)
 *   /perfil        → PerfilPage (requiere paciente)
 *   *              → redirect a /home
 */

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import Header from './components/Header.jsx';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ReservarPage from './pages/ReservarPage.jsx';
import PerfilPage from './pages/PerfilPage.jsx';

function PrivateRoute({ paciente, children }) {
  if (!paciente) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ paciente, children }) {
  if (paciente) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  const { paciente, isLoading, logout } = useAuth();
  const location = useLocation();
  const showHeader = !!paciente && location.pathname !== '/login';

  return (
    <div className="app">
      {showHeader && <Header paciente={paciente} onLogout={logout} />}
      <main className="portal-container">
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute paciente={paciente}>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/home"
            element={
              <PrivateRoute paciente={paciente}>
                <HomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/reservar"
            element={
              <PrivateRoute paciente={paciente}>
                <ReservarPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <PrivateRoute paciente={paciente}>
                <PerfilPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={<Navigate to={paciente ? '/home' : '/login'} replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {isLoading && (
        <div className="loading" style={{ padding: '10px', fontSize: '0.85rem' }}>
          Verificando sesión...
        </div>
      )}
    </div>
  );
}