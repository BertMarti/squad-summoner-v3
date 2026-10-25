// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MissionControls from '@/components/panels/MissionControls.vue'
import { useMissionStore } from '@/stores/mission'
import type { ApiKeySource } from '@/stores/apiKey'
import { TONES } from '@/lib/tones'

interface ControlsProps {
  loading: boolean
  sending: boolean
  hasApiKey: boolean
  keySource: ApiKeySource
  lastSummary: string
}

const baseProps: ControlsProps = {
  loading: false,
  sending: false,
  hasApiKey: false,
  keySource: 'ninguna',
  lastSummary: '',
}

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

const mountControls = (overrides: Partial<ControlsProps> = {}) =>
  mount(MissionControls, { props: { ...baseProps, ...overrides }, global: { plugins: [pinia] } })

describe('MissionControls', () => {
  it('muestra los tres tonos disponibles', () => {
    const wrapper = mountControls()
    expect(wrapper.findAll('input[type="radio"][name="tone"]')).toHaveLength(3)
  })

  it('al elegir el tono cutre actualiza la misión y su explicación', async () => {
    const wrapper = mountControls()
    const missionStore = useMissionStore()
    const cutre = wrapper.findAll('input[type="radio"]').find((radio) => radio.attributes('value') === 'cutre')
    expect(cutre).toBeDefined()
    await cutre!.setValue(true)
    expect(missionStore.mission.tone).toBe('cutre')
    expect(wrapper.get('#tone-hint').text()).toBe(TONES.find((tone) => tone.id === 'cutre')?.hint)
  })

  it('la casilla de asistencia cambia mission.poll', async () => {
    const wrapper = mountControls()
    const missionStore = useMissionStore()
    const poll = wrapper.get('#attendance-poll')
    await poll.setValue(true)
    expect(missionStore.mission.poll).toBe(true)
    await poll.setValue(false)
    expect(missionStore.mission.poll).toBe(false)
  })

  it('«REPETIR LA ÚLTIMA» está deshabilitado sin resumen', () => {
    const wrapper = mountControls()
    expect(wrapper.get('.btn-repeat').attributes('disabled')).toBeDefined()
    expect(wrapper.get('#repeat-hint').text()).toContain('No hay transmisiones')
  })

  it('con resumen habilita «REPETIR LA ÚLTIMA», lo muestra y emite repeatLast', async () => {
    const summary = 'Helldivers 2 · 21:30 · Épico'
    const wrapper = mountControls({ lastSummary: summary })
    const button = wrapper.get('.btn-repeat')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(wrapper.get('#repeat-hint').text()).toBe(summary)
    await button.trigger('click')
    expect(wrapper.emitted('repeatLast')).toHaveLength(1)
  })

  it('«GENERAR TRANSMISIÓN» emite generate', async () => {
    const wrapper = mountControls()
    await wrapper.get('.btn-main').trigger('click')
    expect(wrapper.emitted('generate')).toHaveLength(1)
  })
})
