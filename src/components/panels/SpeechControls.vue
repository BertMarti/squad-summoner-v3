<script setup lang="ts">
import { watch } from 'vue'
import { useSpeech } from '@/composables/useSpeech'
import { SPEECH_UNSUPPORTED } from '@/lib/speech'

const props = defineProps<{ text: string }>()
const { supported, state, voiceName, error, speak, pause, resume, stop } = useSpeech()
const unsupportedId = 'speech-unsupported'

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
</style>
