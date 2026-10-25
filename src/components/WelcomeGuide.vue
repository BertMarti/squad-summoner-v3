<script setup lang="ts">
import { writeStored, STORAGE_KEYS } from '@/lib/storage'

const emit = defineEmits<{ demo: []; config: []; close: [] }>()
const hide = () => {
  writeStored(STORAGE_KEYS.welcomeSeen, '1')
  emit('close')
}
const runDemo = () => emit('demo')
</script>

<template>
  <section id="welcome-guide" class="welcome-guide" aria-labelledby="welcome-title">
    <button type="button" class="guide-close" aria-label="Cerrar ayuda" @click="hide">✕</button>
    <h2 id="welcome-title">BIENVENIDO, RECLUTA</h2>
    <p>
      Squad Summoner escribe convocatorias épicas para que tu grupo se conecte a jugar y te deja compartirlas por
      WhatsApp.
    </p>
    <ol>
      <li>Elige juego</li>
      <li>Escribe reclutas y hora</li>
      <li>Genera y comparte</li>
    </ol>
    <div class="guide-actions">
      <button type="button" class="guide-primary" @click="runDemo">🧪 PROBAR AHORA (SIN CLAVE)</button>
      <button type="button" class="guide-secondary" @click="emit('config')">🔑 USAR LA IA GRATIS</button>
    </div>
    <button type="button" class="guide-dismiss" @click="hide">Entendido, no volver a mostrar</button>
  </section>
</template>

<style scoped>
.welcome-guide {
  position: relative;
  margin: 0 0 24px;
  padding: 22px 26px;
  border: 1px solid var(--border-accent);
  background: var(--bg-panel);
  box-shadow: var(--shadow-accent);
}
h2 {
  margin: 0 0 8px;
  color: var(--text-accent);
  letter-spacing: 1px;
}
p,
li {
  color: var(--text-secondary);
  line-height: 1.5;
}
ol {
  display: flex;
  gap: 28px;
  padding-left: 22px;
  flex-wrap: wrap;
}
.guide-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.guide-actions button,
.guide-dismiss {
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}
.guide-primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: 0;
}
.guide-secondary,
.guide-dismiss {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}
.guide-dismiss {
  margin-top: 14px;
  font-size: 0.8rem;
}
.guide-close {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 40px;
  min-height: 40px;
  background: transparent;
  border: 0;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.1rem;
}
@media (max-width: 480px) {
  .welcome-guide {
    padding: 18px 16px;
  }
  ol {
    gap: 8px 20px;
  }
}
</style>
