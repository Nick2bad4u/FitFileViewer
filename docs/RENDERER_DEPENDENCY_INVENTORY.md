# Renderer Dependency Inventory

This inventory is the Phase 1 baseline for the renderer dependency and vendor
asset migration. Keep it current while moving browser libraries from
package imports and a renderer build pipeline.

## Current Runtime Model

The Electron app now loads third-party browser libraries through typed split
renderer vendor bundles:

- `static/app/index.html` no longer loads legacy vendor JavaScript entries
  directly.
- `electron-app/main-ui.ts` starts
  `electron-app/renderer/vendorBundleLoader.ts` for
  `renderer/renderer-vendor-core.js` during renderer startup. The typed core
  readiness payload registers the DOMPurify sanitizer runtime, JSZip export
  runtime, Arquero summary runtime, and screenfull runtime.
- `electron-app/renderer/vendorBundleLoader.ts` loads
  `renderer/renderer-vendor-chart-data.js` when the Chart or Raw Data tab needs
  the Chart.js runtime, Chart.js zoom plugin, and DataTables stylesheet stacks.
- `electron-app/renderer/vendorBundleLoader.ts` loads
  `renderer/renderer-vendor-map.js` when the Map tab needs the Leaflet, Leaflet
  plugin, MapLibre, and measurement-control stacks.
- `static/app/index.html` loads bundled renderer CSS from
  `renderer/renderer-vendor.css`.
- `scripts/prepare-runtime-dist.mjs` no longer copies a `vendor/` tree into
  `dist/`.
- The root `package.json` no longer includes a `vendor/` tree in the npm
  package file list.
- Renderer modules consume migrated browser libraries through runtime adapters
  instead of persistent browser-library globals; the Chart.js, DataTables, and
  Leaflet adapters resolve only explicitly registered runtimes and no longer
  fall back to `globalThis` or `window` browser-library names.
  Migrated HTML sanitizing resolves DOMPurify through
  `electron-app/utils/dom/domPurifyRuntime.ts`, migrated export ZIP creation
  resolves JSZip through `electron-app/utils/files/export/exportZipRuntime.ts`,
  migrated summary statistics resolve Arquero through
  `electron-app/utils/rendering/helpers/arqueroRuntime.ts`,
  migrated raw-data table rendering resolves DataTables through
  `electron-app/utils/rendering/core/dataTableRuntime.ts`, migrated chart
  helpers resolve Chart.js through `electron-app/utils/charts/core/chartRuntime.ts`,
  and migrated map core-render/base-layer/icon/lap-drawing/measurement/action-button/shown-file overlay helpers resolve Leaflet through
  `electron-app/utils/maps/core/leafletRuntime.ts`, and migrated fullscreen
  controls resolve screenfull through
  `electron-app/utils/ui/controls/screenfullRuntime.ts`.
- `electron-app/renderer/rendererVendorCore.ts`,
  `electron-app/renderer/rendererVendorChartData.ts`, and
  `electron-app/renderer/rendererVendorMap.ts` import migrated renderer packages
  from npm and publish typed runtime payloads by domain.
- `electron-app/renderer/rendererVendorCore.ts` publishes DOMPurify, JSZip,
  Arquero, and screenfull through the typed split-vendor readiness payload
  consumed by `electron-app/renderer/vendorBundleLoader.ts`; app modules then
  resolve them through module-local runtime adapters. It no longer exposes
  `DOMPurify`, `JSZip`, `aq`, `arquero`, or `screenfull` compatibility globals,
  and those adapters no longer use global symbol registries. Split-entry
  readiness is tracked in module state and synchronized through the typed
  readiness event rather than a symbol-backed `globalThis` registry.
