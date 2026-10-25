// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '@/App.vue'
import { useApiKeyStore } from '@/stores/apiKey'
import { useHistoryStore } from '@/stores/history'
import { useMissionStore } from '@/stores/mission'
import { POLL_BLOCK } from '@/lib/poll'
import { MAX_MESSAGE_LENGTH } from '@/lib/mission'

const { generateMock } = vi.hoisted(() => ({ generateMock: vi.fn() }))
vi.mock('@/lib/gemini', () => ({ generateWithGemini: generateMock, validateApiKey: vi.fn() }))

const KEY = 'AIza' + 'Q'.repeat(35)
let pinia: ReturnType<typeof createPinia>
let wrapper: VueWrapper | null = null

const mountApp = () => {
  wrapper = mount(App, { global: { plugins: [pinia] } })
  return wrapper
}
const pickGame = async (w: VueWrapper, title: string) => {
  const card = w.findAll('button.game-card').find((b) => b.text().includes(title))
  await card!.trigger('click')
}

beforeEach(() => {
  localStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
  generateMock.mockReset()
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('App (flujo completo)', () => {
  it('demo con encuesta: la transmisión lleva la encuesta y entra en el historial', async () => {
    const w = mountApp()
    await pickGame(w, 'Deep Rock Galactic')
    await w.get('#attendance-poll').setValue(true)
    await w.get('.btn-demo').trigger('click')
    expect(w.get('.text-content').text().endsWith(POLL_BLOCK)).toBe(true)
    expect(useHistoryStore().entries).toHaveLength(1)
    expect(useHistoryStore().entries[0]!.source).toBe('demo')
  })

  it('«REPETIR LA ÚLTIMA» recupera juego, reclutas, hora y tono', async () => {
    const w = mountApp()
    await pickGame(w, 'Helldivers 2')
    await w.get('#recruits').setValue('Alex y Marta')
    await w.get('input[name="tone"][value="pasivo"]').setValue(true)
    await w.get('.btn-demo').trigger('click')
    const mission = useMissionStore().mission
    await w.get('#recruits').setValue('Otra gente')
    await w.get('input[name="tone"][value="epico"]').setValue(true)
    await w.get('.btn-repeat').trigger('click')
    await flushPromises()
    expect(mission.recruits).toBe('Alex y Marta')
    expect(mission.tone).toBe('pasivo')
    expect(mission.game).toBe('hd2')
    expect(w.get('.text-content').text()).toContain('Alex y Marta')
  })

  it('una respuesta demasiado larga de la IA se ajusta al máximo enviable', async () => {
    useApiKeyStore().setKey(KEY, false)
    generateMock.mockResolvedValue('z'.repeat(MAX_MESSAGE_LENGTH + 500))
    const w = mountApp()
    await pickGame(w, 'Destiny 2')
    await w.get('.btn-main').trigger('click')
    await flushPromises()
    const entry = useHistoryStore().entries[0]!
    expect(entry.source).toBe('ia')
    expect(entry.text.length).toBe(MAX_MESSAGE_LENGTH)
    expect(w.get('.text-content').text().length).toBe(MAX_MESSAGE_LENGTH)
  })

  it('«VER» del historial quita el error anterior y muestra la transmisión', async () => {
    const w = mountApp()
    await pickGame(w, 'Space Marine 2')
    await w.get('.btn-demo').trigger('click')
    const saved = useHistoryStore().entries[0]!.text

    useApiKeyStore().setKey(KEY, false)
    generateMock.mockRejectedValue(new Error('La IA está saturada.'))
    await w.get('.btn-main').trigger('click')
    await flushPromises()
    expect(w.get('.error-output').text()).toContain('saturada')

    await w.get('li.history-entry button').trigger('click')
    await flushPromises()
    expect(w.find('.error-output').exists()).toBe(false)
    expect(w.get('.text-content').text()).toBe(saved)
  })
})
