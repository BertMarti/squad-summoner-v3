import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
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

describe('useHistoryStore y useServerTokenStore (fase 3)', () => {
  const PREFIX = 'squad-summoner-v3:'
  const memory = new Map<string, string>()
  const fakeStorage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k),
  }

  beforeEach(() => {
    memory.clear()
    vi.stubGlobal('localStorage', fakeStorage)
    setActivePinia(createPinia())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('por defecto el historial vive solo en memoria', async () => {
    const { useHistoryStore } = await import('../history')
    const h = useHistoryStore()
    h.add('hola', { game: 'hd2' }, 'demo')
    expect(h.last?.text).toBe('hola')
    expect(h.remember).toBe(false)
    expect(memory.size).toBe(0)
  })

  it('con «recordar» se guarda con prefijo y al desmarcarlo se borra', async () => {
    const { useHistoryStore } = await import('../history')
    const h = useHistoryStore()
    h.add('uno', { game: 'hd2' }, 'demo')
    h.setRemember(true)
    expect(JSON.parse(memory.get(`${PREFIX}historial`)!)).toHaveLength(1)
    h.add('dos', { game: 'sm2' }, 'ia')
    expect(JSON.parse(memory.get(`${PREFIX}historial`)!)).toHaveLength(2)
    expect([...memory.keys()].every((k) => k.startsWith(PREFIX))).toBe(true)

    setActivePinia(createPinia())
    const again = useHistoryStore()
    expect(again.remember).toBe(true)
    expect(again.entries.map((e) => e.text)).toEqual(['dos', 'uno'])

    again.setRemember(false)
    expect(memory.has(`${PREFIX}historial`)).toBe(false)
    expect(again.entries).toHaveLength(2)
    again.clear()
    expect(again.isEmpty).toBe(true)
  })

  it('el token pegado vive solo en memoria', async () => {
    const { useServerTokenStore } = await import('../serverToken')
    const t = useServerTokenStore()
    expect(t.source).toBe('ninguno')
    t.setToken('  token-de-prueba-0123456789abcdef ')
    expect(t.effectiveToken).toBe('token-de-prueba-0123456789abcdef')
    expect(t.source).toBe('manual')
    expect(memory.size).toBe(0)
  })
})
