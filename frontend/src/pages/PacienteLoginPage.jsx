/**
 * pages/PacienteLoginPage.jsx — Portal del Paciente
 * TP Base de Datos II — Sistema de Turnos Odontológicos
 *
 * Pantalla pública donde el paciente:
 *   1) Ingresa su DNI y se loguea, o
 *   2) Se registra si nunca estuvo en el sistema.
 *
 * Si el DNI ya existe, "Iniciar sesión" funciona y guarda al paciente
 * en localStorage para mantenerlo "logueado" durante la sesión.
 * Si no existe, ofrece pasar a "Registrarme".
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '../api/client.js';

const PACIENTE_KEY = 'paciente_logueado';

const VACIO = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  obraSocial: '',
};

export default function PacienteLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'registro'
  const [dni, setDni] = useState('');
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function persistirPaciente(p) {
    localStorage.setItem(PACIENTE_KEY, JSON.stringify(p));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    const dniLimpio = dni.trim();
    if (!/^\d{7,8}$/.test(dniLimpio)) {
      setError('El DNI debe tener 7 u 8 dígitos, sin puntos ni espacios.');
      return;
    }
    setLoading(true);
    try {
      const res = await portalApi.loginPorDni(dniLimpio);
      if (res.exists && res.data) {
        persistirPaciente(res.data);
        navigate('/mi-turno');
      } else {
        // No existe: lo mandamos a registrarse con el DNI prellenado
        setForm((f) => ({ ...f, dni: dniLimpio }));
        setMode('registro');
        setError('No encontramos tu DNI. Completá el registro para crear tu cuenta.');
      }
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegistro(e) {
    e.preventDefault();
    setError(null);
    if (!/^\d{7,8}$/.test(form.dni.trim())) {
      setError('El DNI debe tener 7 u 8 dígitos, sin puntos ni espacios.');
      return;
    }
    setLoading(true);
    try {
      const res = await portalApi.registrar({
        ...form,
        dni: form.dni.trim(),
        email: form.email.trim().toLowerCase(),
      });
      const paciente = res.data;
      persistirPaciente(paciente);
      navigate('/mi-turno');
    } catch (e2) {
      if (e2.details) {
        setError(e2.details.map((d) => `${d.field}: ${d.message}`).join(' | '));
      } else {
        setError(e2.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portal-wrap">
      <div className="portal-card">
        <div className="portal-header">
          <span className="portal-logo">🦷</span>
          <h1 style={{ margin: 0 }}>Portal del Paciente</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Consultá tu próximo turno en el consultorio odontológico.
          </p>
        </div>

        <div className="portal-tabs">
          <button
            type="button"
            className={`portal-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(null); }}
          >
            Ya estoy registrado
          </button>
          <button
            type="button"
            className={`portal-tab ${mode === 'registro' ? 'active' : ''}`}
            onClick={() => { setMode('registro'); setError(null); }}
          >
            Registrarme
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>DNI *</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="40123456"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
                maxLength={8}
              />
              <small className="muted">Ingresá tu DNI sin puntos ni espacios (7 u 8 dígitos).</small>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Buscando...' : 'Iniciar sesión'}
            </button>
          </form>
        )}

        {mode === 'registro' && (
          <form onSubmit={handleRegistro}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} required minLength={2} maxLength={60} />
              </div>
              <div className="form-group">
                <label>Apellido *</label>
                <input name="apellido" value={form.apellido} onChange={handleChange} required minLength={2} maxLength={60} />
              </div>
              <div className="form-group">
                <label>DNI *</label>
                <input
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  required
                  inputMode="numeric"
                  pattern="[0-9]{7,8}"
                  maxLength={8}
                  placeholder="Sin puntos"
                />
                <small className="muted">Sin puntos ni espacios.</small>
              </div>
              <div className="form-group">
                <label>Teléfono *</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Email (Gmail) *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
                <small className="muted">Acá te enviaremos la confirmación del turno.</small>
              </div>
              <div className="form-group">
                <label>Fecha de nacimiento *</label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={form.fechaNacimiento}
                  onChange={handleChange}
                  required
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="form-group full">
                <label>Obra social *</label>
                <input name="obraSocial" value={form.obraSocial} onChange={handleChange} required maxLength={80} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 12 }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta e ingresar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export { PACIENTE_KEY };