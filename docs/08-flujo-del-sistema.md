# 08 — Flujo Completo del Sistema

**Trabajo Práctico — Base de Datos II**
**Sistema de Gestión de Turnos Odontológicos**

Este documento describe el flujo end-to-end del sistema, desde el alta del paciente hasta la atención y registro clínico.

---

## Flujo general (alto nivel)

```
┌────────────────┐
│ Recepción /    │
│ Odontólogo     │
└────────┬───────┘
         │
         ▼
   ┌─────────────┐
   │  Alta de    │──► (1) POST /api/pacientes
   │  Paciente   │    └─► Backend: valida, busca duplicado
   │             │    └─► Mongo: inserta en `pacientes`
   └─────────────┘    └─► Frontend: muestra el paciente

   ┌─────────────┐
   │ Alta de     │──► (2) POST /api/tratamientos
   │ Tratamiento │    └─► Mongo: inserta en `tratamientos`
   └─────────────┘    └─► (Alternativa: seed inicial con 6 tratamientos)

   ┌─────────────┐
   │ Solicitud   │──► (3) GET /api/disponibilidad?fecha=X&tratamientoId=Y
   │ de turno    │    └─► Backend: algoritmo de slots libres
   │             │    └─► Devuelve ["09:00","09:30","10:00",...]
   └─────────────┘

   ┌─────────────┐
   │ Crear       │──► (4) POST /api/turnos
   │ Turno       │    └─► Backend: valida no-solapamiento
   │ (Pendiente) │    └─► Mongo: inserta turno con estado Pendiente
   └─────────────┘

   ┌─────────────┐
   │ Confirmar   │──► (5) PATCH /api/turnos/:id/confirmar-pago   ← FLUJO CRÍTICO
   │ pago        │    └─► Backend + Mongo + Calendar + Email (ver detalle abajo)
   │ (Confirmado)│
   └─────────────┘

   ┌─────────────┐
   │ Atención    │──► (6) PATCH /api/turnos/:id/atender (opcional vía consulta)
   │ al paciente │    └─► También se crea una consulta POST /api/consultas
   │ (Atendido)  │    └─► Esa acción cambia el turno a Atendido automáticamente
   └─────────────┘

   ┌─────────────┐
   │ Cancelación │──► (7) PATCH /api/turnos/:id/cancelar
   │ (si ocurre) │    └─► Backend: cambia estado + elimina evento Calendar
   │ (Cancelado) │    └─► Mongo: marca observaciones con motivo
   └─────────────┘
```

---

## Flujo crítico: `confirmar-pago`

Es el flujo más importante del TP. Integra 4 sistemas: **MongoDB + Google Calendar + Email + Frontend**.

### Diagrama de secuencia

```
Cliente                Backend              MongoDB          Google Calendar       Nodemailer
  │                       │                    │                    │                   │
  │ PATCH /turnos/:id/    │                    │                    │                   │
  │   confirmar-pago      │                    │                    │                   │
  ├──────────────────────►│                    │                    │                   │
  │                       │ findById(id)       │                    │                   │
  │                       ├───────────────────►│                    │                   │
  │                       │◄───────────────────┤                    │                   │
  │                       │ turno existente    │                    │                   │
  │                       │                    │                    │                   │
  │                       │ save() estado=     │                    │                   │
  │                       │  Confirmado        │                    │                   │
  │                       ├───────────────────►│                    │                   │
  │                       │◄───────────────────┤                    │                   │
  │                       │                    │                    │                   │
  │                       │ events.insert({})                      │                   │
  │                       ├────────────────────────────────────────►│                   │
  │                       │◄────────────────────────────────────────┤                   │
  │                       │ eventId = "abc123..."                   │                   │
  │                       │                    │                    │                   │
  │                       │ save() calendarEventId=eventId         │                   │
  │                       ├───────────────────►│                    │                   │
  │                       │◄───────────────────┤                    │                   │
  │                       │                    │                    │                   │
  │                       │ sendMail({...})                          │                   │
  │                       ├──────────────────────────────────────────────────────────────►
  │                       │◄──────────────────────────────────────────────────────────────┤
  │                       │                    │                    │                   │
  │ 200 { ok:true,        │                    │                    │                   │
  │       data: turno,    │                    │                    │                   │
  │       warnings? }     │                    │                    │                   │
  │◄──────────────────────┤                    │                    │                   │
```

### Manejo de errores

```
¿Google Calendar OK?
├── SÍ  → guardar calendarEventId → enviar email
└── NO  → ROLLBACK estado=Pendiente → 502 { error, code: CALENDAR_FAILED }

¿Email OK?
├── SÍ  → 200 { ok:true, data: turno }
└── NO  → 200 { ok:true, data: turno, warnings:{ email:"..." } }
         (NO se hace rollback del evento Calendar — ya está creado)
```

### Por qué este orden

1. **Mongo primero (rollback posible)**: si falla, solo revertimos en la base.
2. **Calendar segundo (rollback crítico)**: si falla, revertimos Mongo. Es caro revertir Calendar manualmente.
3. **Email tercero (tolerante a fallos)**: si falla, el turno sigue confirmado y el evento sigue en Calendar. Solo se notifica al odontólogo vía `warnings.email`.

---

## Estados del turno

