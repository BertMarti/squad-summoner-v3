// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import SpeechControls from '@/components/panels/SpeechControls.vue'
import { SPEECH_UNSUPPORTED } from '@/lib/speech'

class FakeUtterance {
  lang = ''
  voice: unknown = null
  rate = 1
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  constructor(public text: string) {}
}

let synth: Record<string, ReturnType<typeof vi.fn>>
let spoken: FakeUtterance[]

beforeEach(() => {
  spoken = []
  synth = {
    speak: vi.fn((u: FakeUtterance) => spoken.push(u)),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => [
      { name: 'Samantha', lang: 'en-US', default: true },
      { name: 'Mónica', lang: 'es-ES', localService: true },
    ]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  vi.stubGlobal('speechSynthesis', synth)
})
afterEach(() => vi.unstubAllGlobals())

const mountControls = (text = 'Transmisión de prueba.') => mount(SpeechControls, { props: { text } })
const labels = (w: VueWrapper) => w.findAll('button').map((b) => b.text())

describe('SpeechControls', () => {
  it('lee con la voz española, pausa, reanuda y para', async () => {
    const w = mountControls()
    expect(w.text()).toContain('Voz: Mónica')
    await w.get('button').trigger('click')
    expect(spoken[0]).toMatchObject({ text: 'Transmisión de prueba.', lang: 'es-ES' })
    expect(labels(w)).toEqual(['⏸️ PAUSAR', '⏹️ PARAR'])
    expect(w.get('[role="status"]').text()).toBe('Leyendo en voz alta…')
    await w.get('button').trigger('click')
    expect(synth.pause).toHaveBeenCalled()
    expect(labels(w)).toEqual(['▶️ REANUDAR', '⏹️ PARAR'])
    expect(w.get('[role="status"]').text()).toBe('Lectura en pausa')
    await w.get('button').trigger('click')
    expect(synth.resume).toHaveBeenCalled()
    await w.findAll('button')[1]!.trigger('click')
    expect(synth.cancel).toHaveBeenCalled()
    expect(labels(w)).toEqual(['🔊 LEER EN VOZ ALTA'])
  })

  it('al terminar de leer vuelve al botón inicial', async () => {
    const w = mountControls()
    await w.get('button').trigger('click')
    spoken.at(-1)!.onend?.()
    await w.vm.$nextTick()
    expect(labels(w)).toEqual(['🔊 LEER EN VOZ ALTA'])
  })

  it('si cambia la transmisión mientras lee, se para', async () => {
    const w = mountControls()
    await w.get('button').trigger('click')
    await w.setProps({ text: 'Otra transmisión.' })
    expect(synth.cancel).toHaveBeenCalled()
    expect(labels(w)).toEqual(['🔊 LEER EN VOZ ALTA'])
  })

  it('se para al desmontar', async () => {
    const w = mountControls()
    await w.get('button').trigger('click')
    synth.cancel!.mockClear()
    w.unmount()
    expect(synth.cancel).toHaveBeenCalled()
  })

  it('sin texto el botón está deshabilitado', () => {
    expect(mountControls('').get('button').attributes('disabled')).toBeDefined()
  })

  it('sin Web Speech API: botón deshabilitado con la explicación visible enlazada', () => {
    vi.stubGlobal('speechSynthesis', undefined)
    const w = mountControls()
    const button = w.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    const help = w.get(`#${button.attributes('aria-describedby')}`)
    expect(help.text()).toBe(SPEECH_UNSUPPORTED)
  })
})
