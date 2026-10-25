<script setup lang="ts">
import { useMissionStore } from '@/stores/mission'
import HelpTip from '@/components/HelpTip.vue'
import type { ApiKeySource } from '@/stores/apiKey'
import { GEMINI_MODEL } from '@/config'
import { TONES } from '@/lib/tones'

const props = defineProps<{
  loading: boolean
  sending: boolean
  hasApiKey: boolean
  keySource: ApiKeySource
  lastSummary: string
}>()
const emit = defineEmits<{ generate: []; runDemo: []; openConfig: []; repeatLast: [] }>()
const missionStore = useMissionStore()
</script>

<template>
  <div class="panel-section">
    <div class="section-header">
      <span class="step-number">02</span>
      <h3>
        PARÁMETROS
        <HelpTip
          topic="Parámetros"
          text="Escribe los nombres separados por comas y la hora de la partida. Si los dejas vacíos, la transmisión convocará a todo el escuadrón."
        />
      </h3>
    </div>
    <div class="input-row">
      <div class="input-group">
        <label for="recruits">RECLUTAS</label>
        <input
          id="recruits"
          class="tech-input"
          v-model="missionStore.mission.recruits"
          maxlength="120"
          placeholder="Ej: Alex, Juan..."
        />
      </div>
      <div class="input-group time-group">
        <label for="mission-time">HORA (24H)</label>
        <input id="mission-time" class="tech-input" type="time" v-model="missionStore.mission.time" />
      </div>
    </div>
    <fieldset class="tone-fieldset" aria-describedby="tone-hint">
      <legend>TONO</legend>
      <div class="tone-options">
        <label
          v-for="tone in TONES"
          :key="tone.id"
          class="tone-option"
          :class="{ selected: missionStore.mission.tone === tone.id }"
        >
          <input v-model="missionStore.mission.tone" type="radio" name="tone" :value="tone.id" />
          <span>{{ tone.icon }} {{ tone.label }}</span>
        </label>
      </div>
      <p id="tone-hint" class="tone-hint">{{ TONES.find((tone) => tone.id === missionStore.mission.tone)?.hint }}</p>
    </fieldset>
    <label class="poll-option" for="attendance-poll">
      <input id="attendance-poll" v-model="missionStore.mission.poll" type="checkbox" />
      <span>📋 Añadir encuesta de asistencia (✅ voy / ❌ no puedo)</span>
    </label>
  </div>

  <p class="api-status" v-if="props.hasApiKey">
    🔑 IA activada · modelo {{ GEMINI_MODEL }}<span v-if="props.keySource === 'env'"> · clave del .env</span
    ><span v-else-if="props.keySource === 'recordada'"> · clave recordada</span
    ><span v-else> · clave solo para esta visita</span>
  </p>
  <p class="api-status" v-else>
    Sin clave: se usará el modo demo.
    <button type="button" class="config-link" @click="emit('openConfig')">Configurar clave gratis</button>
  </p>
  <button type="button" class="btn-main" @click="emit('generate')" :disabled="props.sending || props.loading">
    📢 GENERAR TRANSMISIÓN
  </button>
  <button type="button" class="btn-demo" @click="emit('runDemo')" :disabled="props.loading">
    {{ props.loading ? 'GENERANDO...' : '🧪 MODO DEMO' }}
  </button>
  <button
    type="button"
    class="btn-repeat"
    :disabled="props.loading || !props.lastSummary"
    aria-describedby="repeat-hint"
    @click="emit('repeatLast')"
  >
    🔁 REPETIR LA ÚLTIMA
  </button>
  <small id="repeat-hint" class="repeat-hint">{{ props.lastSummary || 'No hay transmisiones en el historial.' }}</small>
</template>

<style scoped>
.panel-section {
  background: var(--bg-panel);
  padding: 25px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  margin-bottom: 20px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}
.step-number {
  background: var(--btn-primary-bg);
  color: #05080c;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}
.section-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.input-row {
  display: flex;
  gap: 15px;
}
.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.time-group {
  flex: 0 0 140px;
}
label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.tech-input {
  width: 100%;
  padding: 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 6px;
  box-sizing: border-box;
}
.tech-input:focus {
  outline: none;
  border-color: var(--border-accent);
}

button {
  width: 100%;
  padding: 15px;
  border-radius: 8px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
  margin-bottom: 10px;
  transition: 0.2s;
}
.btn-main {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  font-size: 1.1rem;
}
.btn-main:hover:not(:disabled) {
  box-shadow: var(--shadow-accent);
  transform: translateY(-2px);
}
.btn-demo {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}
.btn-demo:hover:not(:disabled) {
  border-color: var(--text-primary);
  color: var(--text-primary);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.api-status {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin: 0 0 10px;
}
.tone-fieldset {
  min-width: 0;
  margin: 20px 0 14px;
  padding: 0;
  border: 0;
}
.tone-fieldset legend {
  padding: 0;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
}
.tone-options {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.tone-option {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin: 0;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.85rem;
  text-align: center;
}
.tone-option.selected {
  border-color: var(--border-accent);
  color: var(--text-accent);
  background: var(--bg-input);
}
.tone-option input {
  position: absolute;
  opacity: 0;
}
.tone-option input:focus-visible + span {
  outline: 2px solid var(--border-accent);
  outline-offset: 4px;
}
.tone-hint,
.repeat-hint {
  display: block;
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
}
.poll-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  margin-bottom: 12px;
  cursor: pointer;
}
.poll-option span {
  font-size: 0.85rem;
}
.poll-option input {
  accent-color: var(--border-accent);
}
.btn-repeat {
  background: transparent;
  border: 1px solid var(--border-accent);
  color: var(--text-accent);
}
.config-link {
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-accent);
  text-decoration: underline;
  cursor: pointer;
}
@media (max-width: 480px) {
  .input-row {
    flex-direction: column;
  }
  .time-group {
    flex-basis: auto;
  }
  .tone-options {
    flex-direction: column;
  }
}
</style>
