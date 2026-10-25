// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TerminalOutput from '@/components/panels/TerminalOutput.vue'
import { DEMO_BANNER } from '@/lib/demo'

const baseProps = {
  output: '',
  loading: false,
  error: '',
  sending: false,
  staticDemo: false,
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

const mountTerminal = (overrides: Partial<typeof baseProps> = {}) =>
  mount(TerminalOutput, { props: { ...baseProps, ...overrides }, global: { plugins: [pinia] } })

describe('TerminalOutput', () => {
  it('sin salida muestra el placeholder de bienvenida', () => {
    const wrapper = mountTerminal()
    expect(wrapper.get('.placeholder').text()).toContain('ELIGE UN JUEGO')
  })

  it('mientras carga muestra «GENERANDO TRANSMISIÓN» y aria-busy', () => {
    const wrapper = mountTerminal({ loading: true })
    expect(wrapper.text()).toContain('GENERANDO TRANSMISIÓN')
    expect(wrapper.get('.terminal-body').attributes('aria-busy')).toBe('true')
  })

  it('muestra el error en role=alert', () => {
    const wrapper = mountTerminal({ error: 'No hay conexión con Gemini' })
    expect(wrapper.get('[role="alert"]').text()).toContain('No hay conexión con Gemini')
  })

  it('marca como MODO DEMO un texto que empieza por DEMO_BANNER', () => {
    const wrapper = mountTerminal({ output: `${DEMO_BANNER}\n\n¡A jugar!` })
    expect(wrapper.get('.demo-label').text()).toBe('MODO DEMO')
  })

  it('el enlace de compartir apunta a wa.me y abre en otra pestaña', () => {
    const wrapper = mountTerminal({ output: '¡A jugar!' })
    const link = wrapper.get('a.share')
    expect(link.attributes('href')).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('sin servidor no muestra «ENVIAR AL GRUPO», pero con servidor emite send', async () => {
    const staticWrapper = mountTerminal({ output: '¡A jugar!', staticDemo: true })
    expect(staticWrapper.findAll('button').some((button) => button.text().includes('ENVIAR AL GRUPO'))).toBe(false)

    const wrapper = mountTerminal({ output: '¡A jugar!' })
    const send = wrapper.findAll('button').find((button) => button.text().includes('ENVIAR AL GRUPO'))
    expect(send).toBeDefined()
    await send!.trigger('click')
    expect(wrapper.emitted('send')).toHaveLength(1)
  })

  it('COPIAR escribe el texto en el portapapeles y muestra «COPIADO»', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    const wrapper = mountTerminal({ output: '¡A jugar, escuadrón!' })
    await wrapper.get('button.btn-copy').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('¡A jugar, escuadrón!')
    expect(wrapper.text()).toContain('COPIADO')
  })
})
