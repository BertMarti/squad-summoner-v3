import { computed, getCurrentInstance, onBeforeUnmount, ref, shallowRef } from 'vue'
import {
  DEFAULT_RATE,
  SPEECH_FAILED,
  SPEECH_SAMPLE,
  findVoice,
  groupVoices,
  isSpeechSupported,
  normalizeRate,
  pickSpanishVoice,
  splitForSpeech,
  textForSpeech,
} from '@/lib/speech'

export type SpeechState = 'idle' | 'speaking' | 'paused'

/** Tiempo para comprobar que la lectura ha empezado de verdad. */
export const WATCHDOG_MS = 4000

/**
 * Leer en voz alta con `speechSynthesis` (Web Speech API): local y gratis, sin llamadas a Gemini.
 * - Elige una voz en español si el navegador la tiene (es-ES primero) y si no usa la predeterminada con `lang` es-ES.
 * - Lee por frases (Chrome corta las locuciones largas) y permite pausar, reanudar y parar.
 * - Se para al desmontar el componente o al leer otra transmisión.
 * - Con `prefs`, usa la voz y la velocidad elegidas (si la voz no está en este dispositivo, la automática).
 */
type SpeechWindow = Window & { SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance }

export interface SpeechPrefsSource {
  /** Identificador de la voz elegida ('' = automática). */
  voice: () => string
  /** Velocidad elegida. */
  rate: () => number
}

export function useSpeech(
  win: SpeechWindow | undefined = typeof window === 'undefined' ? undefined : (window as SpeechWindow),
  prefs?: SpeechPrefsSource,
) {
  const supported = isSpeechSupported(win)
  const synth = supported ? win!.speechSynthesis : null
  const state = ref<SpeechState>('idle')
  /** Voces que ofrece el navegador (Chrome las carga de forma asíncrona). */
  const voices = shallowRef<SpeechSynthesisVoice[]>([])
  const voiceGroups = computed(() => groupVoices(voices.value))
  const hasVoices = computed(() => voices.value.length > 0)
  /** La voz elegida no existe en este dispositivo (p. ej. se eligió en otro navegador): se usa la automática. */
  const chosenMissing = computed(() => {
    const id = prefs?.voice() ?? ''
    return !!id && hasVoices.value && !findVoice(voices.value, id)
  })
  const voice = computed<SpeechSynthesisVoice | null>(
    () => findVoice(voices.value, prefs?.voice() ?? '') ?? pickSpanishVoice(voices.value),
  )
  const voiceName = computed(() => voice.value?.name ?? '')
  const rate = computed(() => (prefs ? normalizeRate(prefs.rate()) : DEFAULT_RATE))
  /** Motivo en español si la última lectura no pudo empezar o falló ('' si todo bien). */
  const error = ref('')
  let watchdog: ReturnType<typeof setTimeout> | undefined
  // Cada lectura tiene su número: los eventos de una lectura cancelada no tocan el estado de la siguiente.
  let session = 0

  function loadVoice() {
    if (!synth) return
    try {
      const list = synth.getVoices()
      voices.value = Array.isArray(list) ? [...list] : []
    } catch {
      voices.value = []
    }
  }
  loadVoice()
  // Chrome carga las voces de forma asíncrona.
  synth?.addEventListener?.('voiceschanged', loadVoice)

  function stop() {
    session++
    state.value = 'idle'
    clearTimeout(watchdog)
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
    error.value = ''
    if (!voices.value.length) loadVoice()
    const id = session
    const chosen = voice.value
    const speed = rate.value
    // Antes de encolar: algunos navegadores lanzan `onerror` dentro del propio speak() (p. ej. «not-allowed») y la
    // lectura ya habrá terminado al salir del bucle.
    state.value = 'speaking'
    chunks.forEach((chunk, index) => {
      const utterance = new win.SpeechSynthesisUtterance(chunk)
      utterance.lang = chosen?.lang || 'es-ES'
      if (chosen) utterance.voice = chosen
      utterance.rate = speed
      if (index === chunks.length - 1) {
        utterance.onend = () => {
          if (id === session) state.value = 'idle'
        }
      }
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        // «interrupted»/«canceled» llegan al parar a propósito.
        if (id === session && event.error !== 'interrupted' && event.error !== 'canceled') {
          stop()
          error.value = SPEECH_FAILED
        }
      }
      if (id === session) synth.speak(utterance)
    })
    if (id !== session) return false
    // Algunos navegadores (p. ej. Chromium en Linux sin voces instaladas) aceptan speak() pero no leen ni avisan:
    // si a los pocos segundos no está leyendo, se para y se explica. (Chromium sin voces deja la frase «en cola»
    // para siempre, así que `pending` no sirve para saberlo.)
    watchdog = setTimeout(() => {
      if (id === session && state.value === 'speaking' && !synth.speaking) {
        stop()
        error.value = SPEECH_FAILED
      }
    }, WATCHDOG_MS)
    return true
  }

  /** Lee una frase de ejemplo con la voz y la velocidad elegidas (botón PROBAR VOZ). */
  function preview(): boolean {
    return speak(SPEECH_SAMPLE)
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

  return {
    supported,
    state,
    voices,
    voiceGroups,
    hasVoices,
    chosenMissing,
    voiceName,
    rate,
    error,
    speak,
    preview,
    pause,
    resume,
    stop,
    dispose,
  }
}
