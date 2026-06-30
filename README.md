# Sistema de Gestión de Turnos Odontológicos

**Trabajo Práctico — Base de Datos II**
Stack: React + Vite + Node.js + Express + MongoDB (Mongoose)

Sistema completo para gestionar turnos de un consultorio odontológico con:

- 🦷 Alta y gestión de **pacientes** (sin duplicados por DNI/teléfono).
- 📅 Creación de **turnos** con validación anti-solapamiento.
- ✅ Flujo de **confirmación de pago** que crea evento en **Google Calendar** y envía **email**.
- 📋 **Historial clínico** por paciente (consultas con diagnóstico, tratamiento, alta médica).
- 🦷 Catálogo de **tratamientos** (Limpieza, Conducto, Extracción, etc.).
- 📊 **Agregaciones MongoDB** para reportes (turnos por mes, top tratamientos, obras sociales).

---

## 🚀 Guía de arranque rápido

### Prerrequisitos

- **Node.js 18+** (recomendado 20 LTS).
- **MongoDB 6+** corriendo local en `mongodb://127.0.0.1:27017`.
  - Si no lo tenés, instalalo desde https://www.mongodb.com/try/download/community.
- (Opcional) **Cuenta Gmail** con 2FA activo + App Password, para emails reales.
- (Opcional) **Proyecto Google Cloud** con Calendar API habilitada, para eventos reales en Calendar.

### 1) Clonar o descomprimir

```bash
cd C:\Users\sergi\Documents\turnos-odontologia
```

### 2) Backend

```bash
cd backend
npm install
copy .env.example .env       # editar con tus valores
npm run seed                # carga 6 tratamientos iniciales
npm run dev                 # arranca en http://localhost:3000
```

Verificación: abrir `http://localhost:3000/api/health` → debe devolver `{ ok: true }`.

### 3) Frontend (en otra terminal)

```bash
cd frontend
npm install
npm run dev                 # abre http://localhost:5173
```

Al abrir el navegador, redirige automáticamente a `/pacientes`.

### 4) Portal del Paciente (opcional, en otra terminal)

```bash
cd frontend-paciente
npm install
npm run dev                 # abre http://localhost:5174
```

El portal es una segunda SPA donde los pacientes pueden iniciar sesión con su DNI, auto-registrarse, reservar turnos, ver su estado y cancelar. Detalle completo en [`docs/09-portal-paciente.md`](./docs/09-portal-paciente.md).

---

## ⚙️ Configuración

### Variables de entorno (backend/.env)

| Variable | Descripción | Requerida |
|---|---|---|
| `PORT` | Puerto del servidor (default 3000) | No |
| `MONGODB_URI` | URI de MongoDB | Sí |
| `MAIL_USER` | Email Gmail para Nodemailer | No* |
| `MAIL_APP_PASSWORD` | App Password de Gmail | No* |
| `CONSULTORIO_DIRECCION` | Dirección que aparece en el email | No |
| `GOOGLE_CLIENT_ID` | OAuth client ID | No* |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | No* |
| `GOOGLE_REDIRECT_URI` | Callback URL OAuth | No* |
| `GOOGLE_REFRESH_TOKEN` | Token persistido (se completa tras primer OAuth) | No* |
| `GOOGLE_CREDENTIALS_PATH` | Ruta a credentials.json (default `./credentials.json`) | No* |

*Las variables de Gmail y Google son **opcionales**: si no se configuran, el sistema funciona en **modo degradado** (los turnos se confirman sin Calendar/email y se devuelve un `warning` en la respuesta).

### Multi-origen CORS (panel odontólogo + portal paciente)

A partir del portal del paciente, `CLIENT_ORIGIN` acepta una **lista separada por comas**:

```env
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174
```

El backend parsea esa lista y rechaza cualquier `Origin` que no esté en ella. Si necesitás agregar otro frontend, agregá el origen a la lista.

### Configurar Gmail (opcional)

1. Activá la verificación en 2 pasos en tu cuenta Gmail.
2. Andá a https://myaccount.google.com/apppasswords.
3. Generá una contraseña de aplicación para "Mail".
4. En `.env`:
   ```
   MAIL_USER=tu_cuenta@gmail.com
   MAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### Configurar Google Calendar (opcional)

1. Andá a https://console.cloud.google.com/.
2. Creá un proyecto nuevo "Turnos Odontología".
3. Habilitá **Google Calendar API** (Biblioteca).
4. Pantalla de consentimiento OAuth:
   - Tipo: Externo, modo Testing.
   - Agregá tu email como test user.
   - Scope: `https://www.googleapis.com/auth/calendar.events`.
5. Credenciales → Crear → ID de cliente OAuth → **Aplicación de escritorio**.
6. Descargá el JSON → renombrá a `credentials.json` → colocá en `/backend/`.
7. (Opcional) Completá `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`.
8. Arrancá el backend y visitá en el navegador:
   ```
   http://localhost:3000/api/google/init
   ```
