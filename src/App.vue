<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useGemini } from './composables/useGemini';

// Importar Componentes
import AppHeader from './components/AppHeader.vue';
import GameSelector from './components/GameSelector.vue';
import MissionControls from './components/MissionControls.vue';
import TerminalOutput from './components/TerminalOutput.vue';
import ConfigModal from './components/ConfigModal.vue';
import MissionLog from './components/MissionLog.vue';
import IntelTicker from './components/IntelTicker.vue';
import SquadRoster from './components/SquadRoster.vue';
import CommPanel from './components/CommPanel.vue';
import ActionQueue from './components/ActionQueue.vue';
import ProcessManager from './components/ProcessManager.vue';
import MiniRadar from './components/MiniRadar.vue';

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

const mission = reactive({
  game: '',
  subGame: '',
  customGameName: '',
  recruits: '',
  time: ''
});

// API Key Logic
const envApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const userApiKey = ref(localStorage.getItem('USER_API_KEY') || '');

const getEffectiveApiKey = () => {
  if (envApiKey && envApiKey.trim() !== '') return envApiKey;
  return userApiKey.value;
};

const { generateText, isGenerating } = useGemini();

// --- LORE / UI STATE ---
import { ref as _ref } from 'vue';
const logLines = _ref<Array<{ts:string,text:string}>>([
  { ts: new Date().toLocaleTimeString(), text: 'Sistema iniciado.' }
]);
const tickerItems = _ref<string[]>(['ALERTA: PUERTA NORTE COMPROMETIDA','INFO: Módulo TTS activo','LOG: Enlace estable']);
const squad = _ref([{ name:'Alex', initials:'AX', role:'Infiltrator', status:'ok', statusLabel:'OK' },{ name:'Marta', initials:'MT', role:'Scout', status:'injured', statusLabel:'INJ' }]);
const processes = _ref<Array<any>>([]);
const processCounter = _ref(1);
const procManager = _ref<any>(null);

const addLog = (text: string) => {
  const ts = new Date().toLocaleTimeString();
  logLines.value.unshift({ ts, text });
  if (logLines.value.length > 300) logLines.value.pop();
};

const enqueueProcess = () => {
  const id = processCounter.value++;
  const emojis = ['⚙️','🔧','🛰️','📡','💾','🛡️'];
  const proc = { id, name: `Task-${id}`, emoji: emojis[id % emojis.length], detail: 'Inicio secuencia', status: 'queued' };
  processes.value.push(proc);
  // send to process manager which will simulate life-cycle
  if (procManager.value && typeof procManager.value.enqueue === 'function') procManager.value.enqueue(proc);
};

const onProcStarted = (proc: any) => {
  const p = processes.value.find((x:any)=>x.id===proc.id);
  if(p) p.status = 'running';
  addLog(`▶️ Proceso iniciado: ${proc.name}`);
};

const onProcFinished = (proc: any) => {
  const p = processes.value.find((x:any)=>x.id===proc.id);
  if(p) p.status = 'done';
  addLog(`✅ Proceso finalizado: ${proc.name}`);
};

const onProcCancelled = (proc: any) => {
  const idx = processes.value.findIndex((x:any)=>x.id===proc.id);
  if(idx>=0) processes.value.splice(idx,1);
  addLog(`✖ Proceso cancelado: ${proc.name}`);
};

const handleCancelProcess = (id: any) => {
  const idx = processes.value.findIndex((p:any)=>p.id===id);
  if(idx>=0){
    const p = processes.value[idx];
    processes.value.splice(idx,1);
    addLog('✖ Cancel: ' + p.name);
  }
};

// --- ACCIONES ---
const handleRunDemo = async () => {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    alert("⚠️ FALTA API KEY");
    showConfig.value = true;
    return;
  }
  
  try {
    terminalText.value = "📡 INICIANDO PROTOCOLO DE GENERACIÓN...\n>_";
    const text = await generateText(apiKey, mission);
    terminalText.value = text;
  } catch (e: any) {
    terminalText.value = `❌ ERROR CRÍTICO:\n${e.message}`;
  }
};

const handleSendWhatsapp = async () => {
  if (!terminalText.value || terminalText.value.includes('ERROR') || isGenerating.value) {
    await handleRunDemo();
  }
  
  if (!terminalText.value || terminalText.value.includes('ERROR')) return;

  isSending.value = true;
  try {
    const res = await fetch('http://localhost:3000/send-mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: terminalText.value })
    });
    const data = await res.json();
    if (data.success) alert("✅ TRANSMISIÓN ENVIADA");
    else throw new Error(data.error);
  } catch (e: any) {
    alert(`❌ ERROR DE SERVIDOR: ${e.message}`);
  } finally {
    isSending.value = false;
  }
};

const updateMissionData = (data: any) => {
  mission.recruits = data.recruits;
  mission.time = data.time;
};

const saveUserConfig = (key: string) => {
  userApiKey.value = key;
  showConfig.value = false;
};
</script>

<template>
  <div class="app-container">
    <AppHeader 
      :is-dark="isDarkMode" 
      @toggleTheme="toggleTheme" 
      @openConfig="showConfig = true" 
    />

    <main class="main-grid">
      <section class="left-col">
        <GameSelector 
          v-model="mission.game" 
          v-model:subGame="mission.subGame" 
          v-model:customName="mission.customGameName"
        />
        <MissionControls 
          :loading="isGenerating"
          :sending="isSending"
          @runDemo="handleRunDemo"
          @sendWhatsapp="handleSendWhatsapp"
          @updateData="updateMissionData"
        />
      </section>

      <section class="right-col">
        <TerminalOutput :output="terminalText" />
      </section>
    </main>

    <div class="bottom-row">
      <MissionLog :lines="logLines" />
      <IntelTicker :items="tickerItems" />
      <SquadRoster :members="squad" />
    </div>

    <div class="bottom-row-2">
      <CommPanel :connected="true" @toggle-tts="addLog('🔊 TTS toggled')" @mute-toggle="addLog('🔇 Audio mute toggled')" @refresh-ticker="addLog('🔁 Ticker refreshed')" />
      <ActionQueue :processes="processes" @enqueue="enqueueProcess" @cancel="handleCancelProcess" />
      <ProcessManager ref="procManager" @started="onProcStarted" @finished="onProcFinished" @cancelled="onProcCancelled" />
      <MiniRadar :targets="[{x:60,y:40},{x:35,y:30},{x:70,y:72}]" />
    </div>

    <ConfigModal v-if="showConfig" @close="showConfig = false" @save="saveUserConfig" />
  </div>
</template>

<style scoped>
.app-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; align-items: start; }
@media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

.bottom-row { margin-top: 22px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
@media (max-width: 900px) { .bottom-row { grid-template-columns: 1fr; } }

.bottom-row-2{ margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px }
@media (max-width: 1100px) { .bottom-row-2{ grid-template-columns: 1fr 1fr } }
@media (max-width: 700px) { .bottom-row-2{ grid-template-columns: 1fr } }
</style>