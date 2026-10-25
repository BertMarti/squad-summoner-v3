import { SERVER_URL } from '@/config'
import { isSendableMessage } from '@/lib/whatsapp'

/**
 * Envía la transmisión al servidor local (server/index.js), que la publica en el
 * grupo de WhatsApp configurado. Lanza un Error con un mensaje claro si falla.
 * Con `token` (SERVER_TOKEN) lo manda en la cabecera `Authorization: Bearer`, nunca en la URL.
 */
export async function sendToServer(
  message: string,
  {
    timeoutMs = 15_000,
    fetchImpl = fetch,
    token = '',
  }: { timeoutMs?: number; fetchImpl?: typeof fetch; token?: string } = {},
): Promise<void> {
  if (!isSendableMessage(message)) throw new Error('No hay ninguna transmisión válida para enviar.')
  const cleanToken = token.trim()
  if (/[^A-Za-z0-9._~+/=-]/.test(cleanToken)) {
    throw new Error(
      'El token del servidor tiene caracteres no válidos. Cópialo de nuevo del archivo .env (SERVER_TOKEN).',
    )
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cleanToken) headers.Authorization = `Bearer ${cleanToken}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let res: Response
  try {
    res = await fetchImpl(`${SERVER_URL}/send-mission`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
      signal: controller.signal,
    })
  } catch (e) {
    if ((e as Error)?.name === 'AbortError')
      throw new Error('El servidor de WhatsApp no responde (tiempo agotado).', { cause: e })
    throw new Error(`No se puede conectar con el servidor de WhatsApp en ${SERVER_URL}. ¿Lo has arrancado?`, {
      cause: e,
    })
  } finally {
    clearTimeout(timer)
  }

  let data: { success?: boolean; error?: string } = {}
  try {
    data = (await res.json()) as typeof data
  } catch {
    /* respuesta sin JSON */
  }
  if (res.status === 401 && !data.error) {
    throw new Error('El servidor pide un token (SERVER_TOKEN). Pégalo en ⚙️ CONFIGURAR API → Servidor.')
  }
  if (!res.ok || !data.success) {
    throw new Error(data.error || `El servidor respondió con el código ${res.status}.`)
  }
}
