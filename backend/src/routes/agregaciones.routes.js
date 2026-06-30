/**
 * routes/agregaciones.routes.js — Endpoints de agregaciones MongoDB
 */
import { Router } from 'express';
import {
  turnosPorMes,
  tratamientosFrecuentes,
  pacientesPorObraSocial,
  tasaConfirmacion,
} from '../services/agregacionesService.js';

const router = Router();

router.get('/turnos-por-mes', async (_req, res, next) => {
  try {
    const data = await turnosPorMes();
    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

router.get('/tratamientos-mas-frecuentes', async (_req, res, next) => {
  try {
    const data = await tratamientosFrecuentes();
    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

router.get('/pacientes-por-obra-social', async (_req, res, next) => {
  try {
    const data = await pacientesPorObraSocial();
    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

router.get('/tasa-confirmacion', async (_req, res, next) => {
  try {
    const data = await tasaConfirmacion();
    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

export default router;