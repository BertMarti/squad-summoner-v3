<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { renderTemplate, usedVariables } from '@/lib/templates'
import type { SharedTemplate } from '@/lib/shareLink'
import { useMissionStore } from '@/stores/mission'
import { useTemplatesStore } from '@/stores/templates'

type Result = { template: SharedTemplate } | { error: string } | null
const props = defineProps<{ result: Result }>()
const emit = defineEmits<{ close: []; saved: [payload: { name: string; duplicate: boolean }] }>()
const dialog = ref<HTMLElement | null>(null)
const saveError = ref('')
const mission = useMissionStore()
const templates = useTemplatesStore()

const focusTarget = async () => {
  await nextTick()
  // Sin desplazar: en el móvil, el diálogo empieza por arriba (título y aviso) aunque el foco esté en GUARDAR.
  // Mientras se lee el enlace no hay botones: el foco va al propio diálogo (tabindex="-1").
  const target = dialog.value?.querySelector<HTMLElement>('.save-button, .close-button') ?? dialog.value
  target?.focus({ preventScroll: true })
  if (dialog.value) dialog.value.scrollTop = 0
}
const save = () => {
  if (!props.result || !('template' in props.result)) return
  const result = templates.addShared(props.result.template.name, props.result.template.text)
  if ('error' in result) saveError.value = result.error
  else emit('saved', { name: result.template.name, duplicate: result.duplicate })
}
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !dialog.value) return
  const focusable = [...dialog.value.querySelectorAll<HTMLElement>('button')].filter(
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
onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  void focusTarget()
})
watch(
  () => props.result,
  () => void focusTarget(),
)
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="shared-overlay" @click.self="emit('close')">
    <div
      ref="dialog"
      class="shared-dialog"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shared-template-title"
    >
      <template v-if="!result">
        <h2 id="shared-template-title">📨 ENLACE DE PLANTILLA</h2>
        <p role="status">Leyendo el enlace…</p>
      </template>
      <template v-else-if="'error' in result">
        <h2 id="shared-template-title">📨 ENLACE DE PLANTILLA</h2>
        <p role="alert">{{ result.error }}</p>
        <p>Si te lo han enviado por WhatsApp, comprueba que el enlace está completo o pide que te lo reenvíen.</p>
        <button type="button" class="close-button" @click="emit('close')">CERRAR</button>
      </template>
      <template v-else>
        <h2 id="shared-template-title">📨 PLANTILLA COMPARTIDA</h2>
        <p>Te han enviado una plantilla. Revísala antes de guardarla: no se guarda nada hasta que pulses GUARDAR.</p>
        <p class="shared-name">
          <span class="shared-label">NOMBRE</span>
          <strong>{{ result.template.name }}</strong>
        </p>
        <span class="shared-label">TEXTO</span>
        <pre class="shared-text">{{ result.template.text }}</pre>
        <div class="variable-list">
          <span v-for="variable in usedVariables(result.template.text)" :key="variable" class="variable-chip">{{
            '{' + variable + '}'
          }}</span>
        </div>
        <span class="shared-label">VISTA PREVIA con tu misión actual</span>
        <pre class="shared-text">{{ renderTemplate(result.template.text, mission.mission) }}</pre>
        <p v-if="saveError" role="alert">{{ saveError }}</p>
        <div class="dialog-actions">
          <button type="button" class="save-button" @click="save">💾 GUARDAR EN MIS PLANTILLAS</button>
          <button type="button" @click="emit('close')">DESCARTAR</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.shared-label {
  display: block;
  margin: 14px 0 6px;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
}
.shared-name {
  margin: 0;
}
.shared-name strong {
  color: var(--text-accent);
  font-size: 1.05rem;
  overflow-wrap: anywhere;
}
.shared-overlay {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.8);
}
.shared-dialog {
  width: min(560px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  padding: 22px 18px;
  box-sizing: border-box;
  border: 1px solid var(--border-accent);
  border-radius: 12px;
  background: var(--bg-panel);
  color: var(--text-primary);
}
h2 {
  margin-top: 0;
  color: var(--text-accent);
}
p {
  color: var(--text-secondary);
  line-height: 1.45;
}
.shared-text {
  max-height: 220px;
  overflow-y: auto;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  padding: 10px;
  background: var(--bg-input);
  color: var(--terminal-text);
}
.variable-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 8px 0 14px;
}
.variable-chip {
  padding: 2px 6px;
  border: 1px solid var(--border-accent);
  border-radius: 4px;
  color: var(--text-accent);
  font-size: 0.75rem;
}
.dialog-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.dialog-actions button,
.close-button {
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 700;
}
.dialog-actions .save-button {
  border-color: var(--border-accent);
  color: var(--text-accent);
}
button:hover {
  border-color: var(--border-accent);
  color: var(--text-accent);
}
@media (max-width: 480px), (max-height: 700px) {
  .shared-text {
    max-height: 140px;
  }
}
</style>
