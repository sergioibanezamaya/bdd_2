/**
 * routes/turnos.routes.js — Rutas REST para turnos (flujo crítico)
 */
import { Router } from 'express';
import {
  listarTurnos,
  obtenerTurno,
  crearTurno,
  confirmarPago,
  cancelarTurno,
  atenderTurno,
  eliminarTurno,
} from '../controllers/turnos.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  crearTurnoValidator,
  cancelarTurnoValidator,
} from '../validators/turnos.validator.js';

const router = Router();

router.get('/', listarTurnos);
router.get('/:id', obtenerTurno);
router.post('/', validate(crearTurnoValidator), crearTurno);

// Flujo crítico (PATCH)
router.patch('/:id/confirmar-pago', confirmarPago);
router.patch('/:id/cancelar', validate(cancelarTurnoValidator), cancelarTurno);
router.patch('/:id/atender', atenderTurno);

router.delete('/:id', eliminarTurno);

export default router;