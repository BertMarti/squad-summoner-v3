<template>
  <section class="comm-panel">
    <div class="row">
      <button class="btn" @click="$emit('toggle-tts')">🔊 Toggle TTS</button>
      <button class="btn" @click="$emit('mute-toggle')">🔇 Mute</button>
      <button class="btn" @click="$emit('refresh-ticker')">🔁 Refresh Ticker</button>
    </div>
    <div class="row small">
      <span class="status">Status: <strong>{{ connected ? 'ONLINE' : 'OFFLINE' }}</strong></span>
      <span class="lat">Latency: {{ latency }}ms</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
const props = defineProps<{ connected?: boolean }>();
const connected = props.connected ?? true;
const latency = ref(42);
onMounted(() => {
  // small simulation
  setInterval(() => latency.value = 20 + Math.floor(Math.random() * 120), 2000);
});
</script>

<style scoped>
.comm-panel{ background:var(--bg-panel); border:1px solid var(--border-color); padding:10px; border-radius:8px; display:flex; flex-direction:column; gap:8px }
.row{ display:flex; gap:8px; align-items:center }
.row.small{ font-size:0.85rem; color:var(--text-secondary); justify-content:space-between }
.btn{ background:transparent; border:1px solid var(--border-color); padding:6px 10px; border-radius:6px; cursor:pointer; color:var(--text-secondary) }
.btn:hover{ border-color:var(--text-accent); color:var(--text-accent) }
.status{ font-family:monospace }
</style>
