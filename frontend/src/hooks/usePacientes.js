/**
 * hooks/usePacientes.js — Custom hook para la lista de pacientes
 * TP Base de Datos II
 */
import { useState, useEffect, useCallback } from 'react';
import { pacientesApi } from '../api/client.js';

export function usePacientes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await pacientesApi.listar(q);
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}