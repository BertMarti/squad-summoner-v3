'use strict';
const path = require('node:path');
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
} catch {
  /* sin dependencias instaladas: preflight lo explica justo abajo */
} // Lee el .env de la raíz (si faltan las dependencias, preflight lo explica)
// Antes de cargar nada pesado: si falta algo (dependencias, Chromium, .env, ID del grupo) explica cómo arreglarlo.
const { preflight } = require('./lib/preflight');
if (!preflight({ needGroupId: true, needEnvFile: !process.env.WHATSAPP_GROUP_ID })) process.exit(1);

const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode-terminal');
const { createWhatsappClient, QR_HELP } = require('./lib/whatsappClient');
const {
  parseAllowedOrigins,
  isOriginAllowed,
  createOriginGuard,
  isValidGroupId,
  validateMissionBody,
  securityHeaders,
  createRateLimiter,
} = require('./lib/security');

// --- Configuración (ver .env.example) ---
const PORT = Number(process.env.PORT) || 3000;
// Por defecto solo escucha en este equipo. Pon HOST=0.0.0.0 bajo tu responsabilidad.
const HOST = process.env.HOST || '127.0.0.1';
const GROUP_ID = (process.env.WHATSAPP_GROUP_ID || '').trim();
const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

if (!isValidGroupId(GROUP_ID)) {
  console.error('❌ WHATSAPP_GROUP_ID no tiene formato «…@g.us». Ejecuta: npm run server:grupos para elegir tu grupo.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(securityHeaders);
app.use(
  cors({
    origin(origin, cb) {
      // Sin cabecera Origin (curl, misma máquina) se permite; el resto, solo la lista blanca.
      if (isOriginAllowed(origin, ALLOWED_ORIGINS)) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: '16kb' }));

// --- Cliente de WhatsApp ---
const client = createWhatsappClient();

let whatsappReady = false;

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log(QR_HELP);
});

client.on('ready', () => {
  whatsappReady = true;
  console.log('✅ WhatsApp listo. Abre la web con «npm run dev» (http://localhost:5173) y usa 📲 ENVIAR AL GRUPO.');
});

client.on('disconnected', (reason) => {
  whatsappReady = false;
  console.warn('⚠️ WhatsApp desconectado:', reason);
});

client.initialize().catch((err) => {
  console.error('❌ No se pudo iniciar WhatsApp:', err && err.message ? err.message : err);
  console.error('   Comprueba que Chromium está instalado (en Raspberry Pi: sudo apt install chromium) y vuelve a ejecutar npm run setup.');
});

// --- Rutas ---
app.get('/health', (_req, res) => {
  res.json({ ok: true, whatsapp: whatsappReady ? 'ready' : 'starting' });
});

// CORS solo impide leer la respuesta: createOriginGuard impide que otra web dispare el envío
// y va antes del limitador para que sus intentos no consuman el cupo del origen legítimo.
app.post('/send-mission', createOriginGuard(ALLOWED_ORIGINS), createRateLimiter({ windowMs: 60_000, max: 10 }), async (req, res) => {
  const result = validateMissionBody(req.body);
  if (!result.ok) return res.status(400).json({ error: result.error });

  if (!whatsappReady) return res.status(503).json({ error: 'WhatsApp no está listo todavía. Escanea el QR.' });

  try {
    await client.sendMessage(GROUP_ID, result.message);
    console.log('Mensaje enviado correctamente.');
    return res.json({ success: true });
  } catch (error) {
    console.error('Error al enviar mensaje:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Error al enviar el mensaje a WhatsApp.' });
  }
});

// JSON mal formado u otros errores: respuesta genérica sin trazas.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Petición rechazada:', err && err.message ? err.message : err);
  const status = err && err.status && err.status < 500 ? err.status : 500;
  res.status(status).json({ error: status === 413 ? 'Mensaje demasiado grande.' : 'Petición no válida.' });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor backend en http://${HOST}:${PORT} (orígenes permitidos: ${ALLOWED_ORIGINS.join(', ')})`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') console.error(`❌ El puerto ${PORT} ya está en uso. Cierra el otro programa o cambia PORT en .env.`);
  else console.error('❌ No se pudo abrir el servidor:', err && err.message ? err.message : err);
  process.exit(1);
});
