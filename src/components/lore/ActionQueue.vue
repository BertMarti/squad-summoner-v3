<template>
  <section class="queue">
    <div class="header">COLA DE ACCIONES</div>
    <ul>
      <li v-for="p in processes" :key="p.id" :class="p.status">
        <div class="left">
          <span class="dot">{{ p.emoji }}</span>
          <div class="meta">
            <div class="name">{{ p.name }}</div>
            <div class="sub">{{ p.detail }}</div>
          </div>
        </div>
        <div class="right">
          <button type="button" class="small" aria-label="Cancelar proceso" @click="$emit('cancel', p.id)">✖</button>
        </div>
      </li>
    </ul>
    <div class="controls">
      <button type="button" class="btn" @click="$emit('enqueue')">+ Añadir proceso</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProcessItem } from '@/types';
const props = defineProps<{ processes?: ProcessItem[] }>();
const processes = computed(() => props.processes ?? []);
</script>

<style scoped>
.queue{ background:var(--bg-panel); border:1px solid var(--border-color); padding:10px; border-radius:8px; display:flex; flex-direction:column; gap:8px }
.header{ color:var(--text-accent); font-weight:800; font-family:monospace }
ul{ list-style:none; padding:0; margin:0; max-height:160px; overflow:auto }
li{ display:flex; justify-content:space-between; align-items:center; padding:6px 4px; border-bottom:1px dashed rgba(255,255,255,0.03) }
.left{ display:flex; gap:8px; align-items:center }
.dot{ font-size:1.1rem }
.meta .name{ font-weight:700 }
.meta .sub{ font-size:0.8rem; color:var(--text-secondary) }
.small{ background:transparent; border:1px solid var(--border-color); border-radius:6px; padding:4px 6px; cursor:pointer }
.controls{ display:flex; justify-content:flex-end }
.btn{ background:transparent; border:1px solid var(--border-color); padding:6px 10px; border-radius:6px }
.running{ background:rgba(45,220,80,0.03) }
.done{ opacity:0.6 }
.queued{ opacity:0.95 }
</style>
