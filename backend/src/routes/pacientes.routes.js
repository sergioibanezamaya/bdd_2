/**
 * routes/pacientes.routes.js — Rutas REST para pacientes
 */
import { Router } from 'express';
import {
  listarPacientes,
  obtenerPaciente,
  crearPaciente,
  actualizarPaciente,
  eliminarPaciente,
} from '../controllers/pacientes.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  crearPacienteValidator,
  actualizarPacienteValidator,
} from '../validators/pacientes.validator.js';

const router = Router();

router.get('/', listarPacientes);
router.get('/:id', obtenerPaciente);
router.post('/', validate(crearPacienteValidator), crearPaciente);
router.put('/:id', validate(actualizarPacienteValidator), actualizarPaciente);
router.delete('/:id', eliminarPaciente);

export default router;