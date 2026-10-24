# PLAN.md — hoja de ruta

## ✅ Hecho

**24/10/2026 · v3.1.0** — auditoría npm, servidor endurecido, bug del formulario vacío, 49 pruebas, modo demo, `wa.me`,
accesibilidad y móvil, GitHub Pages con CSP, CI con gitleaks, Dependabot, README de usuario y docs.

**24/10/2026 · v3.2.0 (fase 2)**
- Migración a `@google/genai` con errores en español, «PROBAR CLAVE» y SDK cargado bajo demanda.
- Clave en memoria por defecto y «Recordar» opcional (origen compartido de `bertmarti.github.io`); CSP sin `unsafe-inline`.
- Primera visita guiada, ayuda contextual y estado claro de la IA.
- `npm run setup` y `npm run server:grupos`; comprobaciones previas del servidor; Chromium del sistema en Raspberry Pi.
- Servidor: 11 → 5 vulnerabilidades altas transitivas con `overrides`. Dependabot: #2 fusionada, #3 cerrada con ignores.
- Decidido el TTS: se elimina el código muerto (queda como idea).

## ⏭️ Siguiente (prioridad alta → baja)

1. Cuando la Pi tenga Node 22: Vitest 5, Vite 8, TypeScript 7 (cuando `vue-tsc` lo soporte), Pinia 4 y quitar los
   `ignore` de `.github/dependabot.yml`.
2. Quitar los `overrides` y las altas de `extract-zip` en cuanto `whatsapp-web.js` publique una versión con Puppeteer ≥ 25.13.
3. ESLint + Prettier y paso de lint en el CI.
4. Pruebas de componentes con `@vue/test-utils` + `jsdom` (WelcomeGuide, ConfigModal, GameSelector, TerminalOutput).
5. Token opcional entre web y servidor (`SERVER_TOKEN`) para quien abra el servidor a la red local.

## 💡 Ideas

- Más juegos (Deep Rock Galactic, Destiny 2…) siguiendo la skill `anadir-juego`.
- Plantillas propias del usuario y elegir el tono (épico, cutre, pasivo-agresivo).
- Historial de transmisiones (en memoria o con «recordar») y botón «repetir la última».
- Encuesta rápida de asistencia en el mensaje (✅ voy / ❌ no puedo).
- Voz: leer la transmisión con TTS (`buildAudioPrompt` sigue en `src/lib/prompts.ts`).
