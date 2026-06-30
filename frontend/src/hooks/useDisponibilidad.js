/**
 * hooks/useDisponibilidad.js — Custom hook para slots libres
 * TP Base de Datos II
 */
import { useState, useEffect } from 'react';
import { disponibilidadApi } from '../api/client.js';

export function useDisponibilidad(fecha, tratamientoId) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ duracionMin: 30, tratamiento: null });

  useEffect(() => {
    if (!fecha) {
      setSlots([]);
      setError(null);
      return;
    }
    let cancel = false;
    // Limpieza previa para evitar mostrar slots de la fecha anterior
    // mientras llega la respuesta nueva (fix bug "slots viejos al cambiar mes")
    setSlots([]);
    setLoading(true);
    setError(null);
    disponibilidadApi.consultar(fecha, tratamientoId)
      .then((res) => {
        if (cancel) return;
        setSlots(res.data.slotsLibres);
        setMeta({
          duracionMin: res.data.duracionMin,
          tratamiento: res.data.tratamiento,
        });
      })
      .catch((e) => { if (!cancel) setError(e.message); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [fecha, tratamientoId]);

  return { slots, loading, error, meta };
}