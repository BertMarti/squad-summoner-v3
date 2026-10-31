// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import TemplatesPanel from '@/components/panels/TemplatesPanel.vue'
import { useMissionStore } from '@/stores/mission'
import { useTemplatesStore } from '@/stores/templates'
import { EXPORT_APP, MAX_TEMPLATES, exportTemplates } from '@/lib/templates'

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
    const raw = exportTemplates([{ id: 'p-1', name: 'Importada', text: 'Hola', createdAt: '', updatedAt: '' }])
    await pickFile(w, new File([raw], 'plantillas.json', { type: 'application/json' }))
    expect(w.get('.import-status[role="status"]').text()).toBe('1 plantilla importada.')
    expect(w.get('.template-entry').text()).toContain('Importada')
    await pickFile(w, new File(['no es json'], 'roto.json', { type: 'application/json' }))
    expect(w.get('[role="alert"]').text()).toContain('JSON válido')
    expect(w.find('.import-status[role="status"]').exists()).toBe(false)
  })
})
