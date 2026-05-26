# Renderer Dependency Inventory

This inventory is the Phase 1 baseline for the renderer dependency and vendor
asset migration. Keep it current while moving browser libraries from
`electron-app/vendor/` to package imports and a renderer build pipeline.

## Current Runtime Model

The Electron app still uses a classic script/link model for browser libraries:

- `electron-app/index.html` loads CSS and JavaScript from `vendor/`.
- `electron-app/scripts/prepare-runtime-dist.mjs` copies `vendor/` into
  `electron-app/dist/vendor/`.
- `electron-app/package.json` includes `vendor/` in the packaged file list.
- Renderer modules consume browser libraries through globals such as
  `Chart`, `L`, `JSZip`, `DOMPurify`, `screenfull`, and DataTables/jQuery.
- `prepare-runtime-dist.mjs` rejects direct `node_modules` references in
  `index.html`; production should not load browser code directly from
  `node_modules`.

This means vendored assets must stay until the matching browser package is
imported through a renderer bundle or otherwise generated into runtime output.

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
in `devDependencies` because the current production app ships copied browser
assets from `vendor/`, and the long-term target is to bundle them into renderer
output.

| Package                         | Current shipped asset path                                                    | Migration note                                                             |
| ------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `arquero`                       | `vendor/arquero/arquero.min.js`                                               | Low-risk utility global; good early bundling target.                       |
| `chart.js`                      | `vendor/chart.umd.js`                                                         | Migrate with chart adapter, zoom plugin, and Hammer.                       |
| `chartjs-adapter-date-fns`      | `vendor/chartjs-adapter-date-fns.bundle.min.js`                               | Needs Chart.js registration order preserved.                               |
| `chartjs-plugin-zoom`           | `vendor/chartjs-plugin-zoom.min.js`                                           | Needs Hammer/touch support verified.                                       |
| `datatables.net`                | `vendor/dataTables.min.js`                                                    | DataTables/jQuery ordering must be preserved.                              |
| `datatables.net-dt`             | `vendor/dataTables.dataTables.min.js`, `vendor/dataTables.dataTables.min.css` | CSS and styling package for DataTables.                                    |
| `date-fns`                      | bundled inside adapter asset today                                            | Keep as explicit renderer input when chart adapter is bundled.             |
| `dompurify`                     | `vendor/purify.min.js`                                                        | Low-risk utility global; good early bundling target.                       |
| `hammerjs`                      | `vendor/hammer.min.js`                                                        | Migrate with chart zoom plugin.                                            |
| `jszip`                         | `vendor/jszip.min.js`                                                         | Low-risk utility global; good early bundling target.                       |
| `leaflet`                       | `vendor/leaflet/**`                                                           | High-risk map stack; migrate late with CSS/image handling.                 |
| `leaflet-draw`                  | `vendor/leaflet-draw/**`                                                      | Depends on Leaflet global and bundled images.                              |
| `leaflet-measure`               | `vendor/leaflet-measure/leaflet-measure.css`, assets only                     | JavaScript is not shipped from the package; see curated assets below.      |
| `leaflet-minimap`               | `vendor/leaflet-minimap/**`                                                   | Depends on Leaflet global and plugin ordering.                             |
| `leaflet.fullscreen`            | `vendor/leaflet.fullscreen/**`                                                | Current app uses UMD build under file protocol.                            |
| `leaflet.locatecontrol`         | `vendor/leaflet.locatecontrol/**`                                             | Depends on Leaflet global and CSS/map assets.                              |
| `leaflet.markercluster`         | `vendor/leaflet.markercluster/**`                                             | Depends on Leaflet global and plugin CSS.                                  |
| `maplibre-gl`                   | `vendor/maplibre-gl/**`                                                       | High-risk due CSS, worker behavior, and file protocol packaging.           |
| `@maplibre/maplibre-gl-leaflet` | `vendor/maplibre-gl-leaflet/leaflet-maplibre-gl.js`                           | Bridge depends on both MapLibre and Leaflet ordering.                      |
| `screenfull`                    | `vendor/screenfull.js`, `vendor/screenfull-global.js`                         | Low-risk utility global; wrapper preserves legacy `globalThis.screenfull`. |

## Tooling And Test Dependencies

These are build, package, lint, format, documentation, or test-only packages
and should stay in `devDependencies`.

