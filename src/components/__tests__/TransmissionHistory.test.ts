// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import TransmissionHistory from '@/components/panels/TransmissionHistory.vue'
import { useHistoryStore } from '@/stores/history'
import { DEMO_BANNER } from '@/lib/demo'
import { GAME_TITLES } from '@/lib/mission'

const HISTORY_STORAGE = 'squad-summoner-v3:historial'

let pinia: ReturnType<typeof createPinia>

beforeEach(() => {
  localStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const mountHistory = () => mount(TransmissionHistory, { global: { plugins: [pinia] } })

const addTwoEntries = () => {
  const store = useHistoryStore()
  store.add(`${DEMO_BANNER}\n\nTexto de ejemplo de la demo`, { game: 'hd2', time: '21:30', tone: 'epico' }, 'demo')
  store.add('Texto generado por la IA', { game: 'sm2', time: '22:00', tone: 'cutre' }, 'ia')
  return store
}

describe('TransmissionHistory', () => {
  it('sin entradas muestra el estado vacío y el botón de vaciar deshabilitado', () => {
    const wrapper = mountHistory()
    expect(wrapper.text()).toContain('Aún no hay transmisiones')
    expect(wrapper.get('.clear-history').attributes('disabled')).toBeDefined()
  })

  it('muestra dos entradas, la más reciente primero, con título y origen sin el banner', async () => {
    const wrapper = mountHistory()
    addTwoEntries()
    await nextTick()

    const entries = wrapper.findAll('li.history-entry')
    expect(entries).toHaveLength(2)
    expect(entries[0]!.text()).toContain(GAME_TITLES.sm2)
    expect(entries[0]!.text()).toContain('22:00')
    expect(entries[0]!.text()).toContain('IA')
    expect(entries[1]!.text()).toContain(GAME_TITLES.hd2)
    expect(entries[1]!.text()).toContain('21:30')
    expect(entries[1]!.text()).toContain('DEMO')

    const previews = wrapper.findAll('.entry-info p')
    expect(previews).toHaveLength(2)
    for (const preview of previews) expect(preview.text()).not.toContain(DEMO_BANNER)
    expect(wrapper.text()).not.toContain(DEMO_BANNER)
  })

  it('«VER» emite show y «REPETIR» emite repeat con la entrada', async () => {
    const wrapper = mountHistory()
    const store = addTwoEntries()
    await nextTick()

    const firstEntry = wrapper.get('li.history-entry')
    const buttons = firstEntry.findAll('button')
    expect(buttons).toHaveLength(2)
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')

    expect(wrapper.emitted('show')).toHaveLength(1)
    expect(wrapper.emitted('show')![0]![0]).toMatchObject({ id: store.entries[0]!.id })
    expect(wrapper.emitted('repeat')).toHaveLength(1)
    expect(wrapper.emitted('repeat')![0]![0]).toMatchObject({ id: store.entries[0]!.id })
  })

  it('«Recordar historial» guarda con prefijo y al desmarcarlo borra la clave', async () => {
    const wrapper = mountHistory()
    const store = addTwoEntries()
    await nextTick()

    const checkbox = wrapper.get('#remember-history')
    await checkbox.setValue(true)
    expect(store.remember).toBe(true)
    expect(localStorage.getItem(HISTORY_STORAGE)).not.toBeNull()

    await checkbox.setValue(false)
    expect(store.remember).toBe(false)
    expect(localStorage.getItem(HISTORY_STORAGE)).toBeNull()
  })

  it('«VACIAR HISTORIAL» deja el estado vacío y se deshabilita', async () => {
    const wrapper = mountHistory()
    const store = addTwoEntries()
    await nextTick()
    expect(wrapper.get('.clear-history').attributes('disabled')).toBeUndefined()

    await wrapper.get('.clear-history').trigger('click')
    expect(store.isEmpty).toBe(true)
    expect(wrapper.text()).toContain('Aún no hay transmisiones')
    expect(wrapper.get('.clear-history').attributes('disabled')).toBeDefined()
  })
})
