# FitFileViewer Application Overview

This document provides a high-level tour of the FitFileViewer codebase, covering the runtime architecture, supporting utilities, testing strategy, and key workflows. Use it alongside the more focused guides in the `docs/` directory (for example `FIT_PARSER_MIGRATION_GUIDE.md` and `STATE_MANAGEMENT_COMPLETE_GUIDE.md`).

## Technology Stack

- **Platform:** Electron (Chromium renderer + Node.js main process)
- **UI Layer:** Vanilla JS + DOM APIs, Chart.js, Leaflet, MapLibre, DataTables
- **State & Data:** Custom observable state manager (`utils/state/core/stateManager.js`), Garmin FIT SDK
- **Styling & Theming:** CSS, theme utilities (`utils/theming/core`)
- **Tooling:** Vitest, ESLint, Prettier, electron-builder, PowerShell helper scripts

## Repository Layout

| Path                        | Purpose                                                                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `electron-app/main.ts`      | Electron main process source entry point (window lifecycle, IPC, auto-updates, recent files)                                                                                        |
| `electron-app/preload.ts`   | Secure bridge source that exposes `electronAPI` to the renderer                                                                                                                     |
| `electron-app/renderer.ts`  | Renderer bootstrap source (state initialization, dependency wiring, DOM readiness)                                                                                                  |
| `electron-app/fitParser.ts` | FIT file decoding source with state & settings integration                                                                                                                          |
| `electron-app/utils/`       | Shared utilities (app lifecycle, charts, data, files, formatting, rendering, state, theming, UI)                                                                                    |
| `tests/unit/`               | Root-owned Vitest suites for tooling, runtime/preload/main boundaries, strict regressions, chart/map/menu/lifecycle/file/theming/rendering/utility behavior, and shared UI behavior |
| `tests/integration/`        | Root-owned Vitest integration suites                                                                                                                                                |
| `tests/fixtures/`           | Root-owned reusable Vitest fixtures                                                                                                                                                 |
| `tests/playwright/`         | Root-owned Electron Playwright smoke tests                                                                                                                                          |
| `scripts/`                  | Root-owned build, coverage, and runtime packaging helpers                                                                                                                           |
| `docs/`                     | Product and engineering guides                                                                                                                                                      |
| `static/app/`               | Main HTML and CSS source assets copied into the app runtime bundle                                                                                                                  |
| `static/ffv/`               | Embedded alternative FIT viewer source assets copied into the app runtime bundle                                                                                                    |
| `static/icons/`             | Application icon source assets copied into the app runtime bundle                                                                                                                   |
| `node_modules/`             | Third-party libraries managed via npm (Chart.js, Leaflet, MapLibre, DataTables, etc.)                                                                                               |

## Runtime Architecture

```text
Launcher → main.ts → BrowserWindow preload:dist/preload.js → renderer dist/renderer.js
                       │                                    │
                       │ (IPC handlers, auto-update,        │ (State manager bootstrap,
                       │  recent files, menu, logging)      │  DOM hooks, UI modules)
                       ▼                                    ▼
                utils/state/core/masterStateManager.js ◄──► utils/state/domain/
```

1. **Main process (`main.ts`)** builds application state, creates the BrowserWindow via `windowStateUtils`, instantiates menus, registers IPC handlers, and configures auto updates.
2. **Preload (`preload.ts`)** is emitted by the root build as `dist/preload.js`, delegates to compiled modules under `dist/preload/`, and exposes a typed `electronAPI` surface (file dialogs, version info, recent files, FIT parsing, update events, theme events, etc.) using context isolation.
3. **Renderer (`renderer.ts`)** is compiled by the root runtime build, lazily resolves modules through `ensureCoreModules()`, initializes the master state manager, wires legacy compatibility proxies, registers DOM listeners, and orchestrates charts, maps, and notifications.
4. **State management** is centralized in `utils/state/core/stateManager.js`, while domain-specific managers (e.g., `fitFileStateManager`, `uiStateManager`, `settingsStateManager`) sit under `utils/state/domain/`.

## Main Process Responsibilities

- **Window lifecycle:** `windowStateUtils.js` persists bounds, manages `ready-to-show`, and saves state on close.
- **Application menu:** `utils/app/menu/createAppMenu.js` builds dynamic menus that respect theme, platform, and update status.
- **Recent files:** IPC handlers interact with `utils/files/recent/recentFiles.js` to persist MRU lists under user data.
- **File dialogs & FIT operations:** `dialog:openFile`, `file:read`, `fit:parse`, `fit:decode` pipes buffer data to the parser and back to the renderer.
- **Auto updates:** `setupAutoUpdater()` configures electron-updater, hooks download progress events, and surfaces notifications via IPC.
- **Gyazo OAuth helper:** Embedded HTTP server start/stop actions support screenshot sharing workflows.
- **Security:** Navigation and new-window guards restrict content to trusted origins.
- **Dev utilities:** `exposeDevHelpers()` returns diagnostic hooks when running with `NODE_ENV=development` or `--dev`.

## Preload Bridge (`electronAPI`)

