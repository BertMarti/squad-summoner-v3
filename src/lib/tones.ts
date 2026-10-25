import type { ToneId } from '@/types'

export type { ToneId }

export interface ToneOption {
  id: ToneId
  label: string
  icon: string
  /** Explicación corta para la interfaz. */
  hint: string
}

export const DEFAULT_TONE: ToneId = 'epico'

/** Tonos disponibles, en el orden en que se muestran. */
export const TONES: readonly ToneOption[] = [
  { id: 'epico', label: 'Épico', icon: '🎖️', hint: 'Grandilocuente, como un tráiler de cine.' },
  { id: 'cutre', label: 'Cutre', icon: '🪫', hint: 'Presupuesto cero y entusiasmo justito.' },
  { id: 'pasivo', label: 'Pasivo-agresivo', icon: '🙂', hint: '«Tranquilos, no pasa nada si no venís… otra vez».' },
] as const

export function isToneId(value: unknown): value is ToneId {
  return typeof value === 'string' && TONES.some((t) => t.id === value)
}

/**
 * Instrucción de tono que se añade al prompt. El tono épico no añade nada (es el de las instrucciones de
 * cada juego); los demás mandan sobre el tono del juego pero conservan su ambientación.
 */
export const TONE_PROMPTS: Record<ToneId, string> = {
  epico: '',
  cutre: `TONO OBLIGATORIO (manda sobre el tono anterior): CUTRE. Convocatoria de presupuesto cero: épica de saldo,
excusas baratas, comparaciones caseras («el cuartel es mi salón»), algún emoji desganado. Que haga gracia, sin insultar.`,
  pasivo: `TONO OBLIGATORIO (manda sobre el tono anterior): PASIVO-AGRESIVO. Educado en apariencia y lleno de
indirectas («no pasa nada si no venís, ya me acostumbré»), recordando con falsa dulzura la última vez que alguien
faltó. Humor amable: nada de insultos reales ni de nombrar a nadie concreto como culpable.`,
}
