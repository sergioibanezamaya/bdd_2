/**
 * hooks/useDisponibilidad.js — Slots libres para (fecha, tratamientoId)
 *
 * Usa el nuevo endpoint que devuelve slots con flag `ocupado` y `libreHasta`.
 *
 * Re-fetcha cuando cambian los parámetros. Devuelve:
 *   - slots: array de strings HH:MM (sólo libres, compatibilidad)
 *   - slotsCompletos: array con flag ocupado
 *   - loading, error
 *   - reload()
 */

import { useState, useEffect, useCallback } from 'react';
import { disponibilidadApi } from '../api/client.js';

export function useDisponibilidad(fecha, tratamientoId) {
  const [slotsCompletos, setSlotsCompletos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!fecha || !tratamientoId) {
      setSlotsCompletos([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await disponibilidadApi.consultar(fecha, tratamientoId);
      const data = res.data;
      if (Array.isArray(data.slots) && data.slots.length > 0) {
        setSlotsCompletos(data.slots);
      } else {
        setSlotsCompletos(
          (data.slotsLibres || []).map((h) => ({ hora: h, ocupado: false }))
        );
      }
    } catch (err) {
      setError(err);
      setSlotsCompletos([]);
    } finally {
      setLoading(false);
    }
  }, [fecha, tratamientoId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const slots = slotsCompletos.filter((s) => !s.ocupado).map((s) => s.hora);

  return { slots, slotsCompletos, loading, error, reload };
}
