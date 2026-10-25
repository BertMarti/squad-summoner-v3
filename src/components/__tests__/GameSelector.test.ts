// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GameSelector from '@/components/panels/GameSelector.vue'
import { useMissionStore } from '@/stores/mission'

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

const mountSelector = () => mount(GameSelector, { global: { plugins: [pinia] } })

const cardByText = (wrapper: ReturnType<typeof mountSelector>, label: string) => {
  const card = wrapper.findAll('button.game-card').find((item) => item.text().includes(label))
  if (!card) throw new Error(`No se encontró la tarjeta «${label}»`)
  return card
}

describe('GameSelector', () => {
  it('pinta las 6 tarjetas sin ninguna seleccionada', () => {
    const wrapper = mountSelector()
    const cards = wrapper.findAll('button.game-card')
    expect(cards).toHaveLength(6)
    for (const card of cards) expect(card.attributes('aria-pressed')).toBe('false')
  })

  it('al hacer clic en una tarjeta actualiza la misión y su aria-pressed', async () => {
    const wrapper = mountSelector()
    const missionStore = useMissionStore()
    await cardByText(wrapper, 'Helldivers 2').trigger('click')
    expect(missionStore.mission.game).toBe('hd2')
    expect(cardByText(wrapper, 'Helldivers 2').attributes('aria-pressed')).toBe('true')
  })

  it('Monster Hunter muestra la versión y Personalizado el nombre del juego', async () => {
    const wrapper = mountSelector()
    expect(wrapper.find('#monster-version').exists()).toBe(false)
    await cardByText(wrapper, 'Monster Hunter').trigger('click')
    expect(wrapper.find('#monster-version').exists()).toBe(true)
    await cardByText(wrapper, 'Personalizado').trigger('click')
    expect(wrapper.find('#custom-game').exists()).toBe(true)
    expect(wrapper.find('#monster-version').exists()).toBe(false)
  })

  it('al pasar de Monster Hunter con versión a otro juego se vacía subGame', async () => {
    const missionStore = useMissionStore()
    missionStore.update({ game: 'mh', subGame: 'Wilds' })
    const wrapper = mountSelector()
    expect(missionStore.mission.subGame).toBe('Wilds')
    expect(wrapper.find('#monster-version').exists()).toBe(true)
    await cardByText(wrapper, 'Helldivers 2').trigger('click')
    expect(missionStore.mission.subGame).toBe('')
  })

  it('muestra la prop error en role=alert', () => {
    const wrapper = mount(GameSelector, {
      props: { error: 'Elige un juego para continuar' },
      global: { plugins: [pinia] },
    })
    expect(wrapper.get('[role="alert"]').text()).toBe('Elige un juego para continuar')
  })
})
