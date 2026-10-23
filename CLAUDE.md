# CLAUDE.md

Lee y sigue **[AGENTS.md](AGENTS.md)**: estructura, comandos, convenciones y reglas de seguridad del proyecto.

Específico de Claude Code:

- Subagentes del repo en `.claude/agents/`: `revisor-seguridad` (antes de abrir una PR) y `probador-ui` (tras cambios de interfaz).
- Skills en `.claude/skills/`: `publicar-pages` (comprobar y publicar la web) y `anadir-juego` (añadir un juego nuevo).
- Comprobaciones rápidas: `npx vue-tsc --build` y `npx vitest run`.
- **No ejecutes `npm run server`** sin permiso explícito: abre una sesión real de WhatsApp con QR.
- Decisiones y trampas conocidas en [MEMORY.md](MEMORY.md); hoja de ruta en [PLAN.md](PLAN.md). Actualízalos si cambias algo importante.
