import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ENV_API_KEY } from '@/config'
import { STORAGE_KEYS, readStored, removeStored, takeLegacyApiKey, writeStored } from '@/lib/storage'

/** De dónde sale la clave que se está usando. */
export type ApiKeySource = 'env' | 'recordada' | 'sesion' | 'ninguna'

/**
 * API key de Gemini del usuario.
 * - Por defecto vive SOLO en memoria (se olvida al cerrar o recargar la pestaña).
 * - Solo se guarda en localStorage (con prefijo) si la persona marca «Recordar en este navegador».
 * - La clave antigua sin prefijo (v3.1.0) se respeta como «recordada»: se mueve a la clave con prefijo
 *   y se borra la antigua; la interfaz avisa una vez del riesgo y de cómo dejar de recordarla.
 */
export const useApiKeyStore = defineStore('apiKey', () => {
  let remembered = readStored(STORAGE_KEYS.apiKey)?.trim() || ''
  const legacy = takeLegacyApiKey()
  /** `true` si se ha migrado la clave antigua: la interfaz avisa una vez del riesgo de recordarla. */
  let migrated = false
  if (legacy && !remembered && writeStored(STORAGE_KEYS.apiKey, legacy)) {
    remembered = legacy
    migrated = true
  }

  const userKey = ref(remembered || legacy)
  const remember = ref(Boolean(remembered))
  const migratedLegacy = ref(migrated)

  const effectiveKey = computed(() => ENV_API_KEY || userKey.value)
  const hasKey = computed(() => Boolean(effectiveKey.value))
  const source = computed<ApiKeySource>(() => {
    if (ENV_API_KEY) return 'env'
    if (!userKey.value) return 'ninguna'
    return remember.value ? 'recordada' : 'sesion'
  })

  /** Usa la clave; con `rememberIt` la guarda en este navegador, si no la borra del almacenamiento. */
  function setKey(key: string, rememberIt: boolean) {
    const clean = key.trim()
    userKey.value = clean
    remember.value = rememberIt && Boolean(clean)
    if (remember.value) remember.value = writeStored(STORAGE_KEYS.apiKey, clean)
    else removeStored(STORAGE_KEYS.apiKey)
    migratedLegacy.value = false
  }

  /** Olvida la clave en memoria y en el almacenamiento. */
  function clearKey() {
    setKey('', false)
  }

  return { userKey, remember, migratedLegacy, effectiveKey, hasKey, source, setKey, clearKey }
})