9. Autorizá → Google redirige al callback → el `refresh_token` se guarda automáticamente en `.env`.
10. **Verificá estado**: `GET /api/google/status` → debe devolver `enabled: true`.

---

## 📁 Estructura del proyecto

```
turnos-odontologia/
├── backend/                       # API REST
│   ├── server.js                  # Punto de entrada
│   ├── src/
│   │   ├── app.js                 # Config Express
│   │   ├── config/                # db, mailer, googleCalendar
│   │   ├── models/                # Mongoose: Paciente, Turno, Tratamiento, Consulta
│   │   ├── controllers/           # Lógica de endpoints
│   │   ├── routes/                # Rutas REST
│   │   ├── services/              # calendarService, emailService, disponibilidad, agregaciones
│   │   ├── validators/            # express-validator
│   │   ├── middlewares/           # errorHandler, validate
│   │   └── utils/                 # slots, time, seed
│   ├── .env.example               # Plantilla de variables
│   └── credentials.json           # (NO subir) OAuth Google
├── frontend/                      # SPA React (panel odontólogo/recepción)
│   ├── src/
│   │   ├── pages/                 # PacientesPage, TurnosPage, AgendaPage, ConsultasPage
│   │   ├── components/            # Formularios, grilla disponibilidad, tarjetas
│   │   ├── hooks/                 # usePacientes, useTurnos, useConsultas, useDisponibilidad
│   │   ├── api/client.js          # Funciones fetch centralizadas
│   │   └── App.jsx                # Layout + Routes
│   ├── vite.config.js             # Proxy /api → backend
│   └── index.html
├── frontend-paciente/             # SPA React (portal del paciente, :5174)
│   ├── src/
│   │   ├── pages/                 # LoginPage, HomePage, ReservarPage, PerfilPage
│   │   ├── components/            # LoginForm, RegistroForm, NuevoTurnoForm, etc.
│   │   ├── hooks/                 # useAuth, useMisTurnos, useDisponibilidad
│   │   └── App.jsx                # Rutas + auth por DNI
│   ├── vite.config.js             # port 5174, proxy /api → backend
│   └── index.html
└── docs/                          # Documentación entregable del TP
    ├── 01-modelo-conceptual.md
    ├── 02-modelo-logico.md
    ├── 03-diagrama-colecciones.md
    ├── 04-modelo-json.md
    ├── 05-crud-endpoints.md
    ├── 06-agregaciones.md
    ├── 07-justificacion-mongodb.md
    ├── 08-flujo-del-sistema.md
    └── 09-portal-paciente.md      # Portal del paciente (NUEVO)
```

---

## 🧪 Smoke test end-to-end

Una vez levantado el sistema:

1. **Pacientes**: ir a `/pacientes` → "+ Nuevo paciente" → completar formulario → guardar.
   - Repetir con el mismo DNI → debe mostrar "ya estaba registrado, se reutilizó".
2. **Tratamientos**: el seed cargó 6 (Limpieza, Conducto, Extracción, Ortodoncia, Consulta general, Blanqueamiento). Verificar en `/turnos` → "Nuevo turno" → dropdown de tratamientos.
3. **Disponibilidad**: en `/turnos` → "Nuevo turno" → seleccionar fecha futura y tratamiento → debe mostrar grilla con horarios disponibles.
4. **Crear turno**: elegir slot → "Crear turno". Aparece en lista con badge **Pendiente**.
5. **Confirmar pago**: en la tarjeta del turno, click "Confirmar pago" → confirmar.
   - Si Calendar y email están configurados: estado cambia a **Confirmado**, badge muestra 📅 Calendar, email enviado.
   - Si están en modo degradado: estado cambia a **Confirmado** con warning ⚠️ "Sin evento en Calendar".
6. **Cancelar**: cualquier turno → "Cancelar" → estado cambia a **Cancelado**. Si tenía `calendarEventId`, se eliminó de Calendar.
7. **Consulta**: ir a `/consultas` → seleccionar paciente → "+ Nueva consulta" → completar → guardar. El historial aparece ordenado por fecha.
8. **Agenda**: ir a `/agenda` → seleccionar día → ver turnos del día + panel con agregaciones.

### Portal del Paciente (frontend-paciente en :5174)

9. Abrir `http://localhost:5174` → pantalla de login con DNI.
10. Poner DNI "99999999" (o cualquier DNI no registrado) → completar el formulario de auto-registro → crear cuenta. El portal redirige a `/home`.
11. Click "Sacar turno nuevo" → elegir tratamiento + fecha de mañana + slot libre → confirmar. El turno aparece en `/home` con badge **Pendiente**.
12. Click "Cancelar turno" sobre el turno nuevo → confirmar en el modal → badge cambia a **Cancelado**.

### Confirmación cruzada (odontólogo ↔ paciente)

13. Abrir el panel odontólogo en `http://localhost:5173` (otra pestaña).
14. Ir a `/turnos` → localizar el turno recién reservado desde el portal → click "Confirmar pago".
15. Volver al portal :5174 → refrescar `/home` → el turno ahora aparece como **Confirmado**. Si Gmail y Calendar están configurados, el paciente también recibió el email.

