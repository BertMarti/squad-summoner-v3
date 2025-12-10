<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps(['isDark', 'ttsEnabled']); // Recibimos el estado del TTS
const emit = defineEmits(['openConfig', 'toggleTheme', 'update:ttsEnabled']);

const envApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const isEnvConfigured = computed(() => !!envApiKey && envApiKey.trim() !== '');

const showAudioSettings = ref(false);
</script>

<template>
  <header class="top-bar">
    <div class="logo-section">
      <div class="logo-icon">
        <span style="font-size: 1.5rem;">🎖️</span>
      </div>
      <div class="text">
        <h1>SQUAD SUMMONER</h1>
        <small>PROTOCOLO DE INVOCACIÓN TÁCTICA V3.0</small>
      </div>
    </div>
    
    <div class="actions">
      <button class="btn-icon" @click="$emit('toggleTheme')" :title="isDark ? 'Modo Claro' : 'Modo Oscuro'">
        <span v-if="isDark">☀️</span>
        <span v-else>🌑</span>
      </button>

      <div v-if="isEnvConfigured" class="badge-env">
        🔒 API INTEGRADA (.ENV)
      </div>
      <button v-else class="btn-config" @click="$emit('openConfig')">
        ⚙️ CONFIGURAR API
      </button>

      <button 
        class="btn-icon audio-btn" 
        :class="{ 'audio-active': ttsEnabled }"
        @click="showAudioSettings = true" 
        title="Configuración de Voz (TTS)"
      >
        <span v-if="ttsEnabled">🔊</span>
        <span v-else>🔇</span>
      </button>
    </div>

    <div v-if="showAudioSettings" class="modal-backdrop" @click.self="showAudioSettings = false">
      <div class="modal-window">
        <div class="modal-header">
          <h3>/// SISTEMA DE VOX ///</h3>
          <button class="close-btn" @click="showAudioSettings = false">X</button>
        </div>
        
        <div class="modal-body">
          <p class="desc">
            Habilita la síntesis de voz táctica usando el modelo 
            <strong>Gemini 2.5 Flash Preview</strong>.
          </p>

          <div class="switch-container">
            <label class="switch">
              <input 
                type="checkbox" 
                :checked="ttsEnabled" 
                @change="$emit('update:ttsEnabled', ($event.target as HTMLInputElement).checked)"
              >
              <span class="slider"></span>
            </label>
            <span class="status-label">{{ ttsEnabled ? 'ONLINE' : 'OFFLINE' }}</span>
          </div>

          <div class="info-box">
            ⚠️ <strong>NOTA:</strong> El sistema primero resume el mensaje para optimizar tokens y luego genera el audio.
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Estilos Base existentes */
.top-bar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid var(--border-color); margin-bottom: 30px; }
.logo-section { display: flex; align-items: center; gap: 15px; }
.logo-icon { background: rgba(255, 189, 0, 0.1); padding: 8px; border-radius: 8px; border: 1px solid var(--border-accent); }
.text h1 { margin: 0; font-size: 1.8rem; letter-spacing: 1px; color: var(--text-primary); }
.text small { color: var(--text-accent); font-weight: 600; letter-spacing: 2px; font-size: 0.75rem; }
.actions { display: flex; gap: 10px; align-items: center; }

.btn-icon { background: var(--bg-panel); border: 1px solid var(--border-color); color: var(--text-primary); width: 40px; height: 40px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: all 0.2s; }
.btn-icon:hover { border-color: var(--text-accent); }

.btn-config { background: var(--btn-secondary-bg); border: 1px solid var(--btn-secondary-border); color: var(--text-secondary); padding: 0 20px; height: 40px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.badge-env { background: rgba(77, 255, 77, 0.1); color: #4dff4d; padding: 0 15px; height: 40px; border-radius: 8px; border: 1px solid #4dff4d; display: flex; align-items: center; font-size: 0.8rem; font-weight: bold; }

/* NUEVOS ESTILOS PARA AUDIO */
.audio-btn.audio-active {
  border-color: var(--text-accent);
  color: var(--text-accent);
  background: rgba(255, 189, 0, 0.1);
}

/* Modal Styles */
.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(2px);
  z-index: 1000; display: flex; justify-content: center; align-items: center;
}
.modal-window {
  width: 350px; background: #111; border: 2px solid var(--text-accent);
  border-radius: 8px; padding: 20px; box-shadow: 0 0 30px rgba(0,0,0,0.5);
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px; }
.modal-header h3 { margin: 0; color: var(--text-accent); font-family: monospace; letter-spacing: 2px; }
.close-btn { background: none; border: none; color: #666; cursor: pointer; font-weight: bold; }
.close-btn:hover { color: #fff; }

.desc { font-size: 0.9rem; color: #aaa; margin-bottom: 20px; line-height: 1.4; }
.info-box { background: #222; padding: 10px; font-size: 0.8rem; color: #ccc; border-left: 3px solid var(--text-accent); margin-top: 20px; }

/* Switch Toggle */
.switch-container { display: flex; align-items: center; gap: 15px; margin: 20px 0; }
.status-label { font-weight: bold; color: var(--text-accent); font-family: monospace; }

.switch { position: relative; display: inline-block; width: 50px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 34px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: var(--text-accent); }
input:checked + .slider:before { transform: translateX(24px); }
</style>
