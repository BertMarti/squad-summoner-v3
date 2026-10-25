import { describe, expect, it } from 'vitest'
import { buildPrompt } from '../prompts'
import { DEMO_BANNER, DEMO_TONE_TEMPLATES, generateDemoMessage } from '../demo'
import { GAME_IDS, GAME_TITLES, MAX_MESSAGE_LENGTH } from '../mission'
import { POLL_BLOCK, hasAttendancePoll, withAttendancePoll } from '../poll'
import { TONES, TONE_PROMPTS, isToneId } from '../tones'
import { MAX_HISTORY, addEntry, createEntry, parseHistory, serializeHistory } from '../history'
import { GAMES } from '@/composables/useGemini'

describe('juegos nuevos (Deep Rock Galactic y Destiny 2)', () => {
  it('tienen tarjeta, título e ilustración propia', () => {
    for (const id of GAME_IDS) {
      const card = GAMES.find((g) => g.id === id)
      expect(card?.title).toBe(GAME_TITLES[id])
      expect(card?.img).toMatch(new RegExp(`games/${id}\\.svg$`))
    }
  })
  it('tienen prompt propio con reclutas y hora', () => {
    const drg = buildPrompt({ game: 'drg', recruits: 'Alex', time: '22:00' })
    expect(drg).toContain('ROCK AND STONE')
    expect(drg).toContain('"Alex"')
    const d2 = buildPrompt({ game: 'd2', time: '21:15' })
    expect(d2).toContain('Guardianes')
    expect(d2).toContain('21:15')
  })
  it('generan demo marcada', () => {
    expect(generateDemoMessage({ game: 'drg', recruits: 'Marta' }, () => 0)).toMatch(/^🧪.*\n\n⛏️.*MARTA/s)
    expect(generateDemoMessage({ game: 'd2' }, () => 1).startsWith(DEMO_BANNER)).toBe(true)
  })
})

describe('tonos', () => {
  it('épico, cutre y pasivo-agresivo', () => {
    expect(TONES.map((t) => t.id)).toEqual(['epico', 'cutre', 'pasivo'])
    expect(isToneId('pasivo')).toBe(true)
    expect(isToneId('toxico')).toBe(false)
  })
  it('el tono épico no cambia el prompt y los demás añaden su instrucción', () => {
    const base = buildPrompt({ game: 'hd2' })
    expect(buildPrompt({ game: 'hd2', tone: 'epico' })).toBe(base)
    expect(buildPrompt({ game: 'hd2', tone: 'cutre' })).toBe(`${base}\n${TONE_PROMPTS.cutre}`)
    expect(buildPrompt({ game: 'custom', customGameName: 'Tetris', tone: 'pasivo' })).toContain('PASIVO-AGRESIVO')
  })
  it('un tono desconocido se trata como épico', () => {
    expect(buildPrompt({ game: 'sm2', tone: 'malvado' as never })).toBe(buildPrompt({ game: 'sm2' }))
  })
  it('la demo usa las plantillas del tono con el nombre del juego', () => {
    for (const [tone, list] of Object.entries(DEMO_TONE_TEMPLATES)) {
      list.forEach((_, i) => {
        const msg = generateDemoMessage(
          { game: 'drg', tone: tone as 'cutre', recruits: 'Juan', time: '20:00' },
          () => i,
        )
        expect(msg.startsWith(DEMO_BANNER)).toBe(true)
        expect(msg).toMatch(/Deep Rock Galactic|DEEP ROCK GALACTIC/)
        expect(msg).toContain('20:00')
      })
    }
    expect(generateDemoMessage({ game: 'custom', customGameName: 'Tetris', tone: 'pasivo' }, () => 0)).toContain(
      'Tetris',
    )
  })
})

describe('encuesta de asistencia', () => {
  it('se añade al final una sola vez', () => {
    const once = withAttendancePoll('¡A jugar!')
    expect(once).toBe(`¡A jugar!\n\n${POLL_BLOCK}`)
    expect(hasAttendancePoll(once)).toBe(true)
    expect(withAttendancePoll(once)).toBe(once)
    expect(once).toContain('✅ Voy')
    expect(once).toContain('❌ No puedo')
  })
  it('nunca pasa del máximo y conserva la encuesta entera', () => {
    const out = withAttendancePoll('x'.repeat(MAX_MESSAGE_LENGTH))
    expect(out.length).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH)
    expect(out.endsWith(POLL_BLOCK)).toBe(true)
    expect(out).toContain('…')
  })
})

describe('historial', () => {
  const mission = { game: 'hd2', recruits: 'Alex', time: '21:00', tone: 'cutre' as const, poll: true }
  it('guarda la más reciente primero, sin duplicados y con máximo', () => {
    let list = addEntry([], createEntry('uno', mission, 'demo'))
    list = addEntry(list, createEntry('dos', mission, 'ia'))
    list = addEntry(list, createEntry('uno', mission, 'demo'))
    expect(list.map((e) => e.text)).toEqual(['uno', 'dos'])
    for (let i = 0; i < 20; i++) list = addEntry(list, createEntry(`t${i}`, mission, 'demo'))
    expect(list).toHaveLength(MAX_HISTORY)
    expect(list[0]!.text).toBe('t19')
  })
  it('no guarda textos vacíos', () => {
    expect(addEntry([], createEntry('   ', mission, 'demo'))).toEqual([])
  })
  it('sanea la misión al crear la entrada', () => {
    const e = createEntry('hola', { ...mission, recruits: 'a"b' }, 'ia')
    expect(e.mission).toMatchObject({ game: 'hd2', recruits: 'a b', tone: 'cutre', poll: true })
  })
  it('lee y escribe lo guardado; descarta lo que no encaja sin lanzar', () => {
    const list = addEntry([], createEntry('hola', mission, 'ia'))
    expect(parseHistory(serializeHistory(list))).toEqual(list)
    expect(parseHistory(null)).toEqual([])
    expect(parseHistory('{roto')).toEqual([])
    expect(parseHistory('{"a":1}')).toEqual([])
    const malas = [
      { id: 'x', createdAt: 'no-es-fecha', text: 'hola', mission, source: 'ia' },
      { id: 'y', createdAt: '2026-10-25T20:00:00.000Z', text: '', mission, source: 'ia' },
      { id: 'z', createdAt: '2026-10-25T20:00:00.000Z', text: 'hola', mission, source: '<img>' },
      { id: 'w', createdAt: '2026-10-25T20:00:00.000Z', text: 'hola', mission: null, source: 'ia' },
    ]
    expect(parseHistory(JSON.stringify(malas))).toEqual([])
    const sucia = [
      { id: 'v', createdAt: '2026-10-25T20:00:00.000Z', text: 'hola', mission: { game: 'x' }, source: 'demo' },
    ]
    expect(parseHistory(JSON.stringify(sucia))[0]!.mission.game).toBe('')
  })
})
