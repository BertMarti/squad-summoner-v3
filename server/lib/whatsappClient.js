'use strict';
const path = require('node:path');
const { findChromium, needsSystemChromium } = require('./chromium');

/** Texto que explica cómo escanear el QR (lo muestran el servidor y `npm run server:grupos`). */
const QR_HELP = [
  '📲 ESCANEA ESTE QR CON WHATSAPP para vincular este equipo (como WhatsApp Web):',
  '   En el móvil: WhatsApp → Ajustes (⋮ en Android) → Dispositivos vinculados → Vincular un dispositivo,',
  '   y apunta la cámara a este código. Solo hace falta la primera vez: la sesión queda en server/.wwebjs_auth',
  '   (es privada: no la compartas ni la subas a git).',
].join('\n');

/**
 * Navegador a usar: el del sistema solo si lo pide CHROMIUM_PATH o si Puppeteer no trae uno para esta plataforma
 * (Linux ARM). En x64 y macOS se mantiene el Chrome de Puppeteer, como antes.
 */
function chooseExecutablePath({ env = process.env, platform = process.platform, arch = process.arch, exists } = {}) {
  if (!(env.CHROMIUM_PATH || '').trim() && !needsSystemChromium({ platform, arch })) return undefined;
  return findChromium({ env, platform, ...(exists ? { exists } : {}) }) || undefined;
}

/** Cliente de WhatsApp con la sesión en server/.wwebjs_auth. */
function createWhatsappClient() {
  // Se requiere aquí para que preflight pueda avisar antes si faltan las dependencias.
  const { Client, LocalAuth } = require('whatsapp-web.js');
  const executablePath = chooseExecutablePath();
  return new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '..', '.wwebjs_auth') }),
    // --no-sandbox es necesario en algunos Linux/Docker; quítalo si tu sistema lo permite.
    puppeteer: { headless: true, args: ['--no-sandbox'], ...(executablePath ? { executablePath } : {}) },
  });
}

module.exports = { createWhatsappClient, chooseExecutablePath, QR_HELP };
