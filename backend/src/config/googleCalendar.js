/**
 * =====================================================================
 * config/googleCalendar.js — Cliente OAuth2 de Google Calendar
 * =====================================================================
 * Trabajo Práctico — Base de Datos II
 *
 * Inicializa un cliente OAuth2 con refresh token persistente.
 * Si no hay credenciales, exporta `authStatus.enabled = false`
 * y los servicios usan el modo degradado.
 *
 * Flujo OAuth (primera vez):
 *   1) GET  /api/google/init           → redirige a Google
 *   2) Usuario autoriza
 *   3) GET  /api/google/oauth2callback → intercambia code por tokens,
 *                                       persiste refresh_token en .env
 * =====================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';

// Detectar modo degradado:
// - Si GOOGLE_REFRESH_TOKEN está definido → modo activo (ya autorizado)
// - Si no, intentar leer credentials.json (modo setup pendiente)
let enabled = Boolean(CLIENT_ID && CLIENT_SECRET && REDIRECT_URI && REFRESH_TOKEN);
let credentialsFileExists = false;

try {
  const resolved = path.resolve(CREDENTIALS_PATH);
  if (fs.existsSync(resolved)) {
    credentialsFileExists = true;
  }
} catch {
  // ignore
}

if (!enabled && !credentialsFileExists) {
  console.warn(
    '⚠️  Google Calendar NO configurado. Colocar credentials.json y completar GOOGLE_* en .env para habilitarlo.'
  );
} else if (!enabled && credentialsFileExists) {
  console.warn(
    '⚠️  credentials.json detectado pero falta completar el flujo OAuth. Visitar GET /api/google/init para autorizar.'
  );
}

// =====================================================================
// Cliente OAuth2 (lazy)
// =====================================================================
let _oauth2Client = null;
function getOAuth2Client() {
  if (_oauth2Client) return _oauth2Client;

  // Si hay credentials.json, leerlo (formato OAuth client secrets)
  let clientConfig = null;
  if (credentialsFileExists) {
    try {
      const raw = fs.readFileSync(path.resolve(CREDENTIALS_PATH), 'utf-8');
      const parsed = JSON.parse(raw);
      // El archivo puede tener {web:{...}} o {installed:{...}}
      clientConfig = parsed.installed || parsed.web || parsed;
    } catch (e) {
      console.warn('⚠️  No se pudo leer credentials.json:', e.message);
    }
  }

  _oauth2Client = new google.auth.OAuth2(
    clientConfig?.client_id || CLIENT_ID,
    clientConfig?.client_secret || CLIENT_SECRET,
    REDIRECT_URI
  );

  if (REFRESH_TOKEN) {
    _oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  }

  return _oauth2Client;
}

/**
 * Devuelve un cliente Calendar autenticado.
 * Si no está configurado, devuelve null.
 */
export function getCalendarClient() {
  if (!enabled) return null;
  return google.calendar({ version: 'v3', auth: getOAuth2Client() });
}

/**
 * Genera la URL de autorización OAuth (para el endpoint /init).
 */
export function generateAuthUrl() {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // fuerza a devolver refresh_token
    scope: ['https://www.googleapis.com/auth/calendar.events'],
  });
}

/**
 * Intercambia el `code` de OAuth por tokens y guarda el refresh_token en .env.
 */
export async function exchangeCodeForTokens(code) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  return tokens;
}

export const authStatus = {
  enabled,
  hasCredentialsFile: credentialsFileExists,
  hasRefreshToken: Boolean(REFRESH_TOKEN),
};

export const calendar = {
  events: {
    insert: async ({ calendarId, resource }) => {
      const c = getCalendarClient();
      if (!c) throw new Error('Calendar no habilitado');
      return c.events.insert({ calendarId, requestBody: resource, sendUpdates: 'none' });
    },
    delete: async ({ calendarId, eventId }) => {
      const c = getCalendarClient();
      if (!c) throw new Error('Calendar no habilitado');
      return c.events.delete({ calendarId, eventId });
    },
  },
};