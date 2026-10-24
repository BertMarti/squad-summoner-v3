'use strict';
/**
 * Dónde está Chromium/Chrome. En Linux ARM (Raspberry Pi) Puppeteer no publica Chrome, así que hay que usar
 * el del sistema (`sudo apt install chromium`). Funciones puras con dependencias inyectables para las pruebas.
 */
const fs = require('node:fs');

const LINUX_CANDIDATES = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/snap/bin/chromium',
];
const MAC_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

/** Ruta del navegador a usar: CHROMIUM_PATH si existe; si no, el del sistema; si no, null (Puppeteer usará el suyo). */
function findChromium({ env = process.env, platform = process.platform, exists = fs.existsSync } = {}) {
  const custom = (env.CHROMIUM_PATH || '').trim();
  if (custom && exists(custom)) return custom;
  const candidates = platform === 'darwin' ? MAC_CANDIDATES : platform === 'linux' ? LINUX_CANDIDATES : [];
  return candidates.find((candidate) => exists(candidate)) || null;
}

/** `true` donde Puppeteer no puede descargar su Chrome (Linux ARM). */
function needsSystemChromium({ platform = process.platform, arch = process.arch } = {}) {
  return platform === 'linux' && (arch === 'arm' || arch === 'arm64');
}

module.exports = { findChromium, needsSystemChromium, LINUX_CANDIDATES };
