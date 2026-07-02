# Guía de instalación — Sistema de Turnos Odontológicos (TP Base de Datos II)

**Para:** Windows 10/11, PC nueva sin nada instalado.
**Tiempo estimado:** 20–30 minutos (la mayoría, descargas).

---

## 1. Instalar Visual Studio Code

1. Ir a https://code.visualstudio.com/download
2. Click en **"Windows User Installer — x64"** (o el de ARM si tu PC es ARM).
3. Ejecutar el `.exe` descargado.
4. En el wizard, dejar todo por defecto **y tildar**:
   - ✅ "Add to PATH"
   - ✅ "Add 'Open with Code' action to Windows Explorer file context menu"
   - ✅ "Add 'Open with Code' action to Windows Explorer directory context menu"
5. Finalizar.

**Extensiones recomendadas** (abrir VS Code → ícono de cuadrado de la barra izquierda → "Extensions" o `Ctrl+Shift+X`, buscar e instalar):

- **ES7+ React/Redux/React-Native snippets** (dsznajder) — autocompletado React.
- **ESLint** (Microsoft) — detector de errores JS/React.
- **Prettier** (Prettier) — formateador de código.
- **MongoDB for VS Code** (MongoDB) — para explorar la base desde el editor.
- *(Opcional)* **Spanish Language Pack** para VS Code en español.

---

## 2. Instalar Node.js (incluye npm)

1. Ir a https://nodejs.org/en/download
2. Bajar el instalador **Windows Installer (.msi) — 64-bit** de la versión **LTS** (20.x o superior).
3. Ejecutar el `.msi` → todo por defecto → Finish.
4. **Verificar** abriendo una terminal nueva (PowerShell o cmd):

   ```powershell
   node --version
   npm --version
   ```

   Deben mostrar v20.x o superior y 10.x o superior. Si dice "no se reconoce", cerrar y reabrir la terminal.

---

## 3. Instalar Git (recomendado, para clonar el repo)

1. Ir a https://git-scm.com/download/win
2. La descarga empieza sola. Si no, click en "Click here to download".
3. Ejecutar el instalador → todo por defecto (deja "Git from the command line and also from 3rd-party software").
4. **Verificar**:

   ```powershell
   git --version
   ```

> **Si NO querés usar Git**, podés saltearte este paso y copiar la carpeta del proyecto a la PC por pendrive / Drive / zip. En ese caso, saltá al paso 4 y volvé a este paso 3 más adelante si decidís versionar.

---

## 4. Instalar MongoDB (la base de datos)

### 4.1. Instalar MongoDB Community Server

1. Ir a https://www.mongodb.com/try/download/community
2. Versión: la **más reciente** (8.x).
3. Plataforma: **Windows x64**.
4. Paquete: **msi**.
5. Click **Download** (te pide completar un formulario; se puede rellenar con cualquier dato o saltar con "I'll fill it out later").
6. Ejecutar el `.msi`:
   - Setup type: **Complete**.
   - **Importante:** tildar **"Install MongoDB as a Service"** (lo levanta solo al iniciar Windows).
   - Dejar "Run service as Network Service User".
   - Tildar **"Install MongoDB Compass"** (es la GUI oficial, muy útil para ver los datos).
7. Finalizar.

### 4.2. Verificar que quedó corriendo

Abrir PowerShell y correr:

```powershell
# Verifica que el servicio está activo
Get-Service -Name MongoDB

# Estado esperado: Running
```

Si dice **Stopped**, arrancarlo con:

```powershell
Start-Service MongoDB
```

### 4.3. Verificar la conexión

```powershell
# Si instalaste Compass, abrilo y conectá a:
#   mongodb://127.0.0.1:27017
# Si conecta, todo bien.

# O por línea de comando (si instalaste mongosh):
mongosh --eval "db.runCommand({ ping: 1 })"
```

> **Si no querés instalar MongoDB local**, podés usar **MongoDB Atlas** (gratis, en la nube). En ese caso, en el archivo `backend/.env` cambiá `MONGODB_URI` por la connection string que te da Atlas. La guía en `README.md` asume local.

---

## 5. Bajar el proyecto

### Opción A — Clonar con Git (si lo instalaste en el paso 3)

```powershell
cd C:\Users\sergi\Documents
git clone <URL_DEL_REPO> turnos-odontologia
cd turnos-odontologia
```

### Opción B — Copiar la carpeta a mano (sin Git)

