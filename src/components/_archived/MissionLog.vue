<template>
  <section class="log-panel">
    <div class="header"><strong>MISSION LOG</strong></div>
    <div class="log-body">
      <div v-for="(line, i) in lines" :key="i" class="log-line">
        <span class="ts">{{ line.ts }}</span>
        <span class="msg">{{ line.text }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps<{ lines?: Array<{ ts:string, text:string }> }>();
const lines = ref(props.lines ?? [
  { ts: '00:00:01', text: 'Transmisión iniciada.' },
  { ts: '00:00:05', text: 'Generando resumen táctico...' }
]);
</script>

<style scoped>
.log-panel { background: var(--bg-panel); border:1px solid var(--border-color); border-radius:8px; padding:12px; height:220px; display:flex; flex-direction:column; box-shadow: 0 8px 20px rgba(0,0,0,0.25); }
.header{ color:var(--text-accent); font-family: monospace; margin-bottom:8px; font-weight:800 }
.log-body{ flex:1; overflow:auto; font-family:'Courier New', monospace; color:var(--text-secondary); font-size:0.9rem; }
.log-line{ display:flex; gap:10px; padding:6px 4px; border-bottom:1px dashed rgba(255,255,255,0.02); }
.ts{ color: #7fd6ff; width:90px; font-weight:700; font-family:monospace }
.msg{ white-space:pre-wrap; }
</style>
