import { DEMO_BANNER } from './demo'
import { MAX_MESSAGE_LENGTH } from './mission'

/**
 * Lectura en voz alta con la Web Speech API del navegador (`speechSynthesis`): gratis, sin red propia y sin gastar
 * llamadas a Gemini. Aquí solo hay lógica pura (preparar el texto, elegir voz, trocear); el uso está en
 * `src/composables/useSpeech.ts`.
 */

/** Trozo máximo por frase: Chrome corta las locuciones largas (~15 s) si se pasan de golpe. */
export const MAX_CHUNK = 220

/** Explicación cuando el navegador no puede leer en voz alta. */
export const SPEECH_UNSUPPORTED =
  'Tu navegador no puede leer en voz alta (no tiene la Web Speech API). Prueba con Chrome, Edge, Safari o Firefox actualizados.'

/** Explicación cuando el navegador tiene la API pero no consigue leer (sin voces instaladas, error de síntesis). */
export const SPEECH_FAILED =
  'No se ha podido leer en voz alta: este navegador no tiene voces instaladas o ha fallado la síntesis. En Linux, instala speech-dispatcher (o espeak-ng) y reinicia el navegador.'

export interface VoiceLike {
  name: string
  lang: string
  localService?: boolean
  default?: boolean
}

/** `true` si el navegador tiene síntesis de voz. */
export function isSpeechSupported(win: unknown = typeof window === 'undefined' ? undefined : window): boolean {
  if (!win || typeof win !== 'object') return false
  const w = win as { speechSynthesis?: unknown; SpeechSynthesisUtterance?: unknown }
  return !!w.speechSynthesis && typeof w.SpeechSynthesisUtterance === 'function'
}

/**
 * Elige la mejor voz en español: primero es-ES, luego cualquier `es-*`; dentro de cada grupo, las locales (sin red)
 * y la predeterminada. `null` si no hay ninguna en español (se leerá con la voz por defecto y `lang="es-ES"`).
 */
export function pickSpanishVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  const lang = (v: VoiceLike) => v.lang.replace('_', '-').toLowerCase()
  const score = (v: VoiceLike) => (lang(v) === 'es-es' ? 4 : 0) + (v.localService ? 2 : 0) + (v.default ? 1 : 0)
  const spanish = voices.filter((v) => lang(v) === 'es' || lang(v).startsWith('es-'))
  if (!spanish.length) return null
  return [...spanish].sort((a, b) => score(b) - score(a))[0]!
}

// Emojis, selectores de variante, unión de anchura cero y banderas: la voz los leería como «cara sonriente…».
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u{FE0F}|\u{200D}|\u{20E3}|[\u{1F3FB}-\u{1F3FF}]/gu

/**
 * Prepara la transmisión para leerla: quita la marca de demo, emojis y adornos (+++, ***, ---) y colapsa espacios,
 * conservando los saltos de párrafo como pausas.
 */
export function textForSpeech(text: string): string {
  let body = typeof text === 'string' ? text.slice(0, MAX_MESSAGE_LENGTH) : ''
  if (body.startsWith(DEMO_BANNER)) body = body.slice(DEMO_BANNER.length)
  return body
    .replace(EMOJI, ' ')
    .replace(/[+*=_~#|<>]{2,}/g, ' ')
    .replace(/-{3,}/g, ' ')
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => /[\p{L}\p{N}]/u.test(line))
    .join('\n')
}

/** Trocea el texto en frases de como mucho `max` caracteres (por líneas, luego por puntuación, luego por espacios). */
export function splitForSpeech(text: string, max = MAX_CHUNK): string[] {
  const chunks: string[] = []
  for (const line of text.split('\n')) {
    const sentences = line.match(/[^.!?¡¿…]+[.!?…]*|[¡¿][^.!?…]*[.!?…]*/g) ?? [line]
    let current = ''
    const flush = () => {
      if (current.trim()) chunks.push(current.trim())
      current = ''
    }
    for (const sentence of sentences) {
      if ((current + sentence).length <= max) {
        current += sentence
        continue
      }
      flush()
      if (sentence.length <= max) {
        current = sentence
        continue
      }
      for (const word of sentence.split(/\s+/)) {
        if ((current + ' ' + word).trim().length > max) flush()
        current = current ? `${current} ${word.slice(0, max)}` : word.slice(0, max)
      }
    }
    flush()
  }
  return chunks
}

// --- Voz y velocidad elegidas -----------------------------------------------------------------------------------

/** Velocidades ofrecidas (valores razonables: más lento cuesta escucharlo y más rápido no se entiende). */
export const SPEECH_RATES = [
  { value: 0.7, label: 'Muy lenta (0,7×)' },
  { value: 0.85, label: 'Lenta (0,85×)' },
  { value: 1, label: 'Normal (1×)' },
  { value: 1.15, label: 'Algo rápida (1,15×)' },
  { value: 1.3, label: 'Rápida (1,3×)' },
  { value: 1.5, label: 'Muy rápida (1,5×)' },
] as const

export const DEFAULT_RATE = 1

/** Frase del botón PROBAR VOZ. */
export const SPEECH_SAMPLE = '¡Atención, escuadrón! Así sonará la transmisión. Reunión a las 21:30, no faltéis.'

/** Aviso cuando el navegador no ofrece voces para elegir (se usa la del sistema). */
export const NO_VOICES_HELP =
  'Este navegador no ofrece voces para elegir: se usará la voz del sistema. Puedes cambiar la velocidad igualmente.'

/** Preferencias de lectura. `voice` es el identificador de la voz (`voiceURI` o nombre); '' = automática. */
export interface SpeechPrefs {
  voice: string
  rate: number
}

export const DEFAULT_SPEECH_PREFS: SpeechPrefs = { voice: '', rate: DEFAULT_RATE }

/** Largo máximo de un identificador de voz guardado. */
export const MAX_VOICE_ID = 200

/** Velocidad válida más cercana; si no es un número finito, la normal. */
export function normalizeRate(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(n)) return DEFAULT_RATE
  return SPEECH_RATES.reduce<number>(
    (best, r) => (Math.abs(r.value - n) < Math.abs(best - n) ? r.value : best),
    SPEECH_RATES[0].value,
  )
}

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/

