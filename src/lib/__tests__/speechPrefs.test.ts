import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import {
  DEFAULT_SPEECH_PREFS,
  MAX_VOICE_ID,
  SPEECH_FAILED,
  SPEECH_RATES,
  SPEECH_SAMPLE,
  cleanVoiceId,
  findVoice,
  groupVoices,
  normalizeRate,
  parseSpeechPrefs,
  serializeSpeechPrefs,
  voiceId,
  voiceLabel,
} from '../speech'
import { useSpeech } from '@/composables/useSpeech'

const VOICES = [
  { name: 'Samantha', lang: 'en-US', default: true, voiceURI: 'com.apple.samantha' },
  { name: 'Google español', lang: 'es-ES', voiceURI: 'Google español' },
  { name: 'Mónica', lang: 'es-ES', localService: true, voiceURI: 'com.apple.monica' },
  { name: 'Paulina', lang: 'es_MX', localService: true, voiceURI: 'com.apple.paulina' },
  { name: 'Amélie', lang: 'fr-CA', voiceURI: 'com.apple.amelie' },
  { name: 'Mónica', lang: 'es-ES', localService: true, voiceURI: 'com.apple.monica' },
  { name: '', lang: 'es-ES', voiceURI: '' },
]

describe('velocidad', () => {
  it('ofrece valores razonables con la normal incluida', () => {
    const values = SPEECH_RATES.map((r) => r.value)
    expect(values).toContain(1)
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0.5)
    expect(Math.max(...values)).toBeLessThanOrEqual(2)
  })

  it('normalizeRate se queda con la permitida más cercana', () => {
    expect(normalizeRate(1)).toBe(1)
    expect(normalizeRate('1.3')).toBe(1.3)
    expect(normalizeRate(1.2)).toBe(1.15)
    expect(normalizeRate(10)).toBe(1.5)
    expect(normalizeRate(0)).toBe(0.7)
    expect(normalizeRate(NaN)).toBe(1)
    expect(normalizeRate(Infinity)).toBe(1)
    expect(normalizeRate({})).toBe(1)
  })
})

describe('preferencias guardadas', () => {
  it('ida y vuelta', () => {
    const prefs = { voice: 'com.apple.monica', rate: 1.3 }
    expect(parseSpeechPrefs(serializeSpeechPrefs(prefs))).toEqual(prefs)
  })

  it('lo que no encaja (otra web del origen compartido) vuelve a los valores por defecto', () => {
    for (const raw of [null, undefined, '', 'no-json', '[]', '"texto"', 'null', 'x'.repeat(2000)])
      expect(parseSpeechPrefs(raw as string)).toEqual(DEFAULT_SPEECH_PREFS)
    expect(parseSpeechPrefs('{"voice":5,"rate":"rapidísimo"}')).toEqual(DEFAULT_SPEECH_PREFS)
    expect(parseSpeechPrefs(JSON.stringify({ voice: 'a\u202eb', rate: 1.5 }))).toEqual({ voice: '', rate: 1.5 })
    expect(parseSpeechPrefs(JSON.stringify({ voice: 'x'.repeat(MAX_VOICE_ID + 1) })).voice).toBe('')
  })

  it('cleanVoiceId', () => {
    expect(cleanVoiceId(' Mónica ')).toBe('Mónica')
    expect(cleanVoiceId('a\nb')).toBe('')
    expect(cleanVoiceId(42)).toBe('')
  })
})

describe('lista de voces', () => {
  it('españolas primero (es-ES y locales delante), sin repetidas ni vacías; el resto por idioma', () => {
    const { spanish, others } = groupVoices(VOICES)
    expect(spanish.map((v) => v.name)).toEqual(['Mónica', 'Google español', 'Paulina'])
    expect(others.map((v) => v.name)).toEqual(['Samantha', 'Amélie'])
  })

  it('voiceId usa voiceURI y si no el nombre; findVoice', () => {
    expect(voiceId({ name: 'X', lang: 'es-ES' })).toBe('X')
    expect(voiceId(VOICES[2]!)).toBe('com.apple.monica')
    expect(findVoice(VOICES, 'com.apple.amelie')?.name).toBe('Amélie')
    expect(findVoice(VOICES, 'no-existe')).toBeNull()
    expect(findVoice(VOICES, '')).toBeNull()
  })

  it('voiceLabel', () => {
    expect(voiceLabel(VOICES[3]!)).toBe('Paulina (es-MX)')
  })
})

