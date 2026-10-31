# MEMORY.md — decisiones, trampas y estado

*Actualizado: 31/10/2026 (fase 6, v3.4.0).*

## Estado actual

- Versión **3.4.0** (servidor 1.3.0). Web Vue 3 + Vite 8 + Pinia 4, servidor opcional Express 5 + whatsapp-web.js 1.34.7.
- Publicación en GitHub Pages con Actions desde `master` (`https://bertmarti.github.io/squad-summoner-v3/`).
- **244 pruebas** Vitest 4 (lógica pura, componentes, Gemini con el SDK real y `fetch` simulado, almacenamiento,
  stores, servidor y asistente).
- CI: gitleaks, ESLint, Prettier, web en Node 20 y 22 (tipos, pruebas, builds, `npm audit`), servidor. Dependabot semanal
  con ignores.

## Decisiones (y por qué)

- **Clave de Gemini en memoria por defecto** (24/10, fase 2): todas las webs de `https://bertmarti.github.io` comparten
  origen y, por tanto, `localStorage`; un XSS en cualquiera podría leerla. Solo se guarda con la casilla «Recordar en este
  navegador» (desmarcada, con aviso del riesgo y de que se puede revocar en AI Studio). Todo acceso a almacenamiento pasa por
  `src/lib/storage.ts` con prefijo `squad-summoner-v3:`.
- **Migración de la clave antigua** (`USER_API_KEY`, sin prefijo, v3.1.0; decisión de la revisión de Fable): se usa solo
  en memoria durante esa visita, se BORRA del almacenamiento y NO se vuelve a guardar; un aviso único invita a marcar
  «Recordar» si se quiere guardar (con el aviso del riesgo).
- **Chromium del sistema** solo si `CHROMIUM_PATH` está definido o en Linux ARM; en x64/macOS se usa el Chrome de
  Puppeteer como antes. `npm run setup` lanza npm con `node $npm_execpath` (en Windows `npm.cmd` sin shell da EINVAL).
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
- Sin código muerto: fuera `vue-router`, el TTS antiguo sin interfaz, `services/generative.ts` y `stores/ui.ts`.
- **Token del servidor** (25/10, fase 3): `SERVER_TOKEN` es obligatorio cuando `HOST` no es local, con mínimo 24 caracteres;
  se genera con `npm run setup`, viaja solo como `Authorization: Bearer …` y se compara en tiempo constante (SHA-256 más
  `crypto.timingSafeEqual`). Así abrir el servidor a la red no deja el envío al grupo sin autenticación.
- **`VITE_SERVER_TOKEN` solo en `npm run dev`** (25/10, revisión cruzada): `vite.config.ts` lo anula en todo build para
  que un `dist/` servido o copiado no lleve el token; el que se pega en ⚙️ vive solo en memoria.
- **Revisión de Fable de la PR #6** (25/10): `npm run dev -- --host` con `VITE_SERVER_TOKEN` en el `.env` falla a
  propósito (el token se serviría en `/src/config.ts` a toda la wifi); para la red, `build` + `preview -- --host`.
  Límite de autenticación de 30/min antes del token. «Recordar historial» solo se activa si la clave guardada es un
  historial válido (o `[]`); la basura de otra web del origen se borra.
- **Respuestas largas de la IA** (25/10): `fitMessage` las recorta a 4000 caracteres (si no, no se podían enviar ni guardar
  en el historial); el prompt incluye `DATA_RULE` (lo entrecomillado son datos, no órdenes).
- **Tono, encuesta e historial** (25/10, fase 3): los tonos afectan a IA y demo; la encuesta es determinista y se añade
  siempre igual, para que no dependa de una respuesta de Gemini. El historial se valida al leer porque comparte el
  almacenamiento prefijado y solo se persiste con «Recordar historial».
- **Componentes con `happy-dom`** (25/10, fase 3): se usa en vez de `jsdom` porque `jsdom` 30 exige Node 22 y la Pi usa
  Node 20.
- **ESLint y Prettier** (25/10, fase 3): se incorporan al CI para detectar reglas de seguridad y formato antes de fusionar.
- **Dependencias** (25/10, fase 3): se fusionó Dependabot PR #5 (`@types/node` 24.19.2); se mantiene
  `whatsapp-web.js` 1.34.7 con Puppeteer 24.38 porque la 2.0.0-alpha es antigua. Siguen los `overrides` y las dos alertas
  altas de `extract-zip`, sin versión corregida, limitado a la descarga de Chrome al instalar. `js-beautify` de
  `@vue/test-utils` lleva `nopt` fijado a `^9` para Node 20.

