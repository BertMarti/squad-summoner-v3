import { ref } from 'vue'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Mission } from '@/types'
import { GEMINI_MODEL } from '@/config'
import { buildAudioPrompt, buildPrompt } from '@/lib/prompts'

// Las imágenes se sirven desde la propia app (public/games) para no depender de CDNs externos.
const asset = (file: string) => `${import.meta.env.BASE_URL}games/${file}`

// Lista de juegos centralizada
export const GAMES = [
  { id: 'sm2', title: 'Space Marine 2', icon: '⚔️', img: asset('sm2.svg') },
  { id: 'hd2', title: 'Helldivers 2', icon: '🏴', img: asset('hd2.svg') },
  { id: 'mh', title: 'Monster Hunter', icon: '🐾', img: asset('mh.svg') },
  { id: 'custom', title: 'Personalizado', icon: '🖊️', img: asset('custom.svg') },
] as const

/** Traduce los errores típicos de la API de Gemini a mensajes claros. */
export function friendlyGeminiError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error ?? '')
  if (/API[_ ]?key|API_KEY_INVALID|401|403/i.test(msg)) return 'La API key de Gemini no es válida o no tiene permisos.'
  if (/429|quota|rate/i.test(msg)) return 'Has superado el límite de uso de Gemini. Espera un poco y vuelve a intentarlo.'
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'No hay conexión con Gemini. Revisa tu conexión a internet.'
  if (/404|not found|model/i.test(msg)) return `El modelo «${GEMINI_MODEL}» no está disponible para tu clave.`
  return msg || 'Error al conectar con la IA.'
}

export function useGemini() {
  const isGenerating = ref(false)

  // --- GENERAR TEXTO (WHATSAPP) ---
  const generateText = async (apiKey: string, data: Partial<Mission>) => {
    if (!apiKey) throw new Error('Falta la API key de Gemini.')

    isGenerating.value = true
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
      const result = await model.generateContent(buildPrompt(data))
      const text = result.response.text().trim()
      if (!text) throw new Error('La IA ha devuelto una respuesta vacía.')
      return text
    } catch (error: unknown) {
      throw new Error(friendlyGeminiError(error))
    } finally {
      isGenerating.value = false
    }
  }

  // --- RESUMIR PARA AUDIO (Script de Radio) ---
  const summarizeForAudio = async (apiKey: string, fullText: string, gameId: string) => {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
    const result = await model.generateContent(buildAudioPrompt(fullText, gameId))
    return result.response.text()
  }

  // --- GENERAR AUDIO (TTS) ---
  const generateAudio = async (apiKey: string, textToSpeak: string) => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-tts' })
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: textToSpeak }] }],
      })
      const audioData = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
      if (audioData) return audioData
      throw new Error('No se recibieron datos de audio válidos del modelo.')
    } catch (err) {
      console.error('Error TTS:', err)
      return null
    }
  }

  return { isGenerating, generateText, summarizeForAudio, generateAudio, GAMES }
}
