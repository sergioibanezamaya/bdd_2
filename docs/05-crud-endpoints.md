# 05 — CRUD — Endpoints REST

**Trabajo Práctico — Base de Datos II**
**Sistema de Gestión de Turnos Odontológicos**

Base URL: `http://localhost:3000/api`

Formato de respuesta exitoso: `{ "ok": true, "data": ... }`
Formato de error: `{ "ok": false, "error": "mensaje", "code": "CODIGO" }`

---

## Health

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Verifica que el server está vivo |

**Respuesta ejemplo:**
```json
{ "ok": true, "service": "turnos-odontologia", "timestamp": "2026-06-28T14:00:00.000Z" }
```

---

## Pacientes — `/api/pacientes`

| Método | Ruta | Descripción | Body | Respuesta |
|---|---|---|---|---|
| `GET` | `/pacientes` | Listar todos (con `?q=` opcional) | — | `{ data: [pacientes] }` |
| `GET` | `/pacientes/:id` | Obtener uno | — | `{ data: paciente }` |
| `POST` | `/pacientes` | Crear (o devolver existente por DNI/teléfono) | Ver abajo | `{ data: paciente, existed: bool }` |
| `PUT` | `/pacientes/:id` | Editar (DNI no modificable) | Ver abajo | `{ data: paciente }` |
| `DELETE` | `/pacientes/:id` | Borrar (solo si no tiene turnos futuros) | — | `{ data: { deleted: true } }` |

### POST `/pacientes` — Body
```json
{
  "nombre": "María",
  "apellido": "González",
  "dni": "40123456",
  "telefono": "+54 11 5555-1234",
  "email": "maria@example.com",
  "fechaNacimiento": "1990-05-12",
  "obraSocial": "OSDE"
}
```

### Respuestas típicas

- **Creado nuevo**: `201 { ok: true, existed: false, data: {...} }`
- **Reutilizado (deduplicado)**: `200 { ok: true, existed: true, data: {...} }`
- **DNI inválido**: `400 { ok: false, error: "El DNI debe tener 7 u 8 dígitos" }`

---

## Tratamientos — `/api/tratamientos`

| Método | Ruta | Descripción | Body | Respuesta |
|---|---|---|---|---|
| `GET` | `/tratamientos` | Listar activos | — | `{ data: [tratamientos] }` |
| `POST` | `/tratamientos` | Crear | Ver abajo | `201 { data }` |
| `PUT` | `/tratamientos/:id` | Editar | Ver abajo | `{ data }` |

### POST `/tratamientos` — Body
```json
{
  "nombre": "Implante dental",
  "descripcion": "Colocación de implante de titanio",
  "duracionMin": 120,
  "precioReferencia": 80000
}
```

---

## Disponibilidad — `/api/disponibilidad`

| Método | Ruta | Query | Respuesta |
|---|---|---|---|
| `GET` | `/disponibilidad` | `?fecha=YYYY-MM-DD&tratamientoId=...` | `{ data: { slotsLibres: [...], duracionMin, ... } }` |

**Respuesta ejemplo:**
```json
{
  "ok": true,
  "data": {
    "fecha": "2026-07-01",
    "duracionMin": 30,
    "tratamiento": "Limpieza",
    "slotsLibres": ["09:00", "09:30", "10:00", "10:30", "11:00"]
  }
}
```

---

## Turnos — `/api/turnos`

| Método | Ruta | Descripción | Body | Respuesta |
|---|---|---|---|---|
| `GET` | `/turnos` | Listar (filtros: `?estado=&paciente=&desde=&hasta=`) | — | `{ data: [turnos] }` |
| `GET` | `/turnos/:id` | Obtener uno (poblado) | — | `{ data }` |
| `POST` | `/turnos` | Crear (estado Pendiente) | Ver abajo | `201 { data }` |
| `PATCH` | `/turnos/:id/confirmar-pago` | **Flujo crítico** | — | `{ data, warnings? }` |
| `PATCH` | `/turnos/:id/cancelar` | Cancelar (elimina evento Calendar) | `{ motivo? }` | `{ data }` |
| `PATCH` | `/turnos/:id/atender` | Marcar como atendido | — | `{ data }` |
| `DELETE` | `/turnos/:id` | Borrar (solo Pendientes) | — | `{ data: { deleted } }` |

