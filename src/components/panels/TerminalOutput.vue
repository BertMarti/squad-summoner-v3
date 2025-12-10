<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps(['output']);
const copied = ref(false);

const copyToClipboard = async () => {
  if (!props.output) return;
  try {
    await navigator.clipboard.writeText(props.output);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Error al copiar: ', err);
  }
};
</script>

<template>
  <section class="terminal-panel">
    <div class="terminal-header">
      <div class="header-left">
        <span class="status-dot"></span> ENLACE ACTIVO
      </div>
      <div class="header-right">
        <span class="connection-text">SECURE CONNECTION // GEMINI</span>
        
        <button 
          v-if="output" 
          @click="copyToClipboard" 
          class="btn-copy fade-in" 
          :class="{ 'copied': copied }"
          title="Copiar transmisión al portapapeles"
        >
          <span v-if="copied">✅ COPIADO</span>
          <span v-else>📋 COPIAR</span>
        </button>
      </div>
    </div>
    
    <div class="terminal-body">
      <div v-if="!output" class="placeholder fade-in">
        <span class="shield">🛡️</span>
        <p>ESPERANDO PARÁMETROS...</p>
      </div>
      <div v-else class="output-content fade-in">
        <pre class="text-content">{{ output }}</pre>
        <span class="cursor">_</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.terminal-panel { 
  background: var(--terminal-bg); 
  border-radius: 12px; 
  border: 1px solid var(--border-color); 
  height: 600px;
  min-height: 600px;
  max-height: 600px;
  flex: 0 0 600px;
  box-sizing: border-box;
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
}

.terminal-header { 
  background: var(--terminal-header-bg); 
  padding: 10px 20px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  border-bottom: 1px solid var(--border-color); 
  font-size: 0.75rem; 
  color: #4db8ff; 
  letter-spacing: 1px; 
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
  color: var(--text-secondary);
}

.status-dot { 
  width: 8px; 
  height: 8px; 
  background: #00ff00; 
  border-radius: 50%; 
  display: inline-block; 
  margin-right: 8px; 
  box-shadow: 0 0 5px #00ff00; 
}

/* Estilos del Botón de Copiar */
.btn-copy {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-copy:hover {
  border-color: var(--text-accent);
  color: var(--text-accent);
  background: rgba(255, 189, 0, 0.05);
}

.btn-copy.copied {
  border-color: #00ff00;
  color: #00ff00;
  background: rgba(0, 255, 0, 0.1);
}

.terminal-body { 
  flex: 1; 
  min-height: 0; /* permite que el contenido haga scroll y no expanda el panel */
  padding: 30px; 
  overflow-y: auto; 
  overflow-x: hidden;
  font-family: 'Courier New', monospace; 
  position: relative; 
}

.placeholder { 
  height: 100%; 
  display: flex; 
  flex-direction: column; 
  justify-content: center; 
  align-items: center; 
  color: var(--text-secondary); 
  opacity: 0.5; 
}

.shield { font-size: 4rem; margin-bottom: 10px; }

.output-content { 
  color: var(--terminal-text); 
  line-height: 1.6; 
  width: 100%;
  max-width: 100%;
}

.text-content {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  font-family: inherit;
  max-width: 100%;
  word-break: break-word; 
  display: block;
  -webkit-font-smoothing: antialiased;
}

.cursor { animation: blink 1s infinite; font-weight: bold; }
@keyframes blink { 50% { opacity: 0; } }
</style>
