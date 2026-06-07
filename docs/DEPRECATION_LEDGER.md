# Deprecation Ledger

This ledger tracks compatibility surfaces that are intentionally temporary. New code should not depend on these surfaces unless the entry explicitly says that the migration still requires it.

## Renderer Global Data Bridge

- Temporary surface: `window.globalData`, `globalThis.globalData`
- Current owner: `electron-app/utils/state/core/globalDataStore.ts`
- Compatibility callers: legacy chart, map, summary, and Playwright smoke paths that still read the global while renderer state migration continues
- Exit criteria:
  - Runtime source reads loaded FIT data through typed imports or state selectors.
  - Playwright smoke tests assert state through app APIs instead of `window.globalData`.
  - Architecture tests block direct runtime writes outside `globalDataStore`.

## Legacy AppState Global

- Temporary surface: `AppState.globalData`
- Current owner: `electron-app/utils/state/integration/stateIntegration.ts`
- Compatibility callers: legacy renderer state integration paths that still expose AppState-like accessors
- Exit criteria:
  - Renderer modules use `getState`, `setState`, `getGlobalData`, `setGlobalData`, or typed domain services directly.
  - No runtime module writes global data through `AppState.globalData`.
  - The compatibility accessor can be removed without changing UI behavior or smoke tests.

## Renderer Utility Globals

- Temporary surface: `rendererUtils` and broad renderer utility global registration
- Current owners: `electron-app/utils/app/initialization/rendererUtils.ts`, `electron-app/utils/legacy/`
- Compatibility callers: old bootstrap and test helpers that still expect a global utility bag
- Exit criteria:
  - Renderer bootstrap modules import the specific utility they need.
  - Tests mock typed module imports instead of mutating a shared utility object.
  - No new files are added under `electron-app/utils/legacy/`.

## Vendor Globals

- Temporary surface: browser libraries exposed from `electron-app/renderer/vendorGlobals.ts`
- Current owner: `electron-app/renderer/vendorGlobalsCore.ts`
- Compatibility callers: map, chart, DataTables, and plugin integrations that still expect library globals
- Exit criteria:
  - Heavy libraries are loaded by the tab or feature that needs them.
  - Chart, map, and data-table modules use typed imports where practical.
  - Renderer dependency inventory documents any remaining global-only vendor.

## Runtime CommonJS Compatibility

- Temporary surface: CommonJS-style preload and runtime bridge modules
- Current owners: `electron-app/preload.ts`, `electron-app/preload/`, runtime build scripts
- Compatibility callers: packaged Electron runtime and tests that exercise generated CommonJS output
- Exit criteria:
  - Runtime build output remains packaged and smoke-tested.
  - Preload domains have narrow validated IPC surfaces.
  - Architecture tests prevent preload modules from reaching into renderer state internals.
