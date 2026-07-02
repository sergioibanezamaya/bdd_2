/**
 * scripts/generar-doc-exposicion.js
 * Genera un .docx en el escritorio con el resumen del TP.
 * El .docx es un zip con XMLs (estándar OOXML).
 *
 * Estrategia: usamos la API mínima: word/document.xml + word/_rels + _rels + [Content_Types].xml
 * Sin imágenes ni estilos avanzados. Word y LibreOffice lo abren.
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// =====================================================================
// 1) Texto del documento (escapado para XML)
// =====================================================================
function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function p(text, opts = {}) {
  const { bold = false, size = 22, color = null, align = 'left' } = opts;
  const rpr = [
    bold && '<w:b/>',
    `<w:sz w:val="${size}"/>`,
    `<w:szCs w:val="${size}"/>`,
    color && `<w:color w:val="${color}"/>`,
  ].filter(Boolean).join('');
  return `<w:p><w:pPr><w:jc w:val="${align}"/></w:pPr><w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function h1(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="0D6EFD"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function h2(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="0A58CA"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function bullet(text) {
  return `<w:p><w:pPr><w:pStyle w:val="ListBullet"/><w:ind w:left="360" w:hanging="360"/></w:pPr><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function code(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Code"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function table(rows) {
  // rows[0] = header
  const header = rows[0];
  const body = rows.slice(1);
  const colWidths = [3200, 6800]; // 50/50 aprox
  const tablePr = `
    <w:tblPr>
      <w:tblW w:w="10000" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:color="888888"/>
        <w:left w:val="single" w:sz="4" w:color="888888"/>
        <w:bottom w:val="single" w:sz="4" w:color="888888"/>
        <w:right w:val="single" w:sz="4" w:color="888888"/>
        <w:insideH w:val="single" w:sz="4" w:color="CCCCCC"/>
        <w:insideV w:val="single" w:sz="4" w:color="CCCCCC"/>
      </w:tblBorders>
    </w:tblPr>
    <w:tblGrid>
      <w:gridCol w:w="3200"/>
      <w:gridCol w:w="6800"/>
    </w:tblGrid>`;
  function cell(text, isHeader) {
    const rpr = isHeader
      ? '<w:b/><w:color w:val="FFFFFF"/><w:sz w:val="22"/>'
      : '<w:sz w:val="22"/>';
    const shd = isHeader ? '<w:shd w:val="clear" w:color="auto" w:fill="0D6EFD"/>' : '';
    return `<w:tc><w:tcPr><w:tcW w:w="3200" w:type="dxa"/>${shd}</w:tcPr><w:p><w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p></w:tc>`;
  }
  function row(cells, isHeader) {
    return `<w:tr>${cells.map((c) => cell(c, isHeader)).join('')}</w:tr>`;
  }
  return `<w:tbl>${tablePr}${row(header, true)}${body.map((r) => row(r, false)).join('')}</w:tbl><w:p/>`;
}

// =====================================================================
// 2) Contenido
// =====================================================================
const body = [
  p('TP Base de Datos II — Sistema de Gestión de Turnos Odontológicos', { bold: true, size: 36, color: '0D6EFD', align: 'center' }),
  p('Resumen para exposición', { size: 24, color: '6C757D', align: 'center' }),
  p(''),

  h1('1. ¿Qué hace el sistema?'),
  p('Una aplicación web para consultorios odontológicos que permite:'),
  bullet('Al odontólogo: registrar pacientes, cargar turnos, confirmar pagos, registrar consultas (historial clínico).'),
  bullet('Al paciente: auto-registrarse, reservar turnos, ver su historial y pagar (efectivo o transferencia).'),
  bullet('Integración con Gmail (envío de emails) y Google Calendar (eventos). Funciona en modo degradado si no están configurados.'),
  p(''),

  h1('2. Stack tecnológico'),
  table([
    ['Capa', 'Tecnología'],
    ['Frontend odontólogo', 'React 19 + Vite'],
    ['Frontend paciente', 'Misma SPA, rutas /portal, /mi-turno, /solicitar-turno'],
    ['Backend', 'Node.js + Express 4'],
    ['Base de datos', 'MongoDB 8 + Mongoose (ODM)'],
    ['Emails', 'Nodemailer (Gmail SMTP)'],
    ['Agenda', 'googleapis (Calendar OAuth2)'],
    ['Estilos', 'CSS puro, sin frameworks'],
  ]),
  p('Es un monorepo con dos carpetas independientes: /backend y /frontend. La vista del paciente está embebida en /frontend (no hay proyecto aparte).'),
  p(''),

  h1('3. Modelos de datos (MongoDB)'),
  bullet('Paciente: nombre, apellido, DNI (único), teléfono, email, fechaNac, obraSocial.'),
  bullet('Tratamiento: nombre, duración (min), precioReferencia, activo.'),
  bullet('Turno: paciente + tratamiento + fecha + horario + estado (Pendiente/Confirmado/Cancelado/Atendido) + método de pago + comprobante (base64).'),
  bullet('Consulta: paciente + turno + diagnóstico + tratamiento + altaMedica + requiereOperacion. Es el historial clínico.'),
  p('Cada Turno referencia al Paciente y al Tratamiento (FKs con populate en Mongoose). El historial clínico se construye con Consultas que referencian al Turno en que se atendió.'),
  p(''),

  h1('4. Flujo principal'),
  bullet('1) Reservar → POST /api/turnos o POST /api/portal/turnos → estado Pendiente.'),
  bullet('2) Confirmar pago → PATCH /api/turnos/:id/confirmar-pago:'),
  bullet('   • Cambia estado a Confirmado.'),
  bullet('   • Crea evento en Google Calendar (con rollback si falla).'),
  bullet('   • Envía email al paciente (sin rollback, solo warning).'),
  bullet('3) Atender → PATCH /api/turnos/:id/atender o al registrar una Consulta → estado Atendido.'),
  bullet('4) Auto-sweep: cada vez que se listan turnos, los Confirmados con fecha pasada pasan automáticamente a Atendidos.'),
  p(''),

  h1('5. Modo degradado'),
  p('Si Gmail o Google Calendar no están configurados, el sistema sigue funcionando: omite el efecto externo y devuelve un warning en la respuesta. Esto se valida con mongodb-memory-server (BD efímera) en el smoke test.'),
  p(''),

  h1('6. Diagrama de arquitectura'),
  code('┌──────────────────────────────────────────┐'),
  code('│   FRONTEND ÚNICO (React 19 + Vite)      │'),
  code('│  /pacientes  /turnos  /agenda  /consultas'),
  code('│  /portal (login)  /mi-turno  /solicitar  │'),
  code('└────────────┬─────────────────────────────┘'),
  code('             │   /api/turnos, /api/portal/...   │'),
  code('             ▼'),
  code('        ┌──────────────────────────────────────┐'),
  code('        │      BACKEND (Express 4)             │'),
  code('        │ controllers/  services/  routes/     │'),
  code('        │ - turnos.controller.js               │'),
  code('        │ - disponibilidadService.js           │'),
  code('        │ - portal.controller.js               │'),
  code('        │ - consultas.controller.js            │'),
  code('        └────────┬─────────────────────────────┘'),
  code('                 │ Mongoose ODM'),
  code('                 ▼'),
  code('        ┌─────────────────────┐'),
  code('        │      MongoDB 8      │'),
  code('        │ colecciones:        │'),
  code('        │ - pacientes         │'),
  code('        │ - tratamientos      │'),
  code('        │ - turnos            │'),
  code('        │ - consultas         │'),
  code('        └─────────────────────┘'),
  code('                 │'),
  code('                 │ (best-effort)'),
  code('                 ▼'),
  code('        ┌─────────────────────┐'),
  code('        │ Gmail + Google Cal  │'),
  code('        └─────────────────────┘'),
  p(''),

  h1('7. Preguntas que probablemente haga el profesor'),
  bullet('¿Por qué dos roles en la misma SPA? El odontólogo y el paciente tienen UIs distintas pero el dominio es el mismo; embeber el portal en /frontend evita duplicar componentes, mantener dos package.json y sincronizar versiones. Comparten el mismo backend.'),
  bullet('¿Por qué MongoDB y no SQL? El TP lo pide. La ventaja acá: la estructura de Turno (horario embebido, comprobante en base64) es natural en documento.'),
  bullet('¿Cómo evitan solapamiento de turnos? Con un query que busca turnos que se intersecten con [horaInicio, horaFin) y estén en Pendiente/Confirmado. Si hay match → 409.'),
  bullet('¿Cómo calculan disponibilidad? Generan slots base de 30 min entre 08:00 y 20:00, descartan los del pasado y los que se solapan con turnos reservados. Los ocupados se pintan en rojo para que el paciente los vea.'),
  bullet('¿Qué pasa si falla Calendar al confirmar? Rollback: el turno vuelve a Pendiente y se devuelve 502.'),
  bullet('¿Cómo manejan alta médica y operación? Como dos flags booleanos excluyentes en el form (radios), almacenados así en la Consulta.'),
  bullet('¿Por qué React y no Vue/Angular? Decisión de stack del equipo; React 19 con Vite da HMR muy rápido y es lo que vimos en la cursada.'),
  bullet('¿Cómo se comunican front y back? Por HTTP REST con JSON. La base es /api (Vite hace proxy al backend en localhost:3000).'),
  p(''),

  h1('8. Demo en vivo (sugerencia)'),
  bullet('1) Frontend odontólogo: crear un paciente y un turno con método de pago Efectivo.'),
  bullet('2) Frontend paciente: loguearse con el DNI recién creado y ver el turno en "Mis turnos".'),
  bullet('3) Mostrar la grilla de slots: cargar un turno a las 08:00 con tratamiento de 90 min y mostrar cómo 08:00, 08:30 y 09:00 aparecen ocupados en rojo.'),
  bullet('4) Confirmar el pago desde el panel del odontólogo y mostrar el cambio de estado a Confirmado.'),
  bullet('5) Cambiar a la vista Historial y registrar una consulta para el paciente.'),
  p(''),
];

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body.join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

// =====================================================================
// 3) Armar el zip (.docx)
// =====================================================================
// Un .docx es un zip con estos archivos:
//   [Content_Types].xml
//   _rels/.rels
//   word/document.xml
//   word/_rels/document.xml.rels
// No usamos styles.xml ni nada más: Word es tolerante.

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

// CRC32 (necesario para zip)
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(files) {
  // files: [{ name, data: Buffer }]
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const data = f.data;
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    const crc = crc32(data);

    // Local file header
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);          // signature
    local.writeUInt16LE(20, 4);                  // version needed
    local.writeUInt16LE(0, 6);                   // flags
    local.writeUInt16LE(8, 8);                   // method = deflate
    local.writeUInt16LE(0, 10);                  // mod time
    local.writeUInt16LE(0, 12);                  // mod date
    local.writeUInt32LE(crc, 14);                // crc32
    local.writeUInt32LE(compressed.length, 18);  // compressed size
    local.writeUInt32LE(data.length, 22);        // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26);     // name length
    local.writeUInt16LE(0, 28);                  // extra length

    localParts.push(local, nameBuf, compressed);
    const localSize = 30 + nameBuf.length + compressed.length;

    // Central directory header
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);            // signature
    central.writeUInt16LE(20, 4);                    // version made by
    central.writeUInt16LE(20, 6);                    // version needed
    central.writeUInt16LE(0, 8);                     // flags
    central.writeUInt16LE(8, 10);                    // method
    central.writeUInt16LE(0, 12);                    // mod time
    central.writeUInt16LE(0, 14);                    // mod date
    central.writeUInt32LE(crc, 16);                  // crc32
    central.writeUInt32LE(compressed.length, 20);    // compressed size
    central.writeUInt32LE(data.length, 24);          // uncompressed size
    central.writeUInt16LE(nameBuf.length, 28);       // name length
    central.writeUInt16LE(0, 30);                    // extra length
    central.writeUInt16LE(0, 32);                    // comment length
    central.writeUInt16LE(0, 34);                    // disk
    central.writeUInt16LE(0, 36);                    // internal attrs
    central.writeUInt32LE(0, 38);                    // external attrs
    central.writeUInt32LE(offset, 42);               // local header offset

    centralParts.push(central, nameBuf);
    offset += localSize;
  }
  const localBuf = Buffer.concat(localParts);
  const centralBuf = Buffer.concat(centralParts);
  const centralOffset = localBuf.length;

  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);            // signature
  eocd.writeUInt16LE(0, 4);                     // disk
  eocd.writeUInt16LE(0, 6);                     // start disk
  eocd.writeUInt16LE(files.length, 8);          // entries on disk
  eocd.writeUInt16LE(files.length, 10);         // total entries
  eocd.writeUInt32LE(centralBuf.length, 12);    // central size
  eocd.writeUInt32LE(centralOffset, 16);        // central offset
  eocd.writeUInt16LE(0, 20);                    // comment length

  return Buffer.concat([localBuf, centralBuf, eocd]);
}

const zip = buildZip([
  { name: '[Content_Types].xml', data: Buffer.from(contentTypes, 'utf8') },
  { name: '_rels/.rels', data: Buffer.from(rootRels, 'utf8') },
  { name: 'word/document.xml', data: Buffer.from(documentXml, 'utf8') },
  { name: 'word/_rels/document.xml.rels', data: Buffer.from(docRels, 'utf8') },
]);

const outPath = path.join(process.env.USERPROFILE || '/c/Users/sergi', 'Desktop', 'TP-Turnos-Odontologia-Exposicion.docx');
fs.writeFileSync(outPath, zip);
console.log('✅ Documento creado en:', outPath);
console.log('   Tamaño:', (zip.length / 1024).toFixed(1), 'KB');
