import { describe, expect, it } from 'vitest'
import { cleanField, cleanTime, isGameId, MAX_FIELD_LENGTH, normalizeMission } from '../mission'

describe('cleanField', () => {
  it('quita caracteres de control, comillas y espacios de sobra', () => {
    expect(cleanField('  Alex,\n"Juan"\t`Marta`  ')).toBe('Alex, Juan Marta')
  })
  it('recorta a la longitud máxima', () => {
    expect(cleanField('a'.repeat(500))).toHaveLength(MAX_FIELD_LENGTH)
  })
  it('devuelve cadena vacía si no es texto', () => {
    expect(cleanField(42)).toBe('')
    expect(cleanField(undefined)).toBe('')
  })
})

describe('cleanTime', () => {
  it('acepta horas válidas y rellena con cero', () => {
    expect(cleanTime('21:30')).toBe('21:30')
    expect(cleanTime('9:05')).toBe('09:05')
  })
  it('rechaza horas imposibles o texto', () => {
    expect(cleanTime('24:00')).toBe('')
    expect(cleanTime('12:60')).toBe('')
    expect(cleanTime('ya')).toBe('')
  })
})

describe('normalizeMission', () => {
  it('descarta juegos desconocidos', () => {
    expect(isGameId('hd2')).toBe(true)
    expect(isGameId('fortnite')).toBe(false)
    expect(normalizeMission({ game: 'fortnite' }).game).toBe('')
  })
  it('tolera null y campos ausentes', () => {
    expect(normalizeMission(null)).toEqual({
      game: '',
      subGame: '',
      customGameName: '',
      recruits: '',
      time: '',
      tone: 'epico',
      poll: false,
    })
  })
  it('acepta solo tonos conocidos y poll booleano', () => {
    expect(normalizeMission({ tone: 'cutre', poll: true })).toMatchObject({ tone: 'cutre', poll: true })
    expect(normalizeMission({ tone: 'grosero' as never, poll: 'sí' as never })).toMatchObject({
      tone: 'epico',
      poll: false,
    })
  })
})
