import { describe, expect, it } from 'vitest'
import { DEMO_BANNER, DEMO_TEMPLATES, generateDemoMessage } from '../demo'
import { buildWhatsappShareUrl, isSendableMessage } from '../whatsapp'
import { MAX_MESSAGE_LENGTH } from '../mission'

describe('generateDemoMessage', () => {
  it('marca siempre el texto como DEMO', () => {
    for (const game of ['hd2', 'sm2', 'mh', 'custom', '']) {
      expect(generateDemoMessage({ game })).toMatch(new RegExp(`^${DEMO_BANNER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
    }
  })
  it('incluye reclutas y hora', () => {
    const msg = generateDemoMessage({ game: 'sm2', recruits: 'Alex', time: '21:00' }, () => 0)
    expect(msg).toContain('Alex')
    expect(msg).toContain('21:00')
  })
  it('todas las plantillas generan texto con cualquier índice', () => {
    for (const [game, list] of Object.entries(DEMO_TEMPLATES)) {
      list.forEach((_, i) => expect(generateDemoMessage({ game }, () => i).length).toBeGreaterThan(DEMO_BANNER.length + 20))
    }
    expect(generateDemoMessage({ game: 'hd2' }, () => 99)).toContain(DEMO_BANNER)
  })
})

describe('whatsapp', () => {
  it('construye un enlace wa.me codificado', () => {
    expect(buildWhatsappShareUrl('¡Hola & adiós!')).toBe('https://wa.me/?text=%C2%A1Hola%20%26%20adi%C3%B3s!')
  })
  it('valida el mensaje', () => {
    expect(isSendableMessage('  ')).toBe(false)
    expect(isSendableMessage(null)).toBe(false)
    expect(isSendableMessage('x'.repeat(MAX_MESSAGE_LENGTH + 1))).toBe(false)
    expect(isSendableMessage('¡A jugar!')).toBe(true)
  })
})
