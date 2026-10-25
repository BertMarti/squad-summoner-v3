import { describe, expect, it, vi } from 'vitest'
import { sendToServer } from '../whatsappServer'

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('sendToServer', () => {
  it('envía el mensaje por POST como JSON', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { success: true }))
    await sendToServer('¡A jugar!', { fetchImpl: fetchImpl as unknown as typeof fetch })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/send-mission$/)
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ message: '¡A jugar!' })
  })

  it('no llama al servidor con un mensaje vacío', async () => {
    const fetchImpl = vi.fn()
    await expect(sendToServer('  ', { fetchImpl: fetchImpl as unknown as typeof fetch })).rejects.toThrow(/válida/)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('propaga el error del servidor', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(503, { error: 'WhatsApp no está listo' }))
    await expect(sendToServer('hola', { fetchImpl: fetchImpl as unknown as typeof fetch })).rejects.toThrow(
      'WhatsApp no está listo',
    )
  })

  it('explica cuando el servidor no está arrancado', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(sendToServer('hola', { fetchImpl: fetchImpl as unknown as typeof fetch })).rejects.toThrow(/arrancado/)
  })

  it('tolera respuestas sin JSON', async () => {
    const fetchImpl = vi.fn(async () => new Response('Bad gateway', { status: 502 }))
    await expect(sendToServer('hola', { fetchImpl: fetchImpl as unknown as typeof fetch })).rejects.toThrow('502')
  })
})