/** Identificador de voz válido para guardar ('' si no lo es). */
export function cleanVoiceId(value: unknown): string {
  if (typeof value !== 'string' || value.length > MAX_VOICE_ID || CONTROL.test(value)) return ''
  return value.trim()
}

/**
 * Lee las preferencias guardadas (`squad-summoner-v3:voz`). El origen es compartido: se valida todo y lo que no encaje
 * vuelve a los valores por defecto (nunca lanza).
 */
export function parseSpeechPrefs(raw: string | null | undefined): SpeechPrefs {
  if (typeof raw !== 'string' || raw.length > 1000) return { ...DEFAULT_SPEECH_PREFS }
  try {
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ...DEFAULT_SPEECH_PREFS }
    const d = data as Record<string, unknown>
    return { voice: cleanVoiceId(d.voice), rate: normalizeRate(d.rate) }
  } catch {
    return { ...DEFAULT_SPEECH_PREFS }
  }
}

export function serializeSpeechPrefs(prefs: SpeechPrefs): string {
  return JSON.stringify({ voice: cleanVoiceId(prefs.voice), rate: normalizeRate(prefs.rate) })
}

export interface VoiceWithId extends VoiceLike {
  voiceURI?: string
}

/** Identificador estable de una voz en este navegador. */
export function voiceId(voice: VoiceWithId): string {
  return (voice.voiceURI || voice.name || '').slice(0, MAX_VOICE_ID)
}

const isSpanish = (v: VoiceLike) => {
  const lang = v.lang.replace('_', '-').toLowerCase()
  return lang === 'es' || lang.startsWith('es-')
}

/**
 * Voces para el selector: primero las españolas (es-ES y locales delante), luego el resto por idioma y nombre.
 * Sin repetidos ni voces sin nombre.
 */
export function groupVoices<T extends VoiceWithId>(voices: readonly T[]): { spanish: T[]; others: T[] } {
  const seen = new Set<string>()
  const unique = voices.filter((v) => {
    const id = voiceId(v)
    if (!id || !v.name || seen.has(id)) return false
    seen.add(id)
    return true
  })
  const lang = (v: VoiceLike) => v.lang.replace('_', '-').toLowerCase()
  const score = (v: VoiceLike) => (lang(v) === 'es-es' ? 4 : 0) + (v.localService ? 2 : 0) + (v.default ? 1 : 0)
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, 'es')
  const spanish = unique.filter(isSpanish).sort((a, b) => score(b) - score(a) || byName(a, b))
  const others = unique.filter((v) => !isSpanish(v)).sort((a, b) => lang(a).localeCompare(lang(b)) || byName(a, b))
  return { spanish, others }
}

/** Busca la voz elegida entre las disponibles (`null` si no está en este dispositivo o es «automática»). */
export function findVoice<T extends VoiceWithId>(voices: readonly T[], id: string): T | null {
  if (!id) return null
  return voices.find((v) => voiceId(v) === id) ?? null
}

/** Texto de una voz en el selector: «Mónica (es-ES)». */
export function voiceLabel(voice: VoiceLike): string {
  return `${voice.name} (${voice.lang.replace('_', '-')})`
}
