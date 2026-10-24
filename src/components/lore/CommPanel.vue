<template>
  <section class="comm-panel">
    <div class="row">
      <button type="button" class="btn" aria-label="Alternar sonido" @click="$emit('toggle-tts')">🔊 Sonido</button>
      <button type="button" class="btn" aria-label="Silenciar" @click="$emit('mute-toggle')">🔇 Silenciar</button>
      <button type="button" class="btn" @click="$emit('refresh-ticker')">🔁 Actualizar avisos</button>
    </div>
    <div class="row small">
       <span class="status">Estado: <strong>{{ connected ? 'EN LÍNEA' : 'SIN CONEXIÓN' }}</strong></span>
       <span class="lat">Latencia: {{ latency }} ms</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
const props = defineProps<{ connected?: boolean }>();
defineEmits<{ 'toggle-tts': []; 'mute-toggle': []; 'refresh-ticker': [] }>();
const connected = computed(() => props.connected ?? true);
const latency = ref(42);
let timer: number | undefined;
onMounted(() => {
  // Simulación decorativa de latencia
  timer = window.setInterval(() => (latency.value = 20 + Math.floor(Math.random() * 120)), 2000);
});
onUnmounted(() => window.clearInterval(timer));
</script>

<style scoped>
.comm-panel{ background:var(--bg-panel); border:1px solid var(--border-color); padding:10px; border-radius:8px; display:flex; flex-direction:column; gap:8px }
.row{ display:flex; gap:8px; align-items:center }
.row.small{ font-size:0.85rem; color:var(--text-secondary); justify-content:space-between }
.btn{ background:transparent; border:1px solid var(--border-color); padding:6px 10px; border-radius:6px; cursor:pointer; color:var(--text-secondary) }
.btn:hover{ border-color:var(--text-accent); color:var(--text-accent) }
.status{ font-family:monospace }
</style>
