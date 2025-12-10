# Changelog — Squad Summoner v3.0

Todos los cambios notables del proyecto están documentados en este archivo.

---

## [3.0.0] — 2025-12-10 (Refactor & Restructure)

### 🔥 **Cambios Mayores**

#### Reestructuración de Componentes
- **Creación de carpetas temáticas:**
  - `src/components/panels/` — Componentes UI principales (AppHeader, GameSelector, MissionControls, TerminalOutput)
  - `src/components/lore/` — Paneles lore-friendly (MissionLog, IntelTicker, SquadRoster, CommPanel, ActionQueue, ProcessManager, MiniRadar)
  - `src/components/common/` — Placeholder para componentes comunes reutilizables (futuro)
  - `src/components/layout/` — Placeholder para componentes de layout globales (futuro)

#### Implementación de Pinia State Management
- **Creación de stores centralizados en `src/stores/`:**
  - `terminal.ts` — Maneja `terminalText`, `logLines` y métodos `setText()`, `addLog()`
  - `processQueue.ts` — Gestiona colas de procesos con `enqueue()` y `cancel()`
  - `mission.ts` — Estado reactivo de misión
  - `ui.ts` — Control de tema (dark/light)
- Eliminación de estado local duplicado en `App.vue`
- Pinia registrado en `main.ts` con `createPinia()`

#### Creación de Capas de Servicios
- `src/services/generative.ts` — Wrapper para `useGemini` composable (futura abstracción)
- `src/types/index.ts` — Interfaces compartidas: `LogEntry`, `ProcessItem`, `Mission`

#### Barrels (Index Exports)
- `src/components/panels/index.ts` — Exporta: AppHeader, GameSelector, MissionControls, TerminalOutput
- `src/components/lore/index.ts` — Exporta: MissionLog, IntelTicker, SquadRoster, CommPanel, ActionQueue, ProcessManager, MiniRadar

#### Limpieza de Duplicados
- Movimiento de archivos duplicados de `src/components/` a `src/components/_archived/` (respaldo seguro)
- Eliminación de ambigüedades en imports

#### Correcciones CSS (TerminalOutput)
- Panel terminal con altura fija (600px)
- `.terminal-body` con `flex: 1` y `min-height: 0` para permitir scroll interno
- Propiedades `overflow-y: auto`, `word-break: break-word`, `overflow-wrap: break-word`
- Terminal ahora mantiene tamaño constante sin expandirse cuando se agregan logs

### ✅ **Completado**
- Integración de componentes lore en `App.vue`
- Actualización de handlers para usar `terminalStore.addLog()`
- Migración de `processQueue` a store
- Actualización de `MissionLog.vue` para leer desde `terminal.ts` store
- `ProcessManager.vue` integrado con `processQueue` store
- Validación TypeScript correcta (sin implicit-any errors)

### 📝 **Documentación**
- Creación de `RESTRUCTURE.md` con detalles de la reestructuración
- Este `CHANGELOG.md` (versión 3.0)

### 🎯 **Próximos Pasos (Recomendados)**
- [ ] Migrar `terminalText` completamente al store (setter en terminal.ts)
- [ ] Crear barrel `src/components/index.ts` para re-exportar panels y lore
- [ ] Agregar ESLint y Prettier
- [ ] Implementar tests unitarios (Vitest)
- [ ] Documentar composables (useGemini)

---

## [2.5.0] — 2025-12 (Adición de Paneles Lore)

### 🎭 **Nuevos Componentes**
- `MissionLog.vue` — Visualización de logs en tiempo real
- `IntelTicker.vue` — Panel informativo con ticker de noticias lore
- `SquadRoster.vue` — Listado visual de escuadrón
- `CommPanel.vue` — Panel de comunicaciones (basado en lore)
- `ActionQueue.vue` — Cola de acciones del sistema
- `ProcessManager.vue` — Gestor visual de procesos
- `MiniRadar.vue` — Mini radar táctico

### 📐 **Arquitectura**
- Integración de paneles en `App.vue` bajo MissionControls y TerminalOutput
- Emisión de eventos desde componentes hacia contenedor principal

### 🐛 **Fixes**
- Corrección del comportamiento del TerminalOutput (altura fija, scroll interno)

---

## [2.0.0] — 2025-11 (Refactor Inicial)

### 🔧 **Cambios Estructurales**
- Migración a estructura de carpetas por categoría
- Introducción de concepto de "panels" vs "lore" components
- Preparación para state management (Pinia)

### 📦 **Dependencias**
- Adición de Pinia (state management)
- Mantenimiento de vite-plugin-vue-devtools

---

## [1.0.0] — 2025-10 (Lanzamiento Inicial)

### 🚀 **Primer Release**
- Sistema base de Squad Summoner v3 con Vue 3
- Interfaz de selección de juegos
- Integración básica con Google Gemini
- Terminal visual para logs
- Envío de mensajes a WhatsApp (backend Node.js)
- Soporte para múltiples juegos con roleplay:
  - Helldivers 2
  - Space Marine 2
  - Monster Hunter
  - Custom/Libre

### 🎨 **UI/UX**
- Tema Cyberpunk/Militar
- Selector de tema (Claro/Oscuro)
- Panel de configuración para API Key
- Control TTS (síntesis de voz)

### 🔐 **Seguridad**
- Gestión de API Key en .env
- Validación de entrada en frontend

---

## Convenciones de Versionado

Seguimos [Semantic Versioning](https://semver.org/):
- **MAJOR** (X.0.0) — Cambios incompatibles o hitos principales
- **MINOR** (x.Y.0) — Nuevas features compatibles
- **PATCH** (x.y.Z) — Bug fixes y mejoras pequeñas

