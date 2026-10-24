import type { Mission } from '@/types'
import { useGemini } from '@/composables/useGemini'

export async function generateText(apiKey: string, mission: Mission) {
  const { generateText } = useGemini()
  return await generateText(apiKey, mission)
}
