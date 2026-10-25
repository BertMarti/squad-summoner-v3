import type { Fetch, GoogleGenAI } from '@google/genai'
import { friendlyGeminiError } from './geminiErrors'

/**
 * Cliente de Gemini con el SDK `@google/genai`.
 *
 * Seguridad: el SDK envía la clave en la cabecera `x-goog-api-key` (nunca en la URL) directamente a
 * generativelanguage.googleapis.com. Aquí no se registra nada en consola y los errores se traducen sin la clave.
 */

/** Tiempo máximo por petición (ms) para que la interfaz no se quede colgada. */
export const GEMINI_TIMEOUT_MS = 45_000

export interface GeminiOptions {
  model: string
  /** Solo para pruebas: `fetch` simulado. */
  fetch?: Fetch
  timeoutMs?: number
}

/** El SDK (~400 kB) se carga solo al usar la IA: la primera visita y el modo demo no lo descargan. */
async function createClient(apiKey: string, options: GeminiOptions): Promise<GoogleGenAI> {
  const { GoogleGenAI } = await import('@google/genai')
  return new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: options.timeoutMs ?? GEMINI_TIMEOUT_MS, ...(options.fetch ? { fetch: options.fetch } : {}) },
  })
}

/** Genera texto con el modelo indicado. Lanza `Error` con un mensaje en español. */
export async function generateWithGemini(apiKey: string, prompt: string, options: GeminiOptions): Promise<string> {
  const key = apiKey.trim()
  if (!key) throw new Error('Falta la API key de Gemini. Pulsa «⚙️ CONFIGURAR API» o usa el modo demo.')
  let text: string | undefined
  try {
    const response = await (await createClient(key, options)).models.generateContent({ model: options.model, contents: prompt })
    text = response.text
  } catch (error: unknown) {
    throw new Error(friendlyGeminiError(error, options.model), { cause: error })
  }
  const clean = (text ?? '').trim()
  if (!clean) throw new Error('La IA ha devuelto una respuesta vacía (puede que la haya bloqueado su filtro). Vuelve a intentarlo.')
  return clean
}

export type KeyCheck = { ok: true } | { ok: false; message: string }

/**
 * Comprueba la clave sin gastar cuota de generación: pide los datos del modelo configurado
 * (GET models/<modelo>). Así se valida a la vez la clave y que el modelo está disponible.
 */
export async function validateApiKey(apiKey: string, options: GeminiOptions): Promise<KeyCheck> {
  const key = apiKey.trim()
  if (!key) return { ok: false, message: 'Pega tu clave de Gemini.' }
  try {
    await (await createClient(key, options)).models.get({ model: options.model })
    return { ok: true }
  } catch (error: unknown) {
    return { ok: false, message: friendlyGeminiError(error, options.model) }
  }
}
