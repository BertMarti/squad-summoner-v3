import { describe, expect, it, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTerminalStore } from '../terminal'
import { useProcessQueue } from '../processQueue'
import { useMissionStore } from '../mission'

describe('stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('useTerminalStore', () => {
    it('addLog añade al principio', () => {
      const store = useTerminalStore()
      const initialCount = store.logLines.length
      store.addLog('primero')
      expect(store.logLines[0]?.text).toBe('primero')
      expect(store.logLines.length).toBe(initialCount + 1)
    })

    it('addLog respeta el máximo de 300 líneas', () => {
      const store = useTerminalStore()
      for (let i = 0; i < 305; i++) {
        store.addLog(`linea-${i}`)
      }
      expect(store.logLines.length).toBe(300)
      expect(store.logLines[0]?.text).toBe('linea-304')
    })

    it('setText establece el texto del terminal', () => {
      const store = useTerminalStore()
      store.setText('Hola mundo')
      expect(store.terminalText).toBe('Hola mundo')
    })
  })

  describe('useProcessQueue', () => {
    it('enqueue asigna ids crecientes', () => {
      const store = useProcessQueue()
      const p1 = store.enqueue()
      const p2 = store.enqueue()
      const p3 = store.enqueue()
      expect(p1.id).toBe(1)
      expect(p2.id).toBe(2)
      expect(p3.id).toBe(3)
    })

    it('enqueue usa valores por defecto', () => {
      const store = useProcessQueue()
      const p = store.enqueue()
      expect(p.name).toBe('Task-1')
      expect(p.emoji).toBe('⚙️')
      expect(p.detail).toBe('Inicio secuencia')
      expect(p.status).toBe('queued')
    })

    it('cancel elimina por id', () => {
      const store = useProcessQueue()
      const p1 = store.enqueue()
      const p2 = store.enqueue()
      store.cancel(p1.id)
      expect(store.processes.find((x) => x.id === p1.id)).toBeUndefined()
      expect(store.processes.length).toBe(1)
      expect(store.processes[0]?.id).toBe(p2.id)
    })

    it('cancel no falla con id inexistente', () => {
      const store = useProcessQueue()
      store.enqueue()
      expect(() => store.cancel(999)).not.toThrow()
      expect(store.processes.length).toBe(1)
    })
  })

  describe('useMissionStore', () => {
    it('update hace merge parcial', () => {
      const store = useMissionStore()
      store.update({ game: 'hd2' })
      expect(store.mission.game).toBe('hd2')
      expect(store.mission.subGame).toBe('')
      store.update({ recruits: '5' })
      expect(store.mission.game).toBe('hd2')
      expect(store.mission.recruits).toBe('5')
    })
  })
})
