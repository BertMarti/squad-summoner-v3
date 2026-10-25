import { MAX_MESSAGE_LENGTH } from './mission'

/** Bloque de la encuesta rápida de asistencia que se añade al final de la transmisión. */
export const POLL_BLOCK = '📋 ¿VIENES? Responde con un emoji:\n✅ Voy\n❌ No puedo'

const SEPARATOR = '\n\n'

/** `true` si el texto ya lleva la encuesta (para no duplicarla al repetir). */
export function hasAttendancePoll(text: string): boolean {
  return text.trimEnd().endsWith(POLL_BLOCK)
}

/**
 * Añade la encuesta al final sin pasar de MAX_MESSAGE_LENGTH: si hiciera falta, recorta el cuerpo
 * (con «…») y conserva siempre la encuesta completa. Es determinista: no depende de la IA.
 */
export function withAttendancePoll(text: string): string {
  let body = text.trimEnd()
  // Si ya la lleva (p. ej. al repetir), se quita y se vuelve a poner: así el límite se cumple siempre.
  if (hasAttendancePoll(body)) body = body.slice(0, body.length - POLL_BLOCK.length).trimEnd()
  const room = MAX_MESSAGE_LENGTH - POLL_BLOCK.length - SEPARATOR.length
  const trimmed = body.length > room ? `${body.slice(0, room - 1).trimEnd()}…` : body
  return trimmed ? `${trimmed}${SEPARATOR}${POLL_BLOCK}` : POLL_BLOCK
}