1. Copiá la carpeta `turnos-odontologia` (la que tiene `backend/`, `frontend/`, `docs/`, `README.md`) a `C:\Users\sergi\Documents\turnos-odontologia`.
2. En PowerShell:

   ```powershell
   cd C:\Users\sergi\Documents\turnos-odontologia
   ```

> ⚠️ **No copies la carpeta `node_modules`** ni `dist` ni `.env` con tus credenciales reales. El archivo `backend/.env` que ya está es un placeholder; si la PC destino va a usar credenciales distintas, editalo.

---

## 6. Instalar dependencias del proyecto

Abrí PowerShell como **usuario normal** (no necesita admin) en la carpeta del proyecto:

```powershell
cd C:\Users\sergi\Documents\turnos-odontologia\backend
npm install

cd ..\frontend
npm install
```

**Qué se baja (totales aproximados, podés verlos en los `package.json`):**

### Backend (7 dependencias de producción + 2 de desarrollo)

| Dependencia | Versión | Para qué sirve |
|---|---|---|
| `express` | ^4.21.2 | Framework HTTP del backend. |
| `mongoose` | ^8.9.5 | ODM para hablar con MongoDB. |
| `cors` | ^2.8.5 | Permite que el frontend (otro puerto) consuma la API. |
| `dotenv` | ^16.4.5 | Carga variables desde `backend/.env`. |
| `express-validator` | ^7.2.0 | Valida `req.body`, `req.params`, `req.query`. |
| `googleapis` | ^144.0.0 | Cliente de Google Calendar (OAuth2). |
| `nodemailer` | ^6.9.16 | Cliente SMTP para enviar emails con Gmail. |
| `nodemon` *(dev)* | ^3.1.9 | Reinicia el server cuando cambiás un archivo. |
| `mongodb-memory-server` *(dev)* | ^11.2.0 | MongoDB en memoria, solo para el smoke test. |

### Frontend (3 dependencias de producción + 2 de desarrollo)

| Dependencia | Versión | Para qué sirve |
|---|---|---|
| `react` | ^18.3.1 | Librería de UI. |
| `react-dom` | ^18.3.1 | Renderizado de React en el navegador. |
| `react-router-dom` | ^6.28.0 | Ruteo del lado del cliente (`/pacientes`, `/portal`, etc.). |
| `vite` *(dev)* | ^5.4.11 | Dev server + bundler. |
| `@vitejs/plugin-react` *(dev)* | ^4.3.4 | Habilita JSX dentro de Vite. |

> **Total: 9 paquetes en backend + 5 en frontend = 14 dependencias.** Pero `npm install` baja además todas las sub-dependencias transitivas (puede ser ~300–500 paquetes en total). Es normal que tarde 1–3 minutos.

---

## 7. Configurar el backend

### 7.1. Crear/editar el archivo `backend/.env`

Si la PC destino no tiene el archivo, hay que crearlo. Abrí VS Code en la carpeta del proyecto:

```powershell
code C:\Users\sergi\Documents\turnos-odontologia
```

En VS Code: click derecho sobre la carpeta `backend` → "New File" → `backend/.env` (ojo, tiene que empezar con punto).

Pegá este contenido (ajustá lo que necesites):

```env
# Puerto del servidor (default 3000)
PORT=3000

# Conexión a MongoDB local
MONGODB_URI=mongodb://127.0.0.1:27017/turnos_odontologia

# CORS: con el portal embebido, alcanza con un solo origen.
# Si en el futuro agregás otros frontends, separalos con coma.
CLIENT_ORIGIN=http://localhost:5173

# --- Gmail (opcional, modo degradado si falta) ---
MAIL_USER=
MAIL_APP_PASSWORD=
CONSULTORIO_DIRECCION=Av. Siempre Viva 742

# --- Google Calendar (opcional, modo degradado si falta) ---
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth2callback
GOOGLE_REFRESH_TOKEN=
GOOGLE_CREDENTIALS_PATH=./credentials.json
```

> Si no vas a usar Gmail ni Google Calendar, **dejá las variables vacías** y el sistema funciona igual: omite el envío de email / creación de evento y devuelve un `warning` en la respuesta. Ver `README.md` sección "Modo degradado".

### 7.2. (Opcional) Configurar Gmail

Solo si querés que el sistema envíe emails reales al confirmar un turno. Pasos en `README.md` sección "Configurar Gmail".

### 7.3. (Opcional) Configurar Google Calendar

Solo si querés que cree eventos reales en Calendar. Pasos en `README.md` sección "Configurar Google Calendar".

