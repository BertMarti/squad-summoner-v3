<script setup lang="ts">
import { ref, computed } from 'vue'
import { APP_VERSION, ENV_API_KEY } from '@/config'

const props = defineProps<{ isDark: boolean; helpOpen: boolean }>()
const emit = defineEmits<{ openConfig: []; toggleTheme: []; toggleHelp: [] }>()

const isEnvConfigured = computed(() => Boolean(ENV_API_KEY))

const configButton = ref<HTMLButtonElement | null>(null)
defineExpose({ focusConfig: () => configButton.value?.focus() })
</script>

<template>
  <header class="top-bar">
    <div class="logo-section">
      <div class="logo-icon">
        <span class="logo-emoji">🎖️</span>
      </div>
      <div class="text">
        <h1>SQUAD SUMMONER</h1>
        <small>PROTOCOLO DE INVOCACIÓN TÁCTICA V{{ APP_VERSION }}</small>
      </div>
    </div>

    <div class="actions">
      <button
        type="button"
        class="btn-icon"
        @click="emit('toggleTheme')"
        :aria-label="props.isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
        :aria-pressed="props.isDark"
      >
        <span v-if="props.isDark">☀️</span>
        <span v-else>🌑</span>
      </button>

      <div v-if="isEnvConfigured" class="badge-env">🔒 API INTEGRADA (.ENV)</div>
      <button v-else ref="configButton" type="button" class="btn-config" @click="emit('openConfig')">
        ⚙️ CONFIGURAR API
      </button>
      <button
        type="button"
        class="btn-config help-button"
        aria-controls="welcome-guide"
        :aria-expanded="props.helpOpen"
        @click="emit('toggleHelp')"
      >
        ❓ AYUDA
      </button>
    </div>
  </header>
</template>

<style scoped>
/* Estilos Base existentes */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 30px;
}
.logo-section {
  display: flex;
  align-items: center;
  gap: 15px;
}
.logo-icon {
  background: rgba(255, 189, 0, 0.1);
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border-accent);
}
.logo-emoji {
  font-size: 1.5rem;
}
.text h1 {
  margin: 0;
  font-size: 1.8rem;
  letter-spacing: 1px;
  color: var(--text-primary);
}
.text small {
  color: var(--text-accent);
  font-weight: 600;
  letter-spacing: 2px;
  font-size: 0.75rem;
}
.actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-icon {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s;
}
.btn-icon:hover {
  border-color: var(--text-accent);
}

.btn-config {
  background: var(--btn-secondary-bg);
  border: 1px solid var(--btn-secondary-border);
  color: var(--text-secondary);
  padding: 0 20px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.badge-env {
  background: rgba(77, 255, 77, 0.1);
  color: #4dff4d;
  padding: 0 15px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #4dff4d;
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  font-weight: bold;
}

@media (max-width: 600px) {
  .top-bar {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .text h1 {
    font-size: 1.35rem;
  }
  .text small {
    font-size: 0.6rem;
    letter-spacing: 1px;
  }
  .actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
