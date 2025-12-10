<script setup lang="ts">
import { useGemini } from '@/composables/useGemini';

defineProps(['modelValue', 'subGame', 'customName']);
const emit = defineEmits(['update:modelValue', 'update:subGame', 'update:customName']);

const { GAMES } = useGemini();

const select = (id: string) => emit('update:modelValue', id);
</script>

<template>
  <div class="panel-section">
    <div class="section-header">
      <span class="step-number">01</span>
      <h3>SELECCIONAR TEATRO</h3>
    </div>
    
    <div class="games-grid">
      <div 
        v-for="g in GAMES" :key="g.id" 
        class="game-card" 
        :class="{ active: modelValue === g.id }"
        @click="select(g.id)"
      >
        <div class="card-bg" :style="{ backgroundImage: `url(${g.img})` }"></div>
        <div class="card-overlay"></div>
        <div class="game-info">
            <h4>{{ g.title }}</h4>
            <span>{{ g.icon }}</span>
        </div>
      </div>
    </div>

    <!-- Inputs Condicionales -->
    <div v-if="modelValue === 'mh'" class="sub-input fade-in">
      <select class="tech-input" :value="subGame" @input="$emit('update:subGame', ($event.target as HTMLSelectElement).value)">
        <option disabled value="">Versión...</option>
        <option>World</option><option>Rise</option><option>Wilds</option>
      </select>
    </div>
    <div v-if="modelValue === 'custom'" class="sub-input fade-in">
      <input class="tech-input" :value="customName" @input="$emit('update:customName', ($event.target as HTMLInputElement).value)" placeholder="Nombre del juego..." />
    </div>
  </div>
</template>

<style scoped>
.panel-section { background: var(--bg-panel); padding: 25px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 25px; }
.section-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
.step-number { background: var(--text-accent); color: #000; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.section-header h3 { margin: 0; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-primary); }

.games-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px; }
.game-card { height: 100px; border-radius: 8px; cursor: pointer; position: relative; overflow: hidden; border: 2px solid var(--border-color); transition: all 0.2s; background: #000; }
.card-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; opacity: 0.6; transition: 0.3s; }
.card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); }
.game-info { position: absolute; bottom: 8px; left: 8px; right: 8px; display: flex; justify-content: space-between; align-items: center; z-index: 2; }
.game-info h4 { margin: 0; color: #fff; font-size: 0.8rem; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }

.game-card.active { border-color: var(--border-accent); box-shadow: var(--shadow-accent); }
.game-card.active .card-bg { opacity: 1; transform: scale(1.05); }
.game-card.active h4 { color: var(--text-accent); }

.sub-input { margin-top: 15px; }
.tech-input { width: 100%; padding: 12px; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; box-sizing: border-box; }
.tech-input:focus { outline: none; border-color: var(--border-accent); }
</style>
