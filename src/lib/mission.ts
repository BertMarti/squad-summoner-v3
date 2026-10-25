import type { Mission } from '@/types'
import { DEFAULT_TONE, isToneId } from './tones'

/** Longitud máxima de cada campo que escribe el usuario. */
export const MAX_FIELD_LENGTH = 120
/** Longitud máxima del mensaje que se envía o comparte (igual que en el servidor). */
export const MAX_MESSAGE_LENGTH = 4000

export const GAME_IDS = ['sm2', 'hd2', 'mh', 'drg', 'd2', 'custom'] as const
export type GameId = (typeof GAME_IDS)[number]

/** Nombre visible de cada juego (tarjetas, modo demo con tono, historial). */
export const GAME_TITLES: Record<GameId, string> = {
  sm2: 'Space Marine 2',
  hd2: 'Helldivers 2',
  mh: 'Monster Hunter',
  drg: 'Deep Rock Galactic',
  d2: 'Destiny 2',
  custom: 'Personalizado',
}

export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && (GAME_IDS as readonly string[]).includes(value)
}

/**
 * Limpia un texto libre del usuario: quita caracteres de control y comillas
 * dobles (que romperían el prompt), colapsa espacios y recorta la longitud.
 */
export function cleanField(value: unknown, max = MAX_FIELD_LENGTH): string {
  if (typeof value !== 'string') return ''
  return (
    value
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f"`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max)
  )
}

/** Acepta solo horas HH:MM válidas (24 h). Devuelve '' si no lo es. */
export function cleanTime(value: unknown): string {
  if (typeof value !== 'string') return ''
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim())
  return m ? `${m[1]!.padStart(2, '0')}:${m[2]}` : ''
}

/** Devuelve una copia saneada de la misión, lista para el prompt o la demo. */
export function normalizeMission(data: Partial<Mission> | null | undefined): Mission {
  return {
    game: isGameId(data?.game) ? data!.game : '',
    subGame: cleanField(data?.subGame, 30),
    customGameName: cleanField(data?.customGameName, 60),
    recruits: cleanField(data?.recruits),
    time: cleanTime(data?.time),
    tone: isToneId(data?.tone) ? data.tone : DEFAULT_TONE,
    poll: data?.poll === true,
  }
}
