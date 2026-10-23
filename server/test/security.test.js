import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const sec = require('../lib/security.js')

describe('validateMissionBody', () => {
  it('rechaza cuerpos y tipos no válidos', () => {
    expect(sec.validateMissionBody(null).ok).toBe(false)
    expect(sec.validateMissionBody([]).ok).toBe(false)
    expect(sec.validateMissionBody({ message: 123 }).ok).toBe(false)
    expect(sec.validateMissionBody({ message: '   ' }).ok).toBe(false)
  })
  it('rechaza mensajes demasiado largos', () => {
    expect(sec.validateMissionBody({ message: 'x'.repeat(sec.MAX_MESSAGE_LENGTH + 1) }).ok).toBe(false)
  })
  it('limpia caracteres de control y conserva saltos de línea', () => {
    expect(sec.validateMissionBody({ message: ' Hola\u0000\nmundo\u0007 ' })).toEqual({ ok: true, message: 'Hola\nmundo' })
  })
})

describe('parseAllowedOrigins', () => {
  it('usa localhost por defecto', () => {
    expect(sec.parseAllowedOrigins(undefined)).toContain('http://localhost:5173')
  })
  it('normaliza y filtra la lista', () => {
    expect(sec.parseAllowedOrigins('https://bertmarti.github.io/ , javascript:alert(1), http://localhost:5173')).toEqual([
      'https://bertmarti.github.io',
      'http://localhost:5173',
    ])
  })
})

describe('isValidGroupId', () => {
  it('acepta IDs de grupo y rechaza el resto', () => {
    expect(sec.isValidGroupId('123456789-123456@g.us')).toBe(true)
    expect(sec.isValidGroupId('120363012345678901@g.us')).toBe(true)
    expect(sec.isValidGroupId('34600000000@c.us')).toBe(false)
    expect(sec.isValidGroupId('')).toBe(false)
  })
})

describe('createRateLimiter', () => {
  const fakeRes = () => {
    const res = { statusCode: 200, headers: {}, body: null }
    res.setHeader = (k, v) => { res.headers[k] = v }
    res.status = (c) => { res.statusCode = c; return res }
    res.json = (b) => { res.body = b; return res }
    return res
  }
  it('bloquea al superar el máximo dentro de la ventana', () => {
    let t = 0
    const limit = sec.createRateLimiter({ windowMs: 1000, max: 2, now: () => t })
    const next = vi.fn()
    limit({ ip: 'a' }, fakeRes(), next)
    limit({ ip: 'a' }, fakeRes(), next)
    const res = fakeRes()
    limit({ ip: 'a' }, res, next)
    expect(next).toHaveBeenCalledTimes(2)
    expect(res.statusCode).toBe(429)
    t = 2000
    limit({ ip: 'a' }, fakeRes(), next)
    expect(next).toHaveBeenCalledTimes(3)
  })
})

describe('securityHeaders', () => {
  it('pone las cabeceras básicas', () => {
    const headers = {}
    const res = { setHeader: (k, v) => { headers[k] = v }, removeHeader: () => {} }
    const next = vi.fn()
    sec.securityHeaders({}, res, next)
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(next).toHaveBeenCalled()
  })
})