| Category                 | Packages                                                                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Electron build/package   | `electron`, `electron-builder`, `electron-builder-squirrel-windows`, `makensis`, `cross-env`                                                                                                                                 |
| TypeScript/build helpers | `esbuild`, `globals`                                                                                                                                                                                                         |
| Lint/format/docs         | `eslint`, `eslint-config-nick2bad4u`, `prettier`, `prettier-config-nick2bad4u`, `remark`, `remark-cli`, `remark-config-nick2bad4u`, `secretlint`, `secretlint-config-nick2bad4u`, `stylelint`, `stylelint-config-nick2bad4u` |
| Tests                    | `vitest`, `@vitest/coverage-v8`, `@playwright/test`, `fast-check`, `fast-xml-parser`, `jsdom`                                                                                                                                |
| Types                    | `@types/jsdom`, `@types/leaflet`, `@types/leaflet-draw`, `@types/leaflet.markercluster`                                                                                                                                      |
| Release/changelog        | `git-cliff`                                                                                                                                                                                                                  |
| Browser package helper   | `@kurkle/color`                                                                                                                                                                                                              |

## Vendored Asset Groups

### Package-Sourced Assets

These files are expected to be replaceable after a renderer bundle owns the
matching import path.

- `vendor/arquero/arquero.min.js`
- `vendor/chart.umd.js`
- `vendor/chartjs-adapter-date-fns.bundle.min.js`
- `vendor/chartjs-plugin-zoom.min.js`
- `vendor/dataTables.dataTables.min.css`
- `vendor/dataTables.dataTables.min.js`
- `vendor/dataTables.min.js`
- `vendor/hammer.min.js`
- `vendor/jquery.min.js`
- `vendor/jszip.min.js`
- `vendor/leaflet/**`
- `vendor/leaflet-draw/**`
- `vendor/leaflet-measure/leaflet-measure.css`
- `vendor/leaflet-measure/assets/**`
- `vendor/leaflet-minimap/**`
- `vendor/leaflet.fullscreen/**`
- `vendor/leaflet.locatecontrol/**`
- `vendor/leaflet.markercluster/**`
- `vendor/maplibre-gl/**`
- `vendor/maplibre-gl-leaflet/**`
- `vendor/purify.min.js`

### Curated Or Custom Assets

These files should not be removed just because a package dependency exists.
They need a specific replacement and runtime verification.

- `vendor/leaflet-measure-lite.js`: CSP-safe measurement control replacement.
  The upstream `leaflet-measure` JavaScript should not be restored unless it
  works without weakening the app CSP.
- `vendor/screenfull.js`: local ESM copy used by the current wrapper. Replace
  with the npm `screenfull` import only when the renderer bundle can expose the
  same behavior.
- `vendor/screenfull-global.js`: compatibility wrapper that sets
  `globalThis.screenfull` for legacy code paths.
- Source map files under `vendor/`: useful for debugging but not required for
  runtime behavior. Remove only as part of a deliberate packaging-size cleanup.

## Generated Runtime Output

The build writes runtime output under `electron-app/dist/`.

Current `build:runtime-ts` flow:

1. `scripts/clean-runtime-dist.mjs`
2. `tsc --project .\tsconfig.runtime.json`
3. `scripts/bundle-preload.mjs`
4. `scripts/format-runtime-output.mjs`
5. `scripts/prepare-runtime-dist.mjs`

`prepare-runtime-dist.mjs` copies:

- directories: `assets`, `ffv`, `icons`, `vendor`
- files: `elevProfile.css`, `style.css`
- `index.html` after checking that it does not reference `node_modules`

## Electron Builder Package Surface

`electron-app/package.json` currently includes these package files:

- `assets/`
- `dist/`
- `elevProfile.css`
- `global.d.ts`
- `icons/`
- `index.html`
- `package.json`
- `style.css`
- `vendor/`

After renderer bundling is introduced, this surface should move toward shipping
compiled renderer assets from `dist/` and removing `vendor/` once no runtime HTML
or module path references it.

## Migration Guardrails

- Do not remove `vendor/` wholesale before a renderer bundle is in place.
- Do not load browser assets directly from `node_modules` in production.
- Remove one dependency group at a time and verify the affected feature.
- Preserve script, CSS, and plugin ordering until imports make ordering explicit.
- Keep compatibility globals temporarily where the existing renderer expects
  them.
- Treat Leaflet, MapLibre, and their plugins as the highest-risk migration.
- Keep `leaflet-measure-lite.js` unless a CSP-safe package replacement is proven.
