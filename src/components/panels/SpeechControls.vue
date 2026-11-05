<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSpeech } from '@/composables/useSpeech'
import { NO_VOICES_HELP, SPEECH_RATES, SPEECH_UNSUPPORTED, voiceId, voiceLabel } from '@/lib/speech'
import { useSpeechPrefsStore } from '@/stores/speech'

const props = defineProps<{ text: string }>()
const prefs = useSpeechPrefsStore()
const {
  supported,
  state,
  voiceName,
  error,
  speak,
  pause,
  resume,
  stop,
  voiceGroups,
  hasVoices,
  chosenMissing,
  preview,
} = useSpeech(undefined, { voice: () => prefs.voice, rate: () => prefs.rate })
const unsupportedId = 'speech-unsupported'
const settingsOpen = ref(false)
const setVoice = (event: Event) => prefs.setVoice((event.target as HTMLSelectElement).value)
const setRate = (event: Event) => prefs.setRate((event.target as HTMLSelectElement).value)

watch(
  () => props.text,
  () => stop(),
)
</script>

<template>
  <div class="speech-controls">
    <button
      v-if="state === 'idle'"
      type="button"
      class="speech-button"
      :disabled="!text || !supported"
      :aria-describedby="supported ? undefined : unsupportedId"
      @click="speak(text)"
    >
      🔊 LEER EN VOZ ALTA
    </button>
    <template v-else>
      <button type="button" class="speech-button" @click="state === 'speaking' ? pause() : resume()">
        {{ state === 'speaking' ? '⏸️ PAUSAR' : '▶️ REANUDAR' }}
      </button>
      <button type="button" class="speech-button" @click="stop">⏹️ PARAR</button>
    </template>
    <button
      v-if="supported"
      type="button"
      class="speech-button"
      :aria-expanded="settingsOpen"
      aria-controls="speech-settings"
      @click="settingsOpen = !settingsOpen"
    >
      🎚️ VOZ Y VELOCIDAD
    </button>
    <div v-if="supported && settingsOpen" id="speech-settings" class="speech-settings">
      <label for="speech-voice">VOZ</label>
      <select
        id="speech-voice"
        :value="prefs.voice"
        :disabled="!hasVoices"
        :aria-describedby="!hasVoices ? 'speech-no-voices' : undefined"
        @change="setVoice"
      >
        <option value="">Automática (la mejor en español)</option>
        <optgroup v-if="voiceGroups.spanish.length" label="Español">
          <option v-for="voice in voiceGroups.spanish" :key="voiceId(voice)" :value="voiceId(voice)">
            {{ voiceLabel(voice) }}
          </option>
        </optgroup>
        <optgroup v-if="voiceGroups.others.length" label="Otros idiomas">
          <option v-for="voice in voiceGroups.others" :key="voiceId(voice)" :value="voiceId(voice)">
            {{ voiceLabel(voice) }}
          </option>
        </optgroup>
      </select>
      <small v-if="!hasVoices" id="speech-no-voices">{{ NO_VOICES_HELP }}</small>
      <small v-if="chosenMissing">La voz elegida no está en este dispositivo: se usa la automática.</small>
      <label for="speech-rate">VELOCIDAD</label>
      <select id="speech-rate" :value="String(prefs.rate)" @change="setRate">
        <option v-for="rateOption in SPEECH_RATES" :key="rateOption.value" :value="String(rateOption.value)">
          {{ rateOption.label }}
        </option>
      </select>
      <button type="button" class="speech-button" :disabled="state !== 'idle'" @click="preview">▶️ PROBAR VOZ</button>
      <small v-if="prefs.persisted">Se guarda en este navegador.</small>
      <small v-else role="status">Este navegador no deja guardarlo: se usará solo durante esta visita.</small>
    </div>
    <span class="sr-only" role="status" aria-live="polite">
      {{ state === 'speaking' ? 'Leyendo en voz alta…' : state === 'paused' ? 'Lectura en pausa' : '' }}
    </span>
    <small v-if="supported && voiceName">Voz: {{ voiceName }}</small>
    <small v-if="error" class="speech-help" role="alert">{{ error }}</small>
    <small v-if="!supported" :id="unsupportedId" class="speech-help">{{ SPEECH_UNSUPPORTED }}</small>
  </div>
</template>

<style scoped>
.speech-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.speech-button {
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 700;
}
.speech-button:hover:not(:disabled) {
  border-color: var(--border-accent);
  color: var(--text-accent);
}
.speech-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.speech-controls small {
  color: var(--text-secondary);
  font-size: 0.78rem;
}
.speech-help {
  flex-basis: 100%;
  line-height: 1.4;
}
.speech-settings {
  flex-basis: 100%;
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
}
.speech-settings label {
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
}
.speech-settings select {
  min-height: 44px;
  box-sizing: border-box;
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
}
.speech-settings select:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.speech-settings button {
  width: 100%;
}
</style>