class FakeUtterance {
  lang = ''
  voice: unknown = null
  rate = 1
  onend: (() => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  constructor(public text: string) {}
}

function fakeWindow(voices: unknown[] = VOICES) {
  const spoken: FakeUtterance[] = []
  const listeners: (() => void)[] = []
  let list = voices
  const synth = {
    speaking: true,
    pending: false,
    speak: vi.fn((u: FakeUtterance) => spoken.push(u)),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => list),
    addEventListener: vi.fn((_: string, fn: () => void) => listeners.push(fn)),
    removeEventListener: vi.fn(),
  }
  const setVoices = (next: unknown[]) => {
    list = next
    listeners.forEach((fn) => fn())
  }
  return { win: { speechSynthesis: synth, SpeechSynthesisUtterance: FakeUtterance } as never, spoken, setVoices }
}

describe('useSpeech con voz y velocidad elegidas', () => {
  it('usa la voz y la velocidad elegidas', () => {
    const { win, spoken } = fakeWindow()
    const voice = ref('com.apple.amelie')
    const rate = ref(1.3)
    const s = useSpeech(win, { voice: () => voice.value, rate: () => rate.value })
    expect(s.voiceName.value).toBe('Amélie')
    s.speak('Hola.')
    expect(spoken[0]).toMatchObject({ lang: 'fr-CA', rate: 1.3 })
    expect((spoken[0]!.voice as { name: string }).name).toBe('Amélie')
    voice.value = ''
    rate.value = 0.85
    s.speak('Otra.')
    expect(spoken[1]).toMatchObject({ lang: 'es-ES', rate: 0.85 })
    expect((spoken[1]!.voice as { name: string }).name).toBe('Mónica')
  })

  it('si la voz elegida no está en este dispositivo, usa la automática y lo indica', () => {
    const { win } = fakeWindow()
    const s = useSpeech(win, { voice: () => 'voz-de-otro-movil', rate: () => 1 })
    expect(s.chosenMissing.value).toBe(true)
    expect(s.voiceName.value).toBe('Mónica')
  })

  it('PROBAR VOZ lee la frase de ejemplo', () => {
    const { win, spoken } = fakeWindow()
    const s = useSpeech(win, { voice: () => '', rate: () => 1.5 })
    expect(s.preview()).toBe(true)
    expect(spoken.map((u) => u.text).join(' ')).toBe(SPEECH_SAMPLE)
    expect(spoken.every((u) => u.rate === 1.5)).toBe(true)
  })

  it('las voces que llegan tarde (voiceschanged) aparecen en la lista', () => {
    const { win, setVoices } = fakeWindow([])
    const s = useSpeech(win, { voice: () => '', rate: () => 1 })
    expect(s.hasVoices.value).toBe(false)
    expect(s.chosenMissing.value).toBe(false)
    setVoices(VOICES)
    expect(s.hasVoices.value).toBe(true)
    expect(s.voiceGroups.value.spanish).toHaveLength(3)
    expect(s.voiceName.value).toBe('Mónica')
  })

  it('sin voces lee con lang es-ES, sin voz y con la velocidad elegida', () => {
    const { win, spoken } = fakeWindow([])
    const s = useSpeech(win, { voice: () => 'com.apple.monica', rate: () => 0.7 })
    s.speak('Hola.')
    expect(spoken[0]).toMatchObject({ lang: 'es-ES', voice: null, rate: 0.7 })
  })

  it('una velocidad no válida se normaliza; sin preferencias, velocidad normal', () => {
    const { win, spoken } = fakeWindow()
    useSpeech(win, { voice: () => '', rate: () => 99 }).speak('A.')
    useSpeech(win).speak('B.')
    expect(spoken.map((u) => u.rate)).toEqual([1.5, 1])
  })

  it('getVoices que falla deja la lista vacía sin romper', () => {
    const { win } = fakeWindow()
    ;(win as { speechSynthesis: { getVoices: () => never } }).speechSynthesis.getVoices = () => {
      throw new Error('boom')
    }
    const s = useSpeech(win)
    expect(s.hasVoices.value).toBe(false)
    expect(s.speak('Hola.')).toBe(true)
  })

  it('si speak(), pause() o resume() lanzan, la lectura se para con el aviso', () => {
    for (const method of ['speak', 'pause', 'resume'] as const) {
      const { win } = fakeWindow()
      const synth = (win as { speechSynthesis: Record<string, unknown> }).speechSynthesis
      const s = useSpeech(win)
      if (method === 'speak') {
        synth.speak = () => {
          throw new Error('boom')
        }
        expect(s.speak('Uno. Dos.')).toBe(false)
      } else {
        s.speak('Hola.')
        if (method === 'resume') s.pause()
        synth[method] = () => {
          throw new Error('boom')
        }
        if (method === 'pause') s.pause()
        else s.resume()
      }
      expect(s.state.value, method).toBe('idle')
      expect(s.error.value, method).toBe(SPEECH_FAILED)
    }
  })
})
