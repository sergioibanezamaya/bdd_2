/**
 * =====================================================================
 * routes/google.routes.js — Endpoints OAuth2 de Google Calendar
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 *   GET /api/google/init            → genera auth URL y redirige
 *   GET /api/google/oauth2callback  → recibe ?code= y guarda refresh_token
 *   GET /api/google/status          → estado actual de la integración
 * =====================================================================
 */

import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { generateAuthUrl, exchangeCodeForTokens, authStatus } from '../config/googleCalendar.js';

const router = Router();

/**
 * GET /api/google/init
 * Redirige al usuario a Google para autorizar el acceso al calendario.
 */
router.get('/init', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID && !authStatus.hasCredentialsFile) {
    return res.status(400).json({
      ok: false,
      error: 'No hay credenciales configuradas. Colocar credentials.json o completar GOOGLE_CLIENT_ID/SECRET en .env',
    });
  }
  const url = generateAuthUrl();
  res.redirect(url);
});

/**
 * GET /api/google/oauth2callback
 * Google redirige aquí tras la autorización. Intercambia el code por tokens.
 */
router.get('/oauth2callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ ok: false, error: 'Falta el parámetro `code`' });

    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      return res.status(400).json({
        ok: false,
        error: 'No se obtuvo refresh_token. Revocar permisos previos en https://myaccount.google.com/permissions y volver a autorizar.',
      });
    }

    // Persistir refresh_token en el .env (mejor esfuerzo)
    persistRefreshToken(tokens.refresh_token);

    res.json({
      ok: true,
      message: 'Autorización exitosa. refresh_token guardado en .env.',
      data: { hasRefreshToken: true },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/google/status
 * Devuelve el estado de la integración para mostrar en el frontend.
 */
router.get('/status', (_req, res) => {
  res.json({ ok: true, data: authStatus });
});

/**
 * Persiste el refresh_token en el archivo .env del backend.
 * Reemplaza la línea `GOOGLE_REFRESH_TOKEN=` por el valor real.
 */
function persistRefreshToken(token) {
  try {
    const envPath = path.resolve('.env');
    if (!fs.existsSync(envPath)) {
      console.warn('⚠️  No existe .env, no se pudo persistir GOOGLE_REFRESH_TOKEN');
      return;
    }
    let content = fs.readFileSync(envPath, 'utf-8');
    const line = `GOOGLE_REFRESH_TOKEN=${token}`;
    if (/^GOOGLE_REFRESH_TOKEN=.*$/m.test(content)) {
      content = content.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, line);
    } else {
      content += `\n${line}\n`;
    }
    fs.writeFileSync(envPath, content, 'utf-8');
    console.log('✅ GOOGLE_REFRESH_TOKEN persistido en .env');
  } catch (e) {
    console.warn('⚠️  No se pudo persistir GOOGLE_REFRESH_TOKEN:', e.message);
  }
}

export default router;