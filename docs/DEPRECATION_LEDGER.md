# Deprecation Ledger

This ledger tracks compatibility surfaces that are intentionally temporary. New code should not depend on these surfaces unless the entry explicitly says that the migration still requires it.

## Renderer Global Data Bridge

- Temporary surface: `window.globalData`, `globalThis.globalData`
- Current owner: none; active FIT raw-data reads and writes use `electron-app/utils/state/domain/activeFitRawDataState.ts`
- Compatibility callers: none; runtime FIT-data reads and writes use managed state APIs
- Current status: removed; no automatic runtime bridge install, no state-backed bridge helper, no passive plain-value global fallback, no `globalDataStore` helper, and no `loadedFitFilesState` legacy global mirror remain; runtime FIT data load/display paths now write explicit `fitFile.rawData`, and legacy `globalData` writes are unsupported outside preserved state-integration test coverage; AppActions clear/load fallback paths now write explicit `fitFile.rawData`, unified state facade `globalData` access is now an unsupported legacy path instead of routing to active FIT raw data, AppSelectors data-presence checks, chart tab integration readiness, chart state-manager readiness, chart render readiness/state-view/direct-rerender/rendered-event helpers, chart devtools data presence, chart settings rerender guards, chart availability counts, tab visibility no-data checks, tab switching readiness checks, UI active-file display state, map lap selector controls, and GPX export records read through `FitFileSelectors`, chart status refreshes subscribe to state, Playwright smoke assertions read activity counts through renderer state APIs, and lifecycle export/reload handlers, summary storage-key, summary column-modal preference lookup, user/device info, field-toggle metrics, tooltip formatting, data-point filter statistics, event-message charts, lap-zone charts, map lap drawing, map core rendering, elevation profile fallback data and labels, renderer state integration tab loaders, sensor debug utilities, overlay loading, shown-files list rendering/removal, map overlay drawing, elevation profiles, and GPX export record and naming flows now read loaded FIT data through managed state; active FIT activity message reads can use `electron-app/utils/state/domain/fitActivityDataState.ts` for explicit record/session/lap slices, active file identity reads can use `electron-app/utils/state/domain/activeFitFileMetadataState.ts` for current-file/cached-path/loaded-file fallback resolution, map overlay drawing uses `loadedFitFilesState` overlay selectors instead of local loaded-file list slicing, chart readiness/render gating can use `electron-app/utils/state/domain/fitChartDataState.ts` for chart-ready record data, activity start time, and readiness checks, raw-data table rendering can use `electron-app/utils/state/domain/fitTableDataState.ts` for table-ready entries, ordering, row filtering, and readiness checks, user/device rendering can use `electron-app/utils/state/domain/fitUserDeviceDataState.ts` for profile and device-message slices, and map route/add-overlay readiness can use `electron-app/utils/state/domain/fitRouteDataState.ts` for coordinate-bearing records and route coordinate counts; `FitFileSelectors` now read active raw FIT data only from the explicit `fitFile.rawData` domain slice instead of falling back to compatibility `globalData`; `mainUiGlobals`, `main-ui.ts`, state integration startup, core state-manager startup, and the legacy app-state domain no longer own bridge installers
- Next removal step: keep the remaining legacy-global preservation tests scoped to state integration until that compatibility behavior is intentionally removed
- Verification gates:
  - `npm run lint:app`
  - `npm test -- tests/unit/packaging/architectureBoundaries.test.ts`
  - `npm run test:playwright`
- Exit criteria:
  - Runtime source reads loaded FIT data through typed imports or state selectors.
  - Playwright smoke tests assert state through app APIs instead of `window.globalData`.
  - Architecture tests block direct runtime writes, all runtime reads through `getState("globalData")`, direct `globalData` property definitions, reactive `globalData` property creation, and bridge installer calls.
  - Architecture tests block `globalDataStore`, `getGlobalData`, and `setGlobalData` from runtime source.
  - Architecture tests block direct runtime `loadedFitFiles` global lookups outside `loadedFitFilesState`.
  - Migrated rendering helpers stay free of direct `window.globalData` reads.
  - No runtime `getGlobalData`/`setGlobalData` compatibility helper remains.

## Legacy AppState Global

