// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTemplatesStore } from '../templates'
import { EXPORT_APP, MAX_TEMPLATES, TemplateImportError, exportTemplates } from '@/lib/templates'

const KEY = 'squad-summoner-v3:plantillas'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})
afterEach(() => vi.restoreAllMocks())

const created = (r: ReturnType<ReturnType<typeof useTemplatesStore>['add']>) => {
  if ('error' in r) throw new Error(r.error)
  return r.template
}

describe('useTemplatesStore', () => {
  it('crea, guarda con prefijo y se recupera al recargar', () => {
    const store = useTemplatesStore()
    created(store.add('Viernes', 'A las {hora}, {reclutas}'))
    expect(store.templates).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem(KEY)!)[0].name).toBe('Viernes')
    setActivePinia(createPinia())
    expect(useTemplatesStore().templates[0]!.text).toBe('A las {hora}, {reclutas}')
  })

  it('devuelve errores en español y no guarda nada inválido', () => {
    const store = useTemplatesStore()
    expect(store.add('', 'x')).toEqual({ error: expect.stringMatching(/nombre/) })
    expect(store.add('x', '')).toEqual({ error: expect.stringMatching(/vacía/) })
    expect(store.isEmpty).toBe(true)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('edita y renombra sin chocar con otra plantilla', () => {
    const store = useTemplatesStore()
    const a = created(store.add('Uno', 'a'))
    created(store.add('Dos', 'b'))
    expect(store.update(a.id, 'Dos', 'nuevo')).toBe('')
    expect(store.byId(a.id)).toMatchObject({ name: 'Dos (2)', text: 'nuevo', createdAt: a.createdAt })
    expect(store.update('no-existe', 'x', 'y')).toMatch(/ya no existe/)
    expect(store.update(a.id, '', 'y')).toMatch(/nombre/)
  })

  it('borra y, al quedarse sin plantillas, quita la clave', () => {
    const store = useTemplatesStore()
    const a = created(store.add('Uno', 'a'))
    store.remove(a.id)
    expect(store.isEmpty).toBe(true)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('no pasa del máximo', () => {
    const store = useTemplatesStore()
    for (let i = 0; i < MAX_TEMPLATES; i++) created(store.add(`P${i}`, `t${i}`))
    expect(store.isFull).toBe(true)
    expect(store.add('Otra', 'x')).toEqual({ error: expect.stringMatching(/máximo/) })
  })

  it('basura de otra web del mismo origen se ignora y se borra', () => {
    localStorage.setItem(KEY, '{"hackeado":true}')
    const store = useTemplatesStore()
    expect(store.templates).toEqual([])
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('si el navegador no deja guardar, siguen en memoria y lo indica', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const store = useTemplatesStore()
    created(store.add('Uno', 'a'))
    expect(store.templates).toHaveLength(1)
    expect(store.persisted).toBe(false)
  })

  it('importa un archivo válido y rechaza uno que no lo es', () => {
    const store = useTemplatesStore()
    const raw = exportTemplates([{ id: 'p-1', name: 'Importada', text: 'Hola', createdAt: '', updatedAt: '' }])
    expect(store.importFrom(raw)).toMatchObject({ added: 1 })
    expect(store.templates[0]!.name).toBe('Importada')
    expect(store.importFrom(raw)).toMatchObject({ added: 0, duplicated: 1 })
    expect(() => store.importFrom(JSON.stringify({ app: EXPORT_APP }))).toThrow(TemplateImportError)
    expect(store.templates).toHaveLength(1)
  })
})
