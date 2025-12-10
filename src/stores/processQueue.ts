import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProcessItem } from '@/types'

export const useProcessQueue = defineStore('processQueue', () => {
  const processes = ref<ProcessItem[]>([])
  const counter = ref(1)

  function enqueue(proc: Partial<ProcessItem> = {}) {
    const id = (counter.value++)
    const p: ProcessItem = {
      id,
      name: proc.name ?? `Task-${id}`,
      emoji: proc.emoji ?? '⚙️',
      detail: proc.detail ?? 'Inicio secuencia',
      status: 'queued'
    }
    processes.value.push(p)
    return p
  }

  function cancel(id: number | string) {
    const idx = processes.value.findIndex(x => x.id === id)
    if (idx >= 0) processes.value.splice(idx, 1)
  }

  return { processes, enqueue, cancel }
})
