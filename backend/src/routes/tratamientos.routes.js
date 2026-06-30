/**
 * routes/tratamientos.routes.js — Rutas REST para tratamientos
 */
import { Router } from 'express';
import {
  listarTratamientos,
  crearTratamiento,
  actualizarTratamiento,
} from '../controllers/tratamientos.controller.js';

const router = Router();

router.get('/', listarTratamientos);
router.post('/', crearTratamiento);
router.put('/:id', actualizarTratamiento);

export default router;