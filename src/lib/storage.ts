/**
 * Almacenamiento del navegador con prefijo del proyecto.
 *
 * ⚠️ Todas las webs de https://bertmarti.github.io comparten ORIGEN: su localStorage es común. Por eso:
 *  - todas las claves llevan el prefijo `squad-summoner-v3:`;
 *  - la API key de Gemini NO se guarda por defecto (solo vive en memoria mientras la pestaña está abierta);
 *    únicamente se persiste si la persona marca «Recordar en este navegador» tras leer el aviso del riesgo.
 * Todas las operaciones van en try/catch: en modo privado o con el almacenamiento bloqueado la app sigue funcionando.
 */

export const STORAGE_PREFIX = 'squad-summoner-v3:'

export const STORAGE_KEYS = {
  theme: 'tema',
  apiKey: 'gemini-api-key',
  welcomeSeen: 'bienvenida-vista',
  /** Historial de transmisiones: SOLO si la persona marca «Recordar historial». */
  history: 'historial',
  /** Plantillas propias: se guardan cuando la persona pulsa GUARDAR (no contienen claves). */
  templates: 'plantillas',
} as const

export type StorageName = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** Clave antigua (v3.1.0, sin prefijo) donde se guardaba la API key siempre. */
export const LEGACY_API_KEY = 'USER_API_KEY'

function store(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function readStored(name: StorageName): string | null {
  try {
    return store()?.getItem(STORAGE_PREFIX + name) ?? null
  } catch {
    return null
  }
}

export function writeStored(name: StorageName, value: string): boolean {
  try {
    const s = store()
    if (!s) return false
    s.setItem(STORAGE_PREFIX + name, value)
    return true
  } catch {
    return false
  }
}

export function removeStored(name: StorageName): void {
  try {
    store()?.removeItem(STORAGE_PREFIX + name)
  } catch {
    /* almacenamiento bloqueado: nada que borrar */
  }
}

/**
 * Lee y BORRA la clave de la v3.1.0 (guardada sin prefijo). El store la usa solo en memoria durante esta
 * visita: no se vuelve a guardar salvo que la persona marque «Recordar en este navegador».
 */
export function takeLegacyApiKey(): string {
  try {
    const s = store()
    if (!s) return ''
    const legacy = (s.getItem(LEGACY_API_KEY) || '').trim()
    s.removeItem(LEGACY_API_KEY)
    return legacy
  } catch {
    return ''
  }
}
