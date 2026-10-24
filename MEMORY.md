# MEMORY.md — decisiones, trampas y estado

*Actualizado: 24/10/2026 (fase 2).*

## Estado actual

- Versión **3.2.0**. Web Vue 3 + Vite 7 + Pinia 3, servidor opcional Express 5 + whatsapp-web.js 1.34.7.
- Publicación en GitHub Pages con Actions desde `master` (`https://bertmarti.github.io/squad-summoner-v3/`).
- 81 pruebas Vitest 4 (lógica pura, Gemini con el SDK real y `fetch` simulado, almacenamiento, stores, servidor y asistente).
- CI: gitleaks, web en Node 20 y 22 (tipos, pruebas, builds, `npm audit`), servidor. Dependabot semanal con ignores.

## Decisiones (y por qué)

- **Clave de Gemini en memoria por defecto** (24/10, fase 2): todas las webs de `https://bertmarti.github.io` comparten
  origen y, por tanto, `localStorage`; un XSS en cualquiera podría leerla. Solo se guarda con la casilla «Recordar en este
  navegador» (desmarcada, con aviso del riesgo y de que se puede revocar en AI Studio). Todo acceso a almacenamiento pasa por
  `src/lib/storage.ts` con prefijo `squad-summoner-v3:`.
- **Migración de la clave antigua** (`USER_API_KEY`, sin prefijo, v3.1.0): quien la tenía guardada la eligió guardar, así
  que se mueve a la clave con prefijo como «recordada», se borra la antigua y se avisa una vez.
- **`@google/genai`** sustituye a `@google/generative-ai` (obsoleto). Se importa de forma diferida (`import()` en
  `src/lib/gemini.ts`): la primera visita y el modo demo no descargan los ~400 kB del SDK.
- **«PROBAR CLAVE» con `GET models/<modelo>`**: valida clave y modelo sin gastar cuota de generación.
- **CSP sin `'unsafe-inline'`** en `style-src`: nada de `style="…"` en plantillas (los `:style` de Vue usan CSSOM y la CSP
  los permite, pero se han quitado igualmente); fuente con `@fontsource` (sin Google Fonts). Sin service workers.
- **Modo demo marcado** en vez de una clave compartida; **compartir con `wa.me`** (sin servidor); **ilustraciones SVG
  propias**; **CSP solo en el build** (no rompe el HMR); modelo por defecto `gemini-2.5-flash` (`VITE_GEMINI_MODEL`).
- **Servidor**: escucha en `127.0.0.1`, CORS con lista blanca + 403 por `Origin` antes del limitador, 16 kB, 10 envíos/min.
- **Configuración guiada**: `npm run setup` y `npm run server:grupos` en vez de pasos manuales; `server/lib/preflight.js`
  explica en español lo que falta antes de cargar dependencias.
- **Chromium del sistema en Linux ARM** (Raspberry Pi): Puppeteer no publica Chrome para arm64. `setup` instala con
  `PUPPETEER_SKIP_DOWNLOAD=true` y escribe `CHROMIUM_PATH`. Probado en la Pi: el QR sale con `/usr/bin/chromium`.
- **`overrides` en `server/package.json`** (`basic-ftp` 6.2.3, `zod` 4.6.7): solo los usan rutas que este servidor no
  recorre (proxy PAC por FTP y WebDriver BiDi); comprobado que Puppeteer arranca y genera el QR con ellos.
- Sin código muerto: fuera `vue-router`, el TTS sin interfaz, `services/generative.ts` y `stores/ui.ts`.

## Trampas conocidas

- La Raspberry Pi de Alberto tiene **Node 20 y npm 9**: `vitest@^4` (el 5 exige Node ≥ 22.12), `npm-run-all2@^7` (el 8+
  pide npm ≥ 10), TypeScript 5.9, Vite 7. Dependabot ignora esos majors (`.github/dependabot.yml`).
- En la Pi, compilar/probar con `nice -n 19 ionice -c3`, `NODE_OPTIONS=--max-old-space-size=1024` y `--maxWorkers=2`:
  se ha reiniciado por falta de memoria con varios builds a la vez.
- Los errores de `@google/genai` son `ApiError` con `status` numérico y el **JSON de Google en `message`**
  (`{"error":{"code":400,"status":"INVALID_ARGUMENT","details":[{"reason":"API_KEY_INVALID"}]}}`). Los fallos de red
  llegan como `TypeError` del `fetch` («Failed to fetch», «NetworkError…», «Load failed»).
- `whatsapp-web.js` 1.34.7 (la última) fija `puppeteer@24.38`: quedan **5 altas transitivas** de `extract-zip` (sin
  versión corregida; solo se usa al descargar Chrome al instalar, y con Chromium del sistema ni se ejecuta). El CI del
  servidor solo falla con críticas.
- Todo `VITE_*` se incrusta en el JavaScript. `VITE_GOOGLE_API_KEY` solo para uso local (Pages falla si existe).
- Las pruebas de `server/test/` no pueden requerir dependencias del servidor (el job de la web no las instala): la lógica
  va en `server/lib/*.js` sin dependencias.
- Chromium en la Pi muestra los emojis como cuadros (no hay fuente de emojis); usa `127.0.0.1`, no `localhost`, al
  probar con Puppeteer.
- Los paneles `lore/` (radar, cola de procesos, latencia) son decorativos y simulados.
