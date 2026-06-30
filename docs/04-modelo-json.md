# 04 — Modelo JSON

**Trabajo Práctico — Base de Datos II**
**Sistema de Gestión de Turnos Odontológicos**

Ejemplos reales de documentos tal como se almacenan en MongoDB.

---

## Colección `pacientes`

### Documento 1 — paciente nuevo
```json
{
  "_id": "ObjectId('6650a1b2c3d4e5f6a7b8c9d0')",
  "nombre": "María",
  "apellido": "González",
  "dni": "40123456",
  "telefono": "+54 11 5555-1234",
  "email": "maria.gonzalez@example.com",
  "fechaNacimiento": "1990-05-12T00:00:00.000Z",
  "obraSocial": "OSDE",
  "createdAt": "2026-06-20T14:30:00.000Z",
  "updatedAt": "2026-06-20T14:30:00.000Z"
}
```

### Documento 2 — paciente existente (reutilizado por DNI)
```json
{
  "_id": "ObjectId('6650a1b2c3d4e5f6a7b8c9d1')",
  "nombre": "Carlos",
  "apellido": "Pérez",
  "dni": "35123456",
  "telefono": "+54 11 4444-5678",
  "email": "carlos.perez@example.com",
  "fechaNacimiento": "1985-11-30T00:00:00.000Z",
  "obraSocial": "Swiss Medical",
  "createdAt": "2026-05-15T09:00:00.000Z",
  "updatedAt": "2026-05-15T09:00:00.000Z"
}
```

---

## Colección `tratamientos`

### Documento 1 — Limpieza
```json
{
  "_id": "ObjectId('6650b1c2d3e4f5a6b7c8d9e0')",
  "nombre": "Limpieza",
  "descripcion": "Limpieza dental profesional con profilaxis.",
  "duracionMin": 30,
  "precioReferencia": 5000,
  "activo": true,
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-01T00:00:00.000Z"
}
```

### Documento 2 — Conducto
```json
{
  "_id": "ObjectId('6650b1c2d3e4f5a6b7c8d9e1')",
  "nombre": "Conducto",
  "descripcion": "Tratamiento de conducto (endodoncia).",
  "duracionMin": 60,
  "precioReferencia": 15000,
  "activo": true,
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-01T00:00:00.000Z"
}
```

### Documento 3 — Blanqueamiento
```json
{
  "_id": "ObjectId('6650b1c2d3e4f5a6b7c8d9e5')",
  "nombre": "Blanqueamiento",
  "descripcion": "Tratamiento estético de blanqueamiento dental.",
  "duracionMin": 90,
  "precioReferencia": 25000,
  "activo": true,
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-01T00:00:00.000Z"
}
```

---

## Colección `turnos`

### Documento 1 — turno Pendiente
```json
{
  "_id": "ObjectId('6650c1d2e3f4a5b6c7d8e9f0')",
  "paciente": "ObjectId('6650a1b2c3d4e5f6a7b8c9d0')",
  "tratamiento": "ObjectId('6650b1c2d3e4f5a6b7c8d9e0')",
  "odontologo": "Dr. Default",
  "fecha": "2026-07-01T00:00:00.000Z",
  "horario": {
    "horaInicio": "10:00",
    "horaFin": "10:30"
  },
  "duracionMin": 30,
  "estado": "Pendiente",
  "pagoConfirmado": false,
  "calendarEventId": null,
  "observaciones": "Primera consulta",
  "createdAt": "2026-06-28T10:00:00.000Z",
  "updatedAt": "2026-06-28T10:00:00.000Z"
}
```

### Documento 2 — turno Confirmado (con evento Calendar)
```json
{
  "_id": "ObjectId('6650c1d2e3f4a5b6c7d8e9f1')",
  "paciente": "ObjectId('6650a1b2c3d4e5f6a7b8c9d1')",
  "tratamiento": "ObjectId('6650b1c2d3e4f5a6b7c8d9e1')",
  "odontologo": "Dr. Default",
  "fecha": "2026-07-02T00:00:00.000Z",
  "horario": {
    "horaInicio": "15:00",
    "horaFin": "16:00"
  },
  "duracionMin": 60,
  "estado": "Confirmado",
  "pagoConfirmado": true,
  "calendarEventId": "abc123def456ghi789jkl",
  "observaciones": "",
  "createdAt": "2026-06-25T09:00:00.000Z",
  "updatedAt": "2026-06-26T11:30:00.000Z"
}
```

### Documento 3 — turno Cancelado
```json
{
  "_id": "ObjectId('6650c1d2e3f4a5b6c7d8e9f2')",
  "paciente": "ObjectId('6650a1b2c3d4e5f6a7b8c9d2')",
  "tratamiento": "ObjectId('6650b1c2d3e4f5a6b7c8d9e0')",
  "odontologo": "Dr. Default",
  "fecha": "2026-06-15T00:00:00.000Z",
  "horario": {
    "horaInicio": "09:00",
    "horaFin": "09:30"
  },
  "duracionMin": 30,
  "estado": "Cancelado",
  "pagoConfirmado": false,
  "calendarEventId": null,
  "observaciones": "[CANCELADO] Paciente no pudo asistir",
  "createdAt": "2026-06-10T08:00:00.000Z",
  "updatedAt": "2026-06-14T18:00:00.000Z"
}
```

---

## Colección `consultas`

### Documento 1 — consulta con turno asociado
```json
{
  "_id": "ObjectId('6650d1e2f3a4b5c6d7e8f9a0')",
  "paciente": "ObjectId('6650a1b2c3d4e5f6a7b8c9d1')",
  "turno": "ObjectId('6650c1d2e3f4a5b6c7d8e9f1')",
  "fecha": "2026-07-02T16:00:00.000Z",
  "diagnostico": "Caries profunda en pieza 36. Se realiza tratamiento de conducto.",
  "observaciones": "Se programa seguimiento en 15 días. Paciente sin alergias conocidas.",
  "tratamiento": "ObjectId('6650b1c2d3e4f5a6b7c8d9e1')",
  "requiereOperacion": false,
  "altaMedica": false,
  "createdAt": "2026-07-02T16:30:00.000Z",
  "updatedAt": "2026-07-02T16:30:00.000Z"
}
```

### Documento 2 — consulta de alta médica
```json
{
  "_id": "ObjectId('6650d1e2f3a4b5c6d7e8f9a1')",
  "paciente": "ObjectId('6650a1b2c3d4e5f6a7b8c9d0')",
  "turno": null,
  "fecha": "2026-06-10T11:00:00.000Z",
  "diagnostico": "Limpieza completada sin complicaciones.",
  "observaciones": "Se recomienda control en 6 meses.",
  "tratamiento": "ObjectId('6650b1c2d3e4f5a6b7c8d9e0')",
  "requiereOperacion": false,
  "altaMedica": true,
  "createdAt": "2026-06-10T11:20:00.000Z",
  "updatedAt": "2026-06-10T11:20:00.000Z"
}
```

---

## Equivalencias con SQL

| Campo MongoDB | SQL equivalente |
|---|---|
| `_id: ObjectId(...)` | `INT PRIMARY KEY AUTO_INCREMENT` |
| `paciente: ObjectId(...)` | `FOREIGN KEY REFERENCES pacientes(id)` |
| `createdAt` / `updatedAt` | `created_at TIMESTAMP DEFAULT NOW` |
| `estado: "Pendiente"` | `estado ENUM('Pendiente', ...)` |
| `horario: { horaInicio, horaFin }` | JSON column o tabla separada `turno_horarios` |
| `requiereOperacion: false` | `requiere_operacion BOOLEAN DEFAULT FALSE` |
