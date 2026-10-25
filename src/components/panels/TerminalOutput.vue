<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildWhatsappShareUrl } from '@/lib/whatsapp'
import { DEMO_BANNER } from '@/lib/demo'
import { useTerminalStore } from '@/stores/terminal'
import HelpTip from '@/components/HelpTip.vue'

const props = defineProps<{ output: string; loading: boolean; error: string; sending: boolean; staticDemo: boolean }>()
const emit = defineEmits<{ send: [] }>()
const copied = ref(false)
const terminalStore = useTerminalStore()
const terminalBody = ref<HTMLElement | null>(null)
defineExpose({ focus: () => terminalBody.value?.focus() })
const isDemo = computed(() => props.output.startsWith(DEMO_BANNER))
const shareUrl = computed(() => buildWhatsappShareUrl(props.output))

const copyToClipboard = async () => {
  if (!props.output) return
  try {
    await navigator.clipboard.writeText(props.output)
    copied.value = true
    terminalStore.addLog('📋 Transmisión copiada al portapapeles')
    window.setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    /* El navegador puede bloquear el portapapeles. */
  }
}
</script>

<template>
  <section class="terminal-panel">
    <div class="terminal-header">
      <div class="header-left">
        <span class="status-dot"></span> ENLACE ACTIVO
        <HelpTip
          topic="Acciones de transmisión"
          text="📋 Copiar lo deja en el portapapeles. 🟢 Compartir abre WhatsApp con el texto: tú eliges el grupo. 📲 Enviar al grupo solo aparece si tienes el servidor local (opcional)."
        />
      </div>
      <div class="header-right">
        <span v-if="!output" class="connection-text">CONEXIÓN SEGURA // GEMINI</span>
        <button v-if="output" type="button" class="btn-copy" :class="{ copied }" @click="copyToClipboard">
          {{ copied ? '✅ COPIADO' : '📋 COPIAR' }}
        </button>
        <a
          v-if="output"
          class="btn-copy share"
          :href="shareUrl"
          target="_blank"
          rel="noopener noreferrer"
          @click="terminalStore.addLog('🟢 Compartir en WhatsApp')"
          >🟢 COMPARTIR EN WHATSAPP</a
        >
        <button v-if="output && !staticDemo" type="button" class="btn-copy" :disabled="sending" @click="emit('send')">
          {{ sending ? 'ENVIANDO...' : '📲 ENVIAR AL GRUPO' }}
        </button>
      </div>
    </div>
    <div ref="terminalBody" class="terminal-body" tabindex="-1" aria-live="polite" :aria-busy="loading">
      <div v-if="loading" class="placeholder loading">
        <span class="shield">📡</span>
        <p>GENERANDO TRANSMISIÓN…</p>
      </div>
      <div v-else-if="error" class="error-output" role="alert">❌ {{ error }}</div>
      <div v-else-if="!output" class="placeholder">
        <span class="shield">🛡️</span>
        <p>
          1. ELIGE UN JUEGO<br />2. CONFIGURA LA MISIÓN<br />3. GENERA LA TRANSMISIÓN<br /><br />¿Sin clave? Pulsa 🧪
          MODO DEMO.
        </p>
      </div>
      <div v-else class="output-content">
        <strong v-if="isDemo" class="demo-label">MODO DEMO</strong>
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
  min-height: 320px;
  max-height: 600px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
.terminal-header {
  background: var(--terminal-header-bg);
  padding: 10px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.75rem;
  color: #4db8ff;
  letter-spacing: 1px;
  flex-shrink: 0;
}
.header-left {
  white-space: nowrap;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  flex-wrap: wrap;
  justify-content: flex-end;
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
.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-sizing: border-box;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font: 700 0.7rem var(--font-stack);
  min-height: 44px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}
.btn-copy:hover {
  border-color: #ffbd00;
  color: #ffbd00;
}
.btn-copy.copied {
  border-color: #00ff00;
  color: #00ff00;
}
.terminal-body {
  flex: 1;
  min-height: 0;
  padding: 30px;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: 'Courier New', monospace;
  position: relative;
}
.placeholder {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-secondary);
  opacity: 0.7;
  text-align: center;
}
.shield {
  font-size: 4rem;
  margin-bottom: 10px;
}
.loading {
  color: var(--terminal-text);
  animation: pulse 1.2s infinite;
}
.output-content {
  color: var(--terminal-text);
  line-height: 1.6;
  width: 100%;
}
.text-content {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font: inherit;
}
.cursor {
  animation: blink 1s infinite;
  font-weight: bold;
}
.demo-label {
  display: inline-block;
  color: #ffbd00;
  border: 1px solid #ffbd00;
  padding: 3px 8px;
  margin-bottom: 14px;
}
.error-output {
  color: var(--text-danger);
  white-space: pre-wrap;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
@keyframes pulse {
  50% {
    opacity: 0.45;
  }
}
@media (max-width: 700px) {
  .terminal-panel {
    max-height: none;
  }
  .terminal-header {
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }
  .connection-text {
    display: none;
  }
}
</style>
