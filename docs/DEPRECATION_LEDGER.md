# Deprecation Ledger

This ledger tracks compatibility surfaces that are intentionally temporary. New code should not depend on these surfaces unless the entry explicitly says that the migration still requires it.

## Renderer Global Data Bridge

- Temporary surface: `window.globalData`, `globalThis.globalData`
- Current owner: `electron-app/utils/state/core/globalDataStore.ts`
- Compatibility callers: early `main-ui.ts` composition-root startup and remaining legacy state integration bridge internals while renderer state migration continues
- Current status: active compatibility bridge; new runtime writes should go through `setGlobalData`, `setState("globalData", ...)`, or a typed domain service; AppActions clear/load paths and unified state facade globalData routing now go through `globalDataStore`, chart status refreshes subscribe to state, Playwright smoke assertions read activity counts through renderer state APIs, and lifecycle export/reload handlers, summary storage-key, column-modal preference lookup, user/device info, field-toggle metrics, data-point filter statistics, event-message charts, lap-zone charts, chart availability counts, chart settings rerender guards, map lap selector controls, map lap drawing, map core rendering, elevation profile fallback data, and sensor debug utilities now read loaded FIT data through `globalDataStore`; `mainUiGlobals` no longer owns the bridge installer
- Next removal step: replace the remaining legacy state integration bridge internals with state-backed selectors or app-facing test APIs
- Verification gates:
  - `npm run lint:app`
  - `npm test -- tests/unit/packaging/architectureBoundaries.test.ts`
  - `npm run test:playwright`
- Exit criteria:
  - Runtime source reads loaded FIT data through typed imports or state selectors.
  - Playwright smoke tests assert state through app APIs instead of `window.globalData`.
  - Architecture tests block direct runtime writes outside `globalDataStore`.
  - Migrated rendering helpers stay free of direct `window.globalData` reads.

## Legacy AppState Global

- Temporary surface: `AppState.globalData`
- Current owner: `electron-app/utils/state/integration/stateIntegration.ts`
- Compatibility callers: none for FIT data; the legacy global `AppState` object only keeps non-FIT state accessors for older event-listener and chart-rendered checks
- Current status: removed for FIT data; state integration no longer exposes `AppState.globalData`, and architecture tests block reintroducing that runtime access path
- Next removal step: retire the remaining non-FIT `AppState` event-listener and chart-rendered accessors after callers move to `getState(...)`/`setState(...)`
- Verification gates:
  - `npm test -- tests/unit/utils/state/integration/stateIntegration.simple.test.ts tests/unit/utils/state/integration/stateIntegration.comprehensive.test.ts`
  - `npm test -- tests/unit/packaging/architectureBoundaries.test.ts`
- Exit criteria:
  - Renderer modules use `getState`, `setState`, `getGlobalData`, `setGlobalData`, or typed domain services directly.
  - No runtime module writes global data through `AppState.globalData`.
  - The FIT data compatibility accessor stays removed without changing UI behavior or smoke tests.

## Renderer Utility Globals

- Temporary surface: `rendererUtils` and broad renderer utility global registration
- Current owners: `electron-app/utils/legacy/`
- Compatibility callers: old bootstrap and test helpers that still expect a global utility bag
- Current status: shrinking; renderer bootstrap now has focused modules for app startup, state manager startup, file input startup and entrypoint wiring, import-time state/theme/listener bootstrap, development debug globals, Electron API registration, Electron menu action handlers, core module resolution, error handling, lifecycle cleanup, notifications, loading, and renderer state bindings; the compatibility-only `rendererUtils` barrel, global `setLoading` bridge, formatting utility globals, and global `copyTableAsCSV` bridge have been removed; lifecycle CSV export now imports the CSV serializer directly; overlay loading now refreshes maps through a typed dynamic import; `showFitData`, tab state handlers, the map estimated-power refresh path, overlay loading, marker-count controls, map core refreshes, overlay highlight refreshes, and active filename setup now import chart/tab/rendering/file-list/map helpers directly instead of waiting for utility globals; state domain/core modules and state integration are guarded against importing broad renderer utilities; legacy utility imports are quarantined to the compatibility bridge and legacy internals; and `renderer.ts` now uses focused app startup, state startup, file-input wiring, and loading helpers directly
- Next removal step: replace remaining compatibility facades such as the shown-file list and overlay-highlight window shims with typed bootstrap services once the last tests and legacy entrypoints stop assigning them directly
- Verification gates:
  - `npm run lint:app`
  - `npm test -- tests/unit/packaging/architectureBoundaries.test.ts`
  - `npm test -- tests/unit/utils/state/domain/fitFileState.test.ts tests/unit/utils/state/core/masterStateManager.comprehensive.test.ts`
- Exit criteria:
  - Renderer bootstrap modules import the specific utility they need.
  - Tests mock typed module imports instead of mutating a shared utility object.
  - Renderer-adjacent import graphs stay out of main-process-only modules.
  - No new files are added under `electron-app/utils/legacy/`.

## Vendor Globals

- Temporary surface: browser libraries exposed from renderer `vendorGlobals*` entries
- Current owners: `electron-app/renderer/vendorGlobalsCore.ts`, `electron-app/renderer/vendorGlobalsChartData.ts`, `electron-app/renderer/vendorGlobalsMap.ts`
- Compatibility callers: map, chart, DataTables, and plugin integrations that still expect library globals
- Current status: split by broad runtime domain; the core compatibility bundle remains shell-loaded, while the chart/data and map compatibility bundles now load through `electron-app/renderer/vendorBundleLoader.ts` when the related tab renders
- Next removal step: move one feature stack at a time, starting with chart/data-table consumers or map consumers, to lazy typed imports triggered by tab activation
- Verification gates:
  - `npm run build:runtime-ts`
  - `npm test -- tests/unit/packaging/rendererProcessEnvironmentPolicy.test.ts`
  - `npm run test:playwright`
- Exit criteria:
  - Heavy libraries are loaded by the tab or feature that needs them.
  - Chart, map, and data-table modules use typed imports where practical.
  - Renderer dependency inventory documents any remaining global-only vendor.

## Runtime CommonJS Compatibility

- Temporary surface: CommonJS-style preload and runtime bridge modules
- Current owners: `electron-app/preload.ts`, `electron-app/preload/`, runtime build scripts
- Compatibility callers: packaged Electron runtime and tests that exercise generated CommonJS output
- Current status: required by current Electron packaging and preload bundling path; domain-specific preload files exist but still export CommonJS-compatible surfaces
- Next removal step: keep splitting preload APIs by domain while adding stricter schema validation for file access, external links, browser folder listing, app state, and dev tools
- Verification gates:
  - `npm run build:runtime-ts`
  - `npm test -- tests/unit/preload.dist.test.ts tests/unit/preload.distApiMethods.test.ts tests/unit/preload.distBridgeBehavior.test.ts`
  - `npm run package`
- Exit criteria:
  - Runtime build output remains packaged and smoke-tested.
  - Preload domains have narrow validated IPC surfaces.
  - Architecture tests prevent preload modules from reaching into renderer state internals.
