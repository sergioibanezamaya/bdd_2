/**
 * hooks/useDisponibilidad.js — Custom hook para slots
 *
 * Usa el nuevo endpoint que devuelve slots con flag `ocupado` y `libreHasta`.
 * TP Base de Datos II
 */
import { useState, useEffect } from 'react';
import { disponibilidadApi } from '../api/client.js';

export function useDisponibilidad(fecha, tratamientoId) {
  const [slotsCompletos, setSlotsCompletos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ duracionMin: 30, tratamiento: null });

  useEffect(() => {
    if (!fecha) {
      setSlotsCompletos([]);
      setError(null);
      return;
    }
    let cancel = false;
    setSlotsCompletos([]);
    setLoading(true);
    setError(null);
    disponibilidadApi.consultar(fecha, tratamientoId)
      .then((res) => {
        if (cancel) return;
        // Compatibilidad: si el backend no tiene `slots` aún, derivar de slotsLibres
        const data = res.data;
        if (Array.isArray(data.slots) && data.slots.length > 0) {
          setSlotsCompletos(data.slots);
        } else {
          setSlotsCompletos(
            (data.slotsLibres || []).map((h) => ({ hora: h, ocupado: false }))
          );
        }
        setMeta({
          duracionMin: data.duracionMin,
          tratamiento: data.tratamiento,
        });
      })
      .catch((e) => { if (!cancel) setError(e.message); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [fecha, tratamientoId]);

  // Mantener `slots` por compatibilidad con el componente que ya lo usaba
  const slots = slotsCompletos.filter((s) => !s.ocupado).map((s) => s.hora);

  return { slots, slotsCompletos, loading, error, meta };
}
