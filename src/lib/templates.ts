import type { Mission } from '@/types'
import { DEMO_BANNER } from './demo'
import { GAME_TITLES, MAX_MESSAGE_LENGTH, isGameId, normalizeMission } from './mission'
import { POLL_BLOCK } from './poll'

/**
 * Plantillas propias: mensajes favoritos que la persona guarda para reutilizarlos sin gastar llamadas a Gemini.
 *
 * - Se guardan en este navegador (clave `squad-summoner-v3:plantillas`). El origen https://bertmarti.github.io es
 *   compartido con otras webs: todo lo leído (almacenamiento o archivo importado) se valida y se sanea.
 * - Variables: {juego}, {hora} y {reclutas} se sustituyen por los datos de la misión al usarla; en MAYÚSCULAS
 *   ({JUEGO}, {HORA}, {RECLUTAS}) el valor sale en mayúsculas.
 * - El texto se muestra siempre como texto (interpolación de Vue): nunca como HTML.
 */
export interface UserTemplate {
  id: string
  name: string
  text: string
  /** Fecha ISO 8601 de creación. */
  createdAt: string
  /** Fecha ISO 8601 de la última edición. */
  updatedAt: string
}

/** Máximo de plantillas guardadas. */
export const MAX_TEMPLATES = 30
/** Longitud máxima del nombre. */
export const MAX_TEMPLATE_NAME = 60
/** Tamaño máximo de un archivo de importación (bytes). */
export const MAX_IMPORT_BYTES = 200_000
/** Tamaño máximo de lo guardado en el navegador (30 plantillas de 4000 caracteres con escapes JSON caben de sobra). */
export const MAX_STORED_CHARS = 500_000
/** Identificación del formato de exportación. */
export const EXPORT_APP = 'squad-summoner-v3'
export const EXPORT_KIND = 'plantillas'
export const EXPORT_VERSION = 1

/** Variables admitidas (en minúsculas; en mayúsculas el valor sale en mayúsculas). */
export const TEMPLATE_VARIABLES = ['juego', 'hora', 'reclutas'] as const
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number]

/** Texto de ayuda de las variables (interfaz y README). */
export const VARIABLES_HELP =
  'Variables: {juego}, {hora} y {reclutas} se rellenan con los datos de la misión al usar la plantilla. En mayúsculas ({RECLUTAS}) salen en mayúsculas.'

/** Valores por defecto cuando falta el dato en la misión. */
export const VARIABLE_FALLBACKS: Record<TemplateVariable, string> = {
  juego: 'la partida',
  hora: 'YA MISMO',
  reclutas: 'escuadrón',
}

// Caracteres de control (menos \n y \t) y de control de dirección bidi (texto «troyano»).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g

/** Limpia el nombre: sin controles, espacios colapsados y como mucho MAX_TEMPLATE_NAME caracteres. */
export function cleanTemplateName(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\r\n\t]/g, ' ')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEMPLATE_NAME)
}

/** Limpia el texto: saltos de línea normalizados, sin controles, y como mucho MAX_MESSAGE_LENGTH caracteres. */
export function cleanTemplateText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(/[ \t]+$/gm, '')
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH)
}

/** Valores de las variables para una misión (ya saneada). */
export function templateValues(raw: Partial<Mission> | null | undefined): Record<TemplateVariable, string> {
  const m = normalizeMission(raw)
  const game = isGameId(m.game)
    ? m.game === 'custom'
      ? m.customGameName || VARIABLE_FALLBACKS.juego
      : m.game === 'mh' && m.subGame
        ? `${GAME_TITLES.mh} ${m.subGame}`
        : GAME_TITLES[m.game]
    : VARIABLE_FALLBACKS.juego
  return {
    juego: game,
    hora: m.time || VARIABLE_FALLBACKS.hora,
    reclutas: m.recruits || VARIABLE_FALLBACKS.reclutas,
  }
}

const VARIABLE_PATTERN = /\{(juego|hora|reclutas)\}/gi

/**
 * Rellena las variables de una plantilla con los datos de la misión. Lo que no sea una variable conocida se deja tal
 * cual. El resultado nunca pasa de MAX_MESSAGE_LENGTH.
 */
export function renderTemplate(text: string, mission: Partial<Mission> | null | undefined): string {
  const values = templateValues(mission)
  const out = cleanTemplateText(text).replace(VARIABLE_PATTERN, (match: string, name: string) => {
    const value = values[name.toLowerCase() as TemplateVariable]
    return match === match.toUpperCase() ? value.toUpperCase() : value
  })
  return out.length > MAX_MESSAGE_LENGTH ? `${out.slice(0, MAX_MESSAGE_LENGTH - 1).trimEnd()}…` : out
}

