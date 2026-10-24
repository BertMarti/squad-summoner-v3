# Guía de desarrollo — Squad Summoner v3

Todo lo técnico del proyecto: instalación, variables, scripts, arquitectura, servidor de WhatsApp, pruebas y despliegue.
Para la explicación de usuario, vuelve al [README](../README.md).

## Stack

| Parte | Tecnología |
|---|---|
| Web («Centro de Mando») | Vue 3 (`<script setup lang="ts">`) · TypeScript 5.9 · Vite 7 · Pinia 3 |
| IA | Google Gemini con `@google/genai` (modelo por defecto `gemini-2.5-flash`) |
| Servidor («Torre de Comunicaciones», opcional) | Node.js · Express 5 · whatsapp-web.js (Puppeteer) · qrcode-terminal · dotenv · cors |
| Pruebas | Vitest 4 (entorno `node`; Vitest 5 exige Node ≥ 22.12) |
| CI/CD | GitHub Actions: `ci.yml` (gitleaks, matriz Node 20/22, tipos, pruebas, build, audit) y `pages.yml` (GitHub Pages) |

## Requisitos

- Node.js `^20.19.0` o `>=22.12.0` (lo pide Vite 7).
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
│   │   ├── mission.ts          # Saneado de campos, hora HH:MM, ids de juego
│   │   ├── prompts.ts          # Prompts por juego
│   │   ├── demo.ts             # Plantillas del modo demo (con cabecera DEMO)
│   │   └── whatsapp.ts         # Enlace wa.me y validación del mensaje
│   ├── services/whatsappServer.ts # POST /send-mission con timeout y errores claros
│   ├── stores/                 # Pinia: apiKey, mission, terminal, processQueue
│   └── types/index.ts
├── public/games/*.svg          # Ilustraciones propias de cada juego
├── server/
│   ├── index.js                # Express + whatsapp-web.js
│   ├── lib/security.js         # Validación, CORS, cabeceras y limitador (puro, con pruebas)
│   ├── lib/preflight.js        # Comprobaciones previas y mensajes en español
│   ├── lib/chromium.js         # Detección de Chromium del sistema
│   ├── lib/whatsappClient.js   # Cliente y ayuda del QR
│   ├── lib/envFile.js          # Leer/editar .env sin imprimir valores
│   ├── lib/terminalText.js     # Sanea nombres de grupos antes de imprimirlos
│   ├── grupos.js               # Vincula, lista grupos y guarda WHATSAPP_GROUP_ID
│   └── test/                   # security.test.js y setup.test.js
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
- `express.json({ limit: '16kb' })`; el mensaje debe ser texto, se eliminan los caracteres de control (salvo saltos de línea y tabuladores) y debe tener de 1 a 4000 caracteres.
- Limitador: 10 envíos por minuto e IP (`429` con `Retry-After`).
- Cabeceras `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, CSP `default-src 'none'`; sin `X-Powered-By`.
- Errores genéricos al cliente (sin trazas). `GET /health` devuelve el estado de WhatsApp.
- `WHATSAPP_GROUP_ID` se valida al arrancar.
- Puppeteer se lanza con `--no-sandbox` porque es necesario en algunos Linux/Docker; quítalo si tu sistema lo permite.
- `whatsapp-web.js` 1.34.7 fija Puppeteer 24.38. Los *overrides* fijan `basic-ftp` 6.2.3 y `zod` 4.6.7: las
  vulnerabilidades altas transitivas pasan de 11 a 5. Las restantes son de `extract-zip`, sin versión corregida; solo se
  usa al descargar Chrome durante la instalación y no se ejecuta cuando se usa Chromium del sistema.

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
2. **Web**: matriz Node 20 y 22, `npm ci`, `type-check`, `test`, `build-only`, `build:pages`, búsqueda de claves en `dist/` y `npm audit --audit-level=high`.
3. **Servidor**: `npm ci --ignore-scripts`, `node --check` y `npm audit --audit-level=critical` (ver vulnerabilidades conocidas
   en [MEMORY.md](../MEMORY.md)).

Dependabot (`.github/dependabot.yml`) propone cada semana actualizaciones agrupadas de la web, del servidor y de las acciones.
En la web ignora los saltos mayores de Vitest, TypeScript, Vite, el plugin de Vue, Pinia, `@vue/tsconfig`, `npm-run-all2`
y los tipos de Node; agrupa solo menores y parches. La PR #2 del servidor se fusionó y la PR #3 de la web, con esos majors,
se cerró; los menores se aplicaron manualmente.

## Más documentación

- [CHANGELOG.md](../CHANGELOG.md) — historial de versiones.
- [RESTRUCTURE.md](../RESTRUCTURE.md) — notas de la reestructuración de la v3.0.
- [AGENTS.md](../AGENTS.md) — guía para agentes de IA. [PLAN.md](../PLAN.md) — hoja de ruta.
- [SECURITY.md](../SECURITY.md) — cómo avisar de vulnerabilidades.
