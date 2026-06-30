/**
 * hooks/useDisponibilidad.js — Slots libres para (fecha, tratamientoId)
 *
 * Re-fetcha cuando cambian los parámetros. Devuelve:
 *   - slots: array de strings HH:MM
 *   - loading, error
 *   - reload()
 */

import { useState, useEffect, useCallback } from 'react';
import { disponibilidadApi } from '../api/client.js';

export function useDisponibilidad(fecha, tratamientoId) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!fecha || !tratamientoId) {
      setSlots([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await disponibilidadApi.consultar(fecha, tratamientoId);
      setSlots(res.data?.slotsLibres || []);
    } catch (err) {
      setError(err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [fecha, tratamientoId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { slots, loading, error, reload };
}