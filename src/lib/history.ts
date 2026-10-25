import type { Mission } from '@/types'
import { normalizeMission } from './mission'
import { isSendableMessage } from './whatsapp'

/** Una transmisión generada (en memoria; solo se guarda si la persona marca «Recordar historial»). */
export interface HistoryEntry {
  id: string
  /** Fecha ISO 8601. */
  createdAt: string
  text: string
  mission: Mission
  source: 'ia' | 'demo'
}

/** Máximo de transmisiones que se conservan (las más recientes). */
export const MAX_HISTORY = 10

let counter = 0
/** Id único y sin datos personales. */
export function newEntryId(now: number = Date.now()): string {
  counter = (counter + 1) % 1_000_000
  return `${now.toString(36)}-${counter.toString(36)}`
}

/** Crea una entrada saneada. */
export function createEntry(
  text: string,
  mission: Partial<Mission>,
  source: HistoryEntry['source'],
  now: Date = new Date(),
): HistoryEntry {
  return {
    id: newEntryId(now.getTime()),
    createdAt: now.toISOString(),
    text,
    mission: normalizeMission(mission),
    source,
  }
}

/** Añade al principio (más reciente primero), quita duplicados exactos del texto y recorta a MAX_HISTORY. */
export function addEntry(list: readonly HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  if (!isSendableMessage(entry.text)) return [...list]
  return [entry, ...list.filter((e) => e.text !== entry.text)].slice(0, MAX_HISTORY)
}

function isEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    v.id.length <= 40 &&
    typeof v.createdAt === 'string' &&
    !Number.isNaN(Date.parse(v.createdAt)) &&
    isSendableMessage(v.text) &&
    (v.source === 'ia' || v.source === 'demo') &&
    typeof v.mission === 'object' &&
    v.mission !== null
  )
}

/**
 * Lee el historial guardado. El almacenamiento es compartido con otras webs del mismo origen: se valida
 * todo, se sanea la misión y se descarta lo que no encaje (nunca lanza).
 */
export function parseHistory(raw: string | null | undefined): HistoryEntry[] {
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data
      .filter(isEntry)
      .slice(0, MAX_HISTORY)
      .map((e) => ({
        id: e.id,
        createdAt: new Date(e.createdAt).toISOString(),
        text: e.text,
        mission: normalizeMission(e.mission),
        source: e.source,
      }))
  } catch {
    return []
  }
}

export function serializeHistory(list: readonly HistoryEntry[]): string {
  return JSON.stringify(list.slice(0, MAX_HISTORY))
}
