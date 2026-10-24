<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';

defineProps<{ topic: string; text: string }>();
const open = ref(false);
const id = `help-${Math.random().toString(36).slice(2, 9)}`;
const onKeydown = (event: KeyboardEvent) => { if (event.key === 'Escape') open.value = false; };
const toggle = () => {
  open.value = !open.value;
  if (open.value) document.addEventListener('keydown', onKeydown);
  else document.removeEventListener('keydown', onKeydown);
};
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <span class="help-tip">
    <button type="button" class="help-button" :aria-label="`Ayuda: ${topic}`" :aria-controls="id" :aria-expanded="open" @click="toggle">?</button>
    <span v-if="open" :id="id" class="help-text" role="note">{{ text }}</span>
  </span>
</template>

<style scoped>
/* El texto se despliega dentro del flujo (no flotante): nunca se sale de la pantalla en móvil. */
.help-tip { display: inline; }
.help-button { min-width: 32px; min-height: 32px; margin-left: 6px; padding: 0 8px; border: 1px solid var(--border-accent); border-radius: 50%; background: transparent; color: var(--text-accent); font: 700 .85rem var(--font-stack); vertical-align: middle; cursor: pointer; }
.help-text { display: block; box-sizing: border-box; max-width: 100%; min-width: min(260px, 78vw); margin-top: 8px; padding: 10px 12px; background: var(--bg-panel); border: 1px solid var(--border-accent); border-radius: 6px; color: var(--text-secondary); font: 400 .82rem/1.45 var(--font-stack); letter-spacing: normal; text-transform: none; white-space: normal; }
</style>
