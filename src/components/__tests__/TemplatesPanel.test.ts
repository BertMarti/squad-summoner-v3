// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import TemplatesPanel from '@/components/panels/TemplatesPanel.vue'
import { useMissionStore } from '@/stores/mission'
import { useTemplatesStore } from '@/stores/templates'
import { EXPORT_APP, MAX_TEMPLATES, exportTemplates } from '@/lib/templates'
import { MAX_SHARE_FRAGMENT, SHARE_ERRORS, decodeShareFragment } from '@/lib/shareLink'

let pinia: ReturnType<typeof createPinia>

beforeEach(() => {
  localStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
  useMissionStore().update({ game: 'hd2', recruits: 'Alex', time: '21:30' })
})
afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const mountPanel = () => mount(TemplatesPanel, { global: { plugins: [pinia] }, attachTo: document.body })
const btn = (w: VueWrapper, label: string) => {
  const found = w.findAll('button').find((b) => b.text() === label)
  if (!found) throw new Error(`No hay botón «${label}»`)
  return found
}
const createTemplate = async (w: VueWrapper, name: string, text: string) => {
  await btn(w, '➕ NUEVA PLANTILLA').trigger('click')
  await w.get('#template-name').setValue(name)
  await w.get('#template-text').setValue(text)
  await w.get('form').trigger('submit')
  await flushPromises()
}
const pickFile = async (w: VueWrapper, file: File) => {
  const input = w.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
}

