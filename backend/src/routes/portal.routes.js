/**
 * =====================================================================
 * routes/portal.routes.js — Rutas REST del Portal del Paciente
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Endpoints públicos (sin auth) usados por el frontend-paciente (:5174):
 *   POST /api/portal/login
 *   POST /api/portal/registro
 *   GET  /api/portal/mis-turnos?dni=...
 *   GET  /api/portal/alias-pago
 *   POST /api/portal/turnos                  (crear turno nuevo)
 *   PATCH /api/portal/turnos/:id/cancelar    (cancelar propio turno)
 *   PATCH /api/portal/turnos/:id/cambiar     (mover propio turno)
 *   PATCH /api/portal/turnos/:id/comprobante (subir/reemplazar comprobante)
 * =====================================================================
 */

import { Router } from 'express';
import {
  loginPorDni,
  registroPortal,
  misTurnos,
  crearTurnoPortal,
  cancelarTurnoPortal,
  cambiarTurnoPortal,
  subirComprobantePortal,
  getAliasPago,
} from '../controllers/portal.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  portalLoginValidator,
  portalRegistroValidator,
} from '../validators/portal.validator.js';

const router = Router();

router.get('/alias-pago', getAliasPago);
router.post('/login', validate(portalLoginValidator), loginPorDni);
router.post('/registro', validate(portalRegistroValidator), registroPortal);
router.get('/mis-turnos', misTurnos);

// Acciones de turno (el paciente pasa su DNI en el body para autenticarse)
router.post('/turnos', crearTurnoPortal);
router.patch('/turnos/:id/cancelar', cancelarTurnoPortal);
router.patch('/turnos/:id/cambiar', cambiarTurnoPortal);
router.patch('/turnos/:id/comprobante', subirComprobantePortal);

export default router;
