'use strict';
/**
 * Token opcional entre la web y el servidor (SERVER_TOKEN). Puro, sin dependencias, con pruebas.
 *
 * - Viaja SIEMPRE en la cabecera `Authorization: Bearer <token>`, nunca en la URL (no queda en historiales ni logs).
 * - Se compara en tiempo constante (SHA-256 de ambos lados + timingSafeEqual: tampoco filtra la longitud).
 * - Obligatorio si el servidor escucha fuera de este equipo (HOST distinto de 127.0.0.1/localhost/::1):
 *   sin él, cualquiera de la red local podría mandar mensajes a tu grupo (curl no envía Origin).
 */
const nodeCrypto = require('node:crypto');
const { parseEnv, setEnvValue } = require('./envFile');

/** Longitud mínima aceptada (los generados por `npm run setup` tienen 43 caracteres). */
const MIN_TOKEN_LENGTH = 24;

/** Genera un token aleatorio de 256 bits en base64url (seguro para .env y cabeceras). */
function generateToken(bytes = 32) {
  return nodeCrypto.randomBytes(bytes).toString('base64url');
}

/** `true` si el host solo es accesible desde este equipo. */
function isLoopbackHost(host) {
  const h = String(host || '')
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '');
  return h === 'localhost' || h === '::1' || /^127(\.\d{1,3}){3}$/.test(h);
}

/** Extrae el token de una cabecera `Authorization: Bearer <token>`; '' si no hay o no tiene ese formato. */
function readBearer(header) {
  if (typeof header !== 'string') return '';
  const match = /^Bearer[ \t]+([A-Za-z0-9._~+/=-]+)[ \t]*$/i.exec(header);
  return match ? match[1] : '';
}

/** Compara dos tokens en tiempo constante. Con `expected` vacío devuelve siempre `false`. */
function tokensMatch(expected, provided) {
  if (typeof expected !== 'string' || typeof provided !== 'string' || expected === '' || provided === '') return false;
  const a = nodeCrypto.createHash('sha256').update(expected, 'utf8').digest();
  const b = nodeCrypto.createHash('sha256').update(provided, 'utf8').digest();
  return nodeCrypto.timingSafeEqual(a, b);
}

/**
 * Comprueba la configuración al arrancar.
 * @returns {{ ok: true, required: boolean } | { ok: false, error: string }}
 */
function checkTokenConfig({ host, token }) {
  const clean = String(token || '').trim();
  if (clean && clean.length < MIN_TOKEN_LENGTH) {
    return {
      ok: false,
      error: `SERVER_TOKEN es demasiado corto (mínimo ${MIN_TOKEN_LENGTH} caracteres). Bórralo del .env y ejecuta: npm run setup (genera uno seguro).`,
    };
  }
  if (clean && !readBearer(`Bearer ${clean}`)) {
    return {
      ok: false,
      error: 'SERVER_TOKEN tiene caracteres no válidos. Bórralo del .env y ejecuta: npm run setup (genera uno seguro).',
    };
  }
  if (!clean && !isLoopbackHost(host)) {
    return {
      ok: false,
      error: `El servidor escucharía en ${host} (abierto a tu red) sin SERVER_TOKEN: cualquiera de la red podría enviar mensajes a tu grupo. Ejecuta: npm run setup (genera el token) o vuelve a HOST=127.0.0.1 en el .env.`,
    };
  }
  return { ok: true, required: Boolean(clean) };
}

/**
 * Middleware: sin token configurado deja pasar (uso local); con token, exige `Authorization: Bearer` correcto.
 * Va después del filtro de Origin y ANTES del limitador, para que los intentos fallidos no gasten el cupo legítimo.
 */
function createTokenGuard(expected) {
  const token = String(expected || '').trim();
  return function tokenGuard(req, res, next) {
    if (!token) return next();
    const header = req.get ? req.get('authorization') : req.headers && req.headers.authorization;
    if (tokensMatch(token, readBearer(header))) return next();
    res.setHeader('WWW-Authenticate', 'Bearer');
    return res.status(401).json({
      error:
        'Token del servidor incorrecto o ausente. Pega el SERVER_TOKEN de tu .env en ⚙️ CONFIGURAR API → Servidor.',
    });
  };
}

/**
 * Para `npm run setup`: si el .env no tiene un SERVER_TOKEN válido, genera uno y lo escribe también en
 * VITE_SERVER_TOKEN (la web local lo envía sola). Si ya hay uno válido no toca nada. Nunca devuelve el token.
 * @returns {{ text: string, created: boolean }}
 */
function ensureServerToken(envText, generate = generateToken) {
  const current = (parseEnv(envText).get('SERVER_TOKEN') || '').trim();
  if (current && checkTokenConfig({ host: '127.0.0.1', token: current }).ok) return { text: envText, created: false };
  const token = generate();
  let text = setEnvValue(envText, 'SERVER_TOKEN', token);
  text = setEnvValue(text, 'VITE_SERVER_TOKEN', token);
  return { text, created: true };
}

module.exports = {
  ensureServerToken,
  MIN_TOKEN_LENGTH,
  generateToken,
  isLoopbackHost,
  readBearer,
  tokensMatch,
  checkTokenConfig,
  createTokenGuard,
};
