import { describe, expect, it } from 'vitest'
import { assertDevTokenNotExposed, isOpenDevHost } from '../devHost'

describe('isOpenDevHost', () => {
  it('distingue los hosts locales de los abiertos a la red', () => {
    for (const h of [undefined, false, '', 'localhost', '127.0.0.1', '::1', '[::1]', ' LOCALHOST ']) {
      expect(isOpenDevHost(h)).toBe(false)
    }
    for (const h of [true, '0.0.0.0', '::', '192.168.1.50', 'mi-pi.local']) expect(isOpenDevHost(h)).toBe(true)
  })
})

describe('assertDevTokenNotExposed', () => {
  const token = 'token-de-prueba-0123456789abcdef'
  it('se niega a abrir «npm run dev» a la red con el token dentro y explica la alternativa', () => {
    expect(() => assertDevTokenNotExposed('serve', true, token)).toThrow(/npm run preview -- --host/)
    expect(() => assertDevTokenNotExposed('serve', '0.0.0.0', token)).toThrow(/VITE_SERVER_TOKEN/)
  })
  it('deja pasar en local, sin token o al compilar', () => {
    expect(() => assertDevTokenNotExposed('serve', undefined, token)).not.toThrow()
    expect(() => assertDevTokenNotExposed('serve', 'localhost', token)).not.toThrow()
    expect(() => assertDevTokenNotExposed('serve', true, '  ')).not.toThrow()
    expect(() => assertDevTokenNotExposed('serve', true, undefined)).not.toThrow()
    expect(() => assertDevTokenNotExposed('build', true, token)).not.toThrow()
  })
})
