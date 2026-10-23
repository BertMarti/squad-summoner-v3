import { MAX_MESSAGE_LENGTH } from './mission'

/**
 * Enlace «Compartir en WhatsApp» (wa.me). Funciona sin servidor: abre WhatsApp
 * (web o app) con el texto listo para elegir el grupo y enviarlo a mano.
 */
export function buildWhatsappShareUrl(text: string): string {
  const message = text.trim().slice(0, MAX_MESSAGE_LENGTH)
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

/** `true` si el texto es una transmisión válida para enviar o compartir. */
export function isSendableMessage(text: unknown): text is string {
  return typeof text === 'string' && text.trim().length > 0 && text.length <= MAX_MESSAGE_LENGTH
}