/** Variables que usa un texto (en minúsculas y sin repetir), para mostrarlas en la lista. */
export function usedVariables(text: string): TemplateVariable[] {
  const found = new Set<TemplateVariable>()
  for (const match of text.matchAll(VARIABLE_PATTERN)) found.add(match[1]!.toLowerCase() as TemplateVariable)
  return TEMPLATE_VARIABLES.filter((name) => found.has(name))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Convierte una transmisión ya generada en plantilla: quita la marca de demo y la encuesta (se añade al usarla si
 * está marcada) y, si `useVariables`, cambia los reclutas, la hora y el juego de la misión por sus variables.
 */
export function textToTemplate(
  text: string,
  mission: Partial<Mission> | null | undefined,
  useVariables = true,
): string {
  let body = cleanTemplateText(text)
  if (body.startsWith(DEMO_BANNER)) body = body.slice(DEMO_BANNER.length).trim()
  if (body.endsWith(POLL_BLOCK)) body = body.slice(0, body.length - POLL_BLOCK.length).trim()
  if (!useVariables) return body
  const m = normalizeMission(mission)
  const values = templateValues(m)
  const replacements: [string, TemplateVariable][] = []
  if (m.recruits) replacements.push([m.recruits, 'reclutas'])
  if (m.time) replacements.push([m.time, 'hora'])
  // Sin hora, la demo escribe «YA MISMO»: así la plantilla tomará la hora que se ponga después.
  else replacements.push([VARIABLE_FALLBACKS.hora, 'hora'])
  if (isGameId(m.game) && values.juego !== VARIABLE_FALLBACKS.juego) replacements.push([values.juego, 'juego'])
  // Los valores más largos primero, para que uno no se coma parte de otro.
  replacements.sort((a, b) => b[0].length - a[0].length)
  for (const [value, name] of replacements) {
    if (value.length < 2) continue
    const upper = value.toUpperCase()
    // Solo palabras completas: «Alex» no toca «Alexandra».
    const whole = (v: string) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(v)}(?![\\p{L}\\p{N}])`, 'gu')
    if (upper !== value) body = body.replace(whole(upper), `{${name.toUpperCase()}}`)
    body = body.replace(whole(value), `{${name}}`)
  }
  return body
}

let counter = 0
/** Id único y sin datos personales. */
export function newTemplateId(now: number = Date.now()): string {
  counter = (counter + 1) % 1_000_000
  return `p-${now.toString(36)}-${counter.toString(36)}`
}

/** Comprueba nombre y texto antes de guardar. Devuelve el motivo en español o '' si está bien. */
export function validateTemplateInput(name: unknown, text: unknown): string {
  if (!cleanTemplateName(name)) return 'Ponle un nombre a la plantilla.'
  if (!cleanTemplateText(text)) return 'La plantilla no puede estar vacía.'
  if (typeof text === 'string' && text.replace(/\r\n?/g, '\n').trim().length > MAX_MESSAGE_LENGTH)
    return `El texto pasa de ${MAX_MESSAGE_LENGTH} caracteres: acórtalo.`
  return ''
}

/** Crea una plantilla saneada. */
export function createTemplate(name: string, text: string, now: Date = new Date()): UserTemplate {
  const iso = now.toISOString()
  return {
    id: newTemplateId(now.getTime()),
    name: cleanTemplateName(name),
    text: cleanTemplateText(text),
    createdAt: iso,
    updatedAt: iso,
  }
}

/** Nombre que no choca con los existentes (añade « (2)», « (3)»…). */
export function uniqueName(name: string, list: readonly UserTemplate[], exceptId?: string): string {
  const taken = new Set(list.filter((t) => t.id !== exceptId).map((t) => t.name.toLocaleLowerCase('es')))
  const base = cleanTemplateName(name)
  if (!taken.has(base.toLocaleLowerCase('es'))) return base
  for (let i = 2; i < 100; i++) {
    const suffix = ` (${i})`
    const candidate = `${base.slice(0, MAX_TEMPLATE_NAME - suffix.length).trimEnd()}${suffix}`
    if (!taken.has(candidate.toLocaleLowerCase('es'))) return candidate
  }
  return base
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value))
}

/** Valida una plantilla leída del almacenamiento (no lanza). */
function toStoredTemplate(value: unknown): UserTemplate | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(v.id)) return null
  if (typeof v.text !== 'string' || v.text.length > MAX_MESSAGE_LENGTH * 2) return null
  const name = cleanTemplateName(v.name)
  const text = cleanTemplateText(v.text)
  if (!name || !text || !isIsoDate(v.createdAt) || !isIsoDate(v.updatedAt)) return null
  return {
    id: v.id,
    name,
    text,
    createdAt: new Date(v.createdAt).toISOString(),
    updatedAt: new Date(v.updatedAt).toISOString(),
  }
}

/**
 * Lee las plantillas guardadas. Otras webs del mismo origen podrían escribir en la clave: se valida todo y se
 * descarta lo que no encaje (nunca lanza). `null` si lo guardado no es una lista (basura ajena).
 */
export function parseTemplates(raw: string | null | undefined): UserTemplate[] | null {
  if (raw === null || raw === undefined) return []
  // Otra web del origen podría dejar aquí varios MB: no se analiza nada que no pueda ser nuestro.
  if (raw.length > MAX_STORED_CHARS) return null
  try {
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return null
    const seen = new Set<string>()
    const out: UserTemplate[] = []
    for (const item of data.slice(0, MAX_TEMPLATES * 2)) {
      const t = toStoredTemplate(item)
      if (!t || seen.has(t.id)) continue
      seen.add(t.id)
      out.push(t)
      if (out.length >= MAX_TEMPLATES) break
    }
    return out
  } catch {
    return null
  }
}

export function serializeTemplates(list: readonly UserTemplate[]): string {
  return JSON.stringify(list.slice(0, MAX_TEMPLATES))
}

/** Archivo de exportación (sin ids internos ni datos de la misión: solo nombre y texto). */
export interface TemplatesExport {
  app: typeof EXPORT_APP
  tipo: typeof EXPORT_KIND
  version: typeof EXPORT_VERSION
  exportadoEl: string
  plantillas: { nombre: string; texto: string }[]
}

export function exportTemplates(list: readonly UserTemplate[], now: Date = new Date()): string {
  const data: TemplatesExport = {
    app: EXPORT_APP,
    tipo: EXPORT_KIND,
    version: EXPORT_VERSION,
    exportadoEl: now.toISOString(),
    plantillas: list.slice(0, MAX_TEMPLATES).map((t) => ({ nombre: t.name, texto: t.text })),
  }
  return `${JSON.stringify(data, null, 2)}\n`
}

/** Nombre del archivo de exportación (fecha local AAAA-MM-DD). */
export function exportFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `squad-summoner-plantillas-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}

export interface ImportResult {
  /** Lista final (existentes + nuevas). */
  list: UserTemplate[]
  added: number
  /** Ya existían (mismo nombre y texto). */
  duplicated: number
  /** Entradas no válidas descartadas. */
  invalid: number
  /** No cabían por el límite de MAX_TEMPLATES. */
  overLimit: number
}

export class TemplateImportError extends Error {}

/**
 * Importa un archivo exportado. Lanza `TemplateImportError` (mensaje en español) si el archivo no es válido; si lo
 * es, añade las plantillas nuevas al final sin tocar las existentes.
 */
export function importTemplates(raw: string, current: readonly UserTemplate[], now: Date = new Date()): ImportResult {
  if (raw.length > MAX_IMPORT_BYTES) throw new TemplateImportError('El archivo es demasiado grande (máximo 200 kB).')
  let data: unknown
  try {
    data = JSON.parse(raw.replace(/^\uFEFF/, ''))
  } catch {
    throw new TemplateImportError('El archivo no es un JSON válido.')
  }
  const d = data as Partial<TemplatesExport> | null
  if (!d || typeof d !== 'object' || d.app !== EXPORT_APP || d.tipo !== EXPORT_KIND || !Array.isArray(d.plantillas))
    throw new TemplateImportError('Este archivo no es una exportación de plantillas de Squad Summoner.')
  if (d.version !== EXPORT_VERSION)
    throw new TemplateImportError('Versión de archivo no compatible: exporta de nuevo con esta versión de la app.')

  const list = [...current]
  const result: ImportResult = { list, added: 0, duplicated: 0, invalid: 0, overLimit: 0 }
  const items = d.plantillas as unknown[]
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown> | null
    const name = cleanTemplateName(item && typeof item === 'object' ? item.nombre : '')
    const rawText = item && typeof item === 'object' ? item.texto : ''
    const text = cleanTemplateText(rawText)
    // Un texto de más de 4000 caracteres no se recorta en silencio: cuenta como no válido.
    if (!name || !text || typeof rawText !== 'string' || validateTemplateInput(name, rawText)) {
      result.invalid++
      continue
    }
    if (list.some((t) => t.name === name && t.text === text)) {
      result.duplicated++
      continue
    }
    if (list.length >= MAX_TEMPLATES) {
      result.overLimit++
      continue
    }
    list.push(createTemplate(uniqueName(name, list), text, new Date(now.getTime() + i)))
    result.added++
  }
  return result
}

/** Resumen en español de una importación. */
export function describeImport(r: Omit<ImportResult, 'list'>): string {
  const parts = [`${r.added} ${r.added === 1 ? 'plantilla importada' : 'plantillas importadas'}`]
  if (r.duplicated) parts.push(`${r.duplicated} ya existía${r.duplicated === 1 ? '' : 'n'}`)
  if (r.invalid)
    parts.push(`${r.invalid} no válida${r.invalid === 1 ? '' : 's'} descartada${r.invalid === 1 ? '' : 's'}`)
  if (r.overLimit) parts.push(`${r.overLimit} no cabía${r.overLimit === 1 ? '' : 'n'} (máximo ${MAX_TEMPLATES})`)
  return `${parts.join(', ')}.`
}
