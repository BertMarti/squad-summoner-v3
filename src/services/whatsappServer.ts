import { SERVER_URL } from '@/config'
import { isSendableMessage } from '@/lib/whatsapp'

/**
 * Envía la transmisión al servidor local (server/index.js), que la publica en el
 * grupo de WhatsApp configurado. Lanza un Error con un mensaje claro si falla.
 */
export async function sendToServer(message: string, { timeoutMs = 15_000, fetchImpl = fetch } = {}): Promise<void> {
  if (!isSendableMessage(message)) throw new Error('No hay ninguna transmisión válida para enviar.')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let res: Response
  try {
    res = await fetchImpl(`${SERVER_URL}/send-mission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    })
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw new Error('El servidor de WhatsApp no responde (tiempo agotado).')
    throw new Error(`No se puede conectar con el servidor de WhatsApp en ${SERVER_URL}. ¿Lo has arrancado?`)
  } finally {
    clearTimeout(timer)
  }

  let data: { success?: boolean; error?: string } = {}
  try {
    data = (await res.json()) as typeof data
  } catch {
    /* respuesta sin JSON */
  }
  if (!res.ok || !data.success) {
    throw new Error(data.error || `El servidor respondió con el código ${res.status}.`)
  }
}
