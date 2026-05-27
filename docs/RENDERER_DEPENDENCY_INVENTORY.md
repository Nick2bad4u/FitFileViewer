# Renderer Dependency Inventory

This inventory is the Phase 1 baseline for the renderer dependency and vendor
asset migration. Keep it current while moving browser libraries from
`electron-app/vendor/` to package imports and a renderer build pipeline.

## Current Runtime Model

The Electron app now loads third-party browser libraries through the renderer
compatibility bundle:

- `electron-app/index.html` loads the Vite-built compatibility bundle at
  `renderer/vendor-globals.js` for DOMPurify, JSZip, Arquero, screenfull, and
  the Chart.js, DataTables, Leaflet, and MapLibre stacks.
- `electron-app/index.html` loads bundled renderer CSS from
  `renderer/vendor-globals.css`.
- `scripts/prepare-runtime-dist.mjs` no longer copies `vendor/`
  into `electron-app/dist/vendor/`.
- `electron-app/package.json` no longer includes `vendor/` in the npm package
  file list.
- Renderer modules consume browser libraries through globals such as
  `Chart`, `L`, `JSZip`, `DOMPurify`, `screenfull`, and DataTables/jQuery.
- `electron-app/renderer/vendorGlobals.ts` imports migrated renderer packages
  from npm and exposes compatibility globals.
- `prepare-runtime-dist.mjs` rejects direct `node_modules` references in
  `index.html`; production should not load browser code directly from
  `node_modules`.

The remaining `electron-app/vendor/leaflet-measure-lite.js` file is curated
source that is bundled into renderer output; it is not loaded directly by
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

| Package                         | Current shipped asset path                                            | Migration note                                                      |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `arquero`                       | `dist/renderer/vendor-globals.js`                                     | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `chart.js`                      | `dist/renderer/vendor-globals.js`                                     | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `chartjs-adapter-date-fns`      | `dist/renderer/vendor-globals.js`                                     | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `chartjs-plugin-zoom`           | `dist/renderer/vendor-globals.js`                                     | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `datatables.net-dt`             | `dist/renderer/vendor-globals.js`, `dist/renderer/vendor-globals.css` | Migrated from `vendor/`; provides the DataTables core dependency.   |
| `date-fns`                      | bundled inside adapter asset today                                    | Keep as explicit renderer input when chart adapter is bundled.      |
| `dompurify`                     | `dist/renderer/vendor-globals.js`                                     | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `hammerjs`                      | `dist/renderer/vendor-globals.js`                                     | Migrated from `vendor/` with the Chart.js zoom plugin.              |
| `jszip`                         | `dist/renderer/vendor-globals.js`                                     | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `jquery`                        | `dist/renderer/vendor-globals.js`                                     | Migrated from `vendor/` with the DataTables stack.                  |
| `leaflet`                       | `dist/renderer/vendor-globals.js`, `dist/renderer/vendor-globals.css` | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `leaflet-draw`                  | `dist/renderer/vendor-globals.js`, `dist/renderer/vendor-globals.css` | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `leaflet-measure`               | `dist/renderer/vendor-globals.css`                                    | CSS/assets are bundled; CSP-safe JavaScript remains curated source. |
| `leaflet-minimap`               | `dist/renderer/vendor-globals.js`, `dist/renderer/vendor-globals.css` | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `leaflet.fullscreen`            | `dist/renderer/vendor-globals.js`, `dist/renderer/vendor-globals.css` | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `leaflet.locatecontrol`         | `dist/renderer/vendor-globals.js`, `dist/renderer/vendor-globals.css` | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `leaflet.markercluster`         | `dist/renderer/vendor-globals.js`, `dist/renderer/vendor-globals.css` | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `maplibre-gl`                   | `dist/renderer/vendor-globals.js`, `dist/renderer/vendor-globals.css` | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `@maplibre/maplibre-gl-leaflet` | `dist/renderer/vendor-globals.js`                                     | Migrated from `vendor/` to the renderer compatibility bundle.       |
| `screenfull`                    | `dist/renderer/vendor-globals.js`                                     | Migrated from `vendor/` to the renderer compatibility bundle.       |