describe('TemplatesPanel', () => {
  it('sin plantillas muestra el estado vacío y EXPORTAR deshabilitado', () => {
    const w = mountPanel()
    expect(w.text()).toContain('Aún no tienes plantillas')
    expect(btn(w, '⬇️ EXPORTAR').attributes('disabled')).toBeDefined()
  })

  it('crea una plantilla, valida el nombre vacío y devuelve el foco a ➕ NUEVA PLANTILLA', async () => {
    const w = mountPanel()
    await btn(w, '➕ NUEVA PLANTILLA').trigger('click')
    await flushPromises()
    expect(document.activeElement?.id).toBe('template-name')
    await w.get('#template-text').setValue('Hola {reclutas} a las {hora}')
    await w.get('form').trigger('submit')
    expect(w.get('[role="alert"]').text()).toContain('Ponle un nombre')
    expect(w.get('.template-preview').text()).toBe('Hola Alex a las 21:30')
    await w.get('#template-name').setValue('Convocatoria')
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(w.find('form').exists()).toBe(false)
    expect(w.get('.template-entry').text()).toContain('Convocatoria')
    expect(w.findAll('.variable-chip').map((c) => c.text())).toEqual(['{hora}', '{reclutas}'])
    expect(document.activeElement?.textContent).toContain('NUEVA PLANTILLA')
  })

  it('USAR emite el texto con la misión actual (sin IA)', async () => {
    const w = mountPanel()
    await createTemplate(w, 'Original', '{RECLUTAS}: {juego} a las {hora}')
    await btn(w, '▶️ USAR').trigger('click')
    expect(w.emitted('use')?.[0]).toEqual(['ALEX: Helldivers 2 a las 21:30'])
    expect(w.find('button[aria-label="Usar Original"]').exists()).toBe(true)
  })

  it('EDITAR sirve para renombrar y cambiar el texto; Escape cancela', async () => {
    const w = mountPanel()
    await createTemplate(w, 'Original', 'Texto')
    await btn(w, '✏️ EDITAR').trigger('click')
    expect((w.get('#template-name').element as HTMLInputElement).value).toBe('Original')
    await w.get('#template-name').setValue('Renombrada')
    await w.get('#template-text').setValue('Texto nuevo')
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(useTemplatesStore().templates[0]).toMatchObject({ name: 'Renombrada', text: 'Texto nuevo' })
    await btn(w, '✏️ EDITAR').trigger('click')
    await w.get('#template-name').setValue('No se guarda')
    await w.get('form').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(w.find('form').exists()).toBe(false)
    expect(useTemplatesStore().templates[0]!.name).toBe('Renombrada')
  })

  it('BORRAR pide confirmación en línea: CANCELAR no borra y SÍ, BORRAR sí', async () => {
    const w = mountPanel()
    await createTemplate(w, 'Para borrar', 'Texto')
    await btn(w, '🗑️ BORRAR').trigger('click')
    expect(w.text()).toContain('¿Borrar «Para borrar»?')
    await flushPromises()
    expect(document.activeElement?.textContent).toBe('CANCELAR')
    await btn(w, 'CANCELAR').trigger('click')
    await flushPromises()
    expect(useTemplatesStore().templates).toHaveLength(1)
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Borrar Para borrar')
    await btn(w, '🗑️ BORRAR').trigger('click')
    await btn(w, 'SÍ, BORRAR').trigger('click')
    await flushPromises()
    expect(useTemplatesStore().templates).toHaveLength(0)
    expect(w.text()).toContain('Aún no tienes plantillas')
  })

  it('desde una transmisión cambia los datos por variables; desmarcado deja el texto literal', async () => {
    const w = mountPanel()
    ;(w.vm as unknown as { startFromTransmission: (t: string) => void }).startFromTransmission(
      'ALEX, Alex: Helldivers 2 a las 21:30',
    )
    await nextTick()
    const textarea = () => (w.get('#template-text').element as HTMLTextAreaElement).value
    expect(textarea()).toBe('{RECLUTAS}, {reclutas}: {juego} a las {hora}')
    await w.get('#template-variables').setValue(false)
    expect(textarea()).toBe('ALEX, Alex: Helldivers 2 a las 21:30')
  })

  it('con el máximo de plantillas avisa en vez de abrir el editor', async () => {
    const store = useTemplatesStore()
    for (let i = 0; i < MAX_TEMPLATES; i++) store.add(`P${i}`, `t${i}`)
    const w = mountPanel()
    ;(w.vm as unknown as { startFromTransmission: (t: string) => void }).startFromTransmission('Hola')
    await nextTick()
    expect(w.find('form').exists()).toBe(false)
    expect(w.get('[role="alert"]').text()).toContain('máximo')
    expect(btn(w, '➕ NUEVA PLANTILLA').attributes('disabled')).toBeDefined()
  })

  it('el texto nunca se interpreta como HTML', async () => {
    const w = mountPanel()
    await createTemplate(w, '<b>Nombre</b>', '<img src=x onerror=alert(1)>')
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('b').exists()).toBe(false)
    expect(w.get('.template-entry').text()).toContain('<img src=x onerror=alert(1)>')
  })

  it('EXPORTAR descarga un JSON de la app', async () => {
    const w = mountPanel()
    await createTemplate(w, 'Exportable', 'Hola {reclutas}')
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:prueba')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    await btn(w, '⬇️ EXPORTAR').trigger('click')
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:prueba')
    const data = JSON.parse(await createObjectURL.mock.calls[0]![0].text())
    expect(data).toMatchObject({ app: EXPORT_APP, plantillas: [{ nombre: 'Exportable', texto: 'Hola {reclutas}' }] })
  })

  it('IMPORTAR un archivo válido muestra el resumen; uno no válido, el motivo', async () => {
    const w = mountPanel()
    const fileInput = w.get('input[type="file"]')
    // El input real no se alcanza con el teclado: lo abre el botón ⬆️ IMPORTAR.
    expect(fileInput.attributes('tabindex')).toBe('-1')
    expect(fileInput.attributes('aria-hidden')).toBe('true')
    const click = vi.spyOn(fileInput.element as HTMLInputElement, 'click').mockImplementation(() => undefined)
    await btn(w, '⬆️ IMPORTAR').trigger('click')
    expect(click).toHaveBeenCalled()
    const raw = exportTemplates([{ id: 'p-1', name: 'Importada', text: 'Hola', createdAt: '', updatedAt: '' }])
    await pickFile(w, new File([raw], 'plantillas.json', { type: 'application/json' }))
    expect(w.get('.import-status[role="status"]').text()).toBe('1 plantilla importada.')
    expect(w.get('.template-entry').text()).toContain('Importada')
    await pickFile(w, new File(['no es json'], 'roto.json', { type: 'application/json' }))
    expect(w.get('[role="alert"]').text()).toContain('JSON válido')
    expect(w.find('.import-status[role="status"]').exists()).toBe(false)
  })
})

