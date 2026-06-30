/**
 * hooks/useAuth.js — Auth simple por DNI (localStorage)
 *
 * Decisión del TP: NO usamos JWT ni bcrypt. El "login" es identificar
 * al paciente por su DNI. Si ya existe en la BD, se loguea; si no, se
 * muestra el formulario de auto-registro.
 *
 * Persistencia: localStorage guarda { dni, paciente } para que el
 * paciente no tenga que volver a poner su DNI cada vez que abre el portal.
 */

import { useState, useEffect, useCallback } from 'react';
import { portalApi } from '../api/client.js';

const STORAGE_KEY = 'portalPaciente';

function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeToStorage(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignorar quota / modo privado */
  }
}

/**
 * Hook de autenticación del portal.
 * Devuelve:
 *   - paciente: objeto paciente logueado o null
 *   - isLoading: durante el chequeo inicial
 *   - login(dni): hace POST /portal/login, devuelve { exists, paciente? }
 *   - registro(datos): crea paciente y lo guarda en storage
 *   - logout(): borra storage
 *   - refresh(): relee storage (útil tras editar perfil)
 */
export function useAuth() {
  const [paciente, setPaciente] = useState(() => readFromStorage()?.paciente ?? null);
  const [isLoading, setIsLoading] = useState(false);

  // Al montar, verificar que el paciente del storage sigue existiendo en BD
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      const stored = readFromStorage();
      if (!stored?.dni) return;
      setIsLoading(true);
      try {
        const res = await portalApi.login(stored.dni);
        if (cancelled) return;
        if (!res.exists) {
          // El paciente fue borrado del backend. Limpiar sesión.
          writeToStorage(null);
          setPaciente(null);
        } else {
          // Actualizar con datos frescos del backend
          writeToStorage({ dni: stored.dni, paciente: res.data });
          setPaciente(res.data);
        }
      } catch {
        /* Si falla la red, mantener la sesión local — no expulsar al usuario */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    checkSession();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (dni) => {
    const res = await portalApi.login(dni);
    if (res.exists) {
      writeToStorage({ dni, paciente: res.data });
      setPaciente(res.data);
    }
    return res; // { exists: bool, data?: paciente }
  }, []);

  const registro = useCallback(async (datos) => {
    const res = await portalApi.registro(datos);
    // El backend devuelve existed:true si el DNI ya estaba, igual sirve como login.
    writeToStorage({ dni: datos.dni, paciente: res.data });
    setPaciente(res.data);
    return res;
  }, []);

  const logout = useCallback(() => {
    writeToStorage(null);
    setPaciente(null);
  }, []);

  const refresh = useCallback(() => {
    setPaciente(readFromStorage()?.paciente ?? null);
  }, []);

  return { paciente, isLoading, login, registro, logout, refresh };
}