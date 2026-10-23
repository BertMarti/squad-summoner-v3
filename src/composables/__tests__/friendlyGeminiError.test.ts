import { describe, expect, it } from 'vitest'
import { friendlyGeminiError } from '@/composables/useGemini'
import { GEMINI_MODEL } from '@/config'

describe('friendlyGeminiError', () => {
  it('traduce API_KEY_INVALID', () => {
    const err = new Error('API_KEY_INVALID')
    expect(friendlyGeminiError(err)).toBe('La API key de Gemini no es válida o no tiene permisos.')
  })

  it('traduce 429 quota', () => {
    const err = new Error('429 quota exceeded')
    expect(friendlyGeminiError(err)).toBe('Has superado el límite de uso de Gemini. Espera un poco y vuelve a intentarlo.')
  })

  it('traduce Failed to fetch', () => {
    const err = new Error('Failed to fetch')
    expect(friendlyGeminiError(err)).toBe('No hay conexión con Gemini. Revisa tu conexión a internet.')
  })

  it('traduce 404 model not found', () => {
    const err = new Error('404 model not found')
    expect(friendlyGeminiError(err)).toBe(`El modelo «${GEMINI_MODEL}» no está disponible para tu clave.`)
  })

  it('devuelve el mensaje del Error genérico', () => {
    const err = new Error('Algo inesperado ocurrió')
    expect(friendlyGeminiError(err)).toBe('Algo inesperado ocurrió')
  })

  it('devuelve mensaje por defecto para valor no Error', () => {
    expect(friendlyGeminiError(undefined)).toBe('Error al conectar con la IA.')
  })
})
