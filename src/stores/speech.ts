import { defineStore } from 'pinia'
import { ref } from 'vue'
import { cleanVoiceId, normalizeRate, parseSpeechPrefs, serializeSpeechPrefs } from '@/lib/speech'
import { readStored, writeStored, STORAGE_KEYS } from '@/lib/storage'

/**
 * Voz y velocidad de «Leer en voz alta». Es una preferencia (no un dato sensible): se guarda al cambiarla en
 * `squad-summoner-v3:voz` y se valida al leer porque el origen bertmarti.github.io es compartido.
 */
export const useSpeechPrefsStore = defineStore('speechPrefs', () => {
  const initial = parseSpeechPrefs(readStored(STORAGE_KEYS.speech))
  /** Identificador de la voz elegida ('' = automática: la mejor en español). */
  const voice = ref(initial.voice)
  const rate = ref(initial.rate)
  const persisted = ref(true)

  function persist() {
    persisted.value = writeStored(STORAGE_KEYS.speech, serializeSpeechPrefs({ voice: voice.value, rate: rate.value }))
  }

  function setVoice(id: string) {
    voice.value = cleanVoiceId(id)
    persist()
  }

  function setRate(value: unknown) {
    rate.value = normalizeRate(value)
    persist()
  }

  return { voice, rate, persisted, setVoice, setRate }
})
