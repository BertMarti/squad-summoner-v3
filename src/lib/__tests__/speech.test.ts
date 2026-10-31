import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_CHUNK, isSpeechSupported, pickSpanishVoice, splitForSpeech, textForSpeech } from '../speech'
import { useSpeech } from '@/composables/useSpeech'
import { DEMO_BANNER } from '../demo'

describe('isSpeechSupported', () => {
  it('necesita speechSynthesis y SpeechSynthesisUtterance', () => {
    expect(isSpeechSupported(undefined)).toBe(false)
    expect(isSpeechSupported({})).toBe(false)
    expect(isSpeechSupported({ speechSynthesis: {} })).toBe(false)
    expect(isSpeechSupported({ speechSynthesis: {}, SpeechSynthesisUtterance: class {} })).toBe(true)
  })
})

describe('pickSpanishVoice', () => {
  const v = (name: string, lang: string, extra: Partial<{ localService: boolean; default: boolean }> = {}) => ({
    name,
    lang,
    ...extra,
  })

  it('prefiere es-ES, luego otras variantes de español, y entre ellas las locales', () => {
    expect(pickSpanishVoice([v('en', 'en-US', { default: true }), v('mx', 'es-MX'), v('es', 'es-ES')])!.name).toBe('es')
    expect(pickSpanishVoice([v('red', 'es-ES'), v('local', 'es_ES', { localService: true })])!.name).toBe('local')
    expect(pickSpanishVoice([v('en', 'en-GB'), v('mx', 'es-MX')])!.name).toBe('mx')
  })

  it('null si no hay ninguna en español', () => {
    expect(pickSpanishVoice([v('en', 'en-US'), v('eus', 'eu-ES')])).toBeNull()
    expect(pickSpanishVoice([])).toBeNull()
  })
})

describe('textForSpeech', () => {
  it('quita la marca de demo, emojis y adornos', () => {
    const text = `${DEMO_BANNER}\n\n+++ TRANSMISIÓN +++\n📢 ¡ATENCIÓN, ALEX! 🇪🇸👍🏽\n---\n¡POR LA SUPER TIERRA! 🦅`
    expect(textForSpeech(text)).toBe('TRANSMISIÓN\n¡ATENCIÓN, ALEX!\n¡POR LA SUPER TIERRA!')
  })

  it('descarta líneas sin letras ni números y aguanta entradas raras', () => {
    expect(textForSpeech('🛡️\n   \n✅ Voy')).toBe('Voy')
    expect(textForSpeech(undefined as unknown as string)).toBe('')
  })
})

describe('splitForSpeech', () => {
  it('separa por líneas y frases sin pasar del máximo', () => {
    const chunks = splitForSpeech('Hola equipo. ¿Venís?\nA las 21:30.')
    expect(chunks).toEqual(['Hola equipo. ¿Venís?', 'A las 21:30.'])
    const long = splitForSpeech(Array.from({ length: 30 }, (_, i) => `Frase número ${i}.`).join(' '))
    expect(long.length).toBeGreaterThan(1)
    for (const c of long) expect(c.length).toBeLessThanOrEqual(MAX_CHUNK)
  })

  it('corta por palabras una frase enorme y por caracteres una palabra enorme', () => {
    const chunks = splitForSpeech(`${'palabra '.repeat(100)}${'x'.repeat(500)}`, 50)
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(50)
    expect(chunks.join(' ')).toContain('palabra')
  })

  it('texto vacío no da trozos', () => {
    expect(splitForSpeech('')).toEqual([])
  })
})

class FakeUtterance {
  text: string
  lang = ''
  voice: unknown = null
  rate = 1
  onend: (() => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

function fakeWindow(voices = [{ name: 'Mónica', lang: 'es-ES', localService: true }]) {
  const spoken: FakeUtterance[] = []
  const synth = {
    speak: vi.fn((u: FakeUtterance) => spoken.push(u)),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => voices),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  return { win: { speechSynthesis: synth, SpeechSynthesisUtterance: FakeUtterance }, synth, spoken }
}

describe('useSpeech', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sin soporte no hace nada', () => {
    const s = useSpeech(undefined)
    expect(s.supported).toBe(false)
    expect(s.speak('Hola')).toBe(false)
    expect(s.state.value).toBe('idle')
  })

  it('lee por frases con la voz española, pausa, reanuda y para', () => {
    const { win, synth, spoken } = fakeWindow()
    const s = useSpeech(win as never)
    expect(s.voiceName.value).toBe('Mónica')
    expect(s.speak(`${DEMO_BANNER}\n\n¡Hola! 👋\nA las 21:30.`)).toBe(true)
    expect(spoken.map((u) => u.text)).toEqual(['¡Hola!', 'A las 21:30.'])
    expect(spoken.every((u) => u.lang === 'es-ES' && u.voice)).toBe(true)
    expect(s.state.value).toBe('speaking')
    s.pause()
    expect(synth.pause).toHaveBeenCalled()
    expect(s.state.value).toBe('paused')
    s.resume()
    expect(s.state.value).toBe('speaking')
    s.stop()
    expect(synth.cancel).toHaveBeenCalled()
    expect(s.state.value).toBe('idle')
  })

  it('vuelve a reposo al terminar la última frase; lo de una lectura anterior no cuenta', () => {
    const { win, spoken } = fakeWindow()
    const s = useSpeech(win as never)
    s.speak('Primera.')
    const old = spoken[0]!
    s.speak('Segunda.')
    old.onend?.()
    expect(s.state.value).toBe('speaking')
    spoken[1]!.onend?.()
    expect(s.state.value).toBe('idle')
  })

  it('un error real para la lectura; «interrupted» (parar a propósito) no', () => {
    const { win, spoken } = fakeWindow()
    const s = useSpeech(win as never)
    s.speak('Uno. Dos.')
    spoken[0]!.onerror?.({ error: 'interrupted' })
    expect(s.state.value).toBe('speaking')
    spoken[0]!.onerror?.({ error: 'synthesis-failed' })
    expect(s.state.value).toBe('idle')
  })

  it('sin voz española usa lang es-ES y la voz por defecto; nada que leer devuelve false', () => {
    const { win, spoken } = fakeWindow([{ name: 'Sam', lang: 'en-US', localService: true }])
    const s = useSpeech(win as never)
    expect(s.voiceName.value).toBe('')
    expect(s.speak('🛡️')).toBe(false)
    s.speak('Hola')
    expect(spoken[0]).toMatchObject({ lang: 'es-ES', voice: null })
  })

  it('dispose quita el oyente de voces y para si estaba leyendo', () => {
    const { win, synth } = fakeWindow()
    const s = useSpeech(win as never)
    s.speak('Hola')
    s.dispose()
    expect(synth.removeEventListener).toHaveBeenCalledWith('voiceschanged', expect.any(Function))
    expect(s.state.value).toBe('idle')
  })
})