describe('TemplatesPanel · compartir por enlace', () => {
  const openShare = async (w: VueWrapper) => {
    await btn(w, '🔗 COMPARTIR').trigger('click')
    // La compresión usa streams: puede tardar más de una vuelta de microtareas.
    await vi.waitFor(() => {
      if (!w.find('.share-box input, .share-box [role="alert"]').exists()) throw new Error('aún sin enlace')
    })
    await flushPromises()
  }

  it('COMPARTIR crea un enlace que se abre con la misma plantilla, con foco en el enlace', async () => {
    const w = mountPanel()
    await createTemplate(w, 'Viernes', 'A las {hora}, {RECLUTAS}')
    await openShare(w)
    const input = w.get<HTMLInputElement>('.share-box input')
    expect(document.activeElement).toBe(input.element)
    const link = input.element.value
    expect(link.startsWith(`${window.location.href.split('#')[0]}#plantilla=1`)).toBe(true)
    expect(await decodeShareFragment(new URL(link).hash)).toEqual({ name: 'Viernes', text: 'A las {hora}, {RECLUTAS}' })
    expect(w.get('.share-box').text()).toContain(`de ${MAX_SHARE_FRAGMENT} caracteres`)
    expect(w.get('.share-note').text()).toContain('no se envía a ningún servidor')
  })

  it('COPIAR ENLACE usa el portapapeles y lo anuncia; si falla, explica cómo copiarlo a mano', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    const w = mountPanel()
    await createTemplate(w, 'Viernes', 'Hola')
    await openShare(w)
    await btn(w, '📋 COPIAR ENLACE').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(w.get<HTMLInputElement>('.share-box input').element.value)
    expect(w.get('.share-box [role="status"]').text()).toBe('Enlace copiado.')
    writeText.mockRejectedValueOnce(new Error('denegado'))
    await btn(w, '📋 COPIAR ENLACE').trigger('click')
    await flushPromises()
    expect(w.get('.share-box [role="alert"]').text()).toContain('cópialo a mano')
  })

  it('WhatsApp abre wa.me con el enlace completo y rel seguro; sin Web Share no hay botón COMPARTIR…', async () => {
    const w = mountPanel()
    await createTemplate(w, 'Viernes', 'Hola')
    await openShare(w)
    const link = w.get<HTMLInputElement>('.share-box input').element.value
    const wa = w.get('.share-actions a')
    expect(wa.attributes('href')!.startsWith('https://wa.me/?text=')).toBe(true)
    expect(new URL(wa.attributes('href')!).searchParams.get('text')).toContain(link)
    expect(wa.attributes('rel')).toBe('noopener noreferrer')
    expect(wa.attributes('target')).toBe('_blank')
    expect(w.findAll('button').some((b) => b.text() === '📤 COMPARTIR…')).toBe(false)
  })

  it('con Web Share, COMPARTIR… envía el mensaje; cancelar no es un error', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelado', 'AbortError'))
    vi.stubGlobal('navigator', { ...navigator, share })
    const w = mountPanel()
    await createTemplate(w, 'Viernes', 'Hola')
    await openShare(w)
    await btn(w, '📤 COMPARTIR…').trigger('click')
    await flushPromises()
    expect(share).toHaveBeenCalledWith({
      title: 'Plantilla de Squad Summoner',
      text: expect.stringContaining('#plantilla=1'),
    })
    expect(w.find('.share-box [role="alert"]').exists()).toBe(false)
  })

  it('CERRAR y Escape devuelven el foco al botón COMPARTIR; BORRAR sigue pidiendo confirmación', async () => {
    const w = mountPanel()
    await createTemplate(w, 'Viernes', 'Hola')
    await openShare(w)
    await btn(w, 'CERRAR').trigger('click')
    await flushPromises()
    expect(w.find('.share-box').exists()).toBe(false)
    expect(document.activeElement).toBe(btn(w, '🔗 COMPARTIR').element)
    await openShare(w)
    await w.get('.share-box input').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(w.find('.share-box').exists()).toBe(false)
    expect(document.activeElement).toBe(btn(w, '🔗 COMPARTIR').element)
    expect(w.find('.delete-confirmation').exists()).toBe(false)
    await btn(w, '🗑️ BORRAR').trigger('click')
    expect(w.find('.delete-confirmation').exists()).toBe(true)
  })

  it('si la plantilla no cabe en un enlace, lo explica y se puede cerrar', async () => {
    const w = mountPanel()
    const text = Array.from({ length: 3000 }, (_, i) => String.fromCharCode(0x4e00 + ((i * 7919) % 20000))).join('')
    useTemplatesStore().add('Enorme', text)
    await nextTick()
    await openShare(w)
    expect(w.get('.share-box [role="alert"]').text()).toBe(SHARE_ERRORS.tooLongToShare)
    await btn(w, 'CERRAR').trigger('click')
    expect(w.find('.share-box').exists()).toBe(false)
  })
})
