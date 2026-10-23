'use strict';
/**
 * Utilidades de seguridad del servidor (puras, sin dependencias, con tests).
 */

/** Igual que MAX_MESSAGE_LENGTH en src/lib/mission.ts */
const MAX_MESSAGE_LENGTH = 4000;

const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'http://127.0.0.1:4173'];

/** Lista de orígenes permitidos para CORS (ALLOWED_ORIGINS separados por comas). */
function parseAllowedOrigins(value) {
  if (typeof value !== 'string' || value.trim() === '') return DEFAULT_ORIGINS.slice();
  return value
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, '').toLowerCase())
    .filter((o) => /^https?:\/\/[^\s/]+$/i.test(o));
}

/** `true` si el origen (cabecera Origin) está en la lista; sin Origin (curl, misma máquina) se permite. */
function isOriginAllowed(origin, allowed) {
  if (!origin) return true;
  return allowed.includes(String(origin).toLowerCase());
}

/**
 * Rechaza con 403 las peticiones de orígenes no permitidos. Va ANTES del limitador para que una web
 * ajena no pueda gastar el cupo de envíos y bloquear al origen legítimo.
 */
function createOriginGuard(allowed) {
  return function originGuard(req, res, next) {
    if (!isOriginAllowed(req.get ? req.get('origin') : req.headers && req.headers.origin, allowed)) {
      return res.status(403).json({ error: 'Origen no permitido.' });
    }
    return next();
  };
}

/** Formato de ID de grupo de WhatsApp: «123456789-123456@g.us» o «120363…@g.us». */
function isValidGroupId(id) {
  return typeof id === 'string' && /^[0-9]{5,30}(-[0-9]{5,20})?@g\.us$/.test(id.trim());
}

/**
 * Valida el cuerpo de POST /send-mission.
 * @returns {{ ok: true, message: string } | { ok: false, error: string }}
 */
function validateMissionBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Cuerpo de la petición no válido.' };
  }
  const { message } = body;
  if (typeof message !== 'string') return { ok: false, error: 'El campo «message» debe ser texto.' };
  // Quita caracteres de control salvo saltos de línea y tabuladores.
  // eslint-disable-next-line no-control-regex
  const clean = message.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (clean.length === 0) return { ok: false, error: 'El mensaje está vacío.' };
  if (clean.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `El mensaje supera ${MAX_MESSAGE_LENGTH} caracteres.` };
  }
  return { ok: true, message: clean };
}

/** Cabeceras de seguridad básicas para una API JSON. */
function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.removeHeader('X-Powered-By');
  next();
}

/**
 * Limitador de peticiones muy simple en memoria (por IP).
 * Evita que una página abierta dispare cientos de mensajes seguidos.
 */
function createRateLimiter({ windowMs = 60_000, max = 10, now = Date.now } = {}) {
  const hits = new Map();
  return function rateLimit(req, res, next) {
    const key = req.ip || 'local';
    const t = now();
    // Purga IPs sin actividad reciente para que el mapa no crezca sin límite.
    if (hits.size > 1000) {
      for (const [k, list] of hits) if (!list.some((ts) => t - ts < windowMs)) hits.delete(k);
    }
    const recent = (hits.get(key) || []).filter((ts) => t - ts < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ error: 'Demasiados envíos seguidos. Espera un minuto.' });
    }
    recent.push(t);
    hits.set(key, recent);
    return next();
  };
}

module.exports = {
  MAX_MESSAGE_LENGTH,
  DEFAULT_ORIGINS,
  parseAllowedOrigins,
  isOriginAllowed,
  createOriginGuard,
  isValidGroupId,
  validateMissionBody,
  securityHeaders,
  createRateLimiter,
};
