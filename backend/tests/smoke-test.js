/**
 * scripts/smoke-test.js — Smoke test end-to-end con MongoDB en memoria
 *
 * Levanta una MongoDB efímera, conecta el backend, ejecuta requests
 * sobre los endpoints principales y verifica los flujos clave:
 *   - Crear paciente (y duplicado)
 *   - Listar tratamientos (seed)
 *   - Consultar disponibilidad
 *   - Crear turno Pendiente
 *   - Confirmar pago (modo degradado)
 *   - Listar turnos
 *   - Crear consulta
 *   - Agregaciones
 */

import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let server;
let baseUrl;
let app;

async function setup() {
  console.log('🚀 Iniciando MongoDB en memoria...');
  server = await MongoMemoryServer.create();
  const uri = server.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
  console.log('✅ MongoDB conectado:', uri);

  // Importar app DESPUÉS de setear MONGODB_URI
  app = (await import('../src/app.js')).default;

  // Arrancar server
  const { createServer } = await import('node:http');
  const httpServer = createServer(app);
  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log('✅ Backend escuchando en:', baseUrl);
  return httpServer;
}

async function http(method, path, body = null) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) {
    console.error('❌ ASSERT FAIL:', msg);
    process.exit(1);
  } else {
    console.log('  ✓', msg);
  }
}

async function runTests() {
  console.log('\n=== 1. Health check ===');
  let r = await http('GET', '/api/health');
  assert(r.status === 200 && r.data.ok === true, 'Health endpoint responde');

  console.log('\n=== 2. Seed de tratamientos ===');
  const { default: Tratamiento } = await import('../src/models/Tratamiento.js');
  const seedItems = [
    { nombre: 'Limpieza', duracionMin: 30, precioReferencia: 5000 },
    { nombre: 'Conducto', duracionMin: 60, precioReferencia: 15000 },
    { nombre: 'Extracción', duracionMin: 45, precioReferencia: 8000 },
  ];
  for (const t of seedItems) await Tratamiento.create(t);
  const totalTx = await Tratamiento.countDocuments();
  assert(totalTx === 3, 'Seed creó 3 tratamientos');

  console.log('\n=== 3. Listar tratamientos ===');
  r = await http('GET', '/api/tratamientos');
  assert(r.status === 200 && r.data.data.length === 3, 'GET /tratamientos devuelve 3');

  console.log('\n=== 4. Crear paciente ===');
  r = await http('POST', '/api/pacientes', {
    nombre: 'María',
    apellido: 'González',
    dni: '40123456',
    telefono: '+54 11 5555-1234',
    email: 'maria@example.com',
    fechaNacimiento: '1990-05-12',
    obraSocial: 'OSDE',
  });
  assert(r.status === 201 && r.data.existed === false, 'POST /pacientes crea nuevo');
  const pacienteId = r.data.data.id;
  console.log('     pacienteId:', pacienteId);

  console.log('\n=== 5. Deduplicación por DNI ===');
  r = await http('POST', '/api/pacientes', {
    nombre: 'María',
    apellido: 'González (otra vez)',
    dni: '40123456',
    telefono: '+54 11 9999-9999',
    email: 'maria2@example.com',
    fechaNacimiento: '1990-05-12',
    obraSocial: 'OSDE',
  });
  assert(r.status === 200 && r.data.existed === true, 'POST con DNI duplicado → existed:true');

  console.log('\n=== 6. DNI inválido ===');
  r = await http('POST', '/api/pacientes', {
    nombre: 'Test',
    apellido: 'Test',
    dni: '123',
    telefono: '+54 11 5555-1111',
    email: 'test@example.com',
    fechaNacimiento: '1990-01-01',
    obraSocial: 'X',
  });
  assert(r.status === 400, 'DNI con formato inválido → 400');

  console.log('\n=== 7. Disponibilidad ===');
  const tratamientoTx = await Tratamiento.findOne({ nombre: 'Limpieza' });
  const tratamientoId = tratamientoTx._id.toString();
  // Fecha futura (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const ymd = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  r = await http('GET', `/api/disponibilidad?fecha=${ymd}&tratamientoId=${tratamientoId}`);
  assert(r.status === 200 && Array.isArray(r.data.data.slotsLibres), 'GET /disponibilidad devuelve array');
  assert(r.data.data.slotsLibres.length > 0, `Tiene slots libres (${r.data.data.slotsLibres.length})`);
  const slot = r.data.data.slotsLibres[0];

  console.log('\n=== 8. Crear turno ===');
  r = await http('POST', '/api/turnos', {
    pacienteId,
    tratamientoId,
    fecha: ymd,
    horaInicio: slot,
    observaciones: 'Smoke test',
  });
  assert(r.status === 201 && r.data.data.estado === 'Pendiente', 'POST /turnos crea en Pendiente');
  const turnoId = r.data.data.id;

  console.log('\n=== 9. Conflicto de horario ===');
  r = await http('POST', '/api/turnos', {
    pacienteId,
    tratamientoId,
    fecha: ymd,
    horaInicio: slot,
    observaciones: '',
  });
  assert(r.status === 409 && r.data.code === 'SLOT_OCUPADO', 'Mismo horario → 409 SLOT_OCUPADO');

  console.log('\n=== 10. Confirmar pago (modo degradado) ===');
  r = await http('PATCH', `/api/turnos/${turnoId}/confirmar-pago`);
  assert(r.status === 200 && r.data.data.estado === 'Confirmado', 'Confirmar → estado Confirmado');
  // En modo degradado, calendarEventId queda null
  assert(r.data.data.calendarEventId === null, 'Modo degradado: calendarEventId=null');

  console.log('\n=== 11. Listar turnos ===');
  r = await http('GET', '/api/turnos');
  assert(r.status === 200 && r.data.data.length === 1, 'GET /turnos devuelve 1 turno');

  console.log('\n=== 12. Cancelar turno ===');
  r = await http('PATCH', `/api/turnos/${turnoId}/cancelar`, { motivo: 'test' });
  assert(r.status === 200 && r.data.data.estado === 'Cancelado', 'Cancelar → estado Cancelado');

  console.log('\n=== 13. Crear consulta ===');
  r = await http('POST', '/api/consultas', {
    pacienteId,
    turnoId: null,
    diagnostico: 'Caries en pieza 36',
    observaciones: 'Seguimiento en 15 días',
    tratamientoId,
    requiereOperacion: false,
    altaMedica: false,
  });
  assert(r.status === 201, 'POST /consultas crea consulta');

  console.log('\n=== 14. Agregaciones ===');
  r = await http('GET', '/api/agregaciones/pacientes-por-obra-social');
  assert(r.status === 200 && r.data.data.length === 1, 'Agregación por OS devuelve 1 grupo');

  r = await http('GET', '/api/agregaciones/tasa-confirmacion');
  assert(r.status === 200 && typeof r.data.data.tasaConfirmacion === 'number', 'Tasa de confirmación es número');

  console.log('\n=== 15. Google status (modo degradado) ===');
  r = await http('GET', '/api/google/status');
  assert(r.status === 200, 'GET /google/status responde');

  console.log('\n✅ TODOS LOS TESTS PASARON\n');
}

async function teardown(httpServer) {
  await mongoose.disconnect();
  await server.stop();
  httpServer.close();
}

(async () => {
  try {
    const httpServer = await setup();
    await runTests();
    await teardown(httpServer);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en smoke test:', err);
    process.exit(1);
  }
})();