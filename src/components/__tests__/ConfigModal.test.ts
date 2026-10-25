// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import ConfigModal from '@/components/ConfigModal.vue'
import { useApiKeyStore } from '@/stores/apiKey'
import { useServerTokenStore } from '@/stores/serverToken'

const { validateApiKeyMock } = vi.hoisted(() => ({ validateApiKeyMock: vi.fn() }))

vi.mock('@/lib/gemini', () => ({
  validateApiKey: validateApiKeyMock,
  generateWithGemini: vi.fn(),
}))

const KEY = `AIza${'A'.repeat(35)}`
const SERVER_TOKEN = 'token-falso-de-prueba'
const API_KEY_STORAGE = 'squad-summoner-v3:gemini-api-key'

let pinia: ReturnType<typeof createPinia>
const mounted: VueWrapper[] = []

const mountModal = () => {
  const wrapper = mount(ConfigModal, { attachTo: document.body, global: { plugins: [pinia] } })
  mounted.push(wrapper)
  return wrapper
}

beforeEach(() => {
  localStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
  validateApiKeyMock.mockReset()
})

afterEach(() => {
  for (const wrapper of mounted) wrapper.unmount()
  mounted.length = 0
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ConfigModal', () => {
  it('enfoca el campo de la clave al montar', async () => {
    const wrapper = mountModal()
    await flushPromises()
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('#gemini-key').element)
  })

  it('Escape en el documento emite close', async () => {
    const wrapper = mountModal()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('MOSTRAR cambia el tipo de la clave y su aria-pressed', async () => {
    const wrapper = mountModal()
    const input = wrapper.get('#gemini-key')
    expect(input.attributes('type')).toBe('password')
    const show = wrapper.findAll('button.show-key')[0]
    expect(show).toBeDefined()
    await show!.trigger('click')
    expect(input.attributes('type')).toBe('text')
    expect(show!.attributes('aria-pressed')).toBe('true')
  })

  it('«PROBAR CLAVE» está deshabilitado sin clave', () => {
    const wrapper = mountModal()
    expect(wrapper.get('.check-button').attributes('disabled')).toBeDefined()
  })

  it('con una clave válida muestra «Clave válida» en role=status', async () => {
    validateApiKeyMock.mockResolvedValue({ ok: true })
    const wrapper = mountModal()
    await wrapper.get('#gemini-key').setValue(KEY)
    await wrapper.get('.check-button').trigger('click')
    await flushPromises()
    expect(validateApiKeyMock).toHaveBeenCalled()
    expect(wrapper.get('[role="status"]').text()).toContain('Clave válida')
  })

  it('con una clave rechazada muestra el error en role=alert', async () => {
    validateApiKeyMock.mockResolvedValue({ ok: false, message: 'Clave no válida' })
    const wrapper = mountModal()
    await wrapper.get('#gemini-key').setValue(KEY)
    await wrapper.get('.check-button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Clave no válida')
  })

  it('GUARDAR sin «Recordar» deja la clave en memoria y no escribe en localStorage', async () => {
    const store = useApiKeyStore()
    const wrapper = mountModal()
    await wrapper.get('#gemini-key').setValue(KEY)
    await wrapper.get('.btn-save').trigger('click')
    expect(store.userKey).toBe(KEY)
    expect(store.remember).toBe(false)
    expect(localStorage.getItem(API_KEY_STORAGE)).toBeNull()
  })

  it('GUARDAR con «Recordar» persiste la clave con el prefijo del proyecto', async () => {
    const store = useApiKeyStore()
    const wrapper = mountModal()
    await wrapper.get('#gemini-key').setValue(KEY)
    await wrapper.get('label.remember input').setValue(true)
    await wrapper.get('.btn-save').trigger('click')
    expect(store.userKey).toBe(KEY)
    expect(store.remember).toBe(true)
    expect(localStorage.getItem(API_KEY_STORAGE)).toBe(KEY)
  })

  it('BORRAR CLAVE vacía la clave y emite save', async () => {
    const store = useApiKeyStore()
    store.setKey(KEY, true)
    const wrapper = mountModal()
    await wrapper.findAll('.btn-cancel')[0]!.trigger('click')
    expect(store.userKey).toBe('')
    expect(store.hasKey).toBe(false)
    expect(wrapper.emitted('save')).toHaveLength(1)
    expect(localStorage.getItem(API_KEY_STORAGE)).toBeNull()
  })

  it('el token del servidor se guarda solo en memoria', async () => {
    const serverStore = useServerTokenStore()
    const wrapper = mountModal()
    expect(wrapper.find('#server-token').exists()).toBe(true)
    await wrapper.get('#server-token').setValue(SERVER_TOKEN)
    await wrapper.get('.btn-save').trigger('click')
    expect(serverStore.userToken).toBe(SERVER_TOKEN)
    expect(localStorage.getItem('squad-summoner-v3:server-token')).toBeNull()
    expect(localStorage.length).toBe(0)
  })
})
