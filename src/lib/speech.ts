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
