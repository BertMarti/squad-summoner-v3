import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const sec = require('../lib/security.js');

describe('validateMissionBody', () => {
  it('rechaza cuerpos y tipos no válidos', () => {
    expect(sec.validateMissionBody(null).ok).toBe(false);
    expect(sec.validateMissionBody([]).ok).toBe(false);
    expect(sec.validateMissionBody({ message: 123 }).ok).toBe(false);
    expect(sec.validateMissionBody({ message: '   ' }).ok).toBe(false);
  });
  it('rechaza mensajes demasiado largos', () => {
    expect(sec.validateMissionBody({ message: 'x'.repeat(sec.MAX_MESSAGE_LENGTH + 1) }).ok).toBe(false);
  });
  it('limpia caracteres de control y conserva saltos de línea', () => {
    expect(sec.validateMissionBody({ message: ' Hola\u0000\nmundo\u0007 ' })).toEqual({
      ok: true,
      message: 'Hola\nmundo',
    });
  });
});

describe('parseAllowedOrigins', () => {
  it('usa localhost por defecto', () => {
    expect(sec.parseAllowedOrigins(undefined)).toContain('http://localhost:5173');
  });
  it('normaliza y filtra la lista', () => {
    expect(
      sec.parseAllowedOrigins('https://bertmarti.github.io/ , javascript:alert(1), http://localhost:5173'),
    ).toEqual(['https://bertmarti.github.io', 'http://localhost:5173']);
  });
});

describe('origen y limitador', () => {
  const fakeRes = () => {
    const res = { statusCode: 200, headers: {}, body: null };
    res.setHeader = (k, v) => {
      res.headers[k] = v;
    };
    res.status = (c) => {
      res.statusCode = c;
      return res;
    };
    res.json = (b) => {
      res.body = b;
      return res;
    };
    return res;
  };
  const req = (origin) => ({ ip: '127.0.0.1', get: (h) => (h.toLowerCase() === 'origin' ? origin : undefined) });
  // Igual que en server/index.js: guardia de origen ANTES del limitador.
  const chain = (allowed, limiter) => (r) => {
    const res = fakeRes();
    let passed = false;
    sec.createOriginGuard(allowed)(r, res, () =>
      limiter(r, res, () => {
        passed = true;
      }),
    );
    return { res, passed };
  };

  it('isOriginAllowed normaliza mayúsculas y permite peticiones sin Origin', () => {
    const allowed = sec.parseAllowedOrigins('HTTP://LocalHost:5173/');
    expect(allowed).toEqual(['http://localhost:5173']);
    expect(sec.isOriginAllowed('http://LOCALHOST:5173', allowed)).toBe(true);
    expect(sec.isOriginAllowed(undefined, allowed)).toBe(true);
    expect(sec.isOriginAllowed('https://malvada.example', allowed)).toBe(false);
  });

  it('una web ajena recibe 403 y no gasta el cupo del origen legítimo', () => {
    const allowed = ['http://localhost:5173'];
    const send = chain(allowed, sec.createRateLimiter({ windowMs: 60_000, max: 10, now: () => 0 }));
    for (let i = 0; i < 12; i++) {
      const { res, passed } = send(req('https://malvada.example'));
      expect(res.statusCode).toBe(403);
      expect(passed).toBe(false);
    }
    const { res, passed } = send(req('http://localhost:5173'));
    expect(res.statusCode).toBe(200);
    expect(passed).toBe(true);
  });
});

describe('isValidGroupId', () => {
  it('acepta IDs de grupo y rechaza el resto', () => {
    expect(sec.isValidGroupId('123456789-123456@g.us')).toBe(true);
    expect(sec.isValidGroupId('120363012345678901@g.us')).toBe(true);
    expect(sec.isValidGroupId('34600000000@c.us')).toBe(false);
    expect(sec.isValidGroupId('')).toBe(false);
  });
});

