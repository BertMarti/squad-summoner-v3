import { computed, getCurrentInstance, onBeforeUnmount, ref, shallowRef } from 'vue'
import { isSpeechSupported, pickSpanishVoice, splitForSpeech, textForSpeech } from '@/lib/speech'

export type SpeechState = 'idle' | 'speaking' | 'paused'

/**
 * Leer en voz alta con `speechSynthesis` (Web Speech API): local y gratis, sin llamadas a Gemini.
 * - Elige una voz en español si el navegador la tiene (es-ES primero) y si no usa la predeterminada con `lang` es-ES.
 * - Lee por frases (Chrome corta las locuciones largas) y permite pausar, reanudar y parar.
 * - Se para al desmontar el componente o al leer otra transmisión.
 */
type SpeechWindow = Window & { SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance }

export function useSpeech(
  win: SpeechWindow | undefined = typeof window === 'undefined' ? undefined : (window as SpeechWindow),
) {
  const supported = isSpeechSupported(win)
  const synth = supported ? win!.speechSynthesis : null
  const state = ref<SpeechState>('idle')
  const voice = shallowRef<SpeechSynthesisVoice | null>(null)
  const voiceName = computed(() => voice.value?.name ?? '')
  // Cada lectura tiene su número: los eventos de una lectura cancelada no tocan el estado de la siguiente.
  let session = 0

  function loadVoice() {
    if (!synth) return
    try {
      voice.value = pickSpanishVoice(synth.getVoices())
    } catch {
      voice.value = null
    }
  }
  loadVoice()
  // Chrome carga las voces de forma asíncrona.
  synth?.addEventListener?.('voiceschanged', loadVoice)

  function stop() {
    session++
    state.value = 'idle'
    try {
      synth?.cancel()
    } catch {
      /* nada que parar */
    }
  }

  /** Lee el texto desde el principio. Devuelve `false` si no hay nada que leer o el navegador no puede. */
  function speak(text: string): boolean {
    if (!synth || !win) return false
    const chunks = splitForSpeech(textForSpeech(text))
    if (!chunks.length) return false
    stop()
    if (!voice.value) loadVoice()
    const id = session
    chunks.forEach((chunk, index) => {
      const utterance = new win.SpeechSynthesisUtterance(chunk)
      utterance.lang = voice.value?.lang || 'es-ES'
      if (voice.value) utterance.voice = voice.value
      utterance.rate = 1
      if (index === chunks.length - 1) {
        utterance.onend = () => {
          if (id === session) state.value = 'idle'
        }
      }
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        // «interrupted»/«canceled» llegan al parar a propósito.
        if (id === session && event.error !== 'interrupted' && event.error !== 'canceled') stop()
      }
      synth.speak(utterance)
    })
    state.value = 'speaking'
    return true
  }

  function pause() {
    if (!synth || state.value !== 'speaking') return
    synth.pause()
    state.value = 'paused'
  }

  function resume() {
    if (!synth || state.value !== 'paused') return
    synth.resume()
    state.value = 'speaking'
  }

  function dispose() {
    synth?.removeEventListener?.('voiceschanged', loadVoice)
    if (state.value !== 'idle') stop()
  }
  if (getCurrentInstance()) onBeforeUnmount(dispose)

  return { supported, state, voiceName, speak, pause, resume, stop, dispose }
}
