import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@google/genai'
import { generateWithGemini, validateApiKey } from '../gemini'
import { apiKeyFormatWarning, classifyGeminiError, friendlyGeminiError } from '../geminiErrors'

const MODEL = 'gemini-2.5-flash'
// Clave inventada con el formato de Google (no es real).
const KEY = 'AIza' + 'T'.repeat(35)

/** Cuerpo de error con el formato real de Google (el 400 se capturó de la API el 24/10/2026). */
const googleError = (code: number, status: string, message: string, reason?: string) => ({
  error: {
    code,
    message,
    status,
    ...(reason
      ? {
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
              reason,
              domain: 'googleapis.com',
              metadata: { service: 'generativelanguage.googleapis.com' },
            },
          ],
        }
      : {}),
  },
})
const REAL_400 = googleError(
  400,
  'INVALID_ARGUMENT',
  'API key not valid. Please pass a valid API key.',
  'API_KEY_INVALID',
)

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const okGenerate = (text: string) =>
  jsonResponse(200, { candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP', index: 0 }] })

/** Ejecuta el SDK real con un `fetch` simulado y devuelve el error tal y como lo lanza. */
async function sdkErrorFor(status: number, body: unknown): Promise<unknown> {
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: KEY, httpOptions: { fetch: async () => jsonResponse(status, body) } })
  try {
    await ai.models.generateContent({ model: MODEL, contents: 'hola' })
  } catch (error) {
    return error
  }
  throw new Error('Se esperaba un error')
}

afterEach(() => vi.restoreAllMocks())

describe('errores de Gemini con el formato real del SDK @google/genai', () => {
  it('el SDK lanza ApiError con status numérico y el JSON de Google en message', async () => {
    const error = await sdkErrorFor(400, REAL_400)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(400)
    expect(JSON.parse((error as Error).message)).toEqual(REAL_400)
  })

  it.each([
    [400, REAL_400, 'clave'],
    [403, googleError(403, 'PERMISSION_DENIED', "Method doesn't allow unregistered callers."), 'clave'],
    [401, googleError(401, 'UNAUTHENTICATED', 'Request had invalid authentication credentials.'), 'clave'],
    [
      429,
      googleError(
        429,
        'RESOURCE_EXHAUSTED',
        'You exceeded your current quota, please check your plan and billing details.',
      ),
      'limite',
    ],
    [
      404,
      googleError(
        404,
        'NOT_FOUND',
        'models/gemini-x is not found for API version v1beta, or is not supported for generateContent.',
      ),
      'modelo',
    ],
    [503, googleError(503, 'UNAVAILABLE', 'The model is overloaded. Please try again later.'), 'saturado'],
    [504, googleError(504, 'DEADLINE_EXCEEDED', 'Deadline expired before operation could complete.'), 'tiempo'],
    [400, googleError(400, 'FAILED_PRECONDITION', 'User location is not supported for the API use.'), 'region'],
    [400, googleError(400, 'INVALID_ARGUMENT', 'Request contains an invalid argument.'), 'peticion'],
    [500, googleError(500, 'INTERNAL', 'An internal error has occurred.'), 'desconocido'],
  ])('HTTP %i → %s', async (status, body, kind) => {
    expect(classifyGeminiError(await sdkErrorFor(status, body)).kind).toBe(kind)
  })

  it('un 404 no se confunde con el límite aunque el mensaje diga «generateContent»', async () => {
    const error = await sdkErrorFor(
      404,
      googleError(404, 'NOT_FOUND', 'models/x is not supported for generateContent.'),
    )
    expect(friendlyGeminiError(error, MODEL)).toContain(`«${MODEL}» no está disponible`)
  })

  it('un 500 da un mensaje en español con el código, sin JSON crudo', async () => {
    const msg = friendlyGeminiError(await sdkErrorFor(500, googleError(500, 'INTERNAL', 'Internal error')), MODEL)
    expect(msg).toBe('Gemini ha devuelto un error (500: Internal error). Vuelve a intentarlo.')
  })

  it('fallos de red de cada navegador y del tiempo de espera', () => {
    expect(classifyGeminiError(new TypeError('Failed to fetch')).kind).toBe('conexion')
    expect(classifyGeminiError(new TypeError('NetworkError when attempting to fetch resource.')).kind).toBe('conexion')
    expect(classifyGeminiError(new TypeError('Load failed')).kind).toBe('conexion')
    expect(classifyGeminiError(new TypeError('fetch failed')).kind).toBe('conexion')
    expect(classifyGeminiError(new DOMException('The operation was aborted.', 'AbortError')).kind).toBe('tiempo')
  })

  it('un error genérico conserva su mensaje y uno vacío da el mensaje por defecto', () => {
    expect(friendlyGeminiError(new Error('Algo inesperado'), MODEL)).toBe('Algo inesperado')
    expect(friendlyGeminiError(undefined, MODEL)).toBe('Error al conectar con la IA.')
  })
})

