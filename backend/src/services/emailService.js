/**
 * =====================================================================
 * services/emailService.js — Envío de emails con Nodemailer
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Utiliza Gmail SMTP con "App Password" (requiere 2FA activo).
 * Si no está configurado, las funciones lanzan error con código
 * `MAIL_DISABLED` (modo degradado).
 * =====================================================================
 */

import { mailer, mailerStatus } from '../config/mailer.js';

export class MailDisabledError extends Error {
  constructor(message = 'Email no está configurado') {
    super(message);
    this.code = 'MAIL_DISABLED';
  }
}

/**
 * Envía un email de confirmación de turno al paciente.
 * @param {Object} turno - Documento Turno (con paciente y tratamiento populados)
 */
export async function enviarConfirmacion(turno) {
  if (!mailerStatus.enabled) {
    throw new MailDisabledError();
  }

  const paciente = turno.paciente;
  const tratamiento = turno.tratamiento;
  const fromName = process.env.MAIL_FROM_NAME || 'Consultorio Odontológico';
  const direccion = process.env.CONSULTORIO_DIRECCION || '(dirección no configurada)';

  const fechaStr = new Date(turno.fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0d6efd;">Confirmación de turno</h2>
      <p>Hola <strong>${paciente.nombre} ${paciente.apellido}</strong>,</p>
      <p>Tu turno ha sido confirmado. A continuación los detalles:</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Fecha</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${fechaStr}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Hora</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${turno.horario.horaInicio} a ${turno.horario.horaFin} hs</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tratamiento</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${tratamiento?.nombre || 'No especificado'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Dirección</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${direccion}</td></tr>
      </table>
      <p>Por favor, llegar 10 minutos antes.</p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        ${fromName} — Este es un mensaje automático, no responder.
      </p>
    </div>
  `;

  const text = `
Confirmación de turno

Hola ${paciente.nombre} ${paciente.apellido},

Tu turno ha sido confirmado:
- Fecha: ${fechaStr}
- Hora: ${turno.horario.horaInicio} a ${turno.horario.horaFin} hs
- Tratamiento: ${tratamiento?.nombre || 'No especificado'}
- Dirección: ${direccion}

Por favor, llegar 10 minutos antes.

${fromName}
  `.trim();

  await mailer.sendMail({
    from: `"${fromName}" <${process.env.MAIL_USER}>`,
    to: paciente.email,
    subject: `Confirmación de turno — ${fechaStr} ${turno.horario.horaInicio} hs`,
    text,
    html,
  });
}