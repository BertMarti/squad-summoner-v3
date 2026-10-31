<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import HelpTip from '@/components/HelpTip.vue'
import { useTemplatesStore } from '@/stores/templates'
import { useMissionStore } from '@/stores/mission'
import {
  describeImport,
  exportFileName,
  exportTemplates,
  MAX_IMPORT_BYTES,
  MAX_TEMPLATE_NAME,
  MAX_TEMPLATES,
  renderTemplate,
  textToTemplate,
  usedVariables,
  VARIABLES_HELP,
  TemplateImportError,
} from '@/lib/templates'
import { MAX_MESSAGE_LENGTH } from '@/lib/mission'

const emit = defineEmits<{ use: [text: string] }>()
const store = useTemplatesStore()
const missionStore = useMissionStore()
const panel = ref<HTMLElement | null>(null)
const newButton = ref<HTMLButtonElement | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const editorOpen = ref(false)
const editingId = ref<string | null>(null)
const name = ref('')
const text = ref('')
const originalText = ref('')
const convertVariables = ref(true)
const editedByUser = ref(false)
const errorMessage = ref('')
const importMessage = ref('')
const importError = ref('')
const deleteId = ref<string | null>(null)
const opener = ref<HTMLElement | null>(null)

const preview = computed(() => renderTemplate(text.value, missionStore.mission))
const characterCount = computed(() => text.value.length)
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const focusEditor = async () => {
  await nextTick()
  nameInput.value?.focus()
  const editor = panel.value?.querySelector('.template-editor')
  if (editor && typeof editor.scrollIntoView === 'function') {
    editor.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' })
  }
}
const finishEditor = async () => {
  editorOpen.value = false
  errorMessage.value = ''
  const target = opener.value || newButton.value
  await nextTick()
  ;(target as HTMLElement | null)?.focus()
}
const openNew = (source?: HTMLElement) => {
  if (store.isFull && !source) return
  opener.value = source ?? newButton.value
  editingId.value = null
  name.value = ''
  text.value = ''
  originalText.value = ''
  convertVariables.value = true
  editedByUser.value = false
  errorMessage.value = ''
  editorOpen.value = true
  void focusEditor()
}
const openEdit = (id: string, button: HTMLElement) => {
  const template = store.byId(id)
  if (!template) return
  opener.value = button
  editingId.value = id
  name.value = template.name
  text.value = template.text
  originalText.value = ''
  editedByUser.value = true
  errorMessage.value = ''
  editorOpen.value = true
  void focusEditor()
}
const save = () => {
  let error = ''
  if (editingId.value) error = store.update(editingId.value, name.value, text.value)
  else {
    const result = store.add(name.value, text.value)
    if ('error' in result) error = result.error
  }
  if (error) {
    errorMessage.value = error
    return
  }
  void finishEditor()
}
const markTextEdited = () => {
  editedByUser.value = true
}
const toggleVariables = (checked: boolean) => {
  convertVariables.value = checked
  if (!editedByUser.value) text.value = textToTemplate(originalText.value, missionStore.mission, checked)
}
const useTemplate = (value: string) => emit('use', renderTemplate(value, missionStore.mission))
// Al pedir confirmación, el foco pasa a CANCELAR (opción segura); al cancelar, vuelve a BORRAR.
const askDelete = async (id: string) => {
  deleteId.value = id
  await nextTick()
  panel.value?.querySelector<HTMLButtonElement>('.delete-confirmation .cancel-delete')?.focus()
}
const cancelDelete = async () => {
  const id = deleteId.value
  deleteId.value = null
  await nextTick()
  const name = id ? store.byId(id)?.name : ''
  if (name)
    [...(panel.value?.querySelectorAll<HTMLButtonElement>('.template-actions button') ?? [])]
      .find((b) => b.getAttribute('aria-label') === `Borrar ${name}`)
      ?.focus()
}
const remove = (id: string) => {
  store.remove(id)
  deleteId.value = null
  void nextTick(() => newButton.value?.focus())
}
const startFromTransmission = (transmission: string) => {
  importMessage.value = ''
  importError.value = ''
  if (store.isFull) {
    importError.value = `Has llegado al máximo de ${MAX_TEMPLATES} plantillas: borra alguna antes de guardar otra.`
    void nextTick(() => panel.value?.scrollIntoView?.({ block: 'nearest' }))
    return
  }
  opener.value = newButton.value
  editingId.value = null
  name.value = ''
  originalText.value = transmission
  convertVariables.value = true
  editedByUser.value = false
  text.value = textToTemplate(transmission, missionStore.mission, true)
  errorMessage.value = ''
  editorOpen.value = true
  void focusEditor()
}
defineExpose({ startFromTransmission })

