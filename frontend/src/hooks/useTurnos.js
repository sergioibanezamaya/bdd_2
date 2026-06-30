/**
 * hooks/useTurnos.js — Custom hook para turnos
 * TP Base de Datos II
 */
import { useState, useEffect, useCallback } from 'react';
import { turnosApi } from '../api/client.js';

export function useTurnos(filtros = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtrosKey = JSON.stringify(filtros);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await turnosApi.listar(filtros);
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}