describe('generateWithGemini', () => {
  it('envía la clave solo en la cabecera x-goog-api-key, nunca en la URL, y no escribe en consola', async () => {
    const logs = [
      vi.spyOn(console, 'log'),
      vi.spyOn(console, 'warn'),
      vi.spyOn(console, 'error'),
      vi.spyOn(console, 'info'),
      vi.spyOn(console, 'debug'),
    ]
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => okGenerate('  ¡A las armas!  '))
    const text = await generateWithGemini(KEY, 'prompt', { model: MODEL, fetch: fetchMock })
    expect(text).toBe('¡A las armas!')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [input, init] = fetchMock.mock.calls[0]!
    const url = String(input)
    expect(url).toMatch(/^https:\/\/generativelanguage\.googleapis\.com\//)
    expect(url).toContain(`models/${MODEL}:generateContent`)
    expect(url).not.toContain(KEY)
    expect(new Headers(init?.headers).get('x-goog-api-key')).toBe(KEY)
    for (const spy of logs) expect(spy).not.toHaveBeenCalled()
  })

  it('traduce el error y el mensaje no contiene la clave', async () => {
    const fetchMock = async () => jsonResponse(400, REAL_400)
    const error = await generateWithGemini(KEY, 'prompt', { model: MODEL, fetch: fetchMock }).catch((e: Error) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toMatch(/^La API key de Gemini no es válida/)
    expect((error as Error).message).not.toContain(KEY)
  })

  it('sin clave no llama a la red', async () => {
    const fetchMock = vi.fn()
    await expect(generateWithGemini('  ', 'p', { model: MODEL, fetch: fetchMock })).rejects.toThrow(/Falta la API key/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('respuesta vacía → error claro', async () => {
    await expect(generateWithGemini(KEY, 'p', { model: MODEL, fetch: async () => okGenerate('   ') })).rejects.toThrow(
      /respuesta vacía/,
    )
  })
})

describe('validateApiKey', () => {
  it('consulta el modelo (GET, sin gastar cuota) con la clave en cabecera', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse(200, { name: `models/${MODEL}`, displayName: 'Gemini 2.5 Flash' }),
    )
    expect(await validateApiKey(KEY, { model: MODEL, fetch: fetchMock })).toEqual({ ok: true })
    const [input, init] = fetchMock.mock.calls[0]!
    expect(String(input)).toMatch(new RegExp(`/models/${MODEL.replace(/\./g, '\\.')}(\\?|$)`))
    expect(String(input)).not.toContain(KEY)
    expect((init?.method ?? 'GET').toUpperCase()).toBe('GET')
    expect(new Headers(init?.headers).get('x-goog-api-key')).toBe(KEY)
  })

  it('clave rechazada → mensaje en español', async () => {
    const res = await validateApiKey(KEY, { model: MODEL, fetch: async () => jsonResponse(400, REAL_400) })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toMatch(/no es válida/)
  })

  it('clave vacía → no llama a la red', async () => {
    const fetchMock = vi.fn()
    expect((await validateApiKey('', { model: MODEL, fetch: fetchMock })).ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('apiKeyFormatWarning', () => {
  it('acepta el formato de AI Studio y avisa de lo demás', () => {
    expect(apiKeyFormatWarning(KEY)).toBeNull()
    expect(apiKeyFormatWarning(`  ${KEY}\n`)).toBeNull()
    expect(apiKeyFormatWarning('')).toMatch(/Pega/)
    expect(apiKeyFormatWarning('AIza 123')).toMatch(/espacios/)
    expect(apiKeyFormatWarning('sk-123')).toMatch(/No parece/)
  })
})
