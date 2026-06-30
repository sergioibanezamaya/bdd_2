# 06 — Agregaciones MongoDB

**Trabajo Práctico — Base de Datos II**
**Sistema de Gestión de Turnos Odontológicos**

El sistema implementa **cuatro pipelines** de agregación. Todos están expuestos en `/api/agregaciones/*` y consumidos por la pantalla **Agenda**.

---

## 1) Turnos por mes (últimos 12 meses)

### Endpoint
`GET /api/agregaciones/turnos-por-mes`

### Pipeline
```js
[
  // 1) Filtrar últimos 12 meses
  { $match: { createdAt: { $gte: hace12Meses } } },

  // 2) Agrupar por (año, mes) y contar por estado
  {
    $group: {
      _id: {
        year:  { $year:  "$createdAt" },
        month: { $month: "$createdAt" },
      },
      total:       { $sum: 1 },
      confirmados: { $sum: { $cond: [{ $eq: ["$estado", "Confirmado"] }, 1, 0] } },
      cancelados:  { $sum: { $cond: [{ $eq: ["$estado", "Cancelado"]  }, 1, 0] } },
      atendidos:   { $sum: { $cond: [{ $eq: ["$estado", "Atendido"]   }, 1, 0] } },
    },
  },

  // 3) Ordenar cronológicamente
  { $sort: { "_id.year": 1, "_id.month": 1 } },

  // 4) Limpiar la salida
  {
    $project: {
      _id: 0,
      year: "$_id.year",
      month: "$_id.month",
      total: 1,
      confirmados: 1,
      cancelados: 1,
      atendidos: 1,
    },
  },
]
```

### Salida esperada
```json
[
  { "year": 2025, "month": 7,  "total": 12, "confirmados": 8,  "cancelados": 1, "atendidos": 7  },
  { "year": 2025, "month": 8,  "total": 18, "confirmados": 14, "cancelados": 2, "atendidos": 14 },
  { "year": 2025, "month": 9,  "total": 22, "confirmados": 17, "cancelados": 3, "atendidos": 16 },
  { "year": 2025, "month": 10, "total": 25, "confirmados": 20, "cancelados": 2, "atendidos": 20 },
  ...
]
```

---

## 2) Tratamientos más frecuentes (sobre consultas)

### Endpoint
`GET /api/agregaciones/tratamientos-mas-frecuentes`

### Pipeline
```js
[
  // 1) Contar consultas por tratamiento
  { $group: { _id: "$tratamiento", cantidad: { $sum: 1 } } },

  // 2) Ordenar descendente
  { $sort: { cantidad: -1 } },

  // 3) Top 10
  { $limit: 10 },

  // 4) Enriquecer con datos del tratamiento (lookup)
  {
    $lookup: {
      from: "tratamientos",          // otra colección
      localField: "_id",             // ObjectId del tratamiento
      foreignField: "_id",
      as: "info",
    },
  },
  { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },

  // 5) Salida limpia
  {
    $project: {
      _id: 0,
      tratamientoId: "$_id",
      tratamiento: { $ifNull: ["$info.nombre", "(eliminado)"] },
      cantidad: 1,
    },
  },
]
```

### Salida esperada
```json
[
  { "tratamientoId": "6650b1c2d3e4f5a6b7c8d9e0", "tratamiento": "Limpieza",       "cantidad": 45 },
  { "tratamientoId": "6650b1c2d3e4f5a6b7c8d9e1", "tratamiento": "Conducto",       "cantidad": 23 },
  { "tratamientoId": "6650b1c2d3e4f5a6b7c8d9e2", "tratamiento": "Extracción",     "cantidad": 18 },
  { "tratamientoId": "6650b1c2d3e4f5a6b7c8d9e4", "tratamiento": "Consulta general","cantidad": 15 },
  { "tratamientoId": "6650b1c2d3e4f5a6b7c8d9e5", "tratamiento": "Blanqueamiento", "cantidad":  9 }
]
```

---

## 3) Pacientes por obra social

### Endpoint
`GET /api/agregaciones/pacientes-por-obra-social`

### Pipeline
```js
[
  { $group: { _id: "$obraSocial", cantidad: { $sum: 1 } } },
  { $sort: { cantidad: -1 } },
  {
    $project: {
      _id: 0,
      obraSocial: "$_id",
      cantidad: 1,
    },
  },
]
```

### Salida esperada
```json
[
  { "obraSocial": "OSDE",           "cantidad": 38 },
  { "obraSocial": "Swiss Medical",  "cantidad": 24 },
  { "obraSocial": "Galeno",         "cantidad": 19 },
  { "obraSocial": "Particular",     "cantidad": 12 }
]
```

---

## 4) Tasa de confirmación de turnos (bonus)

### Endpoint
`GET /api/agregaciones/tasa-confirmacion`

### Pipeline
```js
[
  {
    $group: {
      _id: null,
      total:       { $sum: 1 },
      confirmados: { $sum: { $cond: [{ $eq: ["$estado", "Confirmado"] }, 1, 0] } },
      cancelados:  { $sum: { $cond: [{ $eq: ["$estado", "Cancelado"]  }, 1, 0] } },
    },
  },
  {
    $project: {
      _id: 0,
      total: 1,
      confirmados: 1,
      cancelados: 1,
      tasaConfirmacion: {
        $cond: [
          { $eq: ["$total", 0] },
          0,
          { $divide: ["$confirmados", "$total"] },
        ],
      },
    },
  },
]
```

### Salida esperada
```json
{ "total": 150, "confirmados": 118, "cancelados": 12, "tasaConfirmacion": 0.7867 }
```

(78.67% de los turnos creados fueron confirmados.)

---

## Operadores utilizados

| Operador | Uso |
|---|---|
| `$match` | Filtrar documentos por condiciones (etapa previa a $group) |
| `$group` | Agrupar por clave y acumular con `$sum`, `$avg`, `$max`, etc. |
| `$sort` | Ordenar resultados |
| `$limit` | Limitar cantidad de documentos |
| `$project` | Dar forma a la salida (renombrar, ocultar, computar) |
| `$lookup` | JOIN entre colecciones (tratamientos ↔ consultas) |
| `$unwind` | "Desenrollar" un array (resultado de $lookup) |
| `$cond` | If/then/else para campos calculados |
| `$year`, `$month` | Extraer partes de una fecha |
| `$divide` | División (útil para tasas) |
| `$ifNull` | Valor por defecto si es null/missing |

---

## Dónde se usan

- **Pantalla Agenda** consume los 4 endpoints en su panel derecho (barras + porcentaje).
- Sirven como ejemplos de uso académico del **Aggregation Framework** que es una de las razones para elegir MongoDB (ver [`07-justificacion-mongodb.md`](./07-justificacion-mongodb.md)).