- `electron-app/renderer/rendererVendorMap.ts` publishes Leaflet through the
  typed split-vendor readiness payload consumed by
  `electron-app/renderer/vendorBundleLoader.ts`; app modules then resolve it
  through the module-local `leafletRuntime.ts` adapter. The map bundle imports
  MiniMap as a constructor and registers it on the typed Leaflet runtime
  explicitly. The disabled markercluster path is no longer bundled or threaded
  through map drawing options. Leaflet.draw now loads through the
  `fitfileviewer:leaflet-draw-runtime` virtual side-effect module, which wraps
  the package dist file with a module-scoped Leaflet import instead of a Vite
  package transform or persistent `L` compatibility global. The map bundle no
  longer exposes separate `L`, `Leaflet`, or `maplibregl` aliases, the
  module-local plugin registration target is named as a runtime rather than a
  global, and the app-side Leaflet adapter no longer uses a global symbol
  registry.
- `electron-app/renderer/rendererVendorChartData.ts` publishes Chart.js,
  Chart.js zoom, and DataTables constructors through the typed split-vendor
  readiness payload consumed by `electron-app/renderer/vendorBundleLoader.ts`;
  app modules then resolve them through module-local `chartRuntime.ts` and
  `dataTableRuntime.ts` adapters. It no longer exposes `Chart`, Chart.js zoom,
  Hammer, or `DataTable` compatibility globals, and those adapters no longer
  use global symbol registries.
- `electron-app/utils/ui/controls/createElevationProfileButton.ts` uses
  `chartRuntime.ts` instead of importing `chart.js/auto` directly from
  unbundled runtime code.
- The old `electron-app/renderer/rendererVendor.ts` source-level compatibility
  aggregator has been removed; build and runtime loading use the split vendor
  entries directly.
- `prepare-runtime-dist.mjs` rejects direct `node_modules` and repository
  `vendor/` references in copied runtime text assets; production should not
  load browser code directly from `node_modules` or repository vendor trees.

The CSP-safe measurement control now lives in
`electron-app/renderer/leafletMeasureLite.js` with
`electron-app/renderer/leafletMeasureLiteRuntime.js` as first-party renderer
source and is bundled into renderer output; it is not loaded directly by
`index.html`.

## Production Dependencies

These packages are required as Node/Electron runtime packages in the packaged
app and should remain in `dependencies` until proven otherwise.

| Package            | Current runtime owner         | Evidence                                           |
| ------------------ | ----------------------------- | -------------------------------------------------- |
| `@garmin/fitsdk`   | FIT decoding runtime          | Dynamically loaded by `electron-app/fitParser.ts`. |
| `electron-conf`    | Main-process persisted config | Required by main IPC, state, and menu modules.     |
| `electron-log`     | Runtime logging               | Used by Electron runtime logging paths.            |
| `electron-updater` | Auto-update runtime           | Required by updater and menu code.                 |
| `zod`              | Main-process IPC validation   | Required by main IPC handler modules.              |

## Browser Libraries Kept In Dev Dependencies

These packages are application libraries, not lint/test-only tooling. They live
in the root workspace `devDependencies` because the packaged app ships their
Vite-bundled renderer output, not the npm packages themselves.