---

## 8. Cargar datos iniciales (seed)

En la terminal:

```powershell
cd C:\Users\sergi\Documents\turnos-odontologia\backend
npm run seed
```

Carga 6 tratamientos (Limpieza, Conducto, Extracción, Ortodoncia, Consulta general, Blanqueamiento). Es **idempotente**: si los corrés de nuevo, no duplica.

---

## 9. Levantar el sistema

Necesitás **2 terminales** en VS Code (o PowerShell):

**Terminal 1 — Backend:**

```powershell
cd C:\Users\sergi\Documents\turnos-odontologia\backend
npm run dev
```

→ Arranca en `http://localhost:3000`.

Verificación rápida: en otra terminal,

```powershell
curl http://localhost:3000/api/health
```

Debe devolver `{"ok":true,...}`. (Si no tenés `curl`, abrí esa URL en el navegador.)

**Terminal 2 — Frontend:**

```powershell
cd C:\Users\sergi\Documents\turnos-odontologia\frontend
npm run dev
```

→ Arranca en `http://localhost:5173`.

Al abrir `http://localhost:5173`, redirige a `/pacientes`. La navbar superior tiene el link **"Portal Paciente"** que lleva a `/portal`.

---

## 10. Probar que todo funciona (smoke test)

Seguí los pasos de la sección **"🧪 Smoke test end-to-end"** del `README.md`. Resumen rápido:

1. `/pacientes` → "+ Nuevo paciente" → guardar.
2. `/turnos` → "Nuevo turno" → elegir fecha futura + tratamiento + slot libre → guardar.
3. Click "Confirmar pago" sobre el turno nuevo.
4. Click "Portal Paciente" en la navbar → `/portal` → poner DNI del paciente recién creado → ver el turno en `/mi-turno`.

Si todo eso anda, **el sistema está funcionando**.

---

## Resumen de herramientas y comandos (cheatsheet)

| Paso | Qué | Comando / link |
|---|---|---|
| 1 | VS Code | https://code.visualstudio.com/download |
| 2 | Node.js (LTS) | https://nodejs.org/en/download |
| 3 | Git | https://git-scm.com/download/win |
| 4 | MongoDB Community | https://www.mongodb.com/try/download/community |
| 5a | Clonar repo | `git clone <URL> turnos-odontologia` |
| 5b | (Alternativa) Copiar carpeta | Copiar `turnos-odontologia/` a `C:\Users\sergi\Documents\` |
| 6a | Deps backend | `cd backend && npm install` |
| 6b | Deps frontend | `cd frontend && npm install` |
| 7 | Configurar `.env` | Crear/editar `backend/.env` |
| 8 | Seed inicial | `cd backend && npm run seed` |
| 9a | Levantar backend | `cd backend && npm run dev` |
| 9b | Levantar frontend | `cd frontend && npm run dev` |

---

## Troubleshooting rápido

| Problema | Solución |
|---|---|
| `node` no se reconoce | Reiniciar la terminal. Si sigue, reinstalar Node marcando "Add to PATH". |
| `npm install` falla con permisos | No usar PowerShell como administrador; usar usuario normal. |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB no está corriendo. `Start-Service MongoDB` en PowerShell admin. |
| Frontend no carga datos | Verificar que el backend esté en :3000 y que Vite haga proxy. |
| `MONGODB_URI no está definida` | Falta el archivo `backend/.env` o está mal formado. |
| Email no llega (warning) | Normal en modo degradado. Configurar Gmail en `.env` para activarlo. |
| Calendar no crea evento (warning) | Normal en modo degradado. Configurar Google en `.env` para activarlo. |

---

## Comandos opcionales

**Detener los servers:** `Ctrl+C` en cada terminal.

**Limpiar e instalar todo de cero:**

```powershell
cd C:\Users\sergi\Documents\turnos-odontologia\backend
Remove-Item -Recurse -Force node_modules
npm install

cd ..\frontend
Remove-Item -Recurse -Force node_modules
npm install
```

**Build de producción del frontend:**

```powershell
cd C:\Users\sergi\Documents\turnos-odontologia\frontend
npm run build
```

Genera la carpeta `frontend/dist/` lista para subir a un hosting estático (Netlify, Vercel, GitHub Pages, etc.).

**Correr el smoke test automatizado (MongoDB en memoria, no necesita Mongo local):**

```powershell
cd C:\Users\sergi\Documents\turnos-odontologia\backend
node tests/smoke-test.js
```
