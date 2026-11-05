import { MAX_MESSAGE_LENGTH } from './mission'
import { MAX_TEMPLATE_NAME, cleanTemplateName, cleanTemplateText } from './templates'

/**
 * Compartir una plantilla por enlace, sin servidor.
 *
 * - La plantilla (solo nombre y texto) va codificada en el FRAGMENTO de la URL (`#plantilla=…`): el navegador no envía
 *   el fragmento a ningún servidor, así que no llega a GitHub Pages ni a sus registros.
 * - Formato: `#plantilla=1z.<base64url>` (JSON `{"n":…,"t":…}` comprimido con deflate) o `#plantilla=1t.<base64url>`
 *   (sin comprimir, si el navegador no tiene `CompressionStream`).
 * - Al abrir un enlace TODO se valida (lo trae otra persona): tamaño del enlace, alfabeto, descompresión con tope,
 *   UTF-8 estricto, JSON con exactamente las claves `n` y `t`, nombre y texto dentro de los límites de una plantilla.
 *   El resultado se muestra siempre como texto (interpolación de Vue), nunca como HTML.
 */
export interface SharedTemplate {
  name: string
  text: string
}

/** Nombre del parámetro del fragmento. */
export const SHARE_PARAM = 'plantilla'
/** Longitud máxima del fragmento (sin «#»). Cabe de sobra en WhatsApp y en cualquier navegador. */
export const MAX_SHARE_FRAGMENT = 6000
/** Tope de bytes del JSON descomprimido (evita «bombas» de descompresión). 4000 caracteres en UTF-8 caben. */
export const MAX_SHARE_JSON_BYTES = 20_000

const FRAGMENT_PATTERN = /^plantilla=1([zt])\.([A-Za-z0-9_-]+)$/

export const SHARE_ERRORS = {
  tooLongToShare: `Esta plantilla es demasiado larga para compartirla por enlace (el enlace pasaría de ${MAX_SHARE_FRAGMENT} caracteres). Acórtala o usa ⬇️ EXPORTAR.`,
  tooLong: `El enlace es demasiado largo (máximo ${MAX_SHARE_FRAGMENT} caracteres): no es un enlace de plantilla válido.`,
  malformed: 'El enlace de plantilla está incompleto o mal copiado. Pide que te lo envíen de nuevo.',
  damaged: 'El enlace de plantilla está dañado: no se ha podido leer. Pide que te lo envíen de nuevo.',
  unsupported:
    'Tu navegador no puede abrir este enlace (no admite descompresión). Actualízalo o ábrelo con Chrome, Edge, Safari o Firefox recientes.',
  invalid: 'El enlace no contiene una plantilla válida de Squad Summoner.',
  noName: 'La plantilla del enlace no tiene nombre.',
  nameTooLong: `El nombre de la plantilla del enlace pasa de ${MAX_TEMPLATE_NAME} caracteres.`,
  empty: 'La plantilla del enlace está vacía.',
  textTooLong: `El texto de la plantilla del enlace pasa de ${MAX_MESSAGE_LENGTH} caracteres.`,
} as const

export class ShareLinkError extends Error {}

type StreamCtor = new (format: 'deflate') => TransformStream<Uint8Array, Uint8Array>
interface StreamApis {
  CompressionStream?: StreamCtor
  DecompressionStream?: StreamCtor
}
const globalStreams = (): StreamApis => globalThis as unknown as StreamApis

// --- base64url ---------------------------------------------------------------------------------------------------

export function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(value) || value.length % 4 === 1) throw new ShareLinkError(SHARE_ERRORS.malformed)
  let binary: string
  try {
    binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4))
  } catch {
    throw new ShareLinkError(SHARE_ERRORS.malformed)
  }
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// --- compresión ---------------------------------------------------------------------------------------------------

async function readAll(stream: ReadableStream<Uint8Array>, max: number): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > max) {
      void reader.cancel().catch(() => {})
      throw new ShareLinkError(SHARE_ERRORS.tooLong)
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

/**
 * Pasa los bytes por un CompressionStream/DecompressionStream escribiendo directamente en su lado `writable` (sin
 * `pipeThrough` desde otro ReadableStream: así no se mezclan implementaciones de streams distintas).
 */
async function transform(bytes: Uint8Array, Ctor: StreamCtor, max: number): Promise<Uint8Array> {
  const stream = new Ctor('deflate')
  const writer = stream.writable.getWriter()
  // Sin await: con datos grandes, write() espera a que alguien lea (contrapresión). Los errores salen al leer.
  writer.write(bytes).catch(() => {})
  writer.close().catch(() => {})
  return readAll(stream.readable, max)
}

async function deflate(bytes: Uint8Array, Ctor: StreamCtor): Promise<Uint8Array> {
  return transform(bytes, Ctor, MAX_SHARE_JSON_BYTES * 2)
}

async function inflate(bytes: Uint8Array, Ctor: StreamCtor): Promise<Uint8Array> {
  try {
    return await transform(bytes, Ctor, MAX_SHARE_JSON_BYTES)
  } catch (error) {
    if (error instanceof ShareLinkError) throw error
    throw new ShareLinkError(SHARE_ERRORS.damaged)
  }
}

// --- validación -----------------------------------------------------------------------------------------------------

/** Valida el contenido ya decodificado. Lanza ShareLinkError con el motivo en español. */
export function validateSharedPayload(data: unknown): SharedTemplate {
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.getPrototypeOf(data) !== Object.prototype)
    throw new ShareLinkError(SHARE_ERRORS.invalid)
  const keys = Object.keys(data).sort()
  if (keys.length !== 2 || keys[0] !== 'n' || keys[1] !== 't') throw new ShareLinkError(SHARE_ERRORS.invalid)
  const { n, t } = data as Record<string, unknown>
  if (typeof n !== 'string' || typeof t !== 'string') throw new ShareLinkError(SHARE_ERRORS.invalid)
  const name = cleanTemplateName(n)
  if (!name) throw new ShareLinkError(SHARE_ERRORS.noName)
  if (n.replace(/\s+/g, ' ').trim().length > MAX_TEMPLATE_NAME) throw new ShareLinkError(SHARE_ERRORS.nameTooLong)
  const text = cleanTemplateText(t)
  if (!text) throw new ShareLinkError(SHARE_ERRORS.empty)
  if (t.replace(/\r\n?/g, '\n').trim().length > MAX_MESSAGE_LENGTH) throw new ShareLinkError(SHARE_ERRORS.textTooLong)
  return { name, text }
}

