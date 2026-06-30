# 02 — Modelo Lógico

**Trabajo Práctico — Base de Datos II**
**Sistema de Gestión de Turnos Odontológicos**

---

## Modelo lógico relacional (equivalente)

Para referencia, así se vería en un modelo relacional clásico. Después se mapea al modelo documental de MongoDB.

### PACIENTE
| Columna | Tipo | PK | FK | Constraints |
|---|---|---|---|---|
| `_id` | ObjectId | ✓ | | auto |
| `nombre` | VARCHAR(60) | | | NOT NULL |
| `apellido` | VARCHAR(60) | | | NOT NULL |
| `dni` | VARCHAR(8) | | | NOT NULL, UNIQUE, CHECK (REGEXP `^\d{7,8}$`) |
| `telefono` | VARCHAR(20) | | | NOT NULL, UNIQUE |
| `email` | VARCHAR(120) | | | NOT NULL, CHECK (formato email) |
| `fechaNacimiento` | DATE | | | NOT NULL, CHECK (≤ hoy) |
| `obraSocial` | VARCHAR(80) | | | NOT NULL |
| `createdAt` | TIMESTAMP | | | auto |
| `updatedAt` | TIMESTAMP | | | auto |

Índices: `dni` UNIQUE, `telefono` UNIQUE, `(apellido, nombre)`.

### TRATAMIENTO
| Columna | Tipo | PK | FK | Constraints |
|---|---|---|---|---|
| `_id` | ObjectId | ✓ | | auto |
| `nombre` | VARCHAR(80) | | | NOT NULL, UNIQUE |
| `descripcion` | VARCHAR(300) | | | |
| `duracionMin` | INT | | | NOT NULL, CHECK (15 ≤ x ≤ 480) |
| `precioReferencia` | DECIMAL | | | CHECK (≥ 0) |
| `activo` | BOOLEAN | | | DEFAULT TRUE |

### TURNO
| Columna | Tipo | PK | FK | Constraints |
|---|---|---|---|---|
| `_id` | ObjectId | ✓ | | auto |
| `paciente` | ObjectId | | ✓ → PACIENTE | NOT NULL, INDEX |
| `tratamiento` | ObjectId | | ✓ → TRATAMIENTO | NOT NULL, INDEX |
| `odontologo` | VARCHAR(80) | | | DEFAULT 'Dr. Default' |
| `fecha` | DATE | | | NOT NULL, INDEX |
| `horario.horaInicio` | VARCHAR(5) | | | NOT NULL, CHECK (REGEXP `^\d{2}:\d{2}$`) |
| `horario.horaFin` | VARCHAR(5) | | | NOT NULL |
| `duracionMin` | INT | | | NOT NULL, CHECK (15 ≤ x ≤ 240) |
| `estado` | ENUM | | | NOT NULL, DEFAULT 'Pendiente' ∈ {Pendiente, Confirmado, Cancelado, Atendido} |
| `pagoConfirmado` | BOOLEAN | | | DEFAULT FALSE |
| `calendarEventId` | VARCHAR(255) | | | NULL |
| `observaciones` | VARCHAR(500) | | | NULL |

Índices: `(fecha, horario.horaInicio)`, `(paciente)`, `(estado)`.

### CONSULTA
| Columna | Tipo | PK | FK | Constraints |
|---|---|---|---|---|
| `_id` | ObjectId | ✓ | | auto |
| `paciente` | ObjectId | | ✓ → PACIENTE | NOT NULL, INDEX |
| `turno` | ObjectId | | ✓ → TURNO | NULL (sparse) |
| `fecha` | DATE | | | NOT NULL, DEFAULT NOW |
| `diagnostico` | VARCHAR(500) | | | NOT NULL |
| `observaciones` | VARCHAR(1000) | | | NULL |
| `tratamiento` | ObjectId | | ✓ → TRATAMIENTO | NOT NULL |
| `requiereOperacion` | BOOLEAN | | | NOT NULL |
| `altaMedica` | BOOLEAN | | | NOT NULL |

Índice: `(paciente, fecha DESC)` para historial cronológico.

---

## Mapeo al modelo documental (MongoDB)

MongoDB es una base **documental**. La traducción es directa: cada tabla se convierte en una **colección** de documentos JSON-like (BSON). Las claves foráneas se reemplazan por `ObjectId` referenciando otra colección.

| Tabla SQL | Colección MongoDB |
|---|---|
| `pacientes` | `pacientes` (documentos con `_id` ObjectId) |
| `tratamientos` | `tratamientos` |
| `turnos` | `turnos` (con `paciente` y `tratamiento` como ObjectId) |
| `consultas` | `consultas` (con `paciente`, `turno`, `tratamiento` como ObjectId) |

### Diferencias clave con el modelo relacional

1. **No hay JOIN en la base**: el "join" se hace en la capa de aplicación con `populate` de Mongoose o `$lookup` en agregaciones.
2. **Embed vs Reference**: el horario se **embebe** dentro del turno (`horario: { horaInicio, horaFin }`) porque son datos 1:1 sin uso independiente.
3. **Schemaless parcial**: Mongoose aplica validación pero se pueden agregar campos nuevos sin migración.
4. **Índices equivalentes**: unique, compound, sparse se declaran directamente en el schema.

### Por qué ObjectId y no string

`ObjectId` es el tipo nativo de MongoDB (12 bytes: timestamp + máquina + counter). Es compacto, ordenable por inserción y permite a Mongoose usar `populate()` para resolver referencias con una sola línea.
