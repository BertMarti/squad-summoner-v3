<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGemini } from './composables/useGemini';
import { useMissionStore } from '@/stores/mission';
import { useTerminalStore } from '@/stores/terminal';
import { useProcessQueue } from '@/stores/processQueue';
import { ENV_API_KEY, IS_STATIC_DEMO, USER_API_KEY_STORAGE } from '@/config';
import { generateDemoMessage } from '@/lib/demo';
import { isSendableMessage } from '@/lib/whatsapp';
import { sendToServer } from '@/services/whatsappServer';
import type { ProcessItem } from '@/types';

// Importar Componentes
import AppHeader from '@/components/panels/AppHeader.vue';
import GameSelector from '@/components/panels/GameSelector.vue';
import MissionControls from '@/components/panels/MissionControls.vue';
import TerminalOutput from '@/components/panels/TerminalOutput.vue';
import ConfigModal from './components/ConfigModal.vue';
import { MissionLog, IntelTicker, SquadRoster, CommPanel, ActionQueue, ProcessManager, MiniRadar } from '@/components/lore'

// --- ESTADO TEMA ---
const isDarkMode = ref(true);

onMounted(() => {
  const saved = localStorage.getItem('theme');
  isDarkMode.value = saved ? saved === 'dark' : true;
  applyTheme();
});

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
  applyTheme();
};

const applyTheme = () => {
  if (isDarkMode.value) document.body.classList.remove('light-mode');
  else document.body.classList.add('light-mode');
};

// --- ESTADO APP ---
const showConfig = ref(false);
const terminalText = ref('');
const isSending = ref(false);
const terminalError = ref('');
const statusMessage = ref('');
const statusError = ref('');
const gameError = ref('');
const userApiKey = ref(localStorage.getItem(USER_API_KEY_STORAGE) || '');
const headerRef = ref<InstanceType<typeof AppHeader> | null>(null);

const getEffectiveApiKey = () => {
  if (ENV_API_KEY) return ENV_API_KEY;
  return userApiKey.value;
};

const { generateText, isGenerating } = useGemini();

const terminalStore = useTerminalStore();
const processQueue = useProcessQueue();
const missionStore = useMissionStore();
const tickerItems = ref<string[]>(['ALERTA: PUERTA NORTE COMPROMETIDA', 'INFO: Enlace estable']);
const squad = ref([{ name: 'Alex', initials: 'AX', role: 'Infiltrador', status: 'ok', statusLabel: 'OK' }, { name: 'Marta', initials: 'MT', role: 'Exploradora', status: 'injured', statusLabel: 'INJ' }]);
const procManager = ref<{ enqueue: (proc: ProcessItem) => void } | null>(null);

const enqueueProcess = () => {
  const emojis = ['⚙️','🔧','🛰️','📡','💾','🛡️'];
  const proc = processQueue.enqueue({ emoji: emojis[Math.floor(Math.random()*emojis.length)] });
  // forward to process manager to simulate lifecycle
  if (procManager.value && typeof procManager.value.enqueue === 'function') procManager.value.enqueue(proc);
};

const onProcStarted = (proc: ProcessItem) => {
  const p = processQueue.processes.find(x => x.id === proc.id);
  if(p) p.status = 'running';
  terminalStore.addLog(`▶️ Proceso iniciado: ${proc.name}`);
};

const onProcFinished = (proc: ProcessItem) => {
  const p = processQueue.processes.find(x => x.id === proc.id);
  if(p) p.status = 'done';
  terminalStore.addLog(`✅ Proceso finalizado: ${proc.name}`);
};

const onProcCancelled = (proc: ProcessItem) => {
  processQueue.cancel(proc.id);
  terminalStore.addLog(`✖ Proceso cancelado: ${proc.name}`);
};

const handleCancelProcess = (id: number | string) => {
  processQueue.cancel(id);
  terminalStore.addLog(`✖ Cancelado: ${id}`);
};

// --- ACCIONES ---
const resetStatus = () => { statusMessage.value = ''; statusError.value = ''; gameError.value = ''; };

const handleRun = async () => {
  resetStatus();
  if (!missionStore.mission.game) {
    gameError.value = 'Elige un juego antes de generar la transmisión.';
    terminalStore.addLog('⚠️ Generación bloqueada: falta elegir juego');
    return;
  }
  const apiKey = getEffectiveApiKey();
  terminalError.value = '';
  terminalText.value = '';
  terminalStore.addLog(apiKey ? '📡 Generación solicitada a Gemini' : '🧪 Generación de ejemplo sin API key');
  try {
    const text = apiKey ? await generateText(apiKey, missionStore.mission) : generateDemoMessage(missionStore.mission);
    terminalText.value = text;
    statusMessage.value = apiKey ? 'Transmisión generada con Gemini.' : 'Sin API key: texto de ejemplo. Configura tu clave para usar la IA';
  } catch (error: unknown) {
    terminalError.value = error instanceof Error ? error.message : 'No se ha podido generar la transmisión.';
    terminalStore.addLog(`❌ ${terminalError.value}`);
  }
};

