# PLAN.md — hoja de ruta

## ✅ Hecho (24/10/2026, v3.1.0)

- Auditoría npm (web a 0 vulnerabilidades), servidor endurecido (CORS, validación, límites, cabeceras, 127.0.0.1).
- Bug del formulario vacío corregido; lógica extraída a `src/lib` con 49 pruebas Vitest.
- Modo demo, compartir por `wa.me`, estados de carga/error sin `alert()`, modal accesible, móvil y modo claro AA.
- GitHub Pages con CSP y barrera de claves; CI con gitleaks; Dependabot; licencia MIT; README de usuario y docs.

## ⏭️ Siguiente (prioridad alta → baja)

1. Migrar de `@google/generative-ai` (obsoleto) a `@google/genai`.
2. Actualizar `whatsapp-web.js` en cuanto use un Puppeteer sin vulnerabilidades (revisar PRs de Dependabot).
3. Decidir el TTS: conectarlo (botón de escuchar la transmisión) o eliminar el código muerto de `useGemini`.
4. ESLint + Prettier y paso de lint en el CI.
5. Pruebas de componentes con `@vue/test-utils` + `jsdom` (GameSelector, ConfigModal, TerminalOutput).
6. Token opcional entre web y servidor (`SERVER_TOKEN`) para quien abra el servidor a la red local.

## 💡 Ideas

- Más juegos (Deep Rock Galactic, Destiny 2…) siguiendo la skill `anadir-juego`.
- Plantillas propias del usuario y elegir el tono (épico, cutre, pasivo-agresivo).
- Historial de transmisiones en el navegador y botón «repetir la última».
- Encuesta rápida de asistencia en el mensaje (✅ voy / ❌ no puedo).
