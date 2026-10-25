import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const tok = require('../lib/token.js');

/** Respuesta mínima estilo Express. */
function mockRes() {
  const res = { statusCode: 200, headers: {}, body: undefined };
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (body) => ((res.body = body), res);
  res.setHeader = (k, v) => {
    res.headers[k.toLowerCase()] = v;
  };
  return res;
}
const mockReq = (headers = {}) => ({ get: (name) => headers[name.toLowerCase()] });

describe('generateToken', () => {
  it('genera 256 bits en base64url, distintos cada vez', () => {
    const a = tok.generateToken();
    const b = tok.generateToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
    expect(tok.checkTokenConfig({ host: '0.0.0.0', token: a })).toEqual({ ok: true, required: true });
  });
});

describe('readBearer', () => {
  it('extrae el token de «Authorization: Bearer …»', () => {
    expect(tok.readBearer('Bearer abc.DEF_123-~+/=')).toBe('abc.DEF_123-~+/=');
    expect(tok.readBearer('bearer   xyz  ')).toBe('xyz');
  });
  it('rechaza otros esquemas, vacíos y basura', () => {
    expect(tok.readBearer(undefined)).toBe('');
    expect(tok.readBearer('Basic dXNlcjpwYXNz')).toBe('');
    expect(tok.readBearer('Bearer ')).toBe('');
    expect(tok.readBearer('Bearer a b')).toBe('');
    expect(tok.readBearer('Bearer a\nX-Inyectada: 1')).toBe('');
  });
});

describe('tokensMatch', () => {
  it('acepta solo el token exacto', () => {
    expect(tok.tokensMatch('secreto-de-prueba-123456789', 'secreto-de-prueba-123456789')).toBe(true);
    expect(tok.tokensMatch('secreto-de-prueba-123456789', 'secreto-de-prueba-12345678')).toBe(false);
    expect(tok.tokensMatch('secreto-de-prueba-123456789', 'SECRETO-DE-PRUEBA-123456789')).toBe(false);
  });
  it('nunca da por bueno un token vacío o que no sea texto', () => {
    expect(tok.tokensMatch('', '')).toBe(false);
    expect(tok.tokensMatch('abc', '')).toBe(false);
    expect(tok.tokensMatch('abc', undefined)).toBe(false);
    expect(tok.tokensMatch(undefined, 'abc')).toBe(false);
  });
  it('compara en tiempo constante (timingSafeEqual sobre resúmenes de igual longitud)', async () => {
    const crypto = require('node:crypto');
    const spy = vi.spyOn(crypto, 'timingSafeEqual');
    tok.tokensMatch('largo-largo-largo-largo-largo', 'x');
    expect(spy).toHaveBeenCalledTimes(1);
    const [a, b] = spy.mock.calls[0];
    expect(a.length).toBe(32);
    expect(b.length).toBe(32);
    spy.mockRestore();
  });
});

describe('isLoopbackHost', () => {
  it('distingue local de red', () => {
    for (const h of ['127.0.0.1', 'localhost', '::1', '[::1]', '127.1.2.3', 'LOCALHOST']) {
      expect(tok.isLoopbackHost(h)).toBe(true);
    }
    for (const h of ['0.0.0.0', '::', '192.168.1.50', '', undefined, '127.0.0.1.example.com']) {
      expect(tok.isLoopbackHost(h)).toBe(false);
    }
  });
});

describe('checkTokenConfig', () => {
  it('sin token en local: arranca sin exigirlo', () => {
    expect(tok.checkTokenConfig({ host: '127.0.0.1', token: '' })).toEqual({ ok: true, required: false });
  });
  it('abierto a la red sin token: no arranca y explica cómo arreglarlo', () => {
    const r = tok.checkTokenConfig({ host: '0.0.0.0', token: '  ' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/npm run setup/);
  });
  it('rechaza tokens cortos o con caracteres raros', () => {
    expect(tok.checkTokenConfig({ host: '127.0.0.1', token: 'corto' }).ok).toBe(false);
    expect(tok.checkTokenConfig({ host: '127.0.0.1', token: 'a'.repeat(30) + ' b' }).ok).toBe(false);
  });
});

describe('createTokenGuard', () => {
  const token = 'token-de-prueba-0123456789abcdef';

  it('sin token configurado deja pasar (uso local)', () => {
    const next = vi.fn();
    tok.createTokenGuard('')(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('con token correcto en la cabecera deja pasar', () => {
    const next = vi.fn();
    tok.createTokenGuard(token)(mockReq({ authorization: `Bearer ${token}` }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('sin token, con uno incorrecto o en otro esquema responde 401 sin llamar a next', () => {
    for (const authorization of [undefined, 'Bearer otro-token-0123456789abcdef', `Basic ${token}`, token]) {
      const next = vi.fn();
      const res = mockRes();
      tok.createTokenGuard(token)(mockReq({ authorization }), res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.headers['www-authenticate']).toBe('Bearer');
      expect(res.body.error).toMatch(/Token del servidor/);
      expect(JSON.stringify(res.body)).not.toContain(token);
    }
  });
});

describe('ensureServerToken (npm run setup)', () => {
  const fixed = () => 'T'.repeat(43);
  it('genera el token y lo comparte con la web si falta', () => {
    const { text, created } = tok.ensureServerToken('WHATSAPP_GROUP_ID=\nSERVER_TOKEN=\n', fixed);
    expect(created).toBe(true);
    expect(text).toContain(`SERVER_TOKEN=${'T'.repeat(43)}\n`);
    expect(text).toContain(`VITE_SERVER_TOKEN=${'T'.repeat(43)}\n`);
    expect(text).toContain('WHATSAPP_GROUP_ID=\n');
  });
  it('sustituye un token demasiado corto', () => {
    expect(tok.ensureServerToken('SERVER_TOKEN=1234\n', fixed).created).toBe(true);
  });
  it('no toca un token válido (ni añade VITE_SERVER_TOKEN si lo quitaste)', () => {
    const env = `SERVER_TOKEN=${'x'.repeat(40)}\n`;
    expect(tok.ensureServerToken(env, fixed)).toEqual({ text: env, created: false });
  });
});
