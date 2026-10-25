import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Mission } from '@/types'
import { addEntry, createEntry, parseHistory, serializeHistory, type HistoryEntry } from '@/lib/history'
import { readStored, removeStored, writeStored, STORAGE_KEYS } from '@/lib/storage'

/**
 * Historial de transmisiones.
 * - Por defecto SOLO en memoria (se pierde al recargar).
 * - Con «Recordar historial» se guarda en este navegador (clave con prefijo `squad-summoner-v3:historial`).
 *   Que exista esa clave es lo que indica que la persona lo pidió; desmarcarlo la borra.
 */
export const useHistoryStore = defineStore('history', () => {
  const saved = readStored(STORAGE_KEYS.history)
  const entries = ref<HistoryEntry[]>(parseHistory(saved))
  const remember = ref(saved !== null)

  const last = computed<HistoryEntry | null>(() => entries.value[0] ?? null)
  const isEmpty = computed(() => entries.value.length === 0)

  function persist() {
    if (remember.value) remember.value = writeStored(STORAGE_KEYS.history, serializeHistory(entries.value))
  }

  /** Guarda una transmisión recién generada. */
  function add(text: string, mission: Partial<Mission>, source: HistoryEntry['source']) {
    entries.value = addEntry(entries.value, createEntry(text, mission, source))
    persist()
  }

  /** Activa o desactiva «Recordar historial» (desactivarlo borra lo guardado, no lo de memoria). */
  function setRemember(value: boolean) {
    remember.value = value
    if (value) persist()
    else removeStored(STORAGE_KEYS.history)
  }

  /** Vacía el historial (memoria y, si estaba recordado, el navegador). */
  function clear() {
    entries.value = []
    if (remember.value) persist()
  }

  return { entries, remember, last, isEmpty, add, setRemember, clear }
})