| Package                         | Current shipped asset path                                                                                                                     | Migration note                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `arquero`                       | `dist/renderer/renderer-vendor-core.js`; `arqueroRuntime.ts` adapter for migrated summary statistics                                           | Migrated from `vendor/`; registered through the runtime adapter, not a global.                                                                                                                                                                                                                  |
| `chart.js`                      | `dist/renderer/renderer-vendor-chart-data.js`; `chartRuntime.ts` adapter for migrated helpers                                                  | Migrated from `vendor/`; registered through the runtime adapter, not a global.                                                                                                                                                                                                                  |
| `chartjs-adapter-date-fns`      | `dist/renderer/renderer-vendor-chart-data.js`                                                                                                  | Migrated from `vendor/` to the renderer compatibility bundle.                                                                                                                                                                                                                                   |
| `chartjs-plugin-zoom`           | `dist/renderer/renderer-vendor-chart-data.js`                                                                                                  | Migrated from `vendor/` to the renderer compatibility bundle.                                                                                                                                                                                                                                   |
| `datatables.net-dt`             | `dist/renderer/renderer-vendor-chart-data.js`, `dist/renderer/renderer-vendor.css`; `dataTableRuntime.ts` adapter for migrated table rendering | Migrated from `vendor/`; registered through the runtime adapter, not a global.                                                                                                                                                                                                                  |
| `date-fns`                      | bundled inside adapter asset today                                                                                                             | Keep as explicit renderer input when chart adapter is bundled.                                                                                                                                                                                                                                  |
| `dompurify`                     | `dist/renderer/renderer-vendor-core.js`; `domPurifyRuntime.ts` adapter for migrated sanitizers                                                 | Migrated from `vendor/`; registered through the runtime adapter, not a global.                                                                                                                                                                                                                  |
| `hammerjs`                      | bundled with the Chart.js zoom plugin stack                                                                                                    | Companion dependency for chart zoom; not exposed as a renderer global.                                                                                                                                                                                                                          |
| `jszip`                         | `dist/renderer/renderer-vendor-core.js`; `exportZipRuntime.ts` adapter for export ZIP creation                                                 | Migrated from `vendor/`; registered through the runtime adapter, not a global.                                                                                                                                                                                                                  |
| `leaflet`                       | `dist/renderer/renderer-vendor-map.js`, `dist/renderer/renderer-vendor.css`; `leafletRuntime.ts` adapter for migrated helpers                  | Registered through the runtime adapter; legacy plugin chunks close over it.                                                                                                                                                                                                                     |
| `leaflet-draw`                  | `dist/renderer/renderer-vendor-map.js`, `dist/renderer/renderer-vendor.css`                                                                    | Migrated from `vendor/` to the renderer compatibility bundle; `leaflet-draw` currently exposes only `dist/leaflet.draw.js` through its package `main` field and has no `module` or `exports` entry, so the `fitfileviewer:leaflet-draw-runtime` wrapper remains the tracked replacement target. |
| `leaflet-measure`               | `dist/renderer/renderer-vendor.css`                                                                                                            | CSS/assets are bundled; CSP-safe JavaScript remains curated source.                                                                                                                                                                                                                             |
| `leaflet-minimap`               | `dist/renderer/renderer-vendor-map.js`, `dist/renderer/renderer-vendor.css`                                                                    | Constructor imported and registered explicitly on the typed Leaflet runtime.                                                                                                                                                                                                                    |
| `leaflet.fullscreen`            | `dist/renderer/renderer-vendor-map.js`, `dist/renderer/renderer-vendor.css`                                                                    | Migrated from `vendor/` to the renderer compatibility bundle.                                                                                                                                                                                                                                   |
| `leaflet.locatecontrol`         | `dist/renderer/renderer-vendor-map.js`, `dist/renderer/renderer-vendor.css`                                                                    | Migrated from `vendor/` to the renderer compatibility bundle.                                                                                                                                                                                                                                   |
| `maplibre-gl`                   | `dist/renderer/renderer-vendor-map.js`, `dist/renderer/renderer-vendor.css`                                                                    | Migrated from `vendor/` to the renderer compatibility bundle.                                                                                                                                                                                                                                   |
| `@maplibre/maplibre-gl-leaflet` | `dist/renderer/renderer-vendor-map.js`                                                                                                         | Migrated from `vendor/` to the renderer compatibility bundle.                                                                                                                                                                                                                                   |
| `screenfull`                    | `dist/renderer/renderer-vendor-core.js`; `screenfullRuntime.ts` adapter for migrated fullscreen controls                                       | Migrated from `vendor/`; registered through the runtime adapter, not a global.                                                                                                                                                                                                                  |

## Tooling And Test Dependencies

These are build, package, lint, format, documentation, or test-only packages
and should stay in `devDependencies`.