The preload script exposes a constrained API (all methods validate their arguments and catch errors). Key categories:

- **File operations:** `openFile`, `openFileDialog`, `readFile`, `parseFitFile`, `decodeFitFile`
- **Recent files:** `recentFiles`, `addRecentFile`
- **System & version info:** `getAppVersion`, `getElectronVersion`, `getNodeVersion`, `getChromeVersion`, `getPlatformInfo`, `getLicenseInfo`
- **Theming:** `getTheme`, `setFullScreen`, `onSetTheme`, `sendThemeChanged`
- **IPC helpers:** `onMenuOpenFile`, `onOpenRecentFile`, `onOpenSummaryColumnSelector`, `onUpdateEvent`, generic `onIpc`/`send`/`invoke`
- **Updates:** `checkForUpdates`, `installUpdate`, update event subscriptions
- **Gyazo helpers:** `startGyazoServer`, `stopGyazoServer`
- **Misc:** `openExternal`, `injectMenu`, `getChannelInfo`, `validateAPI`

## Renderer Initialization

`renderer.ts` performs the following sequence before being compiled into the
runtime renderer output:

1. **State manager boot:** `masterStateManager.initialize()` hydrates state, exposing proxies so legacy consumers still reference `appState`.
2. **DOM validation:** Ensures critical containers (`#openFileBtn`, `#notification`, etc.) exist; warns if running in minimal test DOM.
3. **Module resolution:** `ensureCoreModules()` dynamically imports UI and data modules, accommodating Vitest manual mocks.
4. **UI setup:** Registers drag/drop, menu, and tab listeners (`utils/app/lifecycle/listeners.js`), sets up theme toggles (`utils/theming/core/theme.js`), and initialises charts & maps as needed.
5. **Electron API wiring:** Hooks menu and theme callbacks, queries development mode, and primes state spies.
6. **Performance monitoring:** `PerformanceMonitor` collects timings for startup and component initialization.
7. **Error handling:** Global listeners show notifications for unhandled errors and promise rejections.

## State Management

- **Core Store:** `utils/state/core/stateManager.js` implements a nested object store with `getState`, `setState`, `subscribe`, `updateState`, history tracking, and JSON persistence.
- **Integration:** `masterStateManager.js` bridges renderer and main processes, exposing helper APIs, debugging hooks, and middleware.
- **Domain Modules:**
  - `fitFileStateManager.js` (decode progress, error reporting, metadata)
  - `uiStateManager.js` (tab visibility, theme application, loading indicators)
  - `settingsStateManager.js` (persistent decoder options)
- **Main process mirror:** `utils/state/integration/mainProcessStateManager.js` maintains cross-process state (window references, operations, errors) and exposes IPC endpoints.
- **Fallbacks:** Legacy paths fall back to `electron-conf` when the state manager cannot initialize, ensuring backward compatibility.

## FIT File Handling Pipeline

1. **File selection:** Renderer triggers `electronAPI.openFile()`; main process updates recent files and reconstitutes menus.
2. **Binary read:** `file:read` returns an ArrayBuffer via IPC.
3. **Decode:** `fitParser.ts` loads Garmin's FIT SDK (`@garmin/fitsdk`), validates integrity, tracks progress via `fitFileStateManager`, and records metadata.
4. **State updates:** Successful decodes update the `fitFile.rawData` domain state, propagate to charts/maps/tables (`showFitData.ts`), and notify the main menu.
5. **Overlays:** `loadOverlayFiles.ts` allows additional FIT files to be displayed side-by-side, reusing the decode pipeline and maintaining `loadedFitFiles`.

## UI Systems

- **Tabs & Layout:** `main-ui.ts`, `tabStateManager.ts`, and `updateTabVisibility.ts` coordinate tab switching, drag/drop overlays, and responsive layout.
- **Charts:** `renderChartJS.ts`, `chartTabIntegration.ts`, `renderSingleHRZoneBar.ts`, etc. generate Chart.js configuration, using theme-aware colors and tooltips.
- **Maps:** `renderMap.ts` leverages Leaflet/MapLibre with base layers, lap selectors, overlays, and auxiliary controls.
- **Tables & Summaries:** `renderTable.ts`, `renderSummary.ts`, and helpers manage DataTables integration and summary statistics.
- **Modals & Notifications:** `showNotification.ts`, `showAboutModal.ts`, and toast helpers deliver consistent UX feedback.
- **Controls:** `createExportGPXButton.ts`, `copyTableAsCSV.ts`, and fullscreen helpers round out the toolbar/functionality.

## Theming & Styling

- **Theme discovery:** `detectCurrentTheme()` inspects stored preferences and system dark mode.
- **Application:** `setupTheme()` applies CSS variables, toggles dataset attributes, and persists the theme via state and `electron-conf` fallback.
- **Dynamic adjustments:** Map & chart components respond to theme changes via subscriptions and `onSetTheme` IPC callbacks.

## Auto-Update & Deployment

- Root `electron-builder` wrappers (`build`, `build:all`, `package`) handle
  packaging for Windows/Mac/Linux.
