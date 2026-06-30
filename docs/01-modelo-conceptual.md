# 01 — Modelo Conceptual

**Trabajo Práctico — Base de Datos II**
**Sistema de Gestión de Turnos Odontológicos**

---

## Diagrama Entidad-Relación

```
┌──────────────────────┐                ┌──────────────────────┐
│      PACIENTE        │                │      TRATAMIENTO     │
│──────────────────────│                │──────────────────────│
│ nombre               │                │ nombre               │
│ apellido             │                │ descripcion          │
│ dni (único)          │                │ duracionMin          │
│ telefono (único)     │                │ precioReferencia     │
│ email                │                │ activo               │
│ fechaNacimiento      │                └──────────────────────┘
│ obraSocial           │                            │
└──────────────────────┘                            │
         │ 1                                        │ 1
         │                                          │
         │ N                                        │ N
         ▼                                          ▼
┌──────────────────────────────────────────────────────────────┐
│                            TURNO                             │
│──────────────────────────────────────────────────────────────│
│ paciente (FK → Paciente)                                     │
│ tratamiento (FK → Tratamiento)                               │
│ odontologo                                                   │
│ fecha                                                        │
│ horario.horaInicio, horario.horaFin                          │
│ duracionMin                                                  │
│ estado (Pendiente / Confirmado / Cancelado / Atendido)        │
│ pagoConfirmado                                               │
│ calendarEventId                                              │
│ observaciones                                                │
└──────────────────────────────────────────────────────────────┘
         │ 1
         │
         │ 0..1
         ▼
┌──────────────────────┐
│      CONSULTA        │
│──────────────────────│
│ paciente (FK → Pac.) │
│ turno (FK → Turno)   │
│ fecha                │
│ diagnostico          │
│ observaciones        │
│ tratamiento (FK)     │
│ requiereOperacion    │
│ altaMedica           │
└──────────────────────┘
```

---

## Entidades y atributos

### PACIENTE
| Atributo | Tipo | Descripción |
|---|---|---|
| `nombre` | string(2-60) | Nombre del paciente |
| `apellido` | string(2-60) | Apellido del paciente |
| `dni` | string(7-8) | DNI, único en el sistema |
| `telefono` | string(8-20) | Teléfono, único en el sistema |
| `email` | string | Email de contacto |
| `fechaNacimiento` | date | Fecha de nacimiento |
| `obraSocial` | string(1-80) | Obra social / cobertura |

### TRATAMIENTO
| Atributo | Tipo | Descripción |
|---|---|---|
| `nombre` | string | "Limpieza", "Conducto", etc. Único |
| `descripcion` | string | Descripción breve |
| `duracionMin` | int | Duración estimada en minutos |
| `precioReferencia` | number | Precio sugerido |
| `activo` | bool | Si está disponible en la agenda |

### TURNO
| Atributo | Tipo | Descripción |
|---|---|---|
| `paciente` | FK | Referencia a Paciente |
| `tratamiento` | FK | Referencia a Tratamiento |
| `odontologo` | string | Nombre del profesional |
| `fecha` | date | Fecha del turno |
| `horario.horaInicio` | string | "HH:MM" |
| `horario.horaFin` | string | "HH:MM" |
| `duracionMin` | int | Duración efectiva |
| `estado` | enum | Pendiente / Confirmado / Cancelado / Atendido |
| `pagoConfirmado` | bool | Bandera auxiliar |
| `calendarEventId` | string | ID de evento en Google Calendar |
| `observaciones` | string | Notas libres |

### CONSULTA (historial clínico)
| Atributo | Tipo | Descripción |
|---|---|---|
| `paciente` | FK | Referencia a Paciente |
| `turno` | FK (opcional) | Turno que originó la consulta |
| `fecha` | date | Fecha de la consulta |
| `diagnostico` | string | Diagnóstico del profesional |
| `observaciones` | string | Notas clínicas |
| `tratamiento` | FK | Tratamiento aplicado |
| `requiereOperacion` | bool | Sí/No |
| `altaMedica` | bool | Sí/No |

---

## Cardinalidades

- **PACIENTE (1) — (N) TURNO**: un paciente puede tener muchos turnos; cada turno pertenece a un único paciente.
- **TRATAMIENTO (1) — (N) TURNO**: un tratamiento se aplica en muchos turnos; cada turno tiene un único tratamiento.
- **PACIENTE (1) — (N) CONSULTA**: un paciente puede tener muchas consultas clínicas; cada consulta pertenece a un único paciente.
- **TURNO (1) — (0..1) CONSULTA**: un turno puede (o no) derivar en una consulta clínica registrada.
- **TRATAMIENTO (1) — (N) CONSULTA**: una consulta registra un tratamiento aplicado.

---

## Reglas de negocio

1. **No duplicar pacientes:** si el DNI o teléfono ya existe, se reutiliza el registro existente.
2. **No solapar turnos:** dos turnos en la misma fecha con horarios que se cruzan no pueden coexistir (uno en estado Pendiente/Confirmado).
3. **Días laborables:** la agenda opera lunes a viernes de 08:00 a 20:00, granularidad 30 min.
4. **Flujo de estados de turno:** `Pendiente → Confirmado → Atendido` (vía consulta) o `Pendiente → Cancelado` o `Confirmado → Cancelado`.
5. **Confirmar pago dispara:** (a) cambio de estado, (b) evento en Google Calendar, (c) email al paciente. Si falla Calendar → rollback; si falla email → warning pero confirma igual.
6. **Cancelar turno elimina:** si existe evento en Calendar, se elimina automáticamente.
