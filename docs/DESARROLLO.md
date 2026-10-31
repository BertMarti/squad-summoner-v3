# Guía de desarrollo — Squad Summoner v3

Todo lo técnico del proyecto: instalación, variables, scripts, arquitectura, servidor de WhatsApp, pruebas y despliegue.
Para la explicación de usuario, vuelve al [README](../README.md).

## Stack

| Parte | Tecnología |
|---|---|
| Web («Centro de Mando») | Vue 3 (`<script setup lang="ts">`) · TypeScript 5.9 · Vite 8 · Pinia 4 |
| IA | Google Gemini con `@google/genai` (modelo por defecto `gemini-2.5-flash`) |
| Servidor («Torre de Comunicaciones», opcional) | Node.js · Express 5 · whatsapp-web.js (Puppeteer) · qrcode-terminal · dotenv · cors |
| Pruebas | Vitest 4 (entorno `node`; componentes en `happy-dom`; Vitest 5 exige Node ≥ 22.12) |
| CI/CD | GitHub Actions: `ci.yml` (gitleaks, matriz Node 20/22, lint, formato, tipos, pruebas, build, audit) y `pages.yml` (GitHub Pages) |

## Requisitos

- Node.js 20.19 o posterior de la serie 20, o 22.12 o posterior (`^20.19.0 || >=22.12.0`; lo piden Vite 8 y el servidor).
- Una API key de Gemini de [Google AI Studio](https://aistudio.google.com/apikey) si quieres usar la IA (sin ella hay modo demo).
- Para el servidor: una cuenta de WhatsApp en el móvil y un sistema donde Puppeteer pueda lanzar Chromium.

## Instalación

```sh
git clone https://github.com/BertMarti/squad-summoner-v3.git
cd squad-summoner-v3
npm ci                 # web
npm run setup          # comprueba requisitos, instala y crea .env
npm run server:grupos  # opcional: vincula WhatsApp y elige el grupo
```

Si instalas el servidor a mano en Linux ARM (Raspberry Pi) en vez de con `npm run setup`, evita que Puppeteer descargue
un Chrome x64 que no sirve (~170 MB) y usa el Chromium del sistema (`sudo apt install chromium`):

```sh
cd server && PUPPETEER_SKIP_DOWNLOAD=1 npm ci
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
| `SERVER_TOKEN` | servidor | Token opcional para autorizar el envío; obligatorio si `HOST` no es local y debe tener al menos 24 caracteres. |
| `VITE_SERVER_TOKEN` | web | Token que la web envía en `Authorization: Bearer`. Solo con `npm run dev` en local: `vite.config.ts` lo anula en todo build (Pages o local) y `npm run dev -- --host` falla si está definido (`scripts/devHost.ts`). En la red: `npm run build && npm run preview -- --host` (puerto 4173, `ALLOWED_ORIGINS=http://192.168.1.50:4173`) y el token se pega en ⚙️ → Servidor, solo en memoria. |
| `CHROMIUM_PATH` | servidor | Ruta al Chromium/Chrome del sistema; necesaria en Linux ARM como Raspberry Pi. |

> ⚠️ **Todo lo que empieza por `VITE_` acaba dentro del JavaScript compilado.** No pongas `VITE_GOOGLE_API_KEY` en una
> compilación que vayas a publicar: `vite.config.ts` hace fallar `build:pages` si la detecta, y el CI busca claves
> `AIza…` en `dist/`. En la web publicada cada persona pega su propia clave: por defecto vive en memoria y solo se guarda
> con la casilla «Recordar en este navegador». Todas las webs de `bertmarti.github.io` comparten ese origen.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite en <http://localhost:5173> (con Vue DevTools). |
| `npm run build` | `type-check` + `build-only` en paralelo. |
| `npm run build-only` | `vite build` a `dist/` (base `/`). |
| `npm run build:pages` | Build para GitHub Pages: base `/squad-summoner-v3/`, sin clave y sin botón de envío al servidor. |
| `npm run type-check` | `vue-tsc --build` (app, configuración de Vite y pruebas). |
| `npm test` / `npm run test:watch` | Vitest una vez / en modo vigilancia. |
| `npm run lint` / `npm run lint:fix` | Comprueba / corrige ESLint para Vue, TypeScript y reglas de seguridad. |
| `npm run format` / `npm run format:check` | Formatea / comprueba el formato con Prettier. |
| `npm run preview` | Sirve `dist/` con Vite. |
| `npm run server` | Arranca el servidor de WhatsApp (`server/index.js`). |
| `npm run setup` | Comprueba Node/npm, instala dependencias, crea `.env` con permisos 600 y prepara Chromium/servidor opcional. |
| `npm run server:grupos` | Escanea el QR, lista los grupos y guarda el grupo elegido en `.env`. |

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
│   │   ├── ConfigModal.vue     # Diálogo accesible para la API key
│   │   ├── WelcomeGuide.vue    # Guía de primera visita
│   │   └── HelpTip.vue         # Ayuda contextual de cada sección
│   ├── composables/useGemini.ts# Lista GAMES y coordinación de generación
│   ├── lib/                    # Lógica pura y probada
│   │   ├── gemini.ts           # Cliente @google/genai, timeout 45 s y validación GET
│   │   ├── geminiErrors.ts     # Clasificación de ApiError y mensajes en español
│   │   ├── storage.ts          # localStorage con prefijo y migración de USER_API_KEY
│   │   ├── mission.ts          # Saneado de campos, hora HH:MM, ids y títulos de juego
│   │   ├── prompts.ts          # Prompts por juego
│   │   ├── demo.ts             # Plantillas del modo demo (con cabecera DEMO)
│   │   ├── tones.ts            # Tonos de generación y demo
│   │   ├── poll.ts             # Encuesta determinista de asistencia
│   │   ├── history.ts          # Modelo y almacenamiento del historial
│   │   └── whatsapp.ts         # Enlace wa.me y validación del mensaje
│   ├── services/whatsappServer.ts # POST /send-mission con timeout y errores claros
│   ├── stores/                 # Pinia: apiKey, mission, terminal, processQueue, history, serverToken
│   └── types/index.ts
├── public/games/*.svg          # Ilustraciones propias de cada juego
├── server/
│   ├── index.js                # Express + whatsapp-web.js
│   ├── lib/security.js         # Validación, CORS, cabeceras y limitador (puro, con pruebas)
│   ├── lib/token.js            # SERVER_TOKEN: cabecera Bearer, tiempo constante, guardia y generación
│   ├── lib/preflight.js        # Comprobaciones previas y mensajes en español
│   ├── lib/chromium.js         # Detección de Chromium del sistema
│   ├── lib/whatsappClient.js   # Cliente y ayuda del QR
│   ├── lib/envFile.js          # Leer/editar .env sin imprimir valores
│   ├── lib/terminalText.js     # Sanea nombres de grupos antes de imprimirlos
│   ├── grupos.js               # Vincula, lista grupos y guarda WHATSAPP_GROUP_ID
│   └── test/                   # security.test.js, token.test.js y setup.test.js
├── scripts/setup.mjs           # Asistente `npm run setup`
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

1. La primera vez aparece un **código QR** en la terminal: WhatsApp → *Ajustes* → *Dispositivos vinculados* → *Vincular un dispositivo*.
2. Cuando veas `✅ WhatsApp listo`, el botón **📲 ENVIAR AL GRUPO** de la web (en `npm run dev`) funciona.
3. La sesión se guarda en `server/.wwebjs_auth/` (ignorada por git: **contiene tu sesión de WhatsApp, no la compartas**).

**Cómo obtener el ID del grupo**: ejecuta `npm run server:grupos`, escanea el QR, elige uno de los grupos listados y el
comando guardará `WHATSAPP_GROUP_ID` en `.env`. Los nombres se sanean antes de mostrarlos en la terminal.

### Seguridad del servidor

- Escucha en `127.0.0.1` por defecto (`HOST`).
- CORS con lista blanca (`ALLOWED_ORIGINS`, sin distinguir mayúsculas); además `createOriginGuard` rechaza con 403
  las peticiones con `Origin` no permitido **antes** del limitador, para que una web ajena no gaste el cupo de envíos.
- Si existe `SERVER_TOKEN`, se exige `Authorization: Bearer …`; la comparación usa SHA-256 y `crypto.timingSafeEqual`.
  El orden (`createSendMissionGuards`) es **Origin (403) → límite de autenticación 30/min (429) → token (401) → límite de
  envíos 10/min**: la fuerza bruta contra el token está limitada y los intentos fallidos no gastan el cupo de envíos.
- Si `HOST` no es local, el servidor no arranca sin un `SERVER_TOKEN` de al menos 24 caracteres. `npm run setup` lo genera
  junto a `VITE_SERVER_TOKEN` sin mostrarlo; nunca se acepta el token en la URL.
- `express.json({ limit: '16kb' })`; el mensaje debe ser texto, se eliminan los caracteres de control (salvo saltos de línea y tabuladores) y debe tener de 1 a 4000 caracteres.
- Limitador: 10 envíos por minuto e IP (`429` con `Retry-After`).
- Cabeceras `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, CSP `default-src 'none'`; sin `X-Powered-By`.
- Errores genéricos al cliente (sin trazas). `GET /health` devuelve el estado de WhatsApp.
- `WHATSAPP_GROUP_ID` se valida al arrancar.
- Puppeteer se lanza con `--no-sandbox` porque es necesario en algunos Linux/Docker; quítalo si tu sistema lo permite.
- `whatsapp-web.js` 1.34.7 fija Puppeteer 24.38. Los *overrides* de `server/package.json` dejan `npm audit` a 0:
  `@puppeteer/browsers` ^3.2.6 (ya no usa `extract-zip`; descomprime Chrome con `unzip`/`tar` del sistema o con `yauzl`,
  dependencia directa), `archiver` ^8 y `minimatch` ^11 en `readdir-glob` (solo para `RemoteAuth`, que no se usa),
  `basic-ftp` ^6.2.3 y `zod` ^4.6.6. `@puppeteer/browsers` 3 declara Node ≥ 22.12 pero funciona con 20.19 (`require()`
  de módulos ES): npm muestra un aviso EBADENGINE en Node 20 que se puede ignorar. El job `servidor-chrome` del CI
  descarga y arranca Chrome con Node 20 y 22 (`server/scripts/comprobar-chrome.js`).

### Seguridad de la clave y del navegador

- La API key no se persiste por defecto: vive en memoria y desaparece al cerrar o recargar. Solo `src/lib/storage.ts`
  accede a `localStorage`, siempre con el prefijo `squad-summoner-v3:` y únicamente tras marcar «Recordar en este
  navegador».
- Todas las webs de `bertmarti.github.io` comparten origen y, por tanto, almacenamiento. La antigua `USER_API_KEY` se
  usa solo en memoria durante esa visita, se borra y no se vuelve a guardar; un aviso único invita a marcar «Recordar».
- `@google/genai` envía la clave en `x-goog-api-key`; las peticiones tienen un máximo de 45 segundos. «PROBAR CLAVE» usa
  `GET models/<modelo>` y no genera contenido ni gasta cuota.
- La CSP compilada usa `style-src 'self'` y `font-src 'self'`, sin `unsafe-inline`; Chakra Petch se sirve desde
  `@fontsource`. No hay service workers.

## Pruebas

```sh
npm test
```

- `src/lib/__tests__/` — saneado, prompts, demo, wa.me, tonos, encuesta, historial, juegos nuevos, plantillas
  (variables, conversión, validación, exportar/importar) y voz (texto para leer, voz española, trozos, `useSpeech`).
- `src/components/__tests__/` — WelcomeGuide, ConfigModal, GameSelector, TerminalOutput, MissionControls,
  TransmissionHistory, TemplatesPanel, SpeechControls y App (flujo completo), con `happy-dom` (cada archivo declara `// @vitest-environment happy-dom`).
- `src/services/__tests__/` — envío al servidor (con `fetch` simulado).
- `src/stores/__tests__/`, `src/composables/__tests__/` — stores de Pinia y traducción de errores de Gemini.
- `server/test/` — validación, CORS, cabeceras, limitador, token y asistente del servidor.
- Total actual: **244** pruebas.

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
2. **Web**: matriz Node 20 y 22, `npm ci`, `lint`, `format:check`, `type-check`, `test`, `build-only`, `build:pages`, búsqueda de claves en `dist/` y `npm audit --audit-level=high`.
3. **Servidor**: `npm ci --ignore-scripts`, `node --check` y `npm audit --audit-level=high`.
4. **Servidor · Chrome** (Node 20 y 22): `npm ci` con descarga de Chrome y `node scripts/comprobar-chrome.js` (lo arranca
   sin cabeza y carga `whatsapp-web.js`), para vigilar los *overrides* de Puppeteer.

Dependabot (`.github/dependabot.yml`) propone cada semana actualizaciones agrupadas de la web, del servidor y de las acciones.
En la web ignora los saltos mayores de Vitest y `npm-run-all2` (exigen Node 22), TypeScript (no compatible con `vue-tsc`)
y los tipos de Node (Vite 8, Pinia 4 y `@vue/tsconfig` 0.9 se migraron en la 3.4.0); agrupa solo menores y parches. La PR #2 del servidor se fusionó y la PR #3 de la web, con esos majors,
se cerró; los menores se aplicaron manualmente.

El reformateo está en un commit separado listado en `.git-blame-ignore-revs`; para ignorarlo al usar blame:
`git config blame.ignoreRevsFile .git-blame-ignore-revs`.

## Más documentación

- [CHANGELOG.md](../CHANGELOG.md) — historial de versiones.
- [RESTRUCTURE.md](../RESTRUCTURE.md) — notas de la reestructuración de la v3.0.
- [AGENTS.md](../AGENTS.md) — guía para agentes de IA. [PLAN.md](../PLAN.md) — hoja de ruta.
- [SECURITY.md](../SECURITY.md) — cómo avisar de vulnerabilidades.
