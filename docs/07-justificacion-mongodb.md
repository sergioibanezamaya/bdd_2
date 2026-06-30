# 07 — Justificación del uso de MongoDB

**Trabajo Práctico — Base de Datos II**
**Sistema de Gestión de Turnos Odontológicos**

---

## 1) Resumen ejecutivo

MongoDB es la elección correcta para este sistema porque:

- **Modelo documental** encaja naturalmente con la representación JSON que el frontend React necesita.
- **Esquema flexible** permite extender `consultas` (historial clínico) sin migraciones costosas.
- **Aggregation Framework** permite consultas analíticas complejas (`$lookup`, `$group`, `$facet`) en una sola pasada a la base.
- **Escalado horizontal nativo** vía replica sets y sharding (relevante si el consultorio crece a una red de sucursales).
- **ObjectId como clave** evita colisiones y permite referencias livianas entre colecciones.

---

## 2) Comparación con SQL relacional

| Aspecto | MongoDB | SQL relacional |
|---|---|---|
| **Modelo** | Documentos BSON (JSON-like) | Tablas con filas y columnas |
| **Esquema** | Flexible (schemaless, validado por Mongoose) | Rígido (DDL con ALTER costosos) |
| **Relaciones** | Embebidas o por referencia (`ObjectId`) | Foreign keys + JOIN |
| **Joins** | `$lookup` (más limitado pero suficiente) | JOIN (nativo, optimizado) |
| **Agregaciones** | Aggregation Framework (pipeline) | GROUP BY, HAVING, window functions |
| **Tipos** | BSON: ObjectId, Date, Decimal128, GeoJSON, etc. | INTEGER, VARCHAR, DATE, etc. |
| **Escalado** | Horizontal nativo (sharding) | Vertical (más hardware) o sharding manual |
| **Transacciones** | Multi-document ACID desde v4.0 | ACID nativo |
| **Formato API** | BSON ≈ JSON (cero transformación) | Filas → JSON manual |
| **Curva de aprendizaje** | Media (Mongoose abstrae mucho) | Baja si se conoce SQL estándar |

---

## 3) Beneficios concretos para este TP

### 3.1 Esquema flexible para historial clínico

Las consultas clínicas tienen campos que pueden variar (alergias, medicación, próxima cita). En SQL esto requiere `ALTER TABLE` o tablas EAV. En MongoDB, agregar un campo es tan simple como incluirlo en el documento — sin migrar nada.

```json
{
  "_id": "...",
  "paciente": "...",
  "diagnostico": "Caries",
  "tratamiento": "...",
  // Campos opcionales o futuros sin migración:
  "alergias": ["penicilina"],
  "proximaCita": "2026-08-15"
}
```

### 3.2 Aggregation Framework

El sistema implementa **4 pipelines** que serían muy verbosas en SQL (con subqueries, JOINs y window functions). En MongoDB son declarativas y leíbles:

```js
// Top tratamientos con JOIN a la colección tratamientos
[
  { $group: { _id: "$tratamiento", cantidad: { $sum: 1 } } },
  { $sort: { cantidad: -1 } },
  { $limit: 10 },
  { $lookup: { from: "tratamientos", localField: "_id", foreignField: "_id", as: "info" } },
  { $unwind: "$info" }
]
```

### 3.3 Integración natural con React

El backend devuelve JSON que el frontend consume sin transformación. Mongoose agrega `populate()` que reemplaza ObjectIds por documentos enteros automáticamente, evitando mapeos manuales.

### 3.4 Escalabilidad futura

Si el consultorio pasa de 1 a 10 sucursales con millones de turnos, MongoDB escala horizontalmente (sharding por `fecha` o por `paciente`). Una migración SQL a Postgres en ese escenario sería costosa.

### 3.5 Atomicidad de operaciones críticas

El flujo `confirmar-pago` modifica múltiples campos del turno y dispara efectos externos. Si bien MongoDB históricamente no era ACID multi-documento, **desde v4.0 soporta transacciones**. Para este TP no se usan transacciones explícitas (cada operación es atómica per-document), pero la capacidad existe si el sistema crece.

---

## 4) ¿Cuándo NO elegir MongoDB?

Por honestidad académica, MongoDB no siempre es la mejor opción:

- **Sistemas con mucha integridad referencial** (banca, contabilidad) → SQL con FK constraints es más estricto y validable por la base.
- **Reportes SQL complejos** (data warehouse) → Postgres + herramientas SQL especializadas.
- **Equipos sin experiencia NoSQL** → SQL es más universal.

Para este TP (turnos, consultas, integración con Calendar/email), los beneficios pesan más que las limitaciones.

---

## 5) Decisiones de modelado específicas

### 5.1 Embed vs Reference

| Caso | Decisión | Justificación |
|---|---|---|
| `turno.horario` (horaInicio, horaFin) | **Embed** | Datos 1:1 sin vida propia |
| `turno.paciente` | **Reference** | Paciente se consulta/edita independientemente |
| `turno.tratamiento` | **Reference** | Mismo motivo; permite ver precio/duración actualizados |
| `consulta.turno` | **Reference (sparse)** | Una consulta puede existir sin turno |
| `consulta.paciente` | **Reference** | Historial es una vista del paciente |
| `turno.calendarEventId` | **Embed** | String auxiliar, sin sentido fuera del turno |

### 5.2 Índices creados

- **Unique**: `pacientes.dni`, `pacientes.telefono`, `tratamientos.nombre`.
- **Compuestos**: `turnos(fecha, horaInicio)` para búsqueda de solapamiento; `consultas(paciente, fecha DESC)` para historial cronológico.
- **Single field**: `turnos.paciente`, `turnos.estado`.

### 5.3 Validaciones a nivel modelo

Mongoose aplica las reglas antes de persistir (defensa en profundidad, más allá de express-validator):
- regex para DNI/teléfono
- enum para `estado`
- `match` para `horaInicio`/`horaFin`
- `min`/`max` para duraciones

---

## 6) Conclusión

MongoDB aporta al TP:

1. **Modelo documental** que encaja con la realidad clínica (historial con campos opcionales).
2. **Aggregations declarativas** que resuelven los 4 reportes pedidos con pipelines claros.
3. **Validación declarativa** en el schema de Mongoose.
4. **Integración con frontend JSON** sin mapeos intermedios.
5. **Escalabilidad horizontal** lista para el crecimiento.

Es la elección correcta para un sistema de gestión que probablemente empezará con pocos registros pero tiene potencial de crecer.