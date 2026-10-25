// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WelcomeGuide from '@/components/WelcomeGuide.vue'

const WELCOME_KEY = 'squad-summoner-v3:bienvenida-vista'

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

const mountGuide = () => mount(WelcomeGuide, { global: { plugins: [pinia] } })

describe('WelcomeGuide', () => {
  it('muestra el título y los tres pasos de la guía', () => {
    const wrapper = mountGuide()
    expect(wrapper.get('#welcome-title').text()).toBe('BIENVENIDO, RECLUTA')
    expect(wrapper.findAll('ol > li')).toHaveLength(3)
  })

  it('«PROBAR AHORA» emite demo', async () => {
    const wrapper = mountGuide()
    const button = wrapper.findAll('button').find((item) => item.text().includes('PROBAR AHORA'))
    expect(button).toBeDefined()
    await button!.trigger('click')
    expect(wrapper.emitted('demo')).toHaveLength(1)
  })

  it('«USAR LA IA GRATIS» emite config', async () => {
    const wrapper = mountGuide()
    const button = wrapper.findAll('button').find((item) => item.text().includes('USAR LA IA GRATIS'))
    expect(button).toBeDefined()
    await button!.trigger('click')
    expect(wrapper.emitted('config')).toHaveLength(1)
  })

  it('el botón de cerrar emite close y recuerda que la guía ya se ha visto', async () => {
    const wrapper = mountGuide()
    await wrapper.get('button[aria-label="Cerrar ayuda"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(localStorage.getItem(WELCOME_KEY)).toBe('1')
  })

  it('«Entendido, no volver a mostrar» emite close y guarda la preferencia', async () => {
    const wrapper = mountGuide()
    await wrapper.get('.guide-dismiss').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(localStorage.getItem(WELCOME_KEY)).toBe('1')
  })
})