---

## 📊 Endpoints principales

Base URL: `http://localhost:3000/api`

| Recurso | Rutas |
|---|---|
| Health | `GET /health` |
| Pacientes | `GET/POST/PUT/DELETE /pacientes` |
| Tratamientos | `GET/POST/PUT /tratamientos` |
| Disponibilidad | `GET /disponibilidad?fecha=YYYY-MM-DD&tratamientoId=...` |
| Turnos | `GET/POST/DELETE /turnos`, `PATCH /turnos/:id/{confirmar-pago,cancelar,atender}` |
| Consultas | `GET/POST/PUT/DELETE /consultas` |
| Google OAuth | `GET /google/init`, `GET /google/oauth2callback`, `GET /google/status` |
| Agregaciones | `GET /agregaciones/{turnos-por-mes,tratamientos-mas-frecuentes,pacientes-por-obra-social,tasa-confirmacion}` |
| Portal del paciente | `POST /portal/login`, `POST /portal/registro`, `GET /portal/mis-turnos?dni=...` |

Detalle completo de cada uno (body, response, errores) en [`docs/05-crud-endpoints.md`](./docs/05-crud-endpoints.md).

---

## 🛠️ Comandos útiles

### Backend
```bash
npm install            # instalar dependencias
npm run seed           # cargar tratamientos iniciales (idempotente)
npm run dev            # arrancar con nodemon (auto-reload)
npm start              # arrancar en modo producción
```

### Frontend
```bash
npm install            # instalar dependencias
npm run dev            # servidor de desarrollo (http://localhost:5173)
npm run build          # bundle para producción (./dist)
npm run preview        # previsualizar el build
```

---

## 📚 Documentación

Los 9 documentos del TP están en [`/docs`](./docs):

1. [Modelo conceptual](./docs/01-modelo-conceptual.md) — entidades, atributos, cardinalidades.
2. [Modelo lógico](./docs/02-modelo-logico.md) — tablas equivalentes en SQL + mapeo a MongoDB.
3. [Diagrama de colecciones](./docs/03-diagrama-colecciones.md) — diagrama ER en Mermaid + textual.
4. [Modelo JSON](./docs/04-modelo-json.md) — documentos reales por colección.
5. [CRUD endpoints](./docs/05-crud-endpoints.md) — todos los endpoints REST.
6. [Agregaciones](./docs/06-agregaciones.md) — los 4 pipelines explicados.
7. [Justificación MongoDB](./docs/07-justificacion-mongodb.md) — por qué NoSQL para este TP.
8. [Flujo del sistema](./docs/08-flujo-del-sistema.md) — diagrama de secuencia del confirmar-pago.
9. [Portal del Paciente](./docs/09-portal-paciente.md) — segunda SPA, auth por DNI, flujos E2E.

---

## 🔐 Notas de seguridad

Para este TP **no se implementa autenticación** (es un requisito explícito: mantener el alcance como TP universitario). Sin embargo:

- `.env` y `credentials.json` están en `.gitignore` — **NUNCA subir credenciales reales al repositorio**.
- `GOOGLE_REFRESH_TOKEN` da acceso al calendario del usuario; tratalo como una contraseña.
- Si exponés el backend públicamente, agregá autenticación y rate limiting antes de hacerlo.

### ⚠️ Seguridad del Portal del Paciente

El portal (`frontend-paciente/`) usa **DNI como única credencial**, sin contraseña. Esto significa que:

- Cualquier persona que conozca el DNI de un paciente puede ver sus turnos y cancelar.
- La sesión persiste en `localStorage` del navegador.
- **No es seguro para producción** — es una decisión consciente para mantener el alcance del TP.

Si el profesor pide endurecer: agregar `bcrypt` para PIN de 4 dígitos + JWT + middleware `requireAuth` en backend. Ver [`docs/09-portal-paciente.md`](./docs/09-portal-paciente.md#7-limitaciones-conocidas) para el detalle.

---

## 🐛 Troubleshooting

| Problema | Solución |
|---|---|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB no está corriendo. Iniciá el servicio con `mongod` o desde el panel de servicios. |
| `MONGODB_URI no está definida` | Copiá `.env.example` a `.env` y completá la URI. |
| `Calendar no configurado` (warning al confirmar) | Normal en modo degradado. Para activarlo, seguí los pasos de configuración de Google arriba. |
| `Email no enviado` (warning al confirmar) | Verificá `MAIL_USER` y `MAIL_APP_PASSWORD` en `.env` y que la cuenta tenga 2FA. |
| `SLOT_OCUPADO` | El horario ya está reservado. Elegí otro slot. |
| Frontend no carga | Verificá que el backend esté corriendo en :3000 y que Vite use el proxy correctamente. |

---

## 📝 Licencia

Trabajo Práctico universitario — uso educativo.