'use strict';
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true }); // Lee el .env de la raíz
const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const {
  parseAllowedOrigins,
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
  console.error('❌ ERROR: WHATSAPP_GROUP_ID no está definido o no tiene formato «…@g.us» (revisa el .env).');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(securityHeaders);
app.use(
  cors({
    origin(origin, cb) {
      // Sin cabecera Origin (curl, misma máquina) se permite; el resto, solo la lista blanca.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: '16kb' }));

// --- Cliente de WhatsApp ---
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  // --no-sandbox es necesario en algunos Linux/Docker; quítalo si tu sistema lo permite.
  puppeteer: { headless: true, args: ['--no-sandbox'] },
});

let whatsappReady = false;

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('📲 ESCANEA EL QR PARA VINCULAR WHATSAPP');
});

client.on('ready', () => {
  whatsappReady = true;
  console.log('✅ Cliente WhatsApp LISTO y conectado.');
});

client.on('disconnected', (reason) => {
  whatsappReady = false;
  console.warn('⚠️ WhatsApp desconectado:', reason);
});

client.initialize().catch((err) => {
  console.error('❌ No se pudo iniciar WhatsApp (¿Chromium disponible?):', err && err.message ? err.message : err);
});

// --- Rutas ---
app.get('/health', (_req, res) => {
  res.json({ ok: true, whatsapp: whatsappReady ? 'ready' : 'starting' });
});

app.post('/send-mission', createRateLimiter({ windowMs: 60_000, max: 10 }), async (req, res) => {
  // CORS solo impide leer la respuesta; este control impide que otra web dispare el envío.
  const origin = req.get('origin');
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origen no permitido.' });
  }

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

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor backend en http://${HOST}:${PORT} (orígenes permitidos: ${ALLOWED_ORIGINS.join(', ')})`);
});
