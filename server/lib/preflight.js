'use strict';
/**
 * Comprobaciones previas del servidor ANTES de cargar express/whatsapp-web.js: si falta algo, explica en
 * español qué es y cómo arreglarlo, en vez de un «Cannot find module» o una traza de Puppeteer.
 */
const fs = require('node:fs');
const path = require('node:path');
const { findChromium, needsSystemChromium } = require('./chromium');
const { isValidGroupId } = require('./security');

const SERVER_DIR = path.join(__dirname, '..');
const ROOT_DIR = path.join(SERVER_DIR, '..');

/** Devuelve la lista de problemas (vacía si todo está bien). Pura salvo por `exists`. */
function findProblems({
  needGroupId = true,
  needEnvFile = true,
  env = process.env,
  platform = process.platform,
  arch = process.arch,
  nodeVersion = process.versions.node,
  exists = fs.existsSync,
} = {}) {
  const problems = [];
  const [major, minor] = nodeVersion.split('.').map(Number);
  if (major < 20 || (major === 20 && minor < 19)) {
    problems.push(`Necesitas Node.js 20.19 o superior (tienes ${nodeVersion}). Instálalo desde https://nodejs.org o con nvm.`);
  }
  if (!exists(path.join(SERVER_DIR, 'node_modules', 'whatsapp-web.js'))) {
    problems.push('Faltan las dependencias del servidor. Ejecuta: npm run setup y responde «s» al envío automático a WhatsApp (o: cd server && npm ci).');
  }
  if (needsSystemChromium({ platform, arch }) && !findChromium({ env, platform, exists })) {
    problems.push('En este equipo (Linux ARM, p. ej. Raspberry Pi) hace falta el Chromium del sistema: sudo apt install chromium (y vuelve a ejecutar npm run setup).');
  }
  if (needEnvFile && !exists(path.join(ROOT_DIR, '.env'))) {
    problems.push('No hay archivo .env en la carpeta del proyecto. Ejecuta: npm run setup');
  } else if (needGroupId && !isValidGroupId((env.WHATSAPP_GROUP_ID || '').trim())) {
    problems.push('Falta el ID del grupo de WhatsApp (WHATSAPP_GROUP_ID en .env, formato …@g.us). Ejecuta: npm run server:grupos para ver tus grupos y elegir uno.');
  }
  return problems;
}

/** Muestra los problemas y devuelve `false` si hay alguno. */
function preflight(options = {}) {
  const problems = findProblems(options);
  for (const problem of problems) console.error(`❌ ${problem}`);
  return problems.length === 0;
}

module.exports = { preflight, findProblems, ROOT_DIR, SERVER_DIR };
