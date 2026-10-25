import { ref } from 'vue'
import type { Mission } from '@/types'
import { GEMINI_MODEL } from '@/config'
import { GAME_TITLES } from '@/lib/mission'
import { buildPrompt } from '@/lib/prompts'
import { generateWithGemini, validateApiKey } from '@/lib/gemini'

// Las imágenes se sirven desde la propia app (public/games) para no depender de CDNs externos.
const asset = (file: string) => `${import.meta.env.BASE_URL}games/${file}`

// Lista de juegos centralizada
export const GAMES = [
  { id: 'sm2', title: GAME_TITLES.sm2, icon: '⚔️', img: asset('sm2.svg') },
  { id: 'hd2', title: GAME_TITLES.hd2, icon: '🏴', img: asset('hd2.svg') },
  { id: 'mh', title: GAME_TITLES.mh, icon: '🐾', img: asset('mh.svg') },
  { id: 'drg', title: GAME_TITLES.drg, icon: '⛏️', img: asset('drg.svg') },
  { id: 'd2', title: GAME_TITLES.d2, icon: '🌌', img: asset('d2.svg') },
  { id: 'custom', title: GAME_TITLES.custom, icon: '🖊️', img: asset('custom.svg') },
] as const

export function useGemini() {
  const isGenerating = ref(false)

  /** Genera la transmisión de WhatsApp. Lanza `Error` con un mensaje en español. */
  const generateText = async (apiKey: string, data: Partial<Mission>) => {
    isGenerating.value = true
    try {
      return await generateWithGemini(apiKey, buildPrompt(data), { model: GEMINI_MODEL })
    } finally {
      isGenerating.value = false
    }
  }

  /** Comprueba la clave contra Google (sin gastar cuota de generación). */
  const checkApiKey = (apiKey: string) => validateApiKey(apiKey, { model: GEMINI_MODEL })

  return { isGenerating, generateText, checkApiKey, GAMES }
}
