/**
 * Barrera para `npm run dev`: VITE_SERVER_TOKEN (lo escribe «npm run setup») se sirve en claro dentro de
 * /src/config.ts. Si el servidor de desarrollo se abre a la red (`--host`), cualquiera de la wifi podría leerlo.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

/** `true` si el `server.host` de Vite expone el servidor de desarrollo fuera de este equipo. */
export function isOpenDevHost(host: unknown): boolean {
  if (host === true) return true
  if (typeof host !== 'string') return false
  const h = host.trim().toLowerCase()
  if (h === '') return false
  return !LOCAL_HOSTS.has(h)
}

export const DEV_TOKEN_EXPOSED_ERROR =
  'VITE_SERVER_TOKEN está en tu .env y el servidor de desarrollo se abriría a la red (--host): cualquiera de tu wifi ' +
  'podría leer el token en /src/config.ts y mandar mensajes a tu grupo. Para usar la web desde otro equipo: ' +
  '«npm run build && npm run preview -- --host» (ningún build lleva el token) y pega SERVER_TOKEN en ⚙️ CONFIGURAR API → ' +
  'Servidor. O borra VITE_SERVER_TOKEN del .env.'

/** Lanza un error si `npm run dev` se abriría a la red con el token del servidor dentro. */
export function assertDevTokenNotExposed(command: string, host: unknown, token: string | undefined): void {
  if (command === 'serve' && isOpenDevHost(host) && (token ?? '').trim() !== '') {
    throw new Error(DEV_TOKEN_EXPOSED_ERROR)
  }
}
