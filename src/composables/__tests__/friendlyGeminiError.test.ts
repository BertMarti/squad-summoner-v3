import { describe, expect, it } from 'vitest'
import { friendlyGeminiError } from '@/composables/useGemini'
import { GEMINI_MODEL } from '@/config'

// Formato real de los errores de @google/generative-ai:
// «[GoogleGenerativeAI Error]: Error fetching from <url>:generateContent: [STATUS Texto] mensaje»
const URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const sdkError = (status: string, detail = '') =>
  new Error(`[GoogleGenerativeAI Error]: Error fetching from ${URL}: [${status}] ${detail}`.trim())

const CLAVE = 'La API key de Gemini no es válida o no tiene permisos.'
const LIMITE = 'Has superado el límite de uso de Gemini. Espera un poco y vuelve a intentarlo.'
const RED = 'No hay conexión con Gemini. Revisa tu conexión a internet.'
const MODELO = `El modelo «${GEMINI_MODEL}» no está disponible para tu clave.`
const SATURADO = 'Gemini está saturado ahora mismo. Vuelve a intentarlo en unos minutos.'

describe('friendlyGeminiError', () => {
  it('clave no válida (400 con API_KEY_INVALID, 401, 403)', () => {
    expect(friendlyGeminiError(sdkError('400 Bad Request', 'API key not valid. [{"reason":"API_KEY_INVALID"}]'))).toBe(CLAVE)
    expect(friendlyGeminiError(sdkError('401 Unauthorized', 'Request had invalid authentication credentials.'))).toBe(CLAVE)
    expect(friendlyGeminiError(sdkError('403 Forbidden', 'PERMISSION_DENIED'))).toBe(CLAVE)
  })

  it('límite de uso (429 / RESOURCE_EXHAUSTED)', () => {
    expect(friendlyGeminiError(sdkError('429 Too Many Requests', 'You exceeded your current quota.'))).toBe(LIMITE)
    expect(friendlyGeminiError(new Error('RESOURCE_EXHAUSTED'))).toBe(LIMITE)
  })

  it('modelo no disponible (404) no se confunde con el límite por «generateContent»', () => {
    expect(friendlyGeminiError(sdkError('404 Not Found', 'models/gemini-x is not found for API version v1beta.'))).toBe(MODELO)
  })

  it('servicio saturado (503)', () => {
    expect(friendlyGeminiError(sdkError('503 Service Unavailable', 'The model is overloaded.'))).toBe(SATURADO)
  })

  it('sin conexión (Failed to fetch, NetworkError, Load failed)', () => {
    expect(friendlyGeminiError(new TypeError('Failed to fetch'))).toBe(RED)
    expect(friendlyGeminiError(new Error(`[GoogleGenerativeAI Error]: Error fetching from ${URL}: NetworkError when attempting to fetch resource.`))).toBe(RED)
    expect(friendlyGeminiError(new TypeError('Load failed'))).toBe(RED)
  })

  it('un 500 genérico conserva su mensaje', () => {
    const err = sdkError('500 Internal Server Error', 'Internal error')
    expect(friendlyGeminiError(err)).toBe(err.message)
  })

  it('devuelve el mensaje del Error genérico', () => {
    expect(friendlyGeminiError(new Error('Algo inesperado ocurrió'))).toBe('Algo inesperado ocurrió')
  })

  it('devuelve mensaje por defecto para valor no Error', () => {
    expect(friendlyGeminiError(undefined)).toBe('Error al conectar con la IA.')
  })
})