### POST `/turnos` — Body
```json
{
  "pacienteId": "6650a1b2c3d4e5f6a7b8c9d0",
  "tratamientoId": "6650b1c2d3e4f5a6b7c8d9e0",
  "fecha": "2026-07-01",
  "horaInicio": "10:00",
  "observaciones": "Primera consulta"
}
```

### Errores frecuentes

- `409 SLOT_OCUPADO` — el horario se solapa con otro turno.
- `409 INVALID_STATE_TRANSITION` — el turno ya está Confirmado/Cancelado/Atendido.
- `404 PATIENT_NOT_FOUND` / `404 TREATMENT_NOT_FOUND`.

---

## Consultas — `/api/consultas`

| Método | Ruta | Descripción | Body | Respuesta |
|---|---|---|---|---|
| `GET` | `/consultas` | Listar (`?pacienteId=`) | — | `{ data: [consultas] }` |
| `GET` | `/consultas/:id` | Obtener una (poblada) | — | `{ data }` |
| `POST` | `/consultas` | Registrar nueva | Ver abajo | `201 { data }` (turno → Atendido) |
| `PUT` | `/consultas/:id` | Editar | — | `{ data }` |
| `DELETE` | `/consultas/:id` | Borrar | — | `{ data: { deleted } }` |

### POST `/consultas` — Body
```json
{
  "pacienteId": "6650a1b2c3d4e5f6a7b8c9d0",
  "turnoId": "6650c1d2e3f4a5b6c7d8e9f1",
  "diagnostico": "Caries profunda en pieza 36",
  "observaciones": "Se programa seguimiento",
  "tratamientoId": "6650b1c2d3e4f5a6b7c8d9e1",
  "requiereOperacion": false,
  "altaMedica": false
}
```

> **Nota**: si se envía `turnoId`, el turno asociado pasa automáticamente a estado `Atendido`.

---

## Google Calendar — `/api/google`

| Método | Ruta | Descripción | Respuesta |
|---|---|---|---|
| `GET` | `/google/init` | Inicia OAuth2 (redirige a Google) | redirect |
| `GET` | `/google/oauth2callback` | Callback (intercambia code → tokens) | `{ data: { hasRefreshToken } }` |
| `GET` | `/google/status` | Estado actual de la integración | `{ data: { enabled, hasCredentialsFile, hasRefreshToken } }` |

---

## Agregaciones — `/api/agregaciones`

| Método | Ruta | Pipeline |
|---|---|---|
| `GET` | `/agregaciones/turnos-por-mes` | `$match` últimos 12 meses → `$group` por (año, mes) → `$sort` |
| `GET` | `/agregaciones/tratamientos-mas-frecuentes` | `$group` en consultas → `$lookup` con tratamientos → `$limit 10` |
| `GET` | `/agregaciones/pacientes-por-obra-social` | `$group` por `obraSocial` → `$sort` desc |
| `GET` | `/agregaciones/tasa-confirmacion` | `$group` total/confirmados → `$divide` para tasa |

Detalle completo de cada pipeline en [`06-agregaciones.md`](./06-agregaciones.md).

---

## Códigos de error comunes

| HTTP | Código | Significado |
|---|---|---|
| 400 | (validación) | Datos inválidos (express-validator o Mongoose) |
| 400 | `CastError` | ObjectId malformado |
| 404 | `NOT_FOUND` | Recurso no existe |
| 409 | `DUPLICATE_KEY` | Índice único violado |
| 409 | `SLOT_OCUPADO` | El horario ya está reservado |
| 409 | `INVALID_STATE_TRANSITION` | Cambio de estado no permitido |
| 409 | `HAS_FUTURE_TURNOS` | No se puede borrar paciente con turnos futuros |
| 502 | `CALENDAR_FAILED` | Fallo en Google Calendar, turno revertido |
| 500 | `INTERNAL_ERROR` | Error inesperado |
