'use strict';
const path = require('node:path');
const { findChromium } = require('./chromium');

/** Texto que explica cómo escanear el QR (lo muestran el servidor y `npm run server:grupos`). */
const QR_HELP = [
  '📲 ESCANEA ESTE QR CON WHATSAPP para vincular este equipo (como WhatsApp Web):',
  '   En el móvil: WhatsApp → Ajustes (⋮ en Android) → Dispositivos vinculados → Vincular un dispositivo,',
  '   y apunta la cámara a este código. Solo hace falta la primera vez: la sesión queda en server/.wwebjs_auth',
  '   (es privada: no la compartas ni la subas a git).',
].join('\n');

/** Cliente de WhatsApp con la sesión en server/.wwebjs_auth y el Chromium del sistema si lo hay. */
function createWhatsappClient() {
  // Se requiere aquí para que preflight pueda avisar antes si faltan las dependencias.
  const { Client, LocalAuth } = require('whatsapp-web.js');
  const executablePath = findChromium() || undefined;
  return new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '..', '.wwebjs_auth') }),
    // --no-sandbox es necesario en algunos Linux/Docker; quítalo si tu sistema lo permite.
    puppeteer: { headless: true, args: ['--no-sandbox'], ...(executablePath ? { executablePath } : {}) },
  });
}

module.exports = { createWhatsappClient, QR_HELP };
