// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SpeechControls from '@/components/panels/SpeechControls.vue'
import { NO_VOICES_HELP, SPEECH_SAMPLE, SPEECH_UNSUPPORTED } from '@/lib/speech'

class FakeUtterance {
  lang = ''
  voice: unknown = null
  rate = 1
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  constructor(public text: string) {}
}

let synth: Record<string, ReturnType<typeof vi.fn> | boolean>
let spoken: FakeUtterance[]

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  spoken = []
  synth = {
    speaking: true,
    pending: false,
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
    expect(labels(w)).toEqual(['⏸️ PAUSAR', '⏹️ PARAR', '🎚️ VOZ Y VELOCIDAD'])
    expect(w.get('[role="status"]').text()).toBe('Leyendo en voz alta…')
    await w.get('button').trigger('click')
    expect(synth.pause).toHaveBeenCalled()
    expect(labels(w)).toEqual(['▶️ REANUDAR', '⏹️ PARAR', '🎚️ VOZ Y VELOCIDAD'])
    expect(w.get('[role="status"]').text()).toBe('Lectura en pausa')
    await w.get('button').trigger('click')
    expect(synth.resume).toHaveBeenCalled()
    await w.findAll('button')[1]!.trigger('click')
    expect(synth.cancel).toHaveBeenCalled()
    expect(labels(w)).toEqual(['🔊 LEER EN VOZ ALTA', '🎚️ VOZ Y VELOCIDAD'])
  })

  it('al terminar de leer vuelve al botón inicial', async () => {
    const w = mountControls()
    await w.get('button').trigger('click')
    spoken.at(-1)!.onend?.()
    await w.vm.$nextTick()
    expect(labels(w)).toEqual(['🔊 LEER EN VOZ ALTA', '🎚️ VOZ Y VELOCIDAD'])
  })

  it('si cambia la transmisión mientras lee, se para', async () => {
    const w = mountControls()
    await w.get('button').trigger('click')
    await w.setProps({ text: 'Otra transmisión.' })
    expect(synth.cancel).toHaveBeenCalled()
    expect(labels(w)).toEqual(['🔊 LEER EN VOZ ALTA', '🎚️ VOZ Y VELOCIDAD'])
  })

  it('se para al desmontar', async () => {
    const w = mountControls()
    await w.get('button').trigger('click')
    const cancel = synth.cancel as ReturnType<typeof vi.fn>
    cancel.mockClear()
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

  it('sin Web Speech API no se ofrece VOZ Y VELOCIDAD', () => {
    vi.stubGlobal('speechSynthesis', undefined)
    expect(labels(mountControls())).toEqual(['🔊 LEER EN VOZ ALTA'])
  })
})

describe('SpeechControls · voz y velocidad', () => {
  const openSettings = async (w: VueWrapper) => {
    const toggle = w.findAll('button').find((b) => b.text() === '🎚️ VOZ Y VELOCIDAD')!
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(w.find(`#${toggle.attributes('aria-controls')}`).exists()).toBe(true)
  }

  it('lista las voces con «Automática» primero, luego Español y después Otros idiomas', async () => {
    const w = mountControls()
    await openSettings(w)
    const select = w.get('#speech-voice')
    expect(w.get('label[for="speech-voice"]').text()).toBe('VOZ')
    expect(select.findAll('option')[0]!.text()).toBe('Automática (la mejor en español)')
    expect(select.findAll('optgroup').map((g) => g.attributes('label'))).toEqual(['Español', 'Otros idiomas'])
    expect(select.findAll('optgroup')[0]!.text()).toContain('Mónica (es-ES)')
    expect(w.get('label[for="speech-rate"]').text()).toBe('VELOCIDAD')
  })

  it('la voz y la velocidad elegidas se guardan con la clave prefijada y se usan al leer', async () => {
    const w = mountControls()
    await openSettings(w)
    await w.get('#speech-voice').setValue('Samantha')
    await w.get('#speech-rate').setValue('1.3')
    expect(JSON.parse(localStorage.getItem('squad-summoner-v3:voz')!)).toEqual({ voice: 'Samantha', rate: 1.3 })
    expect(w.text()).toContain('Voz: Samantha')
    await w
      .findAll('button')
      .find((b) => b.text() === '🔊 LEER EN VOZ ALTA')!
      .trigger('click')
    expect(spoken[0]).toMatchObject({ text: 'Transmisión de prueba.', lang: 'en-US', rate: 1.3 })
  })

  it('PROBAR VOZ lee la frase de ejemplo y se desactiva mientras lee', async () => {
    const w = mountControls()
    await openSettings(w)
    const test = () => w.findAll('button').find((b) => b.text() === '▶️ PROBAR VOZ')!
    await test().trigger('click')
    expect(spoken.map((u) => u.text).join(' ')).toBe(SPEECH_SAMPLE)
    expect(test().attributes('disabled')).toBeDefined()
  })

  it('sin voces instaladas: selector de voz desactivado con la explicación; la velocidad sigue disponible', async () => {
    ;(synth.getVoices as ReturnType<typeof vi.fn>).mockReturnValue([])
    const w = mountControls()
    await openSettings(w)
    const select = w.get('#speech-voice')
    expect(select.attributes('disabled')).toBeDefined()
    expect(w.get(`#${select.attributes('aria-describedby')}`).text()).toBe(NO_VOICES_HELP)
    expect(w.get('#speech-rate').attributes('disabled')).toBeUndefined()
  })

  it('si la voz guardada no existe en este dispositivo, lo dice y usa la automática', async () => {
    localStorage.setItem('squad-summoner-v3:voz', JSON.stringify({ voice: 'Voz de otro móvil', rate: 1 }))
    setActivePinia(createPinia())
    const w = mountControls()
    await openSettings(w)
    expect(w.text()).toContain('La voz elegida no está en este dispositivo')
    expect(w.text()).toContain('Voz: Mónica')
  })
})