- **Plantillas propias** (31/10, fase 6): se guardan en `squad-summoner-v3:plantillas` en cuanto la persona pulsa
  GUARDAR (guardarlas es justo lo que pide; no contienen claves), máximo 30. Se validan al leer y al importar porque el
  origen es compartido: ids `[a-z0-9-]`, sin controles ni bidi, límites de tamaño (500 000 caracteres guardados, 200 kB
  importados) y la basura ajena se borra. La exportación solo lleva nombre y texto. Variables `{juego}`, `{hora}`,
  `{reclutas}` (en mayúsculas, valor en mayúsculas); `textToTemplate` solo cambia palabras completas y quita la marca de
  demo y la encuesta (la encuesta se añade al usar, según la casilla). Usar una plantilla no exige elegir juego.
- **Voz con `speechSynthesis`** (31/10, fase 6): gratis y local. Se lee por frases de ≤ 220 caracteres (Chrome corta las
  locuciones largas), sin emojis ni la marca de demo. Si el navegador acepta `speak()` pero no lee (Chromium en Linux
  sin voces, como la Pi o el Chromium sin cabeza), una vigilancia de 3 s lo para y lo explica. Se eliminó
  `buildAudioPrompt`: resumir con Gemini costaría una llamada y la voz puede leer el texto tal cual.
- **`extract-zip` fuera** (31/10, fase 6): `overrides` de `@puppeteer/browsers` ^3.2.6 (descomprime con `unzip`/`tar`
  del sistema o `yauzl`, que se añade como dependencia), `archiver` ^8 y `minimatch` ^11 (solo los usa `RemoteAuth`, que
  no se usa). Probado en la Pi (Node 20.19, Chromium del sistema: arranca y carga whatsapp-web.js) y en el CI (job
  `servidor-chrome`: descarga y arranque de Chrome en x64 con Node 20 y 22). `@puppeteer/browsers` 3 declara Node ≥ 22.12
  (npm avisa con EBADENGINE en Node 20), pero funciona en 20.19 porque `require()` de módulos ES está activo desde 20.19;
  por eso el servidor y `preflight` exigen 20.19+ o 22.12+.
- **Majors de la web** (31/10, fase 6): Vite 8, Pinia 4 y `@vue/tsconfig` 0.9 funcionan con Node 20.19 y se suben.
  Vitest 5 y `npm-run-all2` 9 se probaron con Node 22 (240 pruebas y build bien) pero exigen Node 22: siguen aplazados.
  TypeScript 7 rompe `vue-tsc` 3 (ERR_PACKAGE_PATH_NOT_EXPORTED). `minimatch` ^11 y `glob` ^14 por `overrides` en la web
  (avisos moderados de ESLint y `@vue/test-utils`).

## Trampas conocidas

- La Raspberry Pi de Alberto tiene **Node 20 y npm 9**: `vitest@^4` (el 5 exige Node ≥ 22.12), `npm-run-all2@^7` (el 8+
  pide npm ≥ 10), TypeScript 5.9, Vite 7. Dependabot ignora esos majors (`.github/dependabot.yml`).
- En la Pi, compilar/probar con `nice -n 19 ionice -c3`, `NODE_OPTIONS=--max-old-space-size=1024` y `--maxWorkers=2`:
  se ha reiniciado por falta de memoria con varios builds a la vez.
- Los errores de `@google/genai` son `ApiError` con `status` numérico y el **JSON de Google en `message`**
  (`{"error":{"code":400,"status":"INVALID_ARGUMENT","details":[{"reason":"API_KEY_INVALID"}]}}`). Los fallos de red
  llegan como `TypeError` del `fetch` («Failed to fetch», «NetworkError…», «Load failed»).
- `whatsapp-web.js` 1.34.7 (la última) fija `puppeteer@24.38`: los `overrides` del servidor son los que dejan `npm
  audit` a 0. Si una actualización de `whatsapp-web.js` los rompe, el job `servidor-chrome` del CI lo detecta.
- En `happy-dom`, `setValue` en un `<input type="time">` no actualiza el `v-model`: en las pruebas, cambia la hora con
  `useMissionStore().update({ time })`.
- La herramienta Write de algunos agentes convierte `\uFEFF`, `\u202e`… en caracteres literales: revisa con
  `grep -nP '[\x{FEFF}\x{202A}-\x{202E}\x{2066}-\x{2069}]'` que el código no lleva invisibles.
- Todo `VITE_*` se incrusta en el JavaScript. `VITE_GOOGLE_API_KEY` solo para uso local (Pages falla si existe).
- Las pruebas de `server/test/` no pueden requerir dependencias del servidor (el job de la web no las instala): la lógica
  va en `server/lib/*.js` sin dependencias.
- Chromium en la Pi muestra los emojis como cuadros (no hay fuente de emojis); usa `127.0.0.1`, no `localhost`, al
  probar con Puppeteer.
- Los paneles `lore/` (radar, cola de procesos, latencia) son decorativos y simulados.
- Prettier sin punto y coma rompe manejadores de plantilla con dos sentencias (`@close="a = 1; b = 2"`): usa una función.
