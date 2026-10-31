import { describe, expect, it } from 'vitest'
import {
  EXPORT_APP,
  MAX_IMPORT_BYTES,
  MAX_TEMPLATES,
  MAX_TEMPLATE_NAME,
  TemplateImportError,
  cleanTemplateName,
  cleanTemplateText,
  createTemplate,
  describeImport,
  exportFileName,
  exportTemplates,
  importTemplates,
  parseTemplates,
  renderTemplate,
  serializeTemplates,
  textToTemplate,
  uniqueName,
  usedVariables,
  validateTemplateInput,
  type UserTemplate,
} from '../templates'
import { DEMO_BANNER } from '../demo'
import { POLL_BLOCK } from '../poll'
import { MAX_MESSAGE_LENGTH } from '../mission'

const NOW = new Date('2026-10-31T10:00:00.000Z')
const mk = (name: string, text: string, i = 0) => createTemplate(name, text, new Date(NOW.getTime() + i))

describe('limpieza', () => {
  it('el nombre pierde controles, saltos y bidi, y se recorta', () => {
    expect(cleanTemplateName('  Viernes\n\tnoche\u202E  ')).toBe('Viernes noche')
    expect(cleanTemplateName('x'.repeat(200))).toHaveLength(MAX_TEMPLATE_NAME)
    expect(cleanTemplateName(42)).toBe('')
  })

  it('el texto conserva saltos de línea, normaliza \\r\\n y quita controles', () => {
    expect(cleanTemplateText('Hola\r\nescuadrón\u0007\u2066  \n\n¡Ya!')).toBe('Hola\nescuadrón\n\n¡Ya!')
    expect(cleanTemplateText('a'.repeat(5000))).toHaveLength(MAX_MESSAGE_LENGTH)
    expect(cleanTemplateText(null)).toBe('')
  })

  it('valida nombre y texto con mensajes en español', () => {
    expect(validateTemplateInput('', 'texto')).toMatch(/nombre/)
    expect(validateTemplateInput('Nombre', '   ')).toMatch(/vacía/)
    expect(validateTemplateInput('Nombre', 'a'.repeat(MAX_MESSAGE_LENGTH + 1))).toMatch(/4000/)
    expect(validateTemplateInput('Nombre', 'Hola')).toBe('')
  })
})

describe('variables', () => {
  const mission = { game: 'hd2', recruits: 'Alex y Marta', time: '21:30' }

  it('rellena {juego}, {hora} y {reclutas}, y en mayúsculas sale en mayúsculas', () => {
    expect(renderTemplate('¡{RECLUTAS}! {juego} a las {hora}. {Reclutas}', mission)).toBe(
      '¡ALEX Y MARTA! Helldivers 2 a las 21:30. Alex y Marta',
    )
  })

  it('usa valores por defecto sin misión y deja intactas las llaves desconocidas', () => {
    expect(renderTemplate('{reclutas} · {hora} · {juego} · {otra}', {})).toBe(
      'escuadrón · YA MISMO · la partida · {otra}',
    )
  })

  it('juego personalizado y Monster Hunter con versión', () => {
    expect(renderTemplate('{juego}', { game: 'custom', customGameName: 'Valheim' })).toBe('Valheim')
    expect(renderTemplate('{juego}', { game: 'mh', subGame: 'Wilds' })).toBe('Monster Hunter Wilds')
  })

  it('los datos de la misión se sanean (sin comillas ni controles) y el resultado no pasa del máximo', () => {
    expect(renderTemplate('{reclutas}', { recruits: 'Ana "<b>"\u0000' })).toBe('Ana <b>')
    const long = renderTemplate(`${'x'.repeat(3990)}{reclutas}`, { recruits: 'y'.repeat(120) })
    expect(long.length).toBe(MAX_MESSAGE_LENGTH)
    expect(long.endsWith('…')).toBe(true)
  })

  it('lista las variables usadas sin repetir', () => {
    expect(usedVariables('{HORA} {reclutas} {hora} {nada}')).toEqual(['hora', 'reclutas'])
    expect(usedVariables('sin variables')).toEqual([])
  })
})

