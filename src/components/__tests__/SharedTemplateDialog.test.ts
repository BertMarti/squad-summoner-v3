// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SharedTemplateDialog from '@/components/SharedTemplateDialog.vue'
import { useMissionStore } from '@/stores/mission'
import { useTemplatesStore } from '@/stores/templates'
import { MAX_TEMPLATES } from '@/lib/templates'
import type { SharedTemplate } from '@/lib/shareLink'

let pinia: ReturnType<typeof createPinia>
let wrapper: VueWrapper | null = null

beforeEach(() => {
  localStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
  useMissionStore().update({ game: 'hd2', recruits: 'Alex y Marta', time: '21:30' })
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

type Result = { template: SharedTemplate } | { error: string } | null
const mountDialog = (result: Result) => {
  wrapper = mount(SharedTemplateDialog, { props: { result }, global: { plugins: [pinia] }, attachTo: document.body })
  return wrapper
}
const button = (w: VueWrapper, label: string) => w.findAll('button').find((b) => b.text() === label)!

describe('SharedTemplateDialog', () => {
  it('es un diálogo modal accesible; mientras lee, lo anuncia', () => {
    const w = mountDialog(null)
    const dialog = w.get('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(w.get(`#${dialog.attributes('aria-labelledby')}`).text()).toContain('ENLACE DE PLANTILLA')
    expect(w.get('[role="status"]').text()).toBe('Leyendo el enlace…')
  })

  it('mientras lee, el foco queda dentro del diálogo (no hay botones todavía)', async () => {
    const w = mountDialog(null)
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    const dialog = w.get('.shared-dialog')
    expect(dialog.attributes('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(dialog.element)
  })

  it('muestra la plantilla como TEXTO (nunca HTML), con vista previa y foco en GUARDAR', async () => {
    const text = '<img src=x onerror="alert(1)"> {reclutas} a las {hora}'
    const w = mountDialog({ template: { name: '<b>Del grupo</b>', text } })
    await w.vm.$nextTick()
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('b').exists()).toBe(false)
    expect(w.text()).toContain('<b>Del grupo</b>')
    const [raw, preview] = w.findAll('pre')
    expect(raw!.text()).toBe(text)
    expect(preview!.text()).toBe('<img src=x onerror="alert(1)"> Alex y Marta a las 21:30')
    expect(w.findAll('.variable-chip').map((c) => c.text())).toEqual(['{hora}', '{reclutas}'])
    expect(document.activeElement).toBe(button(w, '💾 GUARDAR EN MIS PLANTILLAS').element)
    expect(useTemplatesStore().templates).toHaveLength(0)
  })

  it('GUARDAR la añade a MIS PLANTILLAS y emite saved; la segunda vez avisa de que ya existía', async () => {
    const template = { name: 'Del grupo', text: 'Hola {reclutas}' }
    const w = mountDialog({ template })
    await button(w, '💾 GUARDAR EN MIS PLANTILLAS').trigger('click')
    expect(useTemplatesStore().templates.map((t) => t.name)).toEqual(['Del grupo'])
    expect(w.emitted('saved')).toEqual([[{ name: 'Del grupo', duplicate: false }]])
    await button(w, '💾 GUARDAR EN MIS PLANTILLAS').trigger('click')
    expect(w.emitted('saved')![1]).toEqual([{ name: 'Del grupo', duplicate: true }])
    expect(useTemplatesStore().templates).toHaveLength(1)
  })

  it('con el máximo de plantillas lo explica dentro del diálogo y no emite saved', async () => {
    const store = useTemplatesStore()
    for (let i = 0; i < MAX_TEMPLATES; i++) store.add(`P${i}`, 'x')
    const w = mountDialog({ template: { name: 'Otra', text: 'y' } })
    await button(w, '💾 GUARDAR EN MIS PLANTILLAS').trigger('click')
    expect(w.get('[role="alert"]').text()).toContain(`máximo de ${MAX_TEMPLATES}`)
    expect(w.emitted('saved')).toBeUndefined()
  })

  it('DESCARTAR, Escape y clic fuera cierran sin guardar', async () => {
    const w = mountDialog({ template: { name: 'Del grupo', text: 'Hola' } })
    await button(w, 'DESCARTAR').trigger('click')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await w.get('.shared-overlay').trigger('click')
    expect(w.emitted('close')).toHaveLength(3)
    expect(useTemplatesStore().templates).toHaveLength(0)
  })

  it('un enlace no válido muestra el motivo como alerta y CERRAR con foco', async () => {
    const w = mountDialog({ error: 'El enlace de plantilla está incompleto o mal copiado.' })
    await w.vm.$nextTick()
    expect(w.get('[role="alert"]').text()).toBe('El enlace de plantilla está incompleto o mal copiado.')
    expect(document.activeElement).toBe(button(w, 'CERRAR').element)
    await button(w, 'CERRAR').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('Tab no sale del diálogo', async () => {
    const w = mountDialog({ template: { name: 'Del grupo', text: 'Hola' } })
    await w.vm.$nextTick()
    const last = button(w, 'DESCARTAR').element as HTMLElement
    last.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(document.activeElement).toBe(button(w, '💾 GUARDAR EN MIS PLANTILLAS').element)
  })
})
