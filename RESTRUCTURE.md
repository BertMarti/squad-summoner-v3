Project Restructure Notes
=========================

Summary
-------
This repository was reorganized to improve maintainability and scalability. The main goals were:

- Group components by responsibility (panels, layout, lore, common)
- Introduce Pinia stores for shared state (terminal logs, process queue, mission, ui)
- Add `services/` for API wrappers and `types/` for shared TS interfaces
- Keep changes incremental and safe (small patches, update imports)

Key folders
-----------
- `src/components/panels/`: core UI panels (TerminalOutput, MissionControls, GameSelector, AppHeader)
- `src/components/lore/`: lore-themed panels (MissionLog, IntelTicker, SquadRoster, CommPanel, ActionQueue, ProcessManager, MiniRadar)
- `src/components/common/`: place for small reusable components (buttons, icons)
- `src/stores/`: Pinia stores (`terminal.ts`, `processQueue.ts`, `mission.ts`, `ui.ts`)
- `src/services/`: API/service wrappers (e.g. `generative.ts`)
- `src/types/`: shared TypeScript types (LogEntry, ProcessItem, Mission)

Next steps
----------
1. Move remaining reusable components into `components/common/` and create barrels.
2. Migrate `terminalText` into `terminal` store for single source of truth and update `TerminalOutput` to read from it.
3. Create services for other external integrations (whatsapp/email) under `services/`.
4. Add ESLint + Prettier + Husky to enforce code style and pre-commit checks.
5. Add unit tests for stores and services.

If you want, I can continue applying these next steps in small commits.

Update 2026-10-24 (v3.1.0)
--------------------------
- `src/components/_archived/` was removed (duplicates that broke `vue-tsc`; still available in git history).
- Pure logic now lives in `src/lib/` (mission, prompts, demo, whatsapp) with tests in `src/lib/__tests__/`.
- `src/services/whatsappServer.ts` wraps the server call; `src/config.ts` reads the `VITE_*` variables.
- Step 2 above is superseded: the `mission` store is the single source of truth for the form.
- Current technical documentation: `docs/DESARROLLO.md` (Spanish).