describe('textToTemplate', () => {
  const mission = { game: 'hd2', recruits: 'Alex, Marta', time: '21:30' }
  const demo = `${DEMO_BANNER}\n\n📢 ¡ATENCIÓN, ALEX, MARTA! Helldivers 2 a las 21:30, Alex, Marta.\n\n${POLL_BLOCK}`

  it('quita la marca de demo y la encuesta, y cambia los datos por variables', () => {
    expect(textToTemplate(demo, mission)).toBe('📢 ¡ATENCIÓN, {RECLUTAS}! {juego} a las {hora}, {reclutas}.')
  })

  it('sin variables deja el texto literal (pero sin marca ni encuesta)', () => {
    expect(textToTemplate(demo, mission, false)).toBe(
      '📢 ¡ATENCIÓN, ALEX, MARTA! Helldivers 2 a las 21:30, Alex, Marta.',
    )
  })

  it('la vuelta (render) reproduce el original con los mismos datos', () => {
    const template = textToTemplate(demo, mission)
    expect(renderTemplate(template, mission)).toBe(textToTemplate(demo, mission, false))
  })

  it('sin hora, el «YA MISMO» de la demo pasa a ser {hora}', () => {
    expect(textToTemplate('Despliegue a las YA MISMO', { game: 'hd2' })).toBe('Despliegue a las {hora}')
    expect(renderTemplate('Despliegue a las {HORA}', { time: '22:15' })).toBe('Despliegue a las 22:15')
  })

  it('no sustituye valores de un carácter ni el juego por defecto', () => {
    expect(textToTemplate('A la partida con A', { recruits: 'A' })).toBe('A la partida con A')
  })

  it('solo sustituye palabras completas', () => {
    expect(textToTemplate('Alex y Alexandra, ALEX', { recruits: 'Alex' })).toBe('{reclutas} y Alexandra, {RECLUTAS}')
    expect(textToTemplate('A las 21:30 o 121:305', { time: '21:30' })).toBe('A las {hora} o 121:305')
  })

  it('escapa los valores al buscarlos (no son expresiones regulares)', () => {
    expect(textToTemplate('Hola a.b y axb', { recruits: 'a.b' })).toBe('Hola {reclutas} y axb')
  })
})

describe('nombres únicos', () => {
  it('añade (2), (3)… sin distinguir mayúsculas y respeta la longitud', () => {
    const list = [mk('Viernes', 'a'), mk('viernes (2)', 'b', 1)]
    expect(uniqueName('VIERNES', list)).toBe('VIERNES (3)')
    expect(uniqueName('Otro', list)).toBe('Otro')
    expect(uniqueName('Viernes', list, list[0]!.id)).toBe('Viernes')
    expect(uniqueName('x'.repeat(60), [mk('x'.repeat(60), 'a')]).length).toBeLessThanOrEqual(MAX_TEMPLATE_NAME)
  })
})

describe('almacenamiento', () => {
  it('ida y vuelta', () => {
    const list = [mk('Uno', 'Texto {hora}'), mk('Dos', 'Otro', 1)]
    expect(parseTemplates(serializeTemplates(list))).toEqual(list)
  })

  it('sin nada guardado es lista vacía; basura ajena (no lista o JSON roto) es null', () => {
    expect(parseTemplates(null)).toEqual([])
    expect(parseTemplates('{"a":1}')).toBeNull()
    expect(parseTemplates('no es json')).toBeNull()
  })

  it('lo guardado demasiado grande (de otra web del origen) ni se analiza', () => {
    expect(parseTemplates(`[${'"x",'.repeat(200_000)}"x"]`)).toBeNull()
  })

  it('descarta entradas no válidas, ids repetidos o raros y recorta al máximo', () => {
    const good = mk('Bien', 'Texto')
    const raw = JSON.stringify([
      good,
      { ...good },
      { ...good, id: '<script>' },
      { ...good, id: 'x1', name: '' },
      { ...good, id: 'x2', createdAt: 'ayer' },
      { ...good, id: 'x3', text: 42 },
      null,
      ...Array.from({ length: 40 }, (_, i) => ({ ...good, id: `n${i}` })),
    ])
    const parsed = parseTemplates(raw)!
    expect(parsed).toHaveLength(MAX_TEMPLATES)
    expect(parsed[0]).toEqual(good)
    expect(parsed.some((t) => t.id === '<script>')).toBe(false)
  })
})

