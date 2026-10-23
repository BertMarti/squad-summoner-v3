<script setup lang="ts">
import { useMissionStore } from '@/stores/mission';

const props = defineProps<{ loading: boolean; sending: boolean; hasApiKey: boolean }>();
const emit = defineEmits<{ generate: []; runDemo: [] }>();
const missionStore = useMissionStore();
</script>

<template>
  <div class="panel-section">
    <div class="section-header">
      <span class="step-number">02</span>
      <h3>PARÁMETROS</h3>
    </div>
    <div class="input-row">
      <div class="input-group">
         <label for="recruits">RECLUTAS</label>
         <input id="recruits" class="tech-input" v-model="missionStore.mission.recruits" maxlength="120" placeholder="Ej: Alex, Juan..." />
      </div>
      <div class="input-group time-group">
         <label for="mission-time">HORA (24H)</label>
         <input id="mission-time" class="tech-input" type="time" v-model="missionStore.mission.time" />
      </div>
    </div>
  </div>

   <p class="api-status">{{ props.hasApiKey ? 'Usando IA (Gemini)' : 'Sin clave: modo demo' }}</p>
   <button type="button" class="btn-main" @click="emit('generate')" :disabled="props.sending || props.loading">
     📢 GENERAR TRANSMISIÓN
   </button>
   <button type="button" class="btn-demo" @click="emit('runDemo')" :disabled="props.loading">
     {{ props.loading ? 'GENERANDO...' : '🧪 MODO DEMO' }}
  </button>
</template>

<style scoped>
.panel-section { background: var(--bg-panel); padding: 25px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 20px; }
.section-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
.step-number { background: var(--btn-primary-bg); color: #05080c; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.section-header h3 { margin: 0; font-size: 1rem; color: var(--text-primary); }

.input-row { display: flex; gap: 15px; }
.input-group { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.time-group { flex: 0 0 140px; }
label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; }

.tech-input { width: 100%; padding: 12px; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; box-sizing: border-box; }
.tech-input:focus { outline: none; border-color: var(--border-accent); }

button { width: 100%; padding: 15px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; text-transform: uppercase; margin-bottom: 10px; transition: 0.2s; }
.btn-main { background: var(--btn-primary-bg); color: var(--btn-primary-text); font-size: 1.1rem; }
.btn-main:hover:not(:disabled) { box-shadow: var(--shadow-accent); transform: translateY(-2px); }
.btn-demo { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); }
.btn-demo:hover:not(:disabled) { border-color: var(--text-primary); color: var(--text-primary); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.api-status { color: var(--text-secondary); font-size: .8rem; margin: 0 0 10px; }
@media (max-width: 480px) { .input-row { flex-direction: column; } .time-group { flex-basis: auto; } }
</style>
