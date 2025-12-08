<script setup lang="ts">
import { ref } from 'vue';
const emit = defineEmits(['save', 'close']);
const key = ref(localStorage.getItem('USER_API_KEY') || '');

const save = () => {
  localStorage.setItem('USER_API_KEY', key.value);
  emit('save', key.value);
};
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h2>CONFIGURACIÓN</h2>
      <p>Introduce tu API Key de Gemini:</p>
      <input type="password" v-model="key" class="tech-input" placeholder="Pegar Key aquí..." />
      <div class="btns">
        <button @click="$emit('close')" class="btn-cancel">CANCELAR</button>
        <button @click="save" class="btn-save">GUARDAR</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 100; backdrop-filter: blur(5px); }
.modal { background: var(--bg-panel); border: 1px solid var(--border-accent); padding: 30px; width: 400px; border-radius: 12px; box-shadow: var(--shadow-accent); }
h2 { color: var(--text-accent); margin-top: 0; }
p { color: var(--text-secondary); }
.tech-input { width: 100%; padding: 12px; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; margin-bottom: 20px; box-sizing: border-box; }
.btns { display: flex; gap: 10px; }
button { flex: 1; padding: 12px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; }
.btn-save { background: var(--btn-primary-bg); color: var(--btn-primary-text); }
.btn-cancel { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); }
</style>