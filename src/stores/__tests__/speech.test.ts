// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSpeechPrefsStore } from '../speech'

const KEY = 'squad-summoner-v3:voz'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.restoreAllMocks()
})

describe('useSpeechPrefsStore', () => {
  it('por defecto: voz automática y velocidad normal, sin escribir nada', () => {
    const store = useSpeechPrefsStore()
    expect(store.voice).toBe('')
    expect(store.rate).toBe(1)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('guarda con la clave prefijada al cambiar y se recupera al recargar', () => {
    const store = useSpeechPrefsStore()
    store.setVoice('com.apple.monica')
    store.setRate('1.3')
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ voice: 'com.apple.monica', rate: 1.3 })
    setActivePinia(createPinia())
    const again = useSpeechPrefsStore()
    expect(again.voice).toBe('com.apple.monica')
    expect(again.rate).toBe(1.3)
  })

  it('basura de otra web del origen: valores por defecto', () => {
    localStorage.setItem(KEY, '<script>alert(1)</script>')
    const store = useSpeechPrefsStore()
    expect(store.voice).toBe('')
    expect(store.rate).toBe(1)
  })

  it('normaliza lo que recibe', () => {
    const store = useSpeechPrefsStore()
    store.setRate(42)
    store.setVoice('a\u0000b')
    expect(store.rate).toBe(1.5)
    expect(store.voice).toBe('')
  })

  it('si el navegador no deja guardar, sigue en memoria y lo indica', () => {
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })
    const store = useSpeechPrefsStore()
    store.setRate(0.85)
    expect(store.rate).toBe(0.85)
    expect(store.persisted).toBe(false)
    spy.mockRestore()
  })
})
