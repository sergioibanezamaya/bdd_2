/**
 * hooks/useConsultas.js — Custom hook para consultas
 * TP Base de Datos II
 */
import { useState, useEffect, useCallback } from 'react';
import { consultasApi } from '../api/client.js';

export function useConsultas(pacienteId = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await consultasApi.listar(pacienteId);
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}