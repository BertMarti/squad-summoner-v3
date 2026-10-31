import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  MAX_TEMPLATES,
  cleanTemplateName,
  cleanTemplateText,
  createTemplate,
  importTemplates,
  parseTemplates,
  serializeTemplates,
  uniqueName,
  validateTemplateInput,
  type ImportResult,
  type UserTemplate,
} from '@/lib/templates'
import { readStored, removeStored, writeStored, STORAGE_KEYS } from '@/lib/storage'

/**
 * Plantillas propias del usuario.
 * - Se guardan en este navegador al pulsar GUARDAR (clave `squad-summoner-v3:plantillas`): guardarlas es justo lo
 *   que pide la persona. No contienen claves ni tokens.
 * - Lo leído se valida (el origen bertmarti.github.io es compartido); la basura de otra web se ignora y se borra.
 * - Si el navegador no deja guardar (modo privado, almacenamiento lleno), siguen en memoria y `persisted` lo indica.
 */
export const useTemplatesStore = defineStore('templates', () => {
  const saved = readStored(STORAGE_KEYS.templates)
  const parsed = parseTemplates(saved)
  if (parsed === null) removeStored(STORAGE_KEYS.templates)
  const templates = ref<UserTemplate[]>(parsed ?? [])
  const persisted = ref(true)

  const isEmpty = computed(() => templates.value.length === 0)
  const isFull = computed(() => templates.value.length >= MAX_TEMPLATES)

  function persist() {
    persisted.value = templates.value.length
      ? writeStored(STORAGE_KEYS.templates, serializeTemplates(templates.value))
      : (removeStored(STORAGE_KEYS.templates), true)
  }

  function byId(id: string): UserTemplate | undefined {
    return templates.value.find((t) => t.id === id)
  }

  /** Crea una plantilla. Devuelve el error en español o la plantilla creada. */
  function add(name: string, text: string): { error: string } | { template: UserTemplate } {
    const error = validateTemplateInput(name, text)
    if (error) return { error }
    if (isFull.value) return { error: `Has llegado al máximo de ${MAX_TEMPLATES} plantillas: borra alguna antes.` }
    const template = createTemplate(uniqueName(name, templates.value), text)
    templates.value = [template, ...templates.value]
    persist()
    return { template }
  }

  /** Edita nombre y texto (renombrar es editar solo el nombre). Devuelve el error en español o ''. */
  function update(id: string, name: string, text: string): string {
    const current = byId(id)
    if (!current) return 'Esa plantilla ya no existe.'
    const error = validateTemplateInput(name, text)
    if (error) return error
    const next: UserTemplate = {
      ...current,
      name: uniqueName(cleanTemplateName(name), templates.value, id),
      text: cleanTemplateText(text),
      updatedAt: new Date().toISOString(),
    }
    templates.value = templates.value.map((t) => (t.id === id ? next : t))
    persist()
    return ''
  }

  function remove(id: string) {
    templates.value = templates.value.filter((t) => t.id !== id)
    persist()
  }

  /** Importa un archivo exportado (lanza TemplateImportError con el motivo en español si no es válido). */
  function importFrom(raw: string): Omit<ImportResult, 'list'> {
    const { list, ...summary } = importTemplates(raw, templates.value)
    if (summary.added) {
      templates.value = list
      persist()
    }
    return summary
  }

  return { templates, persisted, isEmpty, isFull, byId, add, update, remove, importFrom }
})
