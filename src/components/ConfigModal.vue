<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { USER_API_KEY_STORAGE } from '@/config';

const emit = defineEmits<{ save: [key: string]; close: [] }>();
const key = ref(localStorage.getItem(USER_API_KEY_STORAGE) || '');
const input = ref<HTMLInputElement | null>(null);

const close = () => emit('close');
const save = () => { localStorage.setItem(USER_API_KEY_STORAGE, key.value.trim()); emit('save', key.value.trim()); };
const clear = () => { key.value = ''; localStorage.removeItem(USER_API_KEY_STORAGE); emit('save', ''); };
const onKeydown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
onMounted(async () => { document.addEventListener('keydown', onKeydown); await nextTick(); input.value?.focus(); });
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="config-title">
      <h2 id="config-title">CONFIGURACIÓN</h2>
      <p>Introduce tu API key de Gemini:</p>
      <label for="gemini-key">API key</label>
      <input id="gemini-key" ref="input" type="password" v-model="key" class="tech-input" placeholder="Pegar key aquí..." autocomplete="off" />
      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Consigue una clave gratis en Google AI Studio</a>
      <p class="note">Tu clave solo se guarda en este navegador (localStorage) y solo se envía a Google.</p>
      <div class="btns">
        <button type="button" @click="clear" class="btn-cancel">BORRAR CLAVE</button>
        <button type="button" @click="close" class="btn-cancel">CANCELAR</button>
        <button type="button" @click="save" class="btn-save">GUARDAR</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.8); display: flex; justify-content: center; align-items: center; z-index: 100; padding: 16px; box-sizing: border-box; }
.modal { background: var(--bg-panel); border: 1px solid var(--border-accent); padding: 30px; width: min(400px, 92vw); border-radius: 12px; box-shadow: var(--shadow-accent); box-sizing: border-box; }
h2 { color: var(--text-accent); margin-top: 0; } p { color: var(--text-secondary); } label { display: block; margin-bottom: 6px; color: var(--text-secondary); }
.tech-input { width: 100%; padding: 12px; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; margin-bottom: 12px; box-sizing: border-box; }
a { color: var(--terminal-text); } .note { font-size: .8rem; line-height: 1.4; }.btns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 18px; }
button { flex: 1; min-height: 44px; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; }.btn-save { background: var(--btn-primary-bg); color: var(--btn-primary-text); border: none; }.btn-cancel { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); }
</style>