## Tooling And Test Dependencies

These are build, package, lint, format, documentation, or test-only packages
and should stay in `devDependencies`.

| Category                 | Packages                                                                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Electron build/package   | `electron`, `electron-builder`, `electron-builder-squirrel-windows`, `makensis`                                                                                                                                              |
| TypeScript/build helpers | `esbuild`, `globals`, `typescript`, `vite`                                                                                                                                                                                   |
| Lint/format/docs         | `eslint`, `eslint-config-nick2bad4u`, `prettier`, `prettier-config-nick2bad4u`, `remark`, `remark-cli`, `remark-config-nick2bad4u`, `secretlint`, `secretlint-config-nick2bad4u`, `stylelint`, `stylelint-config-nick2bad4u` |
| Tests                    | `vitest`, `@vitest/coverage-v8`, `@vitest/ui`, `@playwright/test`, `fast-check`, `fast-xml-parser`, `jsdom`                                                                                                                  |
| Types                    | `@types/hammerjs`, `@types/jquery`, `@types/jsdom`, `@types/leaflet`, `@types/leaflet-draw`, `@types/leaflet.markercluster`, `@types/node`                                                                                   |
| Release/dependency tools | `git-cliff`, `npm-check-updates`                                                                                                                                                                                             |

`@vitest/ui` is intentionally retained for the local Vitest UI and VS Code
Vitest extension workflow even though it is not imported by application source
or invoked by the regular CI test scripts.

## Vendored Asset Groups

### Package-Sourced Assets

No package-sourced files remain under `electron-app/vendor/`.

### Curated Or Custom Assets

These files should not be removed just because a package dependency exists.
They need a specific replacement and runtime verification.

- `vendor/leaflet-measure-lite.js`: CSP-safe measurement control replacement
  that is imported by `electron-app/renderer/vendorGlobals.ts` and bundled into
  `dist/renderer/chunks/`.
  The upstream `leaflet-measure` JavaScript should not be restored unless it
  works without weakening the app CSP.

## Generated Runtime Output

The build writes runtime output under `electron-app/dist/`.

Current `build:runtime-ts` flow:

1. `scripts/clean-runtime-dist.mjs`
2. `tsc --project tsconfig.runtime.json`
3. `scripts/bundle-preload.mjs`
4. `npm run build:renderer`
5. `scripts/format-runtime-output.mjs`
6. `scripts/prepare-runtime-dist.mjs`

`prepare-runtime-dist.mjs` copies:

- directories: `ffv`, `icons`
- files: `elevProfile.css`, `style.css`
- `index.html` after checking that it does not reference `node_modules`

## Electron Builder Package Surface

The root `electron-builder.files.json` file is the source of truth for the
Electron Builder package surface. Both `electron-builder.config.cjs` and the
Windows 7 build helper read that list. The runtime build copies these app assets
into `dist/` before packaging:

- `dist/`
- `elevProfile.css`
- `ffv/`
- `icons/`
- `index.html`
- `style.css`

Compiled renderer assets ship from `dist/`; no runtime HTML or module path loads
directly from `vendor/`.

## Migration Guardrails

- Keep `electron-app/vendor/` limited to curated source, currently
  `leaflet-measure-lite.js`; do not add package-sourced browser assets back
  there.
- Do not load browser assets directly from `node_modules` in production.
- Remove one dependency group at a time and verify the affected feature.
- Preserve script, CSS, and plugin ordering until imports make ordering explicit.
- Keep compatibility globals temporarily where the existing renderer expects
  them.
- Keep `leaflet-measure-lite.js` unless a CSP-safe package replacement is proven.
