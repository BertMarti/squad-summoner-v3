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

**25/10/2026 · v3.3.0 (fase 3)**
- Tonos épico, cutre y pasivo-agresivo para IA y demo; encuesta determinista de asistencia con límite de 4000 caracteres.
- Historial de las 10 últimas transmisiones, recuperación, repetición y guardado opcional con nombres de reclutas.
- Deep Rock Galactic y Destiny 2 con ilustraciones propias.
- `SERVER_TOKEN` opcional en local y obligatorio al abrir el servidor a la red; `npm run setup` lo genera y la web lo envía
  en la cabecera.
- ESLint 10, Prettier 3, pruebas de componentes con `happy-dom`, CI actualizado y Dependabot PR #5 fusionada.

## ⏭️ Siguiente (prioridad alta → baja)

1. Cuando la Pi tenga Node 22: Vitest 5, Vite 8, TypeScript 7 (cuando `vue-tsc` lo soporte), Pinia 4 y quitar los
   `ignore` de `.github/dependabot.yml`.
2. Quitar los `overrides` y las altas de `extract-zip` en cuanto `whatsapp-web.js` publique una versión con Puppeteer ≥ 25.13.

## 💡 Ideas

- Plantillas propias del usuario.
- Encuesta nativa de WhatsApp enviada por el servidor (Poll de `whatsapp-web.js`).
- Más juegos siguiendo la skill `anadir-juego`.
- Voz: leer la transmisión con TTS (`buildAudioPrompt` sigue en `src/lib/prompts.ts`).
