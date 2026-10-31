# AGENTS.md — Squad Summoner v3

Guía para agentes de IA (Claude Code, OpenCode, Codex…). Léela entera antes de tocar código.

## Qué es

Web en Vue 3 que genera **convocatorias épicas para jugar** (Helldivers 2, Space Marine 2, Monster Hunter, Deep Rock
Galactic, Destiny 2 o un juego personalizado; tono épico, cutre o pasivo-agresivo) con Google Gemini y permite copiarlas,
compartirlas por WhatsApp (`wa.me`) o, con el servidor local opcional (`server/`, Express + whatsapp-web.js), enviarlas
automáticamente a un grupo. Sin API key funciona en
**modo demo** con plantillas locales marcadas. La persona puede guardar sus **plantillas propias** (con variables,
exportables a JSON) y escuchar la transmisión con **LEER EN VOZ ALTA** (Web Speech API del navegador). Publicada en <https://bertmarti.github.io/squad-summoner-v3/>.

## Estructura

- `src/App.vue` — flujo principal (generar, demo, compartir, enviar, estados).
- `src/components/panels/` — paneles funcionales; `src/components/lore/` — paneles decorativos; `ConfigModal.vue`.
- `src/lib/` — **lógica pura con pruebas** (`mission`, `prompts`, `demo`, `tones`, `poll`, `history`, `templates`, `speech`, `whatsapp`, `gemini`, `geminiErrors`,
  `storage`).
- `src/services/whatsappServer.ts` — llamada al servidor. `src/composables/useGemini.ts` — lista `GAMES` y generación;
  `src/composables/useSpeech.ts` — lectura en voz alta.
- `src/stores/` — Pinia (`mission` es la única fuente de verdad del formulario; `apiKey`, `history`, `templates` y `serverToken` gestionan
  su estado).
- `src/config.ts` — variables `VITE_*`. `public/games/*.svg` — ilustraciones propias.
- `server/index.js` + `server/lib/security.js` + `server/lib/token.js` — servidor de WhatsApp. Pruebas en `server/test/`.
- `src/components/__tests__/` — pruebas de componentes con `happy-dom`.
- `docs/DESARROLLO.md` — documentación técnica completa. `README.md` — solo para usuarios (nada técnico).

## Comandos exactos

```sh
npm ci                     # instalar la web
npm --prefix server ci     # instalar el servidor (opcional)
npm run dev                # desarrollo en http://localhost:5173
npm test                   # vitest (web + servidor)
npm run type-check         # vue-tsc --build
npm run lint               # ESLint
npm run format:check       # comprobar Prettier
npm run build              # tipos + build
npm run build:pages        # build de GitHub Pages (base /squad-summoner-v3/)
npm run server             # servidor de WhatsApp (pide QR; no lo arranques sin permiso)
npm run setup              # asistente de instalación y creación segura de .env
npm run server:grupos      # QR, lista de grupos y elección del grupo destino
```

Despliegue: automático con `.github/workflows/pages.yml` al hacer push a `master`.

## Convenciones

- Vue 3 con `<script setup lang="ts">`, props y emits tipados; nada de `any` evitable.
- La lógica nueva va en `src/lib/` (funciones puras) con prueba en `src/lib/__tests__/`.
- Textos de la interfaz en **español de España**, mayúsculas «tácticas» en títulos y botones, tono de lore con humor.
- Paleta: fondo `#05080c`, paneles `#0d121d`, acento `#ffbd00`, terminal `#4db8ff`; fuente Chakra Petch. Usa las
  variables CSS de `src/assets/main.css` (hay modo claro con `.light-mode`).
- Accesibilidad: botones reales (`<button type="button">`), `<label for>`, `aria-*`, foco visible, estados de carga/error
  en regiones `role="status"`/`role="alert"`. **Prohibido `alert()`, `v-html` e `innerHTML`.**
- CSP: no uses `style="..."` en plantillas; `style-src` no permite `unsafe-inline`.
- No uses `localStorage` fuera de `src/lib/storage.ts`; todas sus claves llevan el prefijo `squad-summoner-v3:`.
- El texto del modo demo siempre empieza por `DEMO_BANNER` (`src/lib/demo.ts`).
- Commits pequeños en español.

## Seguridad y privacidad (obligatorio)

- **Nunca** subas claves: ni en git ni en variables `VITE_*` de un build publicado (todo `VITE_*` acaba en el bundle).
  `build:pages` falla si existe `VITE_GOOGLE_API_KEY`.
- La API key vive en memoria por defecto. Solo se persiste si la persona marca «Recordar en este navegador».
- El token del servidor solo viaja en la cabecera `Authorization: Bearer …`, nunca en la URL ni se persiste en el navegador.
- El historial solo se guarda si se marca «Recordar historial en este navegador»; por defecto vive en memoria.
- Las plantillas se guardan al pulsar GUARDAR (`squad-summoner-v3:plantillas`) y se validan al leer e importar: el texto
  de una plantilla o de un JSON importado es de terceros; muéstralo siempre con interpolación, nunca como HTML.
- No subas `.env` ni `server/.wwebjs_auth/` (sesión de WhatsApp). Están en `.gitignore`.
- Usa datos de ejemplo: IPs tipo `192.168.1.50`, IDs de grupo tipo `123456789-123456@g.us`, nombres ficticios.
- El servidor escucha en `127.0.0.1` con CORS de lista blanca; no quites la validación. Con `HOST` de red exige
  `SERVER_TOKEN` (no arranca sin él). `VITE_SERVER_TOKEN` solo llega a `npm run dev`: ningún build lo incrusta.
- Los enlaces externos llevan `rel="noopener noreferrer"`. Si añades un dominio externo, actualiza la CSP en `vite.config.ts`.

## Antes de dar algo por terminado

```sh
npm run lint && npm run format:check && npm run type-check && npm test && npm run build:pages
```

Y, si tocaste la interfaz, sirve `dist/` bajo `/squad-summoner-v3/` y compruébalo a 390 px y 1366 px de ancho.
