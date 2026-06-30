/**
 * hooks/useMisTurnos.js — Lista de turnos del paciente logueado
 *
 * Re-fetcha cuando cambia `pacienteId`. Devuelve:
 *   - turnos: array
 *   - loading, error
 *   - reload(): para llamar después de crear/cancelar
 */

import { useState, useEffect, useCallback } from 'react';
import { portalApi } from '../api/client.js';

export function useMisTurnos(paciente) {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!paciente?.dni) {
      setTurnos([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await portalApi.misTurnos(paciente.dni);
      setTurnos(res.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [paciente?.dni]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { turnos, loading, error, reload };
}