const exportAll = () => {
  const blob = new Blob([exportTemplates(store.templates)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = exportFileName()
  link.click()
  URL.revokeObjectURL(url)
}
const chooseImport = () => fileInput.value?.click()
const importFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  importMessage.value = ''
  importError.value = ''
  if (!file) return
  try {
    if (file.size > MAX_IMPORT_BYTES) throw new TemplateImportError('El archivo es demasiado grande (máximo 200 kB).')
    importMessage.value = describeImport(store.importFrom(await file.text()))
  } catch (caught: unknown) {
    importError.value = caught instanceof Error ? caught.message : 'No se ha podido importar el archivo.'
  } finally {
    input.value = ''
  }
}
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && editorOpen.value) {
    event.preventDefault()
    void finishEditor()
  }
}
</script>

<template>
  <section ref="panel" class="templates-panel" aria-labelledby="templates-title" @keydown="onKeydown">
    <div class="templates-header">
      <h3 id="templates-title">
        MIS PLANTILLAS
        <HelpTip
          topic="Plantillas"
          text="Guarda tus mensajes favoritos y úsalos sin gastar llamadas a la IA. Las variables {juego}, {hora} y {reclutas} se rellenan con la misión actual."
        />
      </h3>
    </div>
    <p v-if="store.isEmpty && !editorOpen" class="empty-templates">
      Aún no tienes plantillas. Genera una transmisión y pulsa ⭐ GUARDAR COMO PLANTILLA, o crea una con ➕ NUEVA
      PLANTILLA.
    </p>
    <ul v-else-if="!store.isEmpty" class="template-list">
      <li v-for="template in store.templates" :key="template.id" class="template-entry">
        <strong>{{ template.name }}</strong>
        <p>{{ template.text.split('\n')[0] || 'Plantilla sin texto.' }}</p>
        <div class="variable-list">
          <span v-for="variable in usedVariables(template.text)" :key="variable" class="variable-chip">{{
            '{' + variable + '}'
          }}</span>
        </div>
        <div v-if="deleteId !== template.id" class="template-actions">
          <button type="button" :aria-label="`Usar ${template.name}`" @click="useTemplate(template.text)">
            ▶️ USAR
          </button>
          <button
            type="button"
            :aria-label="`Editar ${template.name}`"
            @click="openEdit(template.id, $event.currentTarget as HTMLElement)"
          >
            ✏️ EDITAR
          </button>
          <button type="button" :aria-label="`Borrar ${template.name}`" @click="askDelete(template.id)">
            🗑️ BORRAR
          </button>
        </div>
        <div v-else class="delete-confirmation">
          <span>¿Borrar «{{ template.name }}»?</span>
          <button type="button" @click="remove(template.id)">SÍ, BORRAR</button>
          <button type="button" class="cancel-delete" @click="cancelDelete">CANCELAR</button>
        </div>
      </li>
    </ul>
    <form v-if="editorOpen" class="template-editor" @submit.prevent="save">
      <div v-if="errorMessage" class="template-error" role="alert">{{ errorMessage }}</div>
      <label for="template-name">NOMBRE</label>
      <input id="template-name" ref="nameInput" v-model="name" :maxlength="MAX_TEMPLATE_NAME" required />
      <label for="template-text">TEXTO</label>
      <textarea
        id="template-text"
        v-model="text"
        rows="6"
        :maxlength="MAX_MESSAGE_LENGTH"
        aria-describedby="template-help template-count"
        @input="markTextEdited"
      ></textarea>
      <small id="template-count">{{ characterCount }} / {{ MAX_MESSAGE_LENGTH }}</small>
      <small id="template-help">{{ VARIABLES_HELP }}</small>
      <label v-if="originalText" class="variables-option" for="template-variables">
        <input
          id="template-variables"
          type="checkbox"
          :checked="convertVariables"
          @change="toggleVariables(($event.target as HTMLInputElement).checked)"
        />
        <span>Cambiar reclutas, hora y juego por variables</span>
      </label>
      <strong>VISTA PREVIA con la misión actual</strong>
      <pre class="template-preview">{{ preview }}</pre>
      <div class="editor-actions">
        <button type="submit">💾 GUARDAR</button>
        <button type="button" @click="finishEditor">CANCELAR</button>
      </div>
    </form>
    <div class="template-footer">
      <button
        ref="newButton"
        type="button"
        :disabled="store.isFull"
        :title="store.isFull ? `Máximo ${MAX_TEMPLATES} plantillas` : undefined"
        @click="openNew($event.currentTarget as HTMLElement)"
      >
        ➕ NUEVA PLANTILLA
      </button>
      <small v-if="store.isFull" class="limit-note">Máximo {{ MAX_TEMPLATES }} plantillas</small>
      <button type="button" :disabled="store.isEmpty" @click="exportAll">⬇️ EXPORTAR</button>
      <button type="button" @click="chooseImport">⬆️ IMPORTAR</button>
      <input ref="fileInput" class="sr-only" type="file" accept="application/json,.json" @change="importFile" />
    </div>
    <p v-if="importMessage" class="import-status" role="status">{{ importMessage }}</p>
    <p v-if="importError" class="template-error" role="alert">{{ importError }}</p>
    <p class="templates-note">
      Se guardan en este navegador (no en la nube). Exporta un archivo para copiarlas a otro dispositivo.
    </p>
    <p v-if="!store.persisted" class="import-status" role="status">
      Este navegador no deja guardar: tus plantillas se perderán al cerrar la pestaña. Expórtalas para no perderlas.
    </p>
  </section>
