/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { assertDevTokenNotExposed } from './scripts/devHost.ts'

/** Nombre del repo: base de la web en GitHub Pages (https://bertmarti.github.io/squad-summoner-v3/). */
const PAGES_BASE = '/squad-summoner-v3/'

/** Inserta una Content-Security-Policy en el index.html compilado (no en desarrollo, para no romper el HMR). */
function contentSecurityPolicy(connectSrc: string[]): Plugin {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    // Sin 'unsafe-inline': todas las webs de bertmarti.github.io comparten origen. Los estilos dinámicos de Vue
    // (:style) usan CSSOM, que la CSP permite; los atributos style="" escritos en las plantillas no.
    "style-src 'self'",
    "font-src 'self'",
    "img-src 'self' data:",
    `connect-src 'self' https://generativelanguage.googleapis.com ${connectSrc.join(' ')}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ')
  return {
    name: 'squad-summoner-csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
    ],
  }
}

/** Impide `npm run dev -- --host` con VITE_SERVER_TOKEN en el .env (el token se leería desde la wifi). */
function devTokenGuard(token: string | undefined): Plugin {
  return {
    name: 'squad-summoner-dev-token-guard',
    config(cfg, { command }) {
      assertDevTokenNotExposed(command, cfg.server?.host, token)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isPages = env.VITE_DEPLOY_TARGET === 'pages'

  // Barrera: una clave de API jamás debe acabar en la web pública.
  if (isPages && command === 'build' && env.VITE_GOOGLE_API_KEY) {
    throw new Error(
      'VITE_GOOGLE_API_KEY está definida en una compilación para GitHub Pages: se publicaría la clave. Quítala.',
    )
  }

  const serverUrl = (env.VITE_SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '')

  return {
    base: isPages ? PAGES_BASE : '/',
    // El token del servidor solo se incrusta con «npm run dev» (servido en este equipo). Ningún build (ni Pages ni
    // uno local que alguien pueda servir o copiar) lo lleva dentro: ahí se pega en ⚙️ CONFIGURAR API → Servidor.
    define: command === 'build' ? { 'import.meta.env.VITE_SERVER_TOKEN': '""' } : {},
    plugins: [
      devTokenGuard(env.VITE_SERVER_TOKEN),
      vue(),
      command === 'serve' ? vueDevTools() : null,
      contentSecurityPolicy(isPages ? [] : [serverUrl]),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/__tests__/*.test.ts', 'scripts/__tests__/*.test.ts', 'server/**/*.test.js'],
      exclude: ['**/node_modules/**'],
    },
  }
})