```
   ┌─────────────┐
   │  Pendiente  │ (estado inicial al crear el turno)
   └──────┬──────┘
          │
          ├──► PATCH /confirmar-pago ─► ┌─────────────┐
          │                              │ Confirmado  │
          │                              └──────┬──────┘
          │                                     │
          │                                     ├──► POST /consultas (con turnoId) ─► ┌──────────┐
          │                                     │                                       │ Atendido │
          │                                     │                                       └──────────┘
          │                                     │
          └──► PATCH /cancelar ───────────────► ┌──────────┐
                                                 │ Cancelado│
                                                 └──────────┘

   (Confirmado) ──► PATCH /cancelar ──────────► (Cancelado)
```

---

## Relación Turno ↔ Consulta

- Una **consulta** puede existir **sin turno** asociado (consulta espontánea, urgencia).
- Un **turno atendido** generalmente origina una consulta.
- Al crear una consulta con `turnoId`, el backend automáticamente pasa el turno a `Atendido`.

```
┌─────────────────┐    opcional    ┌─────────────────┐
│      TURNO      │◄───────────────│     CONSULTA     │
│                 │  (turno field) │                 │
│ estado: Atendido│                │ diagnostico     │
└─────────────────┘                │ observaciones   │
                                   │ altaMedica      │
                                   │ requiereOp.     │
                                   └─────────────────┘
```

---

## Anti-solapamiento de turnos

Antes de crear un turno, el controller ejecuta:

```js
const conflicto = await Turno.findOne({
  fecha: nuevaFecha,
  estado: { $in: ["Pendiente", "Confirmado"] },
  'horario.horaInicio': { $lt: horaFinNueva },
  'horario.horaFin':    { $gt: horaInicioNueva },
});
if (conflicto) throw new AppError('SLOT_OCUPADO', 409);
```

**Criterio de solapamiento:** dos intervalos `[a,b)` y `[c,d)` se solapan si `a < d && c < b`. Esto cubre cualquier cruce, incluso parcial.

---

## Deduplicación de pacientes

Antes de insertar, el controller ejecuta:

```js
const existente = await Paciente.findOne({
  $or: [{ dni: body.dni }, { telefono: body.telefono }],
});
if (existente) {
  return res.status(200).json({
    ok: true,
    existed: true,
    data: existente,
    message: 'Paciente ya registrado. Se reutilizó el existente.',
  });
}
```

El índice único en `dni` y `telefono` es **defensa en profundidad**: si dos requests concurrentes pasan el `findOne` y ambos intentan insertar, el segundo falla con `DUPLICATE_KEY` (HTTP 409).

---

## Algoritmo de disponibilidad

```js
1. Validar que la fecha es día laborable (lun-vie). Si no → [].
2. Generar slots base: ["08:00", "08:30", ..., "19:30"].
3. Si la fecha es HOY, descartar slots pasados (< ahora + 30 min).
4. Traer turnos del día con estado Pendiente/Confirmado.
5. Para cada slot base:
   a. Calcular [slotInicio, slotFin = slotInicio + duracionMin].
   b. Si slotFin > 20:00 → descartar.
   c. Si algún turno reservado solapa → descartar.
   d. Si pasa todos los filtros → agregar a libres.
6. Devolver array de slots libres.
```

Duración efectiva = la del Tratamiento si existe, si no 30 min por defecto.

---

## Integraciones externas

### Google Calendar (OAuth2 user flow)

1. **Setup inicial (una sola vez):**
   - Crear proyecto en Google Cloud Console.
   - Habilitar Google Calendar API.
   - Crear credencial OAuth (tipo "Aplicación de escritorio") → `credentials.json`.
   - `GET /api/google/init` → redirige a Google.
   - Usuario autoriza → Google redirige a `/api/google/oauth2callback`.
   - Backend intercambia el `code` por tokens, guarda `refresh_token` en `.env`.

2. **Uso normal:**
   - `PATCH /turnos/:id/confirmar-pago` → crea evento con summary "Turno: paciente — tratamiento", description con datos del paciente, start/end en horario local.
   - `PATCH /turnos/:id/cancelar` → elimina el evento por su `calendarEventId`.

3. **Modo degradado:**
   - Si no hay `credentials.json` o falta `GOOGLE_REFRESH_TOKEN`, `authStatus.enabled = false`.
   - El controller de confirmar-pago captura el error `CALENDAR_DISABLED` y responde con `warning`.
   - El sistema sigue funcionando.

### Nodemailer (Gmail SMTP con App Password)

1. **Setup inicial:**
   - Gmail con verificación en 2 pasos activa.
   - Generar App Password en https://myaccount.google.com/apppasswords.
   - Completar `MAIL_USER` y `MAIL_APP_PASSWORD` en `.env`.

2. **Uso normal:**
   - Al confirmar un turno, se envía email HTML al paciente con:
     - Nombre del paciente
     - Fecha y hora del turno
     - Tratamiento
     - Dirección del consultorio
   - Si el envío falla, el turno queda confirmado (no rollback) y se incluye `warnings.email` en la respuesta.

3. **Modo degradado:**
   - Si falta `MAIL_APP_PASSWORD`, `mailerStatus.enabled = false`.
   - El controller lo captura y responde con warning.