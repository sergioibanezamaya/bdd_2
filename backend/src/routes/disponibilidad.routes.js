/**
 * routes/disponibilidad.routes.js — Endpoint de slots libres
 */
import { Router } from 'express';
import { getDisponibilidad } from '../services/disponibilidadService.js';

const router = Router();

router.get('/', getDisponibilidad);

export default router;