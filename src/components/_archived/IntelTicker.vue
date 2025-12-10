<template>
  <div class="ticker">
    <div class="track" :style="{ animationDuration: speed + 's' }">
      <span v-for="(item, i) in items" :key="i" class="item">⚠️ {{ item }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ items?: string[], speed?: number }>();
const items = props.items ?? ['ALERTA: PUERTA NORTE COMPROMETIDA','INFO: Módulo TTS activo'];
const speed = props.speed ?? 18;
</script>

<style scoped>
.ticker{ background: rgba(0,0,0,0.18); border:1px solid var(--border-color); overflow:hidden; border-radius:8px; padding:8px 12px; height:56px; display:flex; align-items:center; box-shadow: 0 6px 16px rgba(0,0,0,0.18); }
.track{ display:inline-block; white-space:nowrap; animation: scroll linear infinite; }
.item{ margin-right:40px; color:var(--text-accent); font-weight:700; font-family:monospace }
@keyframes scroll { 0%{ transform: translateX(0);} 100%{ transform: translateX(-50%);} }
</style>
