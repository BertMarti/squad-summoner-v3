import { describe, expect, it } from 'vitest'
import {
  MAX_SHARE_FRAGMENT,
  MAX_SHARE_JSON_BYTES,
  SHARE_ERRORS,
  ShareLinkError,
  buildShareLink,
  buildWhatsappLinkShare,
  decodeShareFragment,
  encodeShareFragment,
  fromBase64Url,
  hasShareFragment,
  shareMessage,
  toBase64Url,
  urlWithoutFragment,
  validateSharedPayload,
} from '@/lib/shareLink'
import { MAX_MESSAGE_LENGTH } from '@/lib/mission'
import { MAX_TEMPLATE_NAME } from '@/lib/templates'

const PAGE = 'https://bertmarti.github.io/squad-summoner-v3/'
const sample = { name: 'Viernes épico', text: '🚨 ¡{RECLUTAS}! A las {hora} en {juego}.\n\nNo faltéis.' }
const noCompression = {}

const fragmentOf = (payload: unknown, mode = 't') =>
  `#plantilla=1${mode}.${toBase64Url(new TextEncoder().encode(typeof payload === 'string' ? payload : JSON.stringify(payload)))}`

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function expectError(promise: Promise<unknown>, message: string) {
  await expect(promise).rejects.toBeInstanceOf(ShareLinkError)
  await expect(promise).rejects.toThrow(message)
}

describe('base64url', () => {
  it('ida y vuelta sin «+», «/» ni «=»', () => {
    const bytes = new Uint8Array(Array.from({ length: 300 }, (_, i) => (i * 37) % 256))
    const encoded = toBase64Url(bytes)
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
    expect([...fromBase64Url(encoded)]).toEqual([...bytes])
  })

  it('rechaza caracteres fuera del alfabeto y longitudes imposibles', () => {
    expect(() => fromBase64Url('abc+')).toThrow(SHARE_ERRORS.malformed)
    expect(() => fromBase64Url('abcde')).toThrow(SHARE_ERRORS.malformed)
  })
})

describe('encodeShareFragment / decodeShareFragment', () => {
  it('ida y vuelta comprimida (más corta que sin comprimir)', async () => {
    const long = { name: 'Larga', text: 'Atención, escuadrón: a las {hora} en {juego}. '.repeat(60).trim() }
    const packed = await encodeShareFragment(long)
    const plain = await encodeShareFragment(long, noCompression)
    expect(packed.startsWith('plantilla=1z.')).toBe(true)
    expect(plain.startsWith('plantilla=1t.')).toBe(true)
    expect(packed.length).toBeLessThan(plain.length / 2)
    expect(await decodeShareFragment(`#${packed}`)).toEqual(long)
    expect(await decodeShareFragment(plain)).toEqual(long)
  })

  it('conserva emojis, acentos y saltos de línea', async () => {
    expect(await decodeShareFragment(await encodeShareFragment(sample))).toEqual(sample)
  })

  it('sanea nombre y texto al compartir (controles y bidi fuera)', async () => {
    const fragment = await encodeShareFragment({ name: '  Mi‮   plantilla ', text: 'Hola\u0000 {reclutas}\r\n' })
    expect(await decodeShareFragment(fragment)).toEqual({ name: 'Mi plantilla', text: 'Hola {reclutas}' })
  })

  it('una plantilla de 4000 caracteres normales cabe en el enlace', async () => {
    const text = Array.from({ length: 400 }, (_, i) => `Frase ${i} ¡vamos!`)
      .join(' ')
      .slice(0, MAX_MESSAGE_LENGTH)
    const fragment = await encodeShareFragment({ name: 'Máxima', text })
    expect(fragment.length).toBeLessThanOrEqual(MAX_SHARE_FRAGMENT)
  })

  it('si el enlace pasaría del límite, lo dice con un mensaje claro', async () => {
    // Texto sin repeticiones (no se comprime) y con caracteres de 3 bytes: más de 6000 caracteres en base64.
    const text = Array.from({ length: 3000 }, (_, i) => String.fromCharCode(0x4e00 + ((i * 7919) % 20000))).join('')
    await expectError(encodeShareFragment({ name: 'Enorme', text }), SHARE_ERRORS.tooLongToShare)
  })

  it('no comparte plantillas sin nombre o vacías', async () => {
    await expectError(encodeShareFragment({ name: ' ', text: 'Hola' }), SHARE_ERRORS.noName)
    await expectError(encodeShareFragment({ name: 'Hola', text: ' \n ' }), SHARE_ERRORS.empty)
  })

  it('sin CompressionStream en el emisor también funciona (formato sin comprimir)', async () => {
    const fragment = await encodeShareFragment(sample, noCompression)
    expect(fragment.startsWith('plantilla=1t.')).toBe(true)
    expect(await decodeShareFragment(fragment, noCompression)).toEqual(sample)
  })

  it('un enlace comprimido en un navegador sin DecompressionStream explica qué hacer', async () => {
    const fragment = await encodeShareFragment({ name: 'Larga', text: 'Repetido. '.repeat(50) })
    await expectError(decodeShareFragment(fragment, noCompression), SHARE_ERRORS.unsupported)
  })
})

