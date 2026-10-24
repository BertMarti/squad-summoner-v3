# AGENTS.md — Squad Summoner v3

Guía para agentes de IA (Claude Code, OpenCode, Codex…). Léela entera antes de tocar código.

## Qué es

Web en Vue 3 que genera **convocatorias épicas para jugar** (Helldivers 2, Space Marine 2, Monster Hunter o un juego
personalizado) con Google Gemini y permite copiarlas, compartirlas por WhatsApp (`wa.me`) o, con el servidor local
opcional (`server/`, Express + whatsapp-web.js), enviarlas automáticamente a un grupo. Sin API key funciona en
**modo demo** con plantillas locales marcadas. Publicada en <https://bertmarti.github.io/squad-summoner-v3/>.

## Estructura

- `src/App.vue` — flujo principal (generar, demo, compartir, enviar, estados).
- `src/components/panels/` — paneles funcionales; `src/components/lore/` — paneles decorativos; `ConfigModal.vue`.
- `src/lib/` — **lógica pura con pruebas** (`mission`, `prompts`, `demo`, `whatsapp`).
- `src/services/whatsappServer.ts` — llamada al servidor. `src/composables/useGemini.ts` — Gemini y lista `GAMES`.
- `src/stores/` — Pinia (`mission` es la única fuente de verdad del formulario).
- `src/config.ts` — variables `VITE_*`. `public/games/*.svg` — ilustraciones propias.
- `server/index.js` + `server/lib/security.js` — servidor de WhatsApp. Pruebas en `server/test/`.
- `docs/DESARROLLO.md` — documentación técnica completa. `README.md` — solo para usuarios (nada técnico).

## Comandos exactos

```sh
npm ci                     # instalar la web
npm --prefix server ci     # instalar el servidor (opcional)
npm run dev                # desarrollo en http://localhost:5173
npm test                   # vitest (web + servidor)
npm run type-check         # vue-tsc --build
npm run build              # tipos + build
npm run build:pages        # build de GitHub Pages (base /squad-summoner-v3/)
npm run server             # servidor de WhatsApp (pide QR; no lo arranques sin permiso)
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
- El texto del modo demo siempre empieza por `DEMO_BANNER` (`src/lib/demo.ts`).
- Commits pequeños en español.

## Seguridad y privacidad (obligatorio)

- **Nunca** subas claves: ni en git ni en variables `VITE_*` de un build publicado (todo `VITE_*` acaba en el bundle).
  `build:pages` falla si existe `VITE_GOOGLE_API_KEY`.
- No subas `.env` ni `server/.wwebjs_auth/` (sesión de WhatsApp). Están en `.gitignore`.
- Usa datos de ejemplo: IPs tipo `192.168.1.50`, IDs de grupo tipo `123456789-123456@g.us`, nombres ficticios.
- El servidor escucha en `127.0.0.1` con CORS de lista blanca; no lo abras a `0.0.0.0` ni quites la validación.
- Los enlaces externos llevan `rel="noopener noreferrer"`. Si añades un dominio externo, actualiza la CSP en `vite.config.ts`.

## Antes de dar algo por terminado

```sh
npm run type-check && npm test && npm run build:pages
```

Y, si tocaste la interfaz, sirve `dist/` bajo `/squad-summoner-v3/` y compruébalo a 390 px y 1366 px de ancho.
