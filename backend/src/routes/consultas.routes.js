/**
 * routes/consultas.routes.js — Rutas REST para historial clínico
 */
import { Router } from 'express';
import {
  listarConsultas,
  obtenerConsulta,
  crearConsulta,
  actualizarConsulta,
  eliminarConsulta,
} from '../controllers/consultas.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  crearConsultaValidator,
  actualizarConsultaValidator,
} from '../validators/consultas.validator.js';

const router = Router();

router.get('/', listarConsultas);
router.get('/:id', obtenerConsulta);
router.post('/', validate(crearConsultaValidator), crearConsulta);
router.put('/:id', validate(actualizarConsultaValidator), actualizarConsulta);
router.delete('/:id', eliminarConsulta);

export default router;