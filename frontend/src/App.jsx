/**
 * App.jsx — Layout principal y rutas
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 *
 * Rutas:
 *   /            → redirige a /pacientes
 *   /pacientes   → PacientesPage (odontólogo)
 *   /turnos      → TurnosPage (odontólogo)
 *   /agenda      → AgendaPage (odontólogo)
 *   /consultas   → ConsultasPage (odontólogo)
 *   /portal      → PacienteLoginPage (login/registro del paciente)
 *   /mi-turno    → MiTurnoPage (vista del turno del paciente)
 *   /solicitar-turno → SolicitarTurnoPage (pedir o cambiar turno)
 */
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import PacientesPage from './pages/PacientesPage.jsx';
import TurnosPage from './pages/TurnosPage.jsx';
import AgendaPage from './pages/AgendaPage.jsx';
import ConsultasPage from './pages/ConsultasPage.jsx';
import PacienteLoginPage from './pages/PacienteLoginPage.jsx';
import MiTurnoPage from './pages/MiTurnoPage.jsx';
import SolicitarTurnoPage from './pages/SolicitarTurnoPage.jsx';

export default function App() {
  const location = useLocation();
  // Las rutas del paciente no muestran la navbar del odontólogo
  const portalRoutes = ['/portal', '/mi-turno', '/solicitar-turno'];
  const esPortal = portalRoutes.includes(location.pathname);

  return (
    <div className="app">
      {!esPortal && <NavBar />}
      <main className={esPortal ? '' : 'container'}>
        <Routes>
          <Route path="/" element={<Navigate to="/pacientes" replace />} />
          <Route path="/pacientes" element={<PacientesPage />} />
          <Route path="/turnos" element={<TurnosPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/consultas" element={<ConsultasPage />} />
          <Route path="/portal" element={<PacienteLoginPage />} />
          <Route path="/mi-turno" element={<MiTurnoPage />} />
          <Route path="/solicitar-turno" element={<SolicitarTurnoPage />} />
          <Route path="*" element={<Navigate to="/pacientes" replace />} />
        </Routes>
      </main>
    </div>
  );
}