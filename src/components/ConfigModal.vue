<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { GEMINI_MODEL, IS_STATIC_DEMO } from '@/config'
import { apiKeyFormatWarning } from '@/lib/geminiErrors'
import { useApiKeyStore } from '@/stores/apiKey'
import { useGemini } from '@/composables/useGemini'
import { useServerTokenStore } from '@/stores/serverToken'

const emit = defineEmits<{ save: []; close: [] }>()
const store = useApiKeyStore()
const serverTokenStore = useServerTokenStore()
const { checkApiKey } = useGemini()
const key = ref(store.userKey)
const remember = ref(store.remember)
const input = ref<HTMLInputElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
const visibleKey = ref(false)
const checking = ref(false)
const checkMessage = ref('')
const checkError = ref(false)
const formatWarning = computed(() => (key.value ? apiKeyFormatWarning(key.value) : null))
const serverToken = ref(serverTokenStore.userToken)
const visibleServerToken = ref(false)

const close = () => emit('close')
const save = () => {
  store.setKey(key.value, remember.value)
  serverTokenStore.setToken(serverToken.value)
  emit('save')
}
const clear = () => {
  store.clearKey()
  key.value = ''
  remember.value = false
  checkMessage.value = ''
  emit('save')
}
const testKey = async () => {
  checking.value = true
  checkMessage.value = 'Comprobando…'
  checkError.value = false
  try {
    const result = await checkApiKey(key.value.trim())
    checkError.value = !result.ok
    checkMessage.value = result.ok
      ? `✅ Clave válida: lista para usar con el modelo ${GEMINI_MODEL}.`
      : `❌ ${result.message}`
  } catch (error: unknown) {
    checkError.value = true
    checkMessage.value = `❌ ${error instanceof Error ? error.message : 'No se ha podido comprobar la clave.'}`
  } finally {
    checking.value = false
  }
}
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
    return
  }
  if (event.key !== 'Tab' || !dialog.value) return
  const focusable = [...dialog.value.querySelectorAll<HTMLElement>('button, input, a')].filter(
    (el) => !el.hasAttribute('disabled'),
  )
  if (!focusable.length) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  input.value?.focus()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="modal-overlay" @click.self="close">
    <div ref="dialog" class="modal" role="dialog" aria-modal="true" aria-labelledby="config-title">
      <h2 id="config-title">TU CLAVE DE GEMINI (GRATIS)</h2>
      <ol class="instructions">
        <li>
          Abre
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.
        </li>
        <li>Inicia sesión con tu cuenta de Google (la primera vez acepta las condiciones).</li>
        <li>Pulsa «Create API key» («Crear clave de API»); si te lo pide, elige o crea un proyecto.</li>
        <li>Copia la clave (empieza por «AIza…») y pégala aquí.</li>
      </ol>
      <label for="gemini-key">CLAVE DE API</label>
      <div class="key-row">
        <input
          id="gemini-key"
          ref="input"
          v-model="key"
          :type="visibleKey ? 'text' : 'password'"
          class="tech-input"
          autocomplete="off"
          spellcheck="false"
          :aria-describedby="formatWarning ? 'key-warning' : undefined"
        />
        <button
          type="button"
          class="show-key"
          :aria-pressed="visibleKey"
          aria-controls="gemini-key"
          @click="visibleKey = !visibleKey"
        >
          {{ visibleKey ? 'OCULTAR' : 'MOSTRAR' }}
        </button>
      </div>
      <p v-if="formatWarning" id="key-warning" class="warning" role="status">{{ formatWarning }}</p>
      <button type="button" class="check-button" :disabled="checking || !key.trim()" @click="testKey">
        {{ checking ? 'Comprobando…' : 'PROBAR CLAVE' }}
      </button>
      <p v-if="checkMessage" :class="checkError ? 'check-error' : 'check-ok'" :role="checkError ? 'alert' : 'status'">
        {{ checkMessage }}
      </p>
      <label class="remember"
        ><input v-model="remember" type="checkbox" aria-describedby="remember-note" />
        <span>Recordar en este navegador</span></label
      >
      <p id="remember-note" class="note">
        {{
          remember
            ? 'La clave se guardará en este navegador.'
            : 'Sin marcar, la clave se olvida al cerrar o recargar la pestaña.'
        }}
        Si la marcas, otras webs de bertmarti.github.io podrían leerla (comparten almacenamiento): no la marques en
        ordenadores compartidos. Puedes revocar la clave cuando quieras en Google AI Studio.
      </p>
      <p class="note">
        Tu clave solo viaja a Google (por HTTPS, en una cabecera), nunca a nadie más. Sin clave puedes usar el modo
        demo.
      </p>
      <section v-if="!IS_STATIC_DEMO" class="server-section" aria-labelledby="server-title">
        <h3 id="server-title">SERVIDOR DE WHATSAPP (OPCIONAL)</h3>
        <label for="server-token">TOKEN DEL SERVIDOR (SERVER_TOKEN)</label>
        <div class="key-row">
          <input
            id="server-token"
            v-model="serverToken"
            :type="visibleServerToken ? 'text' : 'password'"
            class="tech-input"
            autocomplete="off"
            spellcheck="false"
          />
          <button
            type="button"
            class="show-key"
            :aria-pressed="visibleServerToken"
            aria-controls="server-token"
            @click="visibleServerToken = !visibleServerToken"
          >
            {{ visibleServerToken ? 'OCULTAR' : 'MOSTRAR' }}
          </button>
        </div>
        <p class="note">
          Solo hace falta si abriste el servidor a tu red. Lo genera «npm run setup» en el archivo .env. Se usa solo
          durante esta visita: no se guarda en el navegador.
        </p>
        <p v-if="serverTokenStore.source === 'env'" class="note">
          La web ya usa el token de tu .env; pega otro solo para sustituirlo.
        </p>
      </section>
      <div class="btns">
        <button type="button" class="btn-cancel" @click="clear">BORRAR CLAVE</button>
        <button type="button" class="btn-cancel" @click="close">CANCELAR</button>
        <button type="button" class="btn-save" @click="save">GUARDAR</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.8);
  box-sizing: border-box;
}
.modal {
  width: min(560px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  padding: 26px;
  background: var(--bg-panel);
  border: 1px solid var(--border-accent);
  border-radius: 12px;
  box-shadow: var(--shadow-accent);
  box-sizing: border-box;
}
h2 {
  margin-top: 0;
  color: var(--text-accent);
}
.instructions,
p {
  color: var(--text-secondary);
  line-height: 1.45;
}
.instructions {
  padding-left: 24px;
}
a {
  color: var(--terminal-text);
}
label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-weight: 600;
}
.key-row {
  display: flex;
  gap: 8px;
}
.tech-input {
  min-width: 0;
  flex: 1;
  padding: 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 6px;
  box-sizing: border-box;
}
.show-key {
  padding: 8px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
}
.check-button,
.btns button {
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
}
.check-button {
  width: 100%;
  margin-top: 10px;
  background: transparent;
  border: 1px solid var(--border-accent);
  color: var(--text-accent);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.warning,
.check-error {
  color: var(--text-danger);
}
.check-ok {
  color: var(--terminal-text);
}
.note {
  font-size: 0.8rem;
}
.server-section {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--border-color);
}
.server-section h3 {
  margin: 0 0 14px;
  color: var(--text-accent);
  font-size: 0.95rem;
}
.remember {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 14px;
}
.remember input {
  accent-color: var(--border-accent);
}
.btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
}
.btns button {
  flex: 1;
}
.btn-save {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: 0;
}
.btn-cancel {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}
@media (max-width: 480px) {
  .modal {
    padding: 20px 16px;
  }
  .key-row {
    flex-direction: column;
  }
}
</style>
