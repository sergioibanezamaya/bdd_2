/**
 * =====================================================================
 * services/agregacionesService.js — Pipelines de MongoDB Aggregation
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Tres pipelines principales:
 *   1. turnosPorMes()      → volumen de turnos agrupados por mes/estado
 *   2. tratamientosFrecuentes() → tratamientos más aplicados en consultas
 *   3. pacientesPorObraSocial() → distribución de pacientes por OS
 *
 * Cada pipeline usa $match, $group, $sort, $lookup, $project según
 * corresponda, y devuelve un array listo para enviar al frontend.
 * =====================================================================
 */

import Turno from '../models/Turno.js';
import Consulta from '../models/Consulta.js';
import Paciente from '../models/Paciente.js';

/**
 * 1) Turnos por mes (últimos 12 meses)
 *    Pipeline:
 *      - $match: createdAt en últimos 12 meses
 *      - $group: por (year, month) contando total + confirmados + cancelados
 *      - $sort: cronológico
 */
export async function turnosPorMes() {
  const desde = new Date();
  desde.setMonth(desde.getMonth() - 11);
  desde.setDate(1);
  desde.setHours(0, 0, 0, 0);

  const pipeline = [
    { $match: { createdAt: { $gte: desde } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        total: { $sum: 1 },
        confirmados: {
          $sum: { $cond: [{ $eq: ['$estado', 'Confirmado'] }, 1, 0] },
        },
        cancelados: {
          $sum: { $cond: [{ $eq: ['$estado', 'Cancelado'] }, 1, 0] },
        },
        atendidos: {
          $sum: { $cond: [{ $eq: ['$estado', 'Atendido'] }, 1, 0] },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        total: 1,
        confirmados: 1,
        cancelados: 1,
        atendidos: 1,
      },
    },
  ];

  return Turno.aggregate(pipeline);
}

/**
 * 2) Tratamientos más frecuentes (sobre la colección `consultas`)
 *    Pipeline:
 *      - $group por tratamiento contando
 *      - $sort + $limit 10
 *      - $lookup con colección tratamientos (para enriquecer con nombre)
 */
export async function tratamientosFrecuentes() {
  const pipeline = [
    { $group: { _id: '$tratamiento', cantidad: { $sum: 1 } } },
    { $sort: { cantidad: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'tratamientos',
        localField: '_id',
        foreignField: '_id',
        as: 'info',
      },
    },
    { $unwind: { path: '$info', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        tratamientoId: '$_id',
        tratamiento: { $ifNull: ['$info.nombre', '(eliminado)'] },
        cantidad: 1,
      },
    },
  ];

  return Consulta.aggregate(pipeline);
}

/**
 * 3) Pacientes por obra social
 *    Pipeline simple: $group + $sort
 */
export async function pacientesPorObraSocial() {
  const pipeline = [
    { $group: { _id: '$obraSocial', cantidad: { $sum: 1 } } },
    { $sort: { cantidad: -1 } },
    {
      $project: {
        _id: 0,
        obraSocial: '$_id',
        cantidad: 1,
      },
    },
  ];

  return Paciente.aggregate(pipeline);
}

/**
 * 4) (Bonus) Tasa global de confirmación de turnos
 */
export async function tasaConfirmacion() {
  const pipeline = [
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        confirmados: { $sum: { $cond: [{ $eq: ['$estado', 'Confirmado'] }, 1, 0] } },
        cancelados: { $sum: { $cond: [{ $eq: ['$estado', 'Cancelado'] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        confirmados: 1,
        cancelados: 1,
        tasaConfirmacion: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $divide: ['$confirmados', '$total'] },
          ],
        },
      },
    },
  ];

  const [result] = await Turno.aggregate(pipeline);
  return result || { total: 0, confirmados: 0, cancelados: 0, tasaConfirmacion: 0 };
}