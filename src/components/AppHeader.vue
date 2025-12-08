<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps(['isDark']);
const emit = defineEmits(['openConfig', 'toggleTheme']);

const envApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const isEnvConfigured = computed(() => !!envApiKey && envApiKey.trim() !== '');
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
      <!-- Toggle Tema -->
      <button class="btn-icon" @click="$emit('toggleTheme')" :title="isDark ? 'Modo Claro' : 'Modo Oscuro'">
        <span v-if="isDark">☀️</span>
        <span v-else>🌑</span>
      </button>

      <!-- Botón Config -->
      <div v-if="isEnvConfigured" class="badge-env">
        🔒 API INTEGRADA (.ENV)
      </div>
      <button v-else class="btn-config" @click="$emit('openConfig')">
        ⚙️ CONFIGURAR API
      </button>
    </div>
  </header>
</template>

<style scoped>
.top-bar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid var(--border-color); margin-bottom: 30px; }
.logo-section { display: flex; align-items: center; gap: 15px; }
.logo-icon { background: rgba(255, 189, 0, 0.1); padding: 8px; border-radius: 8px; border: 1px solid var(--border-accent); }
.text h1 { margin: 0; font-size: 1.8rem; letter-spacing: 1px; color: var(--text-primary); }
.text small { color: var(--text-accent); font-weight: 600; letter-spacing: 2px; font-size: 0.75rem; }
.actions { display: flex; gap: 10px; align-items: center; }

.btn-icon { background: var(--bg-panel); border: 1px solid var(--border-color); color: var(--text-primary); width: 40px; height: 40px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.btn-icon:hover { border-color: var(--text-accent); }

.btn-config { background: var(--btn-secondary-bg); border: 1px solid var(--btn-secondary-border); color: var(--text-secondary); padding: 0 20px; height: 40px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-config:hover { border-color: var(--text-accent); color: var(--text-accent); }
.badge-env { background: rgba(77, 255, 77, 0.1); color: #4dff4d; padding: 0 15px; height: 40px; border-radius: 8px; border: 1px solid #4dff4d; display: flex; align-items: center; font-size: 0.8rem; font-weight: bold; }
</style>