- Temporary surface: `AppState.globalData`, `AppState.eventListeners`, `AppState.isChartRendered`, `window.isChartRendered`
- Current owner: `electron-app/utils/state/integration/stateIntegration.ts`
- Compatibility callers: none
- Current status: removed; state integration no longer exposes `AppState.globalData`, non-FIT `AppState` accessors, or `window.isChartRendered`, state integration preserves pre-existing plain `globalData` values into managed state without installing a global accessor, and architecture tests block reintroducing runtime global data access paths
- Next removal step: keep the removed global accessors covered by architecture tests while callers use `getState(...)`/`setState(...)`, typed state services, or development-only debug utilities
- Verification gates:
  - `npm test -- tests/unit/utils/state/integration/stateIntegration.simple.test.ts tests/unit/utils/state/integration/stateIntegration.comprehensive.test.ts`
  - `npm test -- tests/unit/packaging/architectureBoundaries.test.ts`
- Exit criteria:
  - Renderer modules use `getState`, `setState`, or typed domain services directly.
  - No runtime module writes global data through `AppState.globalData`.
  - Non-FIT `AppState` and `window.isChartRendered` compatibility accessors stay removed.

## Renderer Utility Globals

- Temporary surface: `rendererUtils` and broad renderer utility global registration
- Current owners: none for the broad `utils.js`/`FitFileViewerUtils` utility bag; remaining focused compatibility shims live in their feature modules while migration continues
- Compatibility callers: none for the broad utility bag
- Current status: shrinking; renderer bootstrap now has focused modules for app startup, app lifecycle wiring, DOM element access, state manager startup, file input startup and entrypoint wiring with listener error isolation, test-only listener wiring with registration error isolation, import-time setup orchestration, import-time state/theme/listener bootstrap, global surface wiring, development debug globals, Electron API wiring, Electron API registration, Electron menu action handlers, core module resolution, error handling, lifecycle cleanup, notifications, loading, and renderer state bindings; the compatibility-only `rendererUtils` barrel, global `setLoading` bridge, formatting utility globals, global `copyTableAsCSV` bridge, root `utils.js` bridge, `FitFileViewerUtils`, `devUtilsHelpers`, `window.showFitData`, `electron-app/utils/ui/mainUiGlobals.ts`, and `electron-app/utils/legacy/` registry have been removed; Alt FIT file handoff now goes through the typed `sendFitFileToAltFitReader` service instead of `window.sendFitFileToAltFitReader`; chart settings, chart resize, inline zone-color controls, and zone-color picker fallbacks now call typed `renderChartJS` imports instead of probing `window.renderChartJS`; chart theme and resize refreshes now use the typed chart updater instead of `window.ChartUpdater` or `window.chartUpdater`; map overlay highlight state now lives in typed `getHighlightedOverlayIndex`/`setHighlightedOverlayIndex` module state instead of `_highlightedOverlayIdx` and global `updateOverlayHighlights` accessors; marker-count state now lives in `electron-app/utils/maps/state/mapMarkerCountState.ts` instead of `window.mapMarkerCount`; map action retry and highlight bookkeeping now uses module state instead of `__centerMainAttempts`, `__centerRetryHandle`, `__centerStatusNotified`, or `__mainPolylineHighlightToken` globals; map measurement-control registration and Clear All cleanup now go through `electron-app/utils/maps/state/mapMeasureControlState.ts` instead of `_measureControl`; Leaflet map-instance registration, removal, tab invalidation, and overlay/action centering now go through `electron-app/utils/maps/state/mapLeafletInstanceState.ts` instead of `_leafletMapInstance`; shown-file list refresh now stays behind the typed `shownFilesListUpdater` service instead of being assigned to `window.updateShownFilesList`; lifecycle CSV export now imports the CSV serializer directly; overlay loading now refreshes maps through a typed dynamic import; regular file open, path-based file open, recent-file menu loading, and decoder-option reloads now render decoded FIT data through a typed lazy import; `showFitData`, tab state handlers, the map estimated-power refresh path, overlay loading, marker-count controls, map core refreshes, overlay highlight refreshes, and active filename setup now import chart/tab/rendering/file-list/map helpers directly instead of waiting for utility globals; state domain/core modules and state integration are guarded against importing broad renderer utilities; and `renderer.ts` now uses focused app startup, app lifecycle wiring, DOM access, state startup, file-input wiring, test-only bootstrap wiring, import-time setup orchestration, global surface wiring, debug global installation, Electron API wiring, and loading helpers directly without carrying debug-only state-manager helper code
- Map polyline migration status: main/overlay map polyline registration and stored main bounds now go through `electron-app/utils/maps/state/mapPolylineRegistryState.ts` instead of `_mainPolyline`, `_mainPolylineOriginalBounds`, or `_overlayPolylines`.
- Map activity-layer migration status: activity-layer group registration and data-point marker tracking now go through `electron-app/utils/maps/state/mapActivityLayerState.ts` instead of `_ffvActivityLayerGroup` or `_ffvDataPointMarkers`.
- Next removal step: replace the remaining vendor-runtime compatibility globals with typed services or scoped adapters once chart and map browser libraries are fully import-driven
- Verification gates:
  - `npm run lint:app`
  - `npm test -- tests/unit/packaging/architectureBoundaries.test.ts`
  - `npm test -- tests/unit/utils/state/domain/fitFileState.test.ts tests/unit/utils/state/core/masterStateManager.comprehensive.test.ts`