// --- API ------------------------------------------------------------------------------------------------------------

/**
 * Codifica una plantilla como fragmento `plantilla=1z.…` (sin «#»). Comprime si el navegador puede y sale más corto.
 * Lanza ShareLinkError si la plantilla no es válida o el enlace pasaría del límite.
 */
export async function encodeShareFragment(
  template: SharedTemplate,
  apis: StreamApis = globalStreams(),
): Promise<string> {
  const clean = validateSharedPayload({ n: template.name, t: template.text })
  const json = new TextEncoder().encode(JSON.stringify({ n: clean.name, t: clean.text }))
  let mode = 't'
  let bytes: Uint8Array = json
  if (apis.CompressionStream) {
    try {
      const packed = await deflate(json, apis.CompressionStream)
      if (packed.byteLength < json.byteLength) {
        mode = 'z'
        bytes = packed
      }
    } catch {
      /* sin compresión: se envía tal cual */
    }
  }
  const fragment = `${SHARE_PARAM}=1${mode}.${toBase64Url(bytes)}`
  if (fragment.length > MAX_SHARE_FRAGMENT) throw new ShareLinkError(SHARE_ERRORS.tooLongToShare)
  return fragment
}

/** Enlace completo: la dirección de la app (sin fragmento previo) + `#plantilla=…`. */
export async function buildShareLink(
  template: SharedTemplate,
  pageUrl: string,
  apis: StreamApis = globalStreams(),
): Promise<string> {
  const base = pageUrl.split('#')[0]
  return `${base}#${await encodeShareFragment(template, apis)}`
}

/** `true` si el fragmento (`location.hash`, con o sin «#») es de una plantilla compartida. */
export function hasShareFragment(hash: string | null | undefined): boolean {
  return typeof hash === 'string' && hash.replace(/^#/, '').startsWith(`${SHARE_PARAM}=`)
}

/** Lee y valida una plantilla de `location.hash`. Lanza ShareLinkError con el motivo en español. */
export async function decodeShareFragment(hash: string, apis: StreamApis = globalStreams()): Promise<SharedTemplate> {
  const fragment = hash.replace(/^#/, '')
  if (fragment.length > MAX_SHARE_FRAGMENT) throw new ShareLinkError(SHARE_ERRORS.tooLong)
  const match = FRAGMENT_PATTERN.exec(fragment)
  if (!match) throw new ShareLinkError(SHARE_ERRORS.malformed)
  let bytes: Uint8Array = fromBase64Url(match[2]!)
  if (match[1] === 'z') {
    if (!apis.DecompressionStream) throw new ShareLinkError(SHARE_ERRORS.unsupported)
    bytes = await inflate(bytes, apis.DecompressionStream)
  } else if (bytes.byteLength > MAX_SHARE_JSON_BYTES) {
    throw new ShareLinkError(SHARE_ERRORS.tooLong)
  }
  let json: string
  try {
    json = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new ShareLinkError(SHARE_ERRORS.damaged)
  }
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new ShareLinkError(SHARE_ERRORS.invalid)
  }
  return validateSharedPayload(data)
}

/** Texto para WhatsApp u otras apps al compartir el enlace. */
export function shareMessage(name: string, link: string): string {
  return `Te paso mi plantilla de Squad Summoner «${cleanTemplateName(name)}». Ábrela y guárdala en tus plantillas:\n${link}`
}

/** Enlace de WhatsApp (`wa.me`) con el mensaje del enlace (no usa el recorte de 4000 de las transmisiones). */
export function buildWhatsappLinkShare(name: string, link: string): string {
  return `https://wa.me/?text=${encodeURIComponent(shareMessage(name, link))}`
}

/** Dirección actual sin el fragmento (para quitar `#plantilla=…` de la barra tras leerlo). */
export function urlWithoutFragment(href: string): string {
  return href.split('#')[0]!
}
