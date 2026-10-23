---
name: anadir-juego
description: Añadir un juego nuevo a Squad Summoner (tarjeta, ilustración, prompt de Gemini, plantillas del modo demo y pruebas).
---

# Añadir un juego

Ejemplo: añadir Deep Rock Galactic con id `drg`. Los ids son cortos, en minúsculas y sin espacios.

1. **Id válido** — `src/lib/mission.ts`: añade `'drg'` a `GAME_IDS`. (El tipo `GameId` se actualiza solo.)
2. **Tarjeta** — `src/composables/useGemini.ts`: añade a `GAMES`
   `{ id: 'drg', title: 'Deep Rock Galactic', icon: '⛏️', img: asset('drg.svg') }`.
3. **Ilustración propia** — `public/games/drg.svg`: SVG abstracto (sin logos ni arte oficial), `viewBox="0 0 300 160"`,
   menos de 4 KB, colores del juego sobre fondo oscuro. Valida con
   `python3 -c "import xml.dom.minidom;xml.dom.minidom.parse('public/games/drg.svg')"`.
4. **Prompt** — `src/lib/prompts.ts`: añade una rama `if (data.game === 'drg') { … }` con ROL, OBJETIVO (usa
   `"${recruits}"` y `${time}`), INSTRUCCIONES de tono y CIERRE, imitando las existentes.
5. **Modo demo** — `src/lib/demo.ts`: añade `drg: [ (r, t) => \`…\` ]` a `DEMO_TEMPLATES` (1-2 plantillas, con `r` y `t`).
   TypeScript obliga a hacerlo: `DEMO_TEMPLATES` es `Record<GameId, …>`.
6. **Pruebas** — en `src/lib/__tests__/prompts.test.ts` un caso que compruebe el prompt del juego; el test de demo ya
   recorre todas las plantillas.
7. Comprueba: `npm run type-check && npm test && npm run build:pages` y mira la tarjeta a 390 px (la rejilla es
   `auto-fit`, con 5 juegos debe seguir viéndose bien).
8. Añade el juego a la tabla «¿Para qué sirve?» del README y una línea en CHANGELOG.md.