- Exit criteria:
  - Renderer bootstrap modules import the specific utility they need.
  - Tests mock typed module imports instead of mutating a shared utility object.
  - Renderer-adjacent import graphs stay out of main-process-only modules.
  - The deleted root `utils.ts` and `electron-app/utils/legacy/` bridge files stay absent.

## Vendor Globals

- Temporary surface: browser libraries exposed from renderer `vendorGlobals*` entries
- Current owners: `electron-app/renderer/vendorGlobalsCore.ts`, `electron-app/renderer/vendorGlobalsChartData.ts`, `electron-app/renderer/vendorGlobalsMap.ts`
- Compatibility callers: none for persistent renderer vendor globals; legacy Leaflet plugin chunks are rewritten by `vite.renderer.config.mjs` to close over the registered Leaflet runtime
- Current status: split by broad runtime domain; the core compatibility bundle remains shell-loaded, while the chart/data and map compatibility bundles now load through `electron-app/renderer/vendorBundleLoader.ts` when the related tab renders; the generic `defineMissingGlobal` shim and `__FFV_RENDERER_VENDOR_BUNDLE__` global marker have been removed from runtime source, and split-entry readiness is coordinated by `vendorGlobalsShared.ts` through a private symbol-backed registry plus a narrow readiness event so separately compiled renderer module graphs can agree on loaded entries; migrated DOM sanitizing resolves DOMPurify through `electron-app/utils/dom/domPurifyRuntime.ts` registered by the core vendor bundle without exposing a `DOMPurify` compatibility global, migrated export ZIP creation resolves JSZip through `electron-app/utils/files/export/exportZipRuntime.ts` registered by the core vendor bundle without exposing a `JSZip` compatibility global, migrated summary statistics resolve Arquero through `electron-app/utils/rendering/helpers/arqueroRuntime.ts` registered by the core vendor bundle without exposing `aq` or `arquero` compatibility globals, migrated fullscreen controls resolve screenfull through `electron-app/utils/ui/controls/screenfullRuntime.ts` registered by the core vendor bundle without exposing a `screenfull` compatibility global, migrated chart helpers resolve Chart.js through `electron-app/utils/charts/core/chartRuntime.ts` registered by the chart/data vendor bundle without exposing `Chart`, Chart.js zoom, or Hammer compatibility globals, migrated chart lifecycle, primary render-loop, render-completion, devtools, export, zone-chart render, chart-count, chart-settings rerender, chart-export UI, and zone-color preview paths resolve rendered Chart.js instances through `electron-app/utils/charts/core/chartInstanceRegistry.ts` without exposing a chart-instance compatibility global, migrated DataTables table rendering resolves through `electron-app/utils/rendering/core/dataTableRuntime.ts` registered by the chart/data vendor bundle without exposing a `DataTable` compatibility global, and migrated map core rendering, base-layer, vector-layer, marker-icon, lap-drawing, plugin-control, measurement, action-button, and shown-file overlay marker helpers resolve Leaflet through `electron-app/utils/maps/core/leafletRuntime.ts`; `vendorGlobalsMap.ts` registers Leaflet before loading Leaflet.draw, MiniMap, and markercluster, while `vite.renderer.config.mjs` rewrites those legacy package chunks to bind that runtime locally instead of reading a persistent `L` global; separate `L`, `Leaflet`, and `maplibregl` aliases are gone and direct MapLibre bridge calls are quarantined to `electron-app/utils/maps/layers/mapVectorLayers.ts`
- Next removal step: keep the Vite legacy plugin transform covered by architecture and runtime bundle tests until Leaflet.draw/MiniMap/markercluster are replaced with modules that accept explicit imports natively
- Verification gates:
  - `npm run build:runtime-ts`
  - `npm test -- tests/unit/packaging/rendererProcessEnvironmentPolicy.test.ts`
  - `npm run test:playwright`