| Category                 | Packages                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Electron build/package   | `@electron/fuses`, `@electron/get`, `electron`, `electron-builder`, `electron-builder-squirrel-windows`, `makensis`                                                                                                                                                                                                                       |
| TypeScript/build helpers | `cross-env`, `esbuild`, `globals`, `typescript`, `vite`                                                                                                                                                                                                                                                                                   |
| Lint/format              | `eslint`, `eslint-config-nick2bad4u`, `jscpd`, `jscpd-config-nick2bad4u`, `lychee-config-nick2bad4u`, `markdownlint-cli`, `prettier`, `prettier-config-nick2bad4u`, `remark`, `remark-cli`, `remark-config-nick2bad4u`, `remark-lint-check-toc`, `secretlint`, `secretlint-config-nick2bad4u`, `stylelint`, `stylelint-config-nick2bad4u` |
| Docs/site                | `@docusaurus/tsconfig`, `typedoc`, `typedoc-plugin-markdown`                                                                                                                                                                                                                                                                              |
| Tests                    | `vitest`, `@vitest/coverage-v8`, `@vitest/ui`, `@playwright/test`, `fast-check`, `fast-xml-parser`, `jsdom`                                                                                                                                                                                                                               |
| Types                    | `@types/hammerjs`, `@types/jquery`, `@types/jsdom`, `@types/leaflet`, `@types/node`                                                                                                                                                                                                                                                       |
| Release/dependency tools | `git-cliff`, `gitcliff-config-nick2bad4u`, `npm-check-updates`, `yaml`                                                                                                                                                                                                                                                                    |

`@vitest/ui` is intentionally retained for the local Vitest UI and VS Code
Vitest extension workflow even though it is not imported by application source
or invoked by the regular CI test scripts.

## Vendored Asset Groups

### Package-Sourced Assets

No package-sourced files remain under an app or root `vendor/` tree, and the app
no longer needs those directories.

### Curated Or Custom Assets

These files should not be removed just because a package dependency exists.
They need a specific replacement and runtime verification.

- `electron-app/renderer/leafletMeasureLite.js` and
  `electron-app/renderer/leafletMeasureLiteRuntime.js`: CSP-safe measurement
  control replacement imported by `electron-app/renderer/rendererVendorMap.ts`
  and bundled into `dist/renderer/renderer-vendor-map.js`. The upstream
  `leaflet-measure` JavaScript should not be restored unless it works without
  weakening the app CSP.

## Generated Runtime Output

The build writes runtime output under `dist/`.

Current `build:runtime-ts` flow:

1. `scripts/clean-runtime-dist.mjs`
2. `tsc --project tsconfig.runtime.json`
3. `scripts/bundle-preload.mjs`
4. `npm run build:renderer`
5. `scripts/format-runtime-output.mjs`
6. `scripts/prepare-runtime-dist.mjs`

`prepare-runtime-dist.mjs` copies:

- directories: `static/ffv` to `dist/ffv`, `static/icons` to `dist/icons`
- files: `static/app/elevProfile.css` to `dist/elevProfile.css`,
  `static/app/style.css` to `dist/style.css`
- `static/app/index.html` to `dist/index.html` after checking copied runtime
  text assets for direct `node_modules` and repository `vendor/` references

## Electron Builder Package Surface

The root `electron-builder.config.cjs` `files` list is the source of truth for
the Electron Builder package surface. Electron Builder packages only:

- `dist/`
- `package.json`

The runtime build copies these app assets into `dist/` before
packaging:

- `elevProfile.css` from `static/app/elevProfile.css`
- `ffv/` from `static/ffv/`
- `icons/` from `static/icons/`
- `index.html` from `static/app/index.html`
- `style.css` from `static/app/style.css`

Compiled renderer assets ship from `dist/`; no runtime HTML or module path loads
directly from a `vendor/` path.

## Migration Guardrails

- Do not add package-sourced browser assets back into a repository `vendor/`
  directory.
- Do not load browser assets directly from `node_modules` in production.
- Remove one dependency group at a time and verify the affected feature.
- Preserve script, CSS, and plugin ordering in the split bundle loader until
  imports make ordering explicit.
- Keep split-vendor readiness in module-local state and keep Leaflet.draw behind
  the explicit `fitfileviewer:leaflet-draw-runtime` wrapper until a package with
  a native import surface replaces it; do not reintroduce public `window.*`
  vendor globals, app-side browser-library runtime symbols, or persistent
  split-vendor payload registries. Keep MapLibre layer construction behind
  `electron-app/utils/maps/layers/mapLibreLayerRuntime.ts` instead of threading
  plugin-mutated Leaflet properties through map rendering modules.
- Keep `electron-app/renderer/leafletMeasureLite.js` and
  `electron-app/renderer/leafletMeasureLiteRuntime.js` unless a CSP-safe package
  replacement is proven.