describe('validación estricta al abrir un enlace', () => {
  it('rechaza enlaces demasiado largos antes de decodificar nada', async () => {
    await expectError(decodeShareFragment(`#plantilla=1t.${'A'.repeat(MAX_SHARE_FRAGMENT)}`), SHARE_ERRORS.tooLong)
  })

  it('rechaza versiones o modos desconocidos, alfabeto inválido y restos pegados', async () => {
    for (const hash of [
      '#plantilla=',
      '#plantilla=2t.eyJ9',
      '#plantilla=1x.eyJ9',
      '#plantilla=1t.eyJ9.',
      '#plantilla=1t.<img src=x onerror=alert(1)>',
      '#plantilla=1t.abc%20def',
      '#otra=1t.eyJ9',
    ])
      await expectError(decodeShareFragment(hash), SHARE_ERRORS.malformed)
  })

  it('rechaza UTF-8 inválido y JSON roto', async () => {
    await expectError(
      decodeShareFragment(`#plantilla=1t.${toBase64Url(new Uint8Array([0xff, 0xfe, 0x7b]))}`),
      SHARE_ERRORS.damaged,
    )
    await expectError(decodeShareFragment(fragmentOf('{"n":"a","t":')), SHARE_ERRORS.invalid)
  })

  it('rechaza datos comprimidos corruptos', async () => {
    await expectError(
      decodeShareFragment(`#plantilla=1z.${toBase64Url(new Uint8Array([1, 2, 3, 4, 5, 6]))}`),
      SHARE_ERRORS.damaged,
    )
  })

  it('para la descompresión al pasar del tope (bomba de descompresión)', async () => {
    const bomb = await deflate(new TextEncoder().encode(' '.repeat(MAX_SHARE_JSON_BYTES * 10)))
    const hash = `#plantilla=1z.${toBase64Url(bomb)}`
    expect(hash.length).toBeLessThan(MAX_SHARE_FRAGMENT)
    await expectError(decodeShareFragment(hash), SHARE_ERRORS.tooLong)
  })

  it('exige un objeto con exactamente «n» y «t» de tipo texto', async () => {
    for (const payload of [
      [],
      'texto',
      null,
      42,
      { n: 'a' },
      { n: 'a', t: 'b', extra: 1 },
      { n: 1, t: 'b' },
      { n: 'a', t: ['b'] },
      { name: 'a', text: 'b' },
    ])
      await expectError(decodeShareFragment(fragmentOf(payload)), SHARE_ERRORS.invalid)
  })

  it('no se deja engañar con __proto__', async () => {
    await expectError(decodeShareFragment(fragmentOf('{"__proto__":{"n":"a"},"n":"a","t":"b"}')), SHARE_ERRORS.invalid)
  })

  it('motivos claros para nombre o texto fuera de límites', async () => {
    await expectError(decodeShareFragment(fragmentOf({ n: '   ', t: 'Hola' })), SHARE_ERRORS.noName)
    await expectError(
      decodeShareFragment(fragmentOf({ n: 'x'.repeat(MAX_TEMPLATE_NAME + 1), t: 'Hola' })),
      SHARE_ERRORS.nameTooLong,
    )
    await expectError(decodeShareFragment(fragmentOf({ n: 'Hola', t: '\n\t ' })), SHARE_ERRORS.empty)
    await expectError(
      decodeShareFragment(fragmentOf({ n: 'Hola', t: 'x'.repeat(MAX_MESSAGE_LENGTH + 1) })),
      SHARE_ERRORS.textTooLong,
    )
  })

  it('el HTML del enlace se devuelve como texto tal cual (la interfaz lo interpola, nunca lo inyecta)', async () => {
    const payload = { n: '<b>Hola</b>', t: '<img src=x onerror="alert(1)"> {reclutas}' }
    expect(await decodeShareFragment(fragmentOf(payload))).toEqual({ name: payload.n, text: payload.t })
  })

  it('quita controles y caracteres bidi del contenido recibido', async () => {
    expect(await decodeShareFragment(fragmentOf({ n: 'A‮B', t: 'x⁦y\u0007' }))).toEqual({ name: 'AB', text: 'xy' })
  })

  it('validateSharedPayload rechaza objetos con prototipo raro', () => {
    expect(() => validateSharedPayload(Object.create({ n: 'a', t: 'b' }))).toThrow(SHARE_ERRORS.invalid)
  })
})

describe('utilidades', () => {
  it('hasShareFragment', () => {
    expect(hasShareFragment('#plantilla=1z.abc')).toBe(true)
    expect(hasShareFragment('plantilla=')).toBe(true)
    expect(hasShareFragment('#otra')).toBe(false)
    expect(hasShareFragment('')).toBe(false)
    expect(hasShareFragment(undefined)).toBe(false)
  })

  it('buildShareLink sustituye cualquier fragmento previo y conserva la ruta', async () => {
    const link = await buildShareLink(sample, `${PAGE}?x=1#viejo`)
    expect(link.startsWith(`${PAGE}?x=1#plantilla=1`)).toBe(true)
    expect(await decodeShareFragment(new URL(link).hash)).toEqual(sample)
  })

  it('urlWithoutFragment', () => {
    expect(urlWithoutFragment(`${PAGE}#plantilla=1t.abc`)).toBe(PAGE)
    expect(urlWithoutFragment(PAGE)).toBe(PAGE)
  })

  it('mensaje y enlace de WhatsApp con el enlace completo (sin recortar a 4000)', () => {
    const link = `${PAGE}#plantilla=1t.${'A'.repeat(5000)}`
    expect(shareMessage('Mi\nplantilla', link)).toBe(
      `Te paso mi plantilla de Squad Summoner «Mi plantilla». Ábrela y guárdala en tus plantillas:\n${link}`,
    )
    const wa = new URL(buildWhatsappLinkShare('Mi plantilla', link))
    expect(wa.origin).toBe('https://wa.me')
    expect(wa.searchParams.get('text')).toContain(link)
  })
})
