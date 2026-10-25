import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ENV_SERVER_TOKEN } from '@/config'

/**
 * Token del servidor de WhatsApp (SERVER_TOKEN).
 * - El que pega la persona vive SOLO en memoria (nunca se guarda en el navegador).
 * - Si no pega ninguno, se usa el de la compilación local (VITE_SERVER_TOKEN, lo escribe «npm run setup»).
 */
export const useServerTokenStore = defineStore('serverToken', () => {
  const userToken = ref('')
  const effectiveToken = computed(() => userToken.value || ENV_SERVER_TOKEN)
  const source = computed<'manual' | 'env' | 'ninguno'>(() =>
    userToken.value ? 'manual' : ENV_SERVER_TOKEN ? 'env' : 'ninguno',
  )

  function setToken(value: string) {
    userToken.value = value.trim()
  }

  return { userToken, effectiveToken, source, setToken }
})
