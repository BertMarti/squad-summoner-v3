# CLAUDE.md

Lee y sigue **[AGENTS.md](AGENTS.md)**: estructura, comandos, convenciones y reglas de seguridad del proyecto.

Específico de Claude Code:

- Subagentes del repo en `.claude/agents/`: `revisor-seguridad` (antes de abrir una PR) y `probador-ui` (tras cambios de interfaz).
- Skills en `.claude/skills/`: `publicar-pages` (comprobar y publicar la web) y `anadir-juego` (añadir un juego nuevo).
- Comprobaciones rápidas: `npx vue-tsc --build` y `npx vitest run`.
- Comandos de configuración: `npm run setup` y `npm run server:grupos` (este último vincula WhatsApp y elige el grupo).
- **No ejecutes `npm run server`** sin permiso explícito: abre una sesión real de WhatsApp con QR.
- No uses `localStorage` fuera de `src/lib/storage.ts`, ni `style="..."` o `v-html`; respeta la CSP y el prefijo
  `squad-summoner-v3:`. No persistas la API key sin la casilla «Recordar en este navegador».
- Decisiones y trampas conocidas en [MEMORY.md](MEMORY.md); hoja de ruta en [PLAN.md](PLAN.md). Actualízalos si cambias algo importante.
