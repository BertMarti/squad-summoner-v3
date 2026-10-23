# Guía de desarrollo — Squad Summoner v3

Todo lo técnico del proyecto: instalación, variables, scripts, arquitectura, servidor de WhatsApp, pruebas y despliegue.
Para la explicación de usuario, vuelve al [README](../README.md).

## Stack

| Parte | Tecnología |
|---|---|
| Web («Centro de Mando») | Vue 3 (`<script setup lang="ts">`) · TypeScript 5.9 · Vite 7 · Pinia 3 |
| IA | Google Gemini con `@google/generative-ai` (modelo por defecto `gemini-2.5-flash`) |
| Servidor («Torre de Comunicaciones», opcional) | Node.js · Express 5 · whatsapp-web.js (Puppeteer) · qrcode-terminal · dotenv · cors |
| Pruebas | Vitest 4 (entorno `node`; vitest 5 exige Node ≥ 22.12) |
| CI/CD | GitHub Actions: `ci.yml` (gitleaks, tipos, pruebas, build, audit) y `pages.yml` (GitHub Pages) |

## Requisitos

- Node.js `^20.19.0` o `>=22.12.0` (lo pide Vite 7).
- Una API key de Gemini de [Google AI Studio](https://aistudio.google.com/apikey) si quieres usar la IA (sin ella hay modo demo).
- Para el servidor: una cuenta de WhatsApp en el móvil y un sistema donde Puppeteer pueda lanzar Chromium.

## Instalación

```sh
git clone https://github.com/BertMarti/squad-summoner-v3.git
cd squad-summoner-v3
npm ci                 # web
cd server && npm ci    # servidor de WhatsApp (opcional)
cd ..
cp .env.example .env   # y rellénalo
```

## Variables de entorno (`.env` en la raíz)

El servidor y la web leen el mismo `.env` de la raíz. Plantilla completa en [`.env.example`](../.env.example).

| Variable | Quién la usa | Para qué |
|---|---|---|
| `VITE_GOOGLE_API_KEY` | web | Clave de Gemini incrustada (solo para uso local; opcional, también se puede pegar en la app). |
| `VITE_SERVER_URL` | web | URL del servidor de WhatsApp (por defecto `http://localhost:3000`). |
| `VITE_GEMINI_MODEL` | web | Modelo de Gemini (por defecto `gemini-2.5-flash`). |
| `VITE_DEPLOY_TARGET` | web | `pages` al compilar para GitHub Pages (lo pone `npm run build:pages`). |
| `WHATSAPP_GROUP_ID` | servidor | ID del grupo destino, formato `123456789-123456@g.us`. Obligatoria. |
| `PORT` | servidor | Puerto (por defecto `3000`). |
| `HOST` | servidor | Interfaz de escucha (por defecto `127.0.0.1`; `0.0.0.0` lo expone a tu red). |
| `ALLOWED_ORIGINS` | servidor | Orígenes web permitidos por CORS, separados por comas (por defecto los de Vite en localhost). |

> ⚠️ **Todo lo que empieza por `VITE_` acaba dentro del JavaScript compilado.** No pongas `VITE_GOOGLE_API_KEY` en una
> compilación que vayas a publicar: `vite.config.ts` hace fallar `build:pages` si la detecta, y el CI busca claves
> `AIza…` en `dist/`. En la web publicada cada persona pega su propia clave y se guarda en `localStorage`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite en <http://localhost:5173> (con Vue DevTools). |
| `npm run build` | `type-check` + `build-only` en paralelo. |
| `npm run build-only` | `vite build` a `dist/` (base `/`). |
| `npm run build:pages` | Build para GitHub Pages: base `/squad-summoner-v3/`, sin clave y sin botón de envío al servidor. |
| `npm run type-check` | `vue-tsc --build` (app, configuración de Vite y pruebas). |
| `npm test` / `npm run test:watch` | Vitest una vez / en modo vigilancia. |
| `npm run preview` | Sirve `dist/` con Vite. |
| `npm run server` | Arranca el servidor de WhatsApp (`server/index.js`). |

## Arquitectura

```txt
/
├── index.html                  # Entrada de Vite (CSP inyectada en el build)
├── vite.config.ts              # Base de Pages, CSP, barrera de claves y config de Vitest
├── src/
│   ├── App.vue                 # Orquesta el flujo: generar, demo, compartir, enviar, estados
│   ├── config.ts               # Lee VITE_* (IS_STATIC_DEMO, SERVER_URL, GEMINI_MODEL, ENV_API_KEY)
│   ├── components/
│   │   ├── panels/             # AppHeader, GameSelector, MissionControls, TerminalOutput
│   │   ├── lore/               # Paneles decorativos: registro, teletipo, escuadrón, radar…
│   │   └── ConfigModal.vue     # Diálogo accesible para la API key
│   ├── composables/useGemini.ts# Llamadas a Gemini, lista GAMES, errores en español
│   ├── lib/                    # Lógica pura y probada
│   │   ├── mission.ts          # Saneado de campos, hora HH:MM, ids de juego
│   │   ├── prompts.ts          # Prompts por juego
│   │   ├── demo.ts             # Plantillas del modo demo (con cabecera DEMO)
│   │   └── whatsapp.ts         # Enlace wa.me y validación del mensaje
│   ├── services/
│   │   ├── whatsappServer.ts   # POST /send-mission con timeout y errores claros
│   │   └── generative.ts       # Envoltorio de useGemini
│   ├── stores/                 # Pinia: mission, terminal, processQueue, ui
│   └── types/index.ts
├── public/games/*.svg          # Ilustraciones propias de cada juego
├── server/
│   ├── index.js                # Express + whatsapp-web.js
│   ├── lib/security.js         # Validación, CORS, cabeceras y limitador (puro, con pruebas)
│   └── test/security.test.js
└── .github/                    # CI, Pages y Dependabot
```

### Flujo de datos

```txt
Usuario elige juego + reclutas + hora ──► store `mission` (Pinia, única fuente de verdad)
                                              │
              ┌───────────────────────────────┴───────────────────────────────┐
              ▼                                                               ▼
   ¿Hay API key? ── sí ──► useGemini → Gemini (desde el navegador)     no ──► lib/demo (plantillas locales)
              │                                                               │
              └──────────────► TerminalOutput muestra la transmisión ◄────────┘
                                              │
         ┌────────────────────┬───────────────┴──────────────────────────┐
         ▼                    ▼                                          ▼
     📋 Copiar        🟢 wa.me/?text=… (sin servidor)     📲 POST /send-mission → server/index.js
                                                          → whatsapp-web.js → grupo WHATSAPP_GROUP_ID
                                                          (solo en local; oculto en GitHub Pages)
```

La generación con IA ocurre **en el navegador**; el servidor solo envía mensajes a WhatsApp.

## Servidor de WhatsApp

```sh
npm run server          # o: cd server && npm start
```

1. La primera vez aparece un **código QR** en la terminal: escanéalo desde WhatsApp → *Dispositivos vinculados*.
2. Cuando veas `✅ Cliente WhatsApp LISTO`, el botón **📲 ENVIAR AL GRUPO** de la web (en `npm run dev`) funciona.
3. La sesión se guarda en `server/.wwebjs_auth/` (ignorada por git: **contiene tu sesión de WhatsApp, no la compartas**).

**Cómo obtener el ID del grupo**: en WhatsApp Web abre el grupo y busca en las herramientas de desarrollo un id que
termine en `@g.us`, o añade temporalmente en `server/index.js`, dentro de `client.on('ready')`, un
`(await client.getChats()).filter(c => c.isGroup).forEach(c => console.log(c.name, c.id._serialized))` y bórralo después.

### Seguridad del servidor

- Escucha en `127.0.0.1` por defecto (`HOST`).
- CORS con lista blanca (`ALLOWED_ORIGINS`, sin distinguir mayúsculas); además `createOriginGuard` rechaza con 403
  las peticiones con `Origin` no permitido **antes** del limitador, para que una web ajena no gaste el cupo de envíos.
- `express.json({ limit: '16kb' })`; el mensaje debe ser texto, se eliminan los caracteres de control (salvo saltos de línea y tabuladores) y debe tener de 1 a 4000 caracteres.
- Limitador: 10 envíos por minuto e IP (`429` con `Retry-After`).
- Cabeceras `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, CSP `default-src 'none'`; sin `X-Powered-By`.
- Errores genéricos al cliente (sin trazas). `GET /health` devuelve el estado de WhatsApp.
- `WHATSAPP_GROUP_ID` se valida al arrancar.
- Puppeteer se lanza con `--no-sandbox` porque es necesario en algunos Linux/Docker; quítalo si tu sistema lo permite.

## Pruebas

```sh
npm test
```

- `src/lib/__tests__/` — saneado, prompts, demo y wa.me.
- `src/services/__tests__/` — envío al servidor (con `fetch` simulado).
- `src/stores/__tests__/`, `src/composables/__tests__/` — stores de Pinia y traducción de errores de Gemini.
- `server/test/` — validación, CORS, cabeceras y limitador del servidor.

## Despliegue en GitHub Pages

- `.github/workflows/pages.yml` se ejecuta en cada push a `master` (y a mano con *workflow_dispatch*): `npm run build:pages`,
  comprueba que no hay claves, copia `index.html` a `404.html` y publica con `actions/deploy-pages`.
- URL: <https://bertmarti.github.io/squad-summoner-v3/>. En el repositorio, *Settings → Pages → Source* debe ser
  **GitHub Actions**.
- La versión publicada usa `IS_STATIC_DEMO`: muestra el aviso de demo y oculta «Enviar al grupo».
- El HTML compilado lleva una `Content-Security-Policy` (`script-src 'self'`, `connect-src` solo a Gemini y al servidor
  local en builds locales). En desarrollo no se aplica para no romper el HMR.

Comprobación local con el prefijo:

```sh
npm run build:pages
mkdir -p /tmp/pages && rm -rf /tmp/pages/squad-summoner-v3 && cp -r dist /tmp/pages/squad-summoner-v3
python3 -m http.server 8080 --directory /tmp/pages   # abre http://localhost:8080/squad-summoner-v3/
```

## CI

`.github/workflows/ci.yml` (push a `master`, PR y manual), con `permissions: contents: read`:

1. **gitleaks** (binario oficial verificado con su suma) sobre todo el historial y el árbol.
2. **Web**: `npm ci`, `type-check`, `test`, `build-only`, `build:pages`, búsqueda de claves en `dist/` y `npm audit --audit-level=high`.
3. **Servidor**: `npm ci --ignore-scripts`, `node --check` y `npm audit --audit-level=critical` (ver vulnerabilidades conocidas
   en [MEMORY.md](../MEMORY.md)).

Dependabot (`.github/dependabot.yml`) propone cada semana actualizaciones agrupadas de la web, del servidor y de las acciones.

## Más documentación

- [CHANGELOG.md](../CHANGELOG.md) — historial de versiones.
- [RESTRUCTURE.md](../RESTRUCTURE.md) — notas de la reestructuración de la v3.0.
- [AGENTS.md](../AGENTS.md) — guía para agentes de IA. [PLAN.md](../PLAN.md) — hoja de ruta.
- [SECURITY.md](../SECURITY.md) — cómo avisar de vulnerabilidades.