</template>

<style scoped>
.templates-panel {
  margin-top: 16px;
  padding: 20px;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}
.templates-header h3 {
  margin: 0 0 14px;
  color: var(--text-primary);
  font-size: 1rem;
}
.empty-templates,
.templates-note,
.import-status,
.template-editor small {
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.45;
}
.template-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 24px;
}
.template-entry {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
}
.template-entry strong {
  color: var(--text-accent);
}
.template-entry p {
  margin: 5px 0;
  color: var(--terminal-text);
  overflow-wrap: anywhere;
}
.variable-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.variable-chip {
  padding: 2px 6px;
  border: 1px solid var(--border-accent);
  border-radius: 4px;
  color: var(--text-accent);
  font-size: 0.75rem;
}
.template-actions,
.delete-confirmation,
.editor-actions,
.template-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.template-actions button,
.delete-confirmation button,
.editor-actions button,
.template-footer button {
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 700;
}
button:hover:not(:disabled) {
  border-color: var(--border-accent);
  color: var(--text-accent);
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.template-editor {
  display: grid;
  gap: 8px;
}
.template-editor label {
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
}
.template-editor input:not([type='checkbox']),
.template-editor textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: var(--bg-input);
  color: var(--text-primary);
}
.template-editor textarea {
  resize: vertical;
}
.template-editor input:focus,
.template-editor textarea:focus {
  outline: none;
  border-color: var(--border-accent);
}
.variables-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  cursor: pointer;
}
.template-preview {
  max-width: 100%;
  margin: 0;
  padding: 10px;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  background: var(--bg-input);
  color: var(--terminal-text);
}
.template-error {
  color: var(--text-danger);
}
.template-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
}
@media (max-width: 480px) {
  .template-actions button,
  .delete-confirmation button,
  .editor-actions button,
  .template-footer button {
    flex: 1 1 100%;
  }
}
</style>