const handleRunDemo = () => {
  resetStatus();
  if (!missionStore.mission.game) {
    gameError.value = 'Elige un juego antes de generar la transmisión.';
    terminalStore.addLog('⚠️ Demo bloqueada: falta elegir juego');
    return;
  }
  terminalError.value = '';
  terminalText.value = generateDemoMessage(missionStore.mission);
  statusMessage.value = 'Modo demo: transmisión generada sin conexión.';
  terminalStore.addLog('🧪 Transmisión generada en modo demo');
};

const handleSendWhatsapp = async () => {
  if (!isSendableMessage(terminalText.value) || isGenerating.value || IS_STATIC_DEMO) return;
  isSending.value = true;
  resetStatus();
  terminalStore.addLog('📲 Enviando transmisión al grupo');
  try {
    await sendToServer(terminalText.value);
    statusMessage.value = 'Transmisión enviada al grupo.';
    terminalStore.addLog('✅ Transmisión enviada al grupo');
  } catch (error: unknown) {
    statusError.value = error instanceof Error ? error.message : 'No se ha podido enviar la transmisión.';
    terminalStore.addLog(`❌ ${statusError.value}`);
  } finally {
    isSending.value = false;
  }
};

const saveUserConfig = (key: string) => {
  userApiKey.value = key;
  showConfig.value = false;
  statusMessage.value = key ? 'API key guardada en este navegador.' : 'API key borrada.';
};

const closeConfig = () => {
  showConfig.value = false;
  headerRef.value?.focusConfig();
};
</script>

<template>
  <div class="app-container">
    <div v-if="IS_STATIC_DEMO" class="demo-banner" role="note">Versión web de demostración: aquí puedes generar con tu propia API key de Gemini o en modo demo y compartir por WhatsApp. El envío automático al grupo necesita el servidor local (<a href="https://github.com/BertMarti/squad-summoner-v3#readme" target="_blank" rel="noopener noreferrer">ver cómo</a>).</div>
    <AppHeader ref="headerRef"
      :is-dark="isDarkMode" 
      @toggleTheme="toggleTheme" 
      @openConfig="showConfig = true" 
    />

    <main class="main-grid">
      <section class="left-col">
        <GameSelector :error="gameError" />
        <MissionControls 
          :loading="isGenerating"
          :sending="isSending"
          :has-api-key="Boolean(getEffectiveApiKey())"
          @generate="handleRun"
          @run-demo="handleRunDemo"
        />
      </section>

      <section class="right-col">
        <TerminalOutput :output="terminalText" :loading="isGenerating" :error="terminalError" :sending="isSending" :static-demo="IS_STATIC_DEMO" @send="handleSendWhatsapp" />
      </section>
    </main>
    <div class="status-region" role="status" aria-live="polite">
      <p v-if="statusMessage" class="status-message">{{ statusMessage }}</p>
    </div>
    <div class="status-region" role="alert">
      <p v-if="statusError" class="status-error">{{ statusError }}</p>
    </div>

    <div class="bottom-row">
      <MissionLog />
      <IntelTicker :items="tickerItems" />
      <SquadRoster :members="squad" />
    </div>

    <div class="bottom-row-2">
      <CommPanel :connected="true" @toggle-tts="terminalStore.addLog('🔊 Voz táctica: no disponible todavía')" @mute-toggle="terminalStore.addLog('🔇 Audio silenciado')" @refresh-ticker="terminalStore.addLog('🔁 Teletipo actualizado')" />
      <ActionQueue :processes="processQueue.processes" @enqueue="enqueueProcess" @cancel="handleCancelProcess" />
      <ProcessManager ref="procManager" @started="onProcStarted" @finished="onProcFinished" @cancelled="onProcCancelled" />
      <MiniRadar :targets="[{x:60,y:40},{x:35,y:30},{x:70,y:72}]" />
    </div>

    <ConfigModal v-if="showConfig" @close="closeConfig" @save="saveUserConfig" />
  </div>
</template>

<style scoped>
.app-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.demo-banner a { color: var(--terminal-text); }
.demo-banner { margin-bottom: 16px; padding: 10px 14px; border: 1px solid var(--border-color); color: var(--text-secondary); font-size: .85rem; }
.status-message, .status-error { margin: 12px 0 0; padding: 10px 14px; border-left: 3px solid var(--border-accent); background: var(--bg-panel); }
.status-error { color: var(--text-danger); border-color: var(--border-danger); }
.main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; align-items: start; }
@media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

.bottom-row { margin-top: 22px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
@media (max-width: 900px) { .bottom-row { grid-template-columns: 1fr; } }

.bottom-row-2{ margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px }
@media (max-width: 1100px) { .bottom-row-2{ grid-template-columns: 1fr 1fr } }
@media (max-width: 700px) { .bottom-row-2{ grid-template-columns: 1fr } }
@media (max-width: 420px) { .app-container { padding: 12px; } }
</style>
