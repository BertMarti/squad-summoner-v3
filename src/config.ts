/**
 * Configuración de la app leída de variables VITE_* en tiempo de compilación.
 *
 * ⚠️ Todo lo que empieza por VITE_ acaba DENTRO del JavaScript publicado.
 * Nunca pongas VITE_GOOGLE_API_KEY en una compilación que vayas a publicar
 * (GitHub Pages lo impide: ver vite.config.ts).
 */

/** `true` en la versión publicada en GitHub Pages (sin servidor de WhatsApp). */
export const IS_STATIC_DEMO = import.meta.env.VITE_DEPLOY_TARGET === 'pages'

/** URL del servidor local que envía los mensajes a WhatsApp. */
export const SERVER_URL = (import.meta.env.VITE_SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '')

/** Modelo de Gemini para generar el texto. */
export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'

/**
 * Token del servidor de WhatsApp (SERVER_TOKEN) para la web local; lo escribe «npm run setup» como VITE_SERVER_TOKEN.
 * Solo llega con «npm run dev»: vite.config.ts lo anula en TODO build (Pages o local), donde se pega a mano.
 */
export const ENV_SERVER_TOKEN = IS_STATIC_DEMO ? '' : (import.meta.env.VITE_SERVER_TOKEN || '').trim()

/** Clave incrustada en la compilación (solo para uso local; vacía en Pages). */
export const ENV_API_KEY = IS_STATIC_DEMO ? '' : (import.meta.env.VITE_GOOGLE_API_KEY || '').trim()