- Exit criteria:
  - Heavy libraries are loaded by the tab or feature that needs them.
  - Chart, map, and data-table modules use typed imports or scoped runtime adapters where practical.
  - Architecture tests block direct Chart.js constructor global lookups from runtime source.
  - Architecture tests block direct Leaflet global lookups and persistent `L` definitions in runtime source.
  - Architecture tests quarantine direct MapLibre bridge calls to the vector-layer adapter.
  - Renderer dependency inventory documents any remaining global-only vendor.

## Runtime CommonJS Compatibility

- Temporary surface: CommonJS-style preload and runtime bridge modules
- Current owners: `electron-app/preload.ts`, `electron-app/preload/`, runtime build scripts
- Compatibility callers: packaged Electron runtime and tests that exercise generated CommonJS output
- Current status: required by current Electron packaging and preload bundling path; domain-specific preload files exist but still export CommonJS-compatible surfaces, dev-only global exposure now lives in `electron-app/preload/developmentToolsGlobal.ts` instead of the root preload composition file, preload startup orchestration now lives in `electron-app/preload/preloadBootstrap.ts`, dependency loading is composed by `electron-app/preload/preloadModuleLoader.ts` from app, file, IPC, and state loader modules, and the root `electron-app/preload.ts` now imports `electron-app/preload/preloadEntrypoint.ts` directly while esbuild still emits the packaged `dist/preload.js` as CommonJS for Electron; `preloadEntrypoint.ts` owns the typed Electron preload `require` handoff, and the bootstrap/runtime/module-loader chain now resolves dependencies through that injected `requireModule` instead of ambient module-level `require(...)` calls; exposed `electronAPI` method assembly now lives in `electron-app/preload/electronApiFactory.ts`, API assembly now lives in `electron-app/preload/apiAssembly.ts`, shared preload runtime/module typing now lives in `electron-app/preload/preloadModuleTypes.ts` without adding a runtime dependency, `shell:openExternal` preload validation now uses the same shared HTTPS/mailto URL policy as main-process shell handlers, FIT browser folder preload validation now rejects malformed root-folder and relative-folder paths through a shared path policy before IPC while main keeps filesystem trust and containment enforcement, FIT file path preload validation now rejects malformed or non-absolute file paths for `file:read` and recent-file path IPC through the same shared path policy used by main file-access approval checks, main-state path/operation preload validation now rejects unsafe dot paths, prototype-pollution segments, malformed segments, and overlong renderer-provided state paths through a shared policy also used by the main-process state manager, devtools menu injection now validates and normalizes theme/file-path payloads through a shared preload/main-process policy, app source no longer calls generic renderer preload IPC methods directly, the public `electronAPI` no longer exposes `invoke`, `send`, or `onIpc`, and `createPreloadEventApi` only returns `notifyFitFileLoaded` plus allowlisted update-event subscriptions
- Next removal step: narrow or retire the remaining CommonJS-compatible runtime bridge modules after the Electron preload bundling path can consume typed ESM-style modules directly
- Verification gates:
  - `npm run build:runtime-ts`
  - `npm test -- tests/unit/preload.dist.test.ts tests/unit/preload.distApiMethods.test.ts tests/unit/preload.distBridgeBehavior.test.ts`
  - `npm run package`
- Exit criteria:
  - Runtime build output remains packaged and smoke-tested.
  - Preload domains have narrow validated IPC surfaces.
  - Architecture tests prevent preload modules from reaching into renderer state internals.
  - Architecture tests keep app source off generic renderer preload IPC methods.