describe('exportar e importar', () => {
  it('el archivo exportado lleva solo nombre y texto, y se importa de vuelta', () => {
    const list = [mk('Uno', 'Hola {reclutas}'), mk('Dos', 'Adiós', 1)]
    const raw = exportTemplates(list, NOW)
    const data = JSON.parse(raw)
    expect(data).toMatchObject({ app: EXPORT_APP, tipo: 'plantillas', version: 1 })
    expect(data.plantillas).toEqual([
      { nombre: 'Uno', texto: 'Hola {reclutas}' },
      { nombre: 'Dos', texto: 'Adiós' },
    ])
    expect(raw).not.toContain(list[0]!.id)
    const result = importTemplates(raw, [], NOW)
    expect(result.added).toBe(2)
    expect(result.list.map((t) => t.name)).toEqual(['Uno', 'Dos'])
  })

  it('cuenta repetidas, no válidas y las que no caben; renombra choques de nombre', () => {
    const current: UserTemplate[] = [mk('Uno', 'Hola')]
    const raw = JSON.stringify({
      app: EXPORT_APP,
      tipo: 'plantillas',
      version: 1,
      plantillas: [
        { nombre: 'Uno', texto: 'Hola' },
        { nombre: 'Uno', texto: 'Distinto' },
        { nombre: '', texto: 'x' },
        { nombre: 'Sin texto' },
        'cadena',
        { nombre: 'Enorme', texto: 'x'.repeat(MAX_MESSAGE_LENGTH * 3) },
      ],
    })
    const r = importTemplates(raw, current, NOW)
    expect(r).toMatchObject({ added: 1, duplicated: 1, invalid: 4, overLimit: 0 })
    expect(r.list.map((t) => t.name)).toEqual(['Uno', 'Uno (2)'])
    expect(describeImport(r)).toBe('1 plantilla importada, 1 ya existía, 4 no válidas descartadas.')
  })

  it('respeta el máximo de plantillas', () => {
    const current = Array.from({ length: MAX_TEMPLATES - 1 }, (_, i) => mk(`P${i}`, `t${i}`, i))
    const raw = JSON.stringify({
      app: EXPORT_APP,
      tipo: 'plantillas',
      version: 1,
      plantillas: [
        { nombre: 'A', texto: 'a' },
        { nombre: 'B', texto: 'b' },
      ],
    })
    const r = importTemplates(raw, current, NOW)
    expect(r).toMatchObject({ added: 1, overLimit: 1 })
    expect(r.list).toHaveLength(MAX_TEMPLATES)
    expect(describeImport(r)).toContain('no cabía')
  })

  it('rechaza archivos que no son una exportación de la app, con el motivo en español', () => {
    const bad = (raw: string) => () => importTemplates(raw, [], NOW)
    expect(bad('{')).toThrow(TemplateImportError)
    expect(bad('{')).toThrow(/JSON válido/)
    expect(bad('[]')).toThrow(/no es una exportación/)
    expect(bad(JSON.stringify({ app: 'otra', tipo: 'plantillas', version: 1, plantillas: [] }))).toThrow(
      /no es una exportación/,
    )
    expect(bad(JSON.stringify({ app: EXPORT_APP, tipo: 'plantillas', version: 9, plantillas: [] }))).toThrow(/Versión/)
    expect(bad('x'.repeat(MAX_IMPORT_BYTES + 1))).toThrow(/demasiado grande/)
  })

  it('acepta un BOM al principio y sanea lo importado', () => {
    const raw = `\uFEFF${JSON.stringify({
      app: EXPORT_APP,
      tipo: 'plantillas',
      version: 1,
      plantillas: [{ nombre: 'Ataque\u202E', texto: '<img src=x onerror=alert(1)>\u0000' }],
    })}`
    const r = importTemplates(raw, [], NOW)
    expect(r.list[0]).toMatchObject({ name: 'Ataque', text: '<img src=x onerror=alert(1)>' })
  })

  it('nombre de archivo con la fecha', () => {
    expect(exportFileName(new Date(2026, 9, 31, 12))).toBe('squad-summoner-plantillas-2026-10-31.json')
  })
})
