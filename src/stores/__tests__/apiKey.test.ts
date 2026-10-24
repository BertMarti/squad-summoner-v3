import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useApiKeyStore } from '../apiKey'
import { LEGACY_API_KEY, STORAGE_PREFIX } from '@/lib/storage'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null }
  key(i: number) { return [...this.data.keys()][i] ?? null }
  removeItem(k: string) { this.data.delete(k) }
  setItem(k: string, v: string) { this.data.set(k, String(v)) }
}

const KEY = 'AIza' + 'K'.repeat(35)
let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  vi.stubGlobal('localStorage', storage)
  setActivePinia(createPinia())
})
afterEach(() => vi.unstubAllGlobals())

describe('useApiKeyStore', () => {
  it('por defecto la clave vive solo en memoria (no toca localStorage)', () => {
    const store = useApiKeyStore()
    store.setKey(`  ${KEY} `, false)
    expect(store.effectiveKey).toBe(KEY)
    expect(store.source).toBe('sesion')
    expect(storage.length).toBe(0)
  })

  it('solo se guarda, con prefijo del proyecto, si se pide «recordar»', () => {
    const store = useApiKeyStore()
    store.setKey(KEY, true)
    expect(store.source).toBe('recordada')
    expect(storage.getItem(`${STORAGE_PREFIX}gemini-api-key`)).toBe(KEY)
    for (let i = 0; i < storage.length; i++) expect(storage.key(i)).toMatch(/^squad-summoner-v3:/)
  })

  it('desmarcar «recordar» o borrar la clave la elimina del almacenamiento', () => {
    const store = useApiKeyStore()
    store.setKey(KEY, true)
    store.setKey(KEY, false)
    expect(storage.length).toBe(0)
    expect(store.effectiveKey).toBe(KEY)
    store.setKey(KEY, true)
    store.clearKey()
    expect(storage.length).toBe(0)
    expect(store.hasKey).toBe(false)
    expect(store.source).toBe('ninguna')
  })

  it('recupera la clave recordada al recargar', () => {
    storage.setItem(`${STORAGE_PREFIX}gemini-api-key`, KEY)
    const store = useApiKeyStore()
    expect(store.effectiveKey).toBe(KEY)
    expect(store.remember).toBe(true)
  })

  it('migra la clave antigua sin prefijo respetando la elección de recordarla', () => {
    storage.setItem(LEGACY_API_KEY, KEY)
    const store = useApiKeyStore()
    expect(store.effectiveKey).toBe(KEY)
    expect(store.source).toBe('recordada')
    expect(store.migratedLegacy).toBe(true)
    expect(storage.getItem(LEGACY_API_KEY)).toBeNull()
    expect(storage.getItem(`${STORAGE_PREFIX}gemini-api-key`)).toBe(KEY)
    expect(storage.length).toBe(1)
    // En la siguiente carga ya no es una migración.
    setActivePinia(createPinia())
    expect(useApiKeyStore().migratedLegacy).toBe(false)
  })

  it('si no se puede escribir, la clave antigua se usa solo en memoria', () => {
    storage.setItem(LEGACY_API_KEY, KEY)
    vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('lleno') })
    const store = useApiKeyStore()
    expect(store.effectiveKey).toBe(KEY)
    expect(store.source).toBe('sesion')
    expect(storage.getItem(LEGACY_API_KEY)).toBeNull()
  })

  it('funciona aunque el almacenamiento esté bloqueado', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('bloqueado') },
      setItem: () => { throw new Error('bloqueado') },
      removeItem: () => { throw new Error('bloqueado') },
    })
    setActivePinia(createPinia())
    const store = useApiKeyStore()
    store.setKey(KEY, true)
    expect(store.effectiveKey).toBe(KEY)
    expect(store.remember).toBe(false)
  })
})
