export interface LogEntry {
  ts: string
  text: string
}

export interface ProcessItem {
  id: number | string
  name: string
  emoji?: string
  detail?: string
  status?: 'queued' | 'running' | 'done' | 'cancelled'
}

/** Tono de la transmisión (ver `src/lib/tones.ts`). */
export type ToneId = 'epico' | 'cutre' | 'pasivo'

export interface Mission {
  game: string
  subGame: string
  customGameName: string
  recruits: string
  time: string
  /** Tono elegido; por defecto «épico». */
  tone: ToneId
  /** Añadir al final la encuesta rápida de asistencia (✅ voy / ❌ no puedo). */
  poll: boolean
}
