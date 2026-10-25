/**
 * Traducción de los errores de Gemini (SDK `@google/genai`) a mensajes en español que dicen qué hacer.
 *
 * Formato REAL de los errores del SDK (comprobado contra la API el 24/10/2026):
 *   `ApiError` con `status` numérico (400, 404, 429…) y `message` = el cuerpo JSON de Google, p. ej.
 *   {"error":{"code":400,"message":"API key not valid…","status":"INVALID_ARGUMENT",
 *             "details":[{"@type":"…ErrorInfo","reason":"API_KEY_INVALID",…}]}}
 * Los fallos de red no pasan por `ApiError`: llega el `TypeError` del `fetch` del navegador
 * («Failed to fetch» en Chrome, «NetworkError…» en Firefox, «Load failed» en Safari).
 */

export type GeminiErrorKind =
  'clave' | 'limite' | 'conexion' | 'tiempo' | 'modelo' | 'saturado' | 'region' | 'peticion' | 'desconocido'

export interface GeminiErrorInfo {
  kind: GeminiErrorKind
  /** Código HTTP si lo hay. */
  httpStatus?: number
  /** Estado de Google («INVALID_ARGUMENT», «RESOURCE_EXHAUSTED»…). */
  apiStatus?: string
  /** Motivo de Google («API_KEY_INVALID»…). */
  reason?: string
  /** Mensaje original de Google (en inglés), sin la clave. */
  detail?: string
}

interface GoogleErrorBody {
  error?: { code?: number; message?: string; status?: string; details?: Array<{ reason?: string }> }
}

/** Intenta leer el JSON de Google que el SDK mete en `message`. */
function parseGoogleBody(message: string): GoogleErrorBody['error'] | undefined {
  const start = message.indexOf('{')
  if (start === -1) return undefined
  try {
    const body = JSON.parse(message.slice(start)) as GoogleErrorBody
    return body && typeof body === 'object' && body.error && typeof body.error === 'object' ? body.error : undefined
  } catch {
    return undefined
  }
}

/** Clasifica un error de Gemini usando `status` y el cuerpo JSON (nunca la URL ni texto libre ambiguo). */
export function classifyGeminiError(error: unknown): GeminiErrorInfo {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const name = error instanceof Error ? error.name : ''
  const rawStatus = (error as { status?: unknown } | null)?.status
  const body = parseGoogleBody(message)
  const httpStatus = typeof rawStatus === 'number' ? rawStatus : typeof body?.code === 'number' ? body.code : undefined
  const apiStatus = typeof body?.status === 'string' ? body.status : undefined
  const reason = body?.details?.find((d) => d && typeof d.reason === 'string')?.reason
  const detail = typeof body?.message === 'string' ? body.message : undefined
  const info = { httpStatus, apiStatus, reason, detail }

  if (httpStatus === undefined && !body) {
    if (name === 'AbortError' || name === 'TimeoutError' || /\b(aborted|timed? ?out)\b/i.test(message))
      return { kind: 'tiempo' }
    if (
      /^(Failed to fetch|Load failed|fetch failed)$|^NetworkError\b/.test(message) ||
      /NetworkError when attempting to fetch/.test(message)
    ) {
      return { kind: 'conexion' }
    }
    return { kind: 'desconocido', detail: message || undefined }
  }

  if (
    reason === 'API_KEY_INVALID' ||
    httpStatus === 401 ||
    httpStatus === 403 ||
    apiStatus === 'PERMISSION_DENIED' ||
    apiStatus === 'UNAUTHENTICATED'
  ) {
    return { kind: 'clave', ...info }
  }
  if (httpStatus === 429 || apiStatus === 'RESOURCE_EXHAUSTED') return { kind: 'limite', ...info }
  if (httpStatus === 404 || apiStatus === 'NOT_FOUND') return { kind: 'modelo', ...info }
  if (httpStatus === 503 || apiStatus === 'UNAVAILABLE') return { kind: 'saturado', ...info }
  if (httpStatus === 504 || apiStatus === 'DEADLINE_EXCEEDED') return { kind: 'tiempo', ...info }
  if (apiStatus === 'FAILED_PRECONDITION' && /location|region|country/i.test(detail ?? ''))
    return { kind: 'region', ...info }
  if (httpStatus === 400) return { kind: 'peticion', ...info }
  return { kind: 'desconocido', ...info }
}

/** Mensaje en español, con lo que tiene que hacer la persona. */
export function geminiErrorMessage(info: GeminiErrorInfo, model: string): string {
  switch (info.kind) {
    case 'clave':
      return 'La API key de Gemini no es válida o no tiene permisos. Cópiala otra vez desde Google AI Studio, pégala en «⚙️ CONFIGURAR API» y compruébala con «PROBAR CLAVE».'
    case 'limite':
      return 'Has superado el límite de uso gratuito de Gemini. Espera un minuto y vuelve a intentarlo (o usa el modo demo mientras tanto).'
    case 'conexion':
      return 'No hay conexión con Gemini. Revisa tu conexión a internet (o un bloqueador de anuncios) y vuelve a intentarlo.'
    case 'tiempo':
      return 'Gemini está tardando demasiado en responder. Vuelve a intentarlo en unos segundos.'
    case 'modelo':
      return `El modelo «${model}» no está disponible para tu clave. Prueba con otro modelo (por ejemplo gemini-2.5-flash).`
    case 'saturado':
      return 'Gemini está saturado ahora mismo. Vuelve a intentarlo en unos minutos.'
    case 'region':
      return 'Google no ofrece la API de Gemini en tu país o región. Puedes seguir usando el modo demo.'
    case 'peticion':
      return `Gemini ha rechazado la petición (400${info.detail ? `: ${info.detail}` : ''}).`
    default:
      if (info.httpStatus)
        return `Gemini ha devuelto un error (${info.httpStatus}${info.detail ? `: ${info.detail}` : ''}). Vuelve a intentarlo.`
      return info.detail || 'Error al conectar con la IA.'
  }
}

/** Atajo: error → mensaje en español. */
export function friendlyGeminiError(error: unknown, model: string): string {
  return geminiErrorMessage(classifyGeminiError(error), model)
}

/**
 * Comprobación de formato (sin red). Las claves de Google AI Studio empiezan por «AIza» y tienen 39 caracteres.
 * Devuelve un aviso en español o `null` si el formato parece correcto. Es solo una pista: la validación real
 * la hace `validateApiKey` contra Google.
 */
export function apiKeyFormatWarning(key: string): string | null {
  const k = key.trim()
  if (!k) return 'Pega tu clave de Gemini.'
  if (/\s/.test(k)) return 'La clave no puede tener espacios: cópiala de nuevo.'
  if (!/^AIza[0-9A-Za-z_-]{35}$/.test(k))
    return 'No parece una clave de Gemini (suelen empezar por «AIza» y tener 39 caracteres). Revisa que la has copiado entera.'
  return null
}
