<template>
  <div class="radar" aria-hidden="true">
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" class="ring" />
      <circle cx="50" cy="50" r="30" class="ring dim" />
      <circle cx="50" cy="50" r="15" class="ring dim" />
      <g v-for="(t, i) in targets" :key="i">
        <circle :cx="t.x" :cy="t.y" r="1.8" class="p" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ targets?: Array<{ x: number; y: number }> }>()
const targets = computed(
  () =>
    props.targets ?? [
      { x: 60, y: 40 },
      { x: 35, y: 30 },
      { x: 70, y: 72 },
    ],
)
</script>

<style scoped>
.radar {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.04));
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
svg {
  width: 100%;
  height: 120px;
}
.ring {
  fill: none;
  stroke: rgba(77, 189, 255, 0.06);
  stroke-width: 1.2;
}
.dim {
  stroke-opacity: 0.6;
}
.p {
  fill: var(--text-accent);
  filter: drop-shadow(0 0 6px rgba(77, 189, 255, 0.2));
}
</style>
