# MEMORY.md — decisiones, trampas y estado

*Actualizado: 24/10/2026.*

## Estado actual

- Versión **3.1.0**. Web Vue 3 + Vite 7 + Pinia, servidor opcional Express 5 + whatsapp-web.js.
- Publicación en GitHub Pages con Actions desde `master` (`https://bertmarti.github.io/squad-summoner-v3/`).
- 49 pruebas Vitest 4 (lógica pura, servicio del servidor, stores, errores de Gemini y seguridad del servidor).
- CI: gitleaks, tipos, pruebas, builds, `npm audit`. Dependabot semanal.

## Decisiones (y por qué)

- **Modo demo marcado** en vez de una clave compartida: la web pública no puede llevar claves. Sin clave se usan
  plantillas locales (`src/lib/demo.ts`) siempre con la cabecera `DEMO_BANNER`.
- **BYOK**: en Pages cada persona pega su clave de Gemini; se guarda en `localStorage` y la llamada va directa a Google.
- **Compartir con `wa.me`**: permite usar WhatsApp sin servidor. «Enviar al grupo» solo aparece fuera de Pages.
- **Ilustraciones SVG propias** (`public/games/`) en lugar de imágenes de Steam/Unsplash enlazadas: sin derechos de
  terceros, sin depender de CDNs y con una CSP estricta (`img-src 'self' data:`).
- **Servidor**: escucha en `127.0.0.1`, CORS con lista blanca, validación, límite de 16 kB y 10 envíos/min. Antes tenía
  CORS abierto: cualquier web visitada podía mandar mensajes a tu grupo.
- **CSP solo en el build** (plugin en `vite.config.ts`) para no romper el HMR de desarrollo.
- **Modelo por defecto `gemini-2.5-flash`**, configurable con `VITE_GEMINI_MODEL` (`gemini-2.0-flash` está en retirada).
- Se borró `src/components/_archived/` (duplicados antiguos que rompían `vue-tsc`; siguen en el historial de git).
- Se quitó el botón de TTS de la cabecera: no estaba conectado a nada.

## Trampas conocidas

- La Raspberry Pi de Alberto tiene **Node 20 y npm 9**: por eso `vitest@^4` (el 5 exige Node ≥ 22.12) y `npm-run-all2@^7`
  (el 8 pide npm ≥ 10). El npm 9 de Debian falla con `Cannot read properties of null (reading 'edgesOut')` al *añadir*
  vitest 4; se resolvió generando el lockfile con `npx npm@10 install`. `npm ci` con npm 9 funciona bien.
- Los errores del SDK de Gemini incluyen la URL (`…:generateContent: [404 Not Found] …`): los patrones de
  `friendlyGeminiError` van anclados a `[NNN ` para no confundir «generateContent» con «rate».

- **Bug corregido**: `App.vue` enlazaba el formulario a un `reactive` local, pero generaba con `missionStore.mission`,
  que nunca se rellenaba → la IA recibía siempre datos vacíos. Ahora el store es la única fuente de verdad.
- Todo `VITE_*` se incrusta en el JavaScript. `VITE_GOOGLE_API_KEY` solo para uso local.
- `npm audit` del servidor: quedan **11 vulnerabilidades altas transitivas** de `puppeteer@24.38` (fijado por
  `whatsapp-web.js@1.34.7`): `basic-ftp`, `extract-zip`, `zod` vía `chromium-bidi`/`proxy-agent`. Afectan a la descarga
  de navegadores y proxies de Puppeteer, no a la API. No hay arreglo compatible; el CI solo falla con críticas.
- `@google/generative-ai` está obsoleto (sucesor: `@google/genai`); sigue funcionando.
- `useGemini` conserva `summarizeForAudio`/`generateAudio` (TTS) aunque la interfaz no los usa.
- Las capturas con Chromium en la Raspberry Pi muestran los emojis como cuadros (no hay fuente de emojis instalada).
- Los paneles `lore/` (radar, cola de procesos, latencia) son decorativos y simulados.
