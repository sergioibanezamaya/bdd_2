/**
 * =====================================================================
 * config/mailer.js — Configuración del transportador Nodemailer
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Si MAIL_USER y MAIL_APP_PASSWORD están configurados, exporta un
 * transportador Gmail SMTP funcional. Si no, exporta un objeto
 * `mailerStatus.enabled = false` para que los servicios detecten
 * el modo degradado y NO fallen.
 * =====================================================================
 */

import nodemailer from 'nodemailer';

const user = process.env.MAIL_USER;
const pass = process.env.MAIL_APP_PASSWORD;
const enabled = Boolean(user && pass && pass !== 'xxxx xxxx xxxx xxxx');

let mailer = null;

if (enabled) {
  mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  console.log('📧 Mailer configurado para:', user);
} else {
  console.warn(
    '⚠️  Mailer NO configurado. Configurar MAIL_USER y MAIL_APP_PASSWORD en .env para habilitar el envío de emails.'
  );
}

export { mailer };

export const mailerStatus = {
  enabled,
  user: enabled ? user : null,
};