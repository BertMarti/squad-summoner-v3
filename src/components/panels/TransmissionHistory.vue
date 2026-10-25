<script setup lang="ts">
import HelpTip from '@/components/HelpTip.vue'
import { DEMO_BANNER } from '@/lib/demo'
import { GAME_TITLES } from '@/lib/mission'
import { TONES } from '@/lib/tones'
import type { HistoryEntry } from '@/lib/history'
import { useHistoryStore } from '@/stores/history'

const emit = defineEmits<{ show: [entry: HistoryEntry]; repeat: [entry: HistoryEntry] }>()
const store = useHistoryStore()

const titleFor = (entry: HistoryEntry) =>
  entry.mission.game === 'custom'
    ? entry.mission.customGameName || 'Personalizado'
    : GAME_TITLES[entry.mission.game as keyof typeof GAME_TITLES] || 'Personalizado'
const toneFor = (entry: HistoryEntry) => TONES.find((tone) => tone.id === entry.mission.tone)?.label || 'Épico'
const timeFor = (entry: HistoryEntry) =>
  new Date(entry.createdAt).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
const hourFor = (entry: HistoryEntry) =>
  new Date(entry.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
const previewFor = (entry: HistoryEntry) =>
  entry.text.replace(DEMO_BANNER, '').trim().split('\n')[0] || 'Transmisión sin texto.'
</script>

<template>
  <section class="history-panel" aria-labelledby="history-title">
    <div class="history-header">
      <h3 id="history-title">
        HISTORIAL
        <HelpTip
          topic="Historial"
          text="Las últimas 10 transmisiones. Sin marcar «Recordar», se borran al recargar la página."
        />
      </h3>
    </div>
    <p v-if="store.isEmpty" class="empty-history">
      Aún no hay transmisiones. Genera una (o prueba 🧪 MODO DEMO) y aparecerá aquí.
    </p>
    <ol v-else class="history-list">
      <li v-for="entry in store.entries" :key="entry.id" class="history-entry">
        <div class="entry-info">
          <time :datetime="entry.createdAt">{{ timeFor(entry) }}</time>
          <strong>{{ titleFor(entry) }}</strong>
          <span
            >{{ entry.mission.time || 'sin hora' }} · {{ toneFor(entry) }} ·
            {{ entry.source === 'demo' ? 'DEMO' : 'IA' }}</span
          >
          <p :title="previewFor(entry)">{{ previewFor(entry) }}</p>
        </div>
        <div class="entry-actions">
          <button
            type="button"
            @click="emit('show', entry)"
            :aria-label="`Ver la transmisión de ${titleFor(entry)} de las ${hourFor(entry)}`"
          >
            📄 VER
          </button>
          <button
            type="button"
            @click="emit('repeat', entry)"
            :aria-label="`Repetir la transmisión de ${titleFor(entry)} de las ${hourFor(entry)}`"
          >
            🔁 REPETIR
          </button>
        </div>
      </li>
    </ol>
    <label class="remember-history" for="remember-history">
      <input
        id="remember-history"
        type="checkbox"
        :checked="store.remember"
        @change="store.setRemember(($event.target as HTMLInputElement).checked)"
      />
      <span>Recordar historial en este navegador</span>
    </label>
    <p class="history-note">
      Sin marcar, el historial solo vive en esta pestaña. Si lo marcas, se guarda en este navegador (incluye los nombres
      de los reclutas); desmárcalo para borrarlo.
    </p>
    <button type="button" class="clear-history" :disabled="store.isEmpty" @click="store.clear">
      🗑️ VACIAR HISTORIAL
    </button>
  </section>
</template>

<style scoped>
.history-panel {
  margin-top: 16px;
  padding: 20px;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}
.history-header h3 {
  margin: 0 0 14px;
  color: var(--text-primary);
  font-size: 1rem;
}
.history-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 24px;
}
.history-entry {
  padding: 10px 0 10px 4px;
  border-bottom: 1px solid var(--border-color);
}
.entry-info {
  min-width: 0;
  display: grid;
  gap: 3px;
}
.entry-info time,
.entry-info span {
  color: var(--text-secondary);
  font-size: 0.78rem;
}
.entry-info strong {
  color: var(--text-accent);
}
.entry-info p {
  overflow: hidden;
  margin: 2px 0 0;
  color: var(--terminal-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.entry-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.entry-actions button,
.clear-history {
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 700;
}
.entry-actions button:hover,
.clear-history:hover:not(:disabled) {
  border-color: var(--border-accent);
  color: var(--text-accent);
}
.remember-history {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  margin-top: 14px;
  cursor: pointer;
}
.remember-history input {
  accent-color: var(--border-accent);
}
.history-note,
.empty-history {
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.45;
}
.clear-history {
  width: 100%;
  margin-top: 8px;
}
.clear-history:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