describe('createRateLimiter', () => {
  const fakeRes = () => {
    const res = { statusCode: 200, headers: {}, body: null };
    res.setHeader = (k, v) => {
      res.headers[k] = v;
    };
    res.status = (c) => {
      res.statusCode = c;
      return res;
    };
    res.json = (b) => {
      res.body = b;
      return res;
    };
    return res;
  };
  it('bloquea al superar el máximo dentro de la ventana', () => {
    let t = 0;
    const limit = sec.createRateLimiter({ windowMs: 1000, max: 2, now: () => t });
    const next = vi.fn();
    limit({ ip: 'a' }, fakeRes(), next);
    limit({ ip: 'a' }, fakeRes(), next);
    const res = fakeRes();
    limit({ ip: 'a' }, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(res.statusCode).toBe(429);
    t = 2000;
    limit({ ip: 'a' }, fakeRes(), next);
    expect(next).toHaveBeenCalledTimes(3);
  });
});

describe('securityHeaders', () => {
  it('pone las cabeceras básicas', () => {
    const headers = {};
    const res = {
      setHeader: (k, v) => {
        headers[k] = v;
      },
      removeHeader: () => {},
    };
    const next = vi.fn();
    sec.securityHeaders({}, res, next);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(next).toHaveBeenCalled();
  });
});

describe('createSendMissionGuards (orden Origin → límite de autenticación → token → límite de envíos)', () => {
  const token = 'token-de-prueba-0123456789abcdef';
  const allowed = ['http://localhost:5173'];

  /** Ejecuta la cadena como Express: se para en la primera respuesta. */
  function run(guards, headers) {
    const res = { statusCode: 200, body: undefined, headers: {} };
    res.status = (c) => ((res.statusCode = c), res);
    res.json = (b) => ((res.body = b), res);
    res.setHeader = (k, v) => (res.headers[k.toLowerCase()] = v);
    const req = { ip: '192.168.1.50', get: (n) => headers[n.toLowerCase()] };
    let passed = false;
    const step = (i) => {
      if (i === guards.length) return void (passed = true);
      guards[i](req, res, () => step(i + 1));
    };
    step(0);
    return { passed, status: passed ? 200 : res.statusCode, body: res.body };
  }

  it('limita la fuerza bruta del token a 30 intentos por minuto', () => {
    let t = 0;
    const guards = sec.createSendMissionGuards({ allowed, token, now: () => t });
    const bad = { origin: 'http://localhost:5173', authorization: 'Bearer token-adivinado-000000000000' };
    for (let i = 0; i < 30; i++) expect(run(guards, bad).status).toBe(401);
    const blocked = run(guards, bad);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/intentos con el token/);
    // Pasado un minuto se puede volver a intentar.
    t = 61_000;
    expect(run(guards, { ...bad, authorization: `Bearer ${token}` }).passed).toBe(true);
  });

  it('el límite de 10 envíos por minuto sigue al final, solo para peticiones autenticadas', () => {
    const guards = sec.createSendMissionGuards({ allowed, token, now: () => 0 });
    const ok = { origin: 'http://localhost:5173', authorization: `Bearer ${token}` };
    for (let i = 0; i < 10; i++) expect(run(guards, ok).passed).toBe(true);
    const r = run(guards, ok);
    expect(r.status).toBe(429);
    expect(r.body.error).toMatch(/envíos seguidos/);
  });

  it('un Origin ajeno se rechaza con 403 antes de gastar ningún cupo', () => {
    const guards = sec.createSendMissionGuards({ allowed, token, now: () => 0 });
    for (let i = 0; i < 50; i++) expect(run(guards, { origin: 'https://malo.example' }).status).toBe(403);
    expect(run(guards, { origin: 'http://localhost:5173', authorization: `Bearer ${token}` }).passed).toBe(true);
  });

  it('sin SERVER_TOKEN (uso local) deja pasar sin cabecera', () => {
    const guards = sec.createSendMissionGuards({ allowed, token: '', now: () => 0 });
    expect(run(guards, {}).passed).toBe(true);
  });
});