- Auto-update events (`update-available`, `update-downloaded`, etc.) surface in both renderer UI and application menu items.
- NSIS, Squirrel, AppImage, Debian, and other targets are preconfigured in the
  root `electron-builder.config.cjs`; packaged file inclusion is centralized in
  that config's `files` list.

## Logging & Diagnostics

- `logWithLevel.js` centralizes log formatting (timestamps, severity).
- `stateDevTools.js` exposes typed `performanceMonitor` utilities, and renderer dev helpers remain behind the dedicated renderer debug module.
- Main process logs contextual messages via `logWithContext` and ensures errors are captured even when mocks intercept Electron APIs.

## IPC Reference (selected)

| Channel/Event                                                 | Direction       | Description                                                  |
| ------------------------------------------------------------- | --------------- | ------------------------------------------------------------ |
| `dialog:openFile`                                             | renderer → main | Open file picker filtered to FIT files                       |
| `file:read`                                                   | renderer → main | Read file contents into ArrayBuffer                          |
| `fit:parse`, `fit:decode`                                     | renderer → main | Decode FIT data via shared parser                            |
| `recentFiles:get`, `recentFiles:add`                          | renderer ↔ main | Manage recent file list                                      |
| `theme:get`, `map-tab:get`                                    | renderer → main | Retrieve persisted settings                                  |
| `shell:openExternal`                                          | renderer → main | Open external URLs                                           |
| `menu-open-file`, `open-recent-file`, `theme-changed`         | main → renderer | Menu-driven actions forwarded through preload event handlers |
| Update events (`update-available`, `update-downloaded`, etc.) | main → renderer | Auto-updater status notifications                            |

Refer to `preload.ts`, `main.ts`, and `electron-app/shared/ipc.ts` for the full
set of channels and event names.

## Testing & Quality

- **Unit & integration:** `npm test` runs Vitest. Targeted suites such as
  `npm run test:unit` exist for focused validation.
- **Electron smoke:** `npm run test:playwright` runs the root-owned
  `tests/playwright/` suite, opens the packaged-like app shell, and verifies
  real FIT data across map, chart, data, and summary tabs.
- **Coverage:** `npm run test:coverage` generates coverage data.
- **Strict regression suites:** Under `tests/unit/strictTests/` to guard tricky DOM/Electron edge cases.
- **Type checking & linting:** `typecheck`, `lint`, `lint:fix`, `prettier`, and associated `format:*` scripts.
- **Release readiness:** `npm run release:verify` is the canonical full gate for formatting, linting, CSS linting, docs checks, audits, Vitest, Electron Playwright smoke tests, signing preflight, and an unpacked package build. The manual **Release Rehearsal** workflow runs that gate across Linux, Windows, and macOS, checks signing availability without publishing, and uploads unsigned artifacts for inspection. The scheduled **Dependency Validation** workflow runs the same gate weekly and on dependency-file pull requests so dependency updates prove the app-level smoke and package checks before they can be merged.

## Build & Distribution

Common scripts:

- `npm start` – Development mode with Chromium inspector
- `npm run start:prod` – Launch packaged-like instance
- `npm run build` – Build platform-specific installers
- `npm run build:all` – Cross-platform artifacts
- `npm run package` – Unpacked directories for manual inspection

Artifacts are configured via `electron-builder` to include NSIS, Squirrel, AppImage, Debian, RPM, snap, and more.

## Error Handling & Fallbacks

- **State manager:** Falls back to `electron-conf` when initialization fails, ensuring persisted settings still load.
- **Main process IPC:** Wraps handlers in try/catch and logs contextual errors, preventing crashes from propagating to the renderer.
- **Renderer:** Global error/promise rejection listeners show toast notifications and log details.
- **File workflows:** `handleOpenFile` and overlay loaders gracefully notify users about duplicate or malformed files.

## Development Tips

- Renderer debug helpers are module-owned test/development tools, not renderer console globals.
- Main-process development helpers are returned from `exposeDevHelpers()` instead of being published on `globalThis`.
- Vitest uses the root `tests/vitest/stubs/electron-virtual.cjs` alias plus targeted `vi.doMock` calls to simulate Electron APIs.
- Scripts in `scripts/` (PowerShell/Node) automate cleanup, changelog updates, and testing migrations.

## Glossary

- **FIT (Flexible & Interoperable Data Transfer):** Binary format used by Garmin and other devices for activity data.
- **Master State Manager:** Central orchestrator that synchronizes state across renderer domains and, when necessary, the main process.
- **Overlay FIT Files:** Additional FIT files layered on top of the primary activity to compare data sets.
- **electron-conf:** Lightweight configuration store used as a persistence fallback.

---

For deeper dives into particular subsystems:

- FIT parsing: `docs/FIT_PARSER_MIGRATION_GUIDE.md`
- Renderer state migration: `docs/STATE_MANAGEMENT_COMPLETE_GUIDE.md`
- Main-process state client: `docs/MAIN_PROCESS_STATE_CLIENT_USAGE.md`

Feel free to expand this overview as new modules or workflows are introduced.
