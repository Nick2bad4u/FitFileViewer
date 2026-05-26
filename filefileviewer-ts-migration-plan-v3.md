# Long-Term Goal: Modernize FitFileViewer Packaging, Renderer Dependencies, and Repo Layout

Modernize the FitFileViewer Electron app so dependency management, renderer asset loading, packaging, testing, and repository structure are easier to maintain long term.

The end state should be:

- The Electron app is managed from the repository root instead of requiring most commands to run from `electron-app/`.
- Browser/runtime libraries such as Chart.js, Leaflet, MapLibre, DOMPurify, JSZip, Arquero, DataTables, and related plugins are consumed from npm packages through a proper renderer build pipeline instead of
  being manually loaded from `electron-app/vendor/`.
- Vendored assets are removed wherever a package-imported, bundled, or generated equivalent is safer and maintainable.
- Any remaining vendored files are intentional, documented, and justified.
- Production dependencies contain only Node/Electron runtime packages actually required by the packaged app.
- Build-time renderer/browser libraries live in `devDependencies` when they are bundled or copied into app assets during build.
- Packaging, tests, linting, and release workflows still pass after each migration step.

## Strategic Direction

Do not perform this as one large move. This should be an incremental migration with behavior-preserving checkpoints.

The repo currently centers the app under `electron-app/`, with root tooling wrapping some app commands. The long-term direction is to make the root the primary workspace and app management surface while
preserving Electron runtime boundaries.

Prefer a root workspace/package setup over physically dumping everything into root immediately. The likely best target is:

```folders
/
  package.json
  package-lock.json
  electron-app/
    main/
    preload/
    renderer/
    shared/
    assets/
    icons/
  docs/
  docusaurus/
  fit-test-files/
```

If the repo eventually moves Electron source files closer to root, do it only after tooling and workspace boundaries are clear. A rushed flattening will create path churn, broken package scripts, broken
Electron Builder config, and noisy history.

## Phase 1: Inventory and Stabilize Current State

Audit the current dependency model before making more changes.

Confirm:

- Which packages are required by Electron main/preload at runtime.
- Which packages are browser libraries only.
- Which packages are test/build/lint only.
- Which browser libraries are currently loaded from index.html as classic global scripts.
- Which files under vendor/ are copied from npm packages.
- Which files under vendor/ are custom/curated and must not be blindly replaced.

Create a short dependency classification document or script output covering:

- dependencies
- devDependencies
- vendored browser assets
- custom vendored assets
- generated build outputs
- package files included by Electron Builder

Do not remove additional dependencies until the import/runtime path is proven.

## Phase 2: Add a Real Renderer Build Pipeline

Introduce a renderer bundling pipeline before removing vendored browser files.

Prefer Vite unless repo constraints strongly favor esbuild. Vite is likely better here because the renderer depends on CSS, browser assets, Leaflet images, MapLibre CSS, side-effect plugin imports, and
multiple browser-facing libraries.

The renderer build should:

- Compile renderer TypeScript.
- Bundle browser npm imports.
- Emit stable output into dist/renderer or another owned runtime output folder.
- Handle CSS imports.
- Handle Leaflet images and plugin CSS.
- Preserve Electron file:// compatibility.
- Preserve the existing Content Security Policy or improve it without adding unsafe-eval.
- Avoid remote CDN loading.

Update index.html so it loads built renderer assets rather than dozens of vendor/\*.js files.

Keep the first pass conservative. It is acceptable to expose compatibility globals temporarily, for example:

import Chart from "chart.js/auto";
globalThis.Chart = Chart;

That allows legacy modules to continue working while the codebase is migrated away from globals.

## Phase 3: Migrate Vendored Dependencies Incrementally

Remove vendored libraries one group at a time. After each group, run the relevant validation and inspect the packaged app.

Recommended order:

1. Low-risk utility globals:
   - dompurify
   - jszip
   - screenfull
   - arquero
2. Chart stack:
   - chart.js
   - chartjs-adapter-date-fns
   - chartjs-plugin-zoom
   - hammerjs
3. DataTables stack:
   - datatables.net
   - datatables.net-dt
   - any jQuery dependency still required by DataTables
4. Map and Leaflet stack:
   - leaflet
   - leaflet-draw
   - leaflet.locatecontrol
   - leaflet-minimap
   - leaflet.fullscreen
   - leaflet.markercluster
   - maplibre-gl
   - @maplibre/maplibre-gl-leaflet

Treat Leaflet and MapLibre as the riskiest part. Their CSS, image assets, plugin side effects, global L expectations, and initialization order need direct runtime testing.

Do not blindly remove leaflet-measure-lite.js. It appears to be a curated CSP-safe replacement for a plugin that may require unsafe-eval. Keep it until there is a proven package-based replacement that works
under the app CSP.

For each removed vendored asset:

- Replace script/link usage with package imports.
- Remove the file from vendor/.
- Remove any now-unused copy logic.
- Keep the npm package as a direct dependency or devDependency according to how it is consumed.
- Verify the packaged app still renders the affected feature.

## Phase 4: Dependency Policy

Use this policy after the renderer bundling migration:

dependencies should contain only packages needed as Node modules at packaged-app runtime, such as:

- Electron main-process runtime libraries
- preload/runtime libraries if loaded as Node modules in production
- updater/config/logging packages
- FIT parsing packages if loaded directly at runtime

devDependencies should contain:

- Electron itself
- Electron Builder
- TypeScript
- Vite/esbuild
- test tools
- lint/format/doc tools
- browser libraries that are bundled into renderer output
- type packages
- packages used only to generate copied assets

If a browser package is imported by renderer source and bundled into static output, it belongs in devDependencies unless the packaging model intentionally ships node_modules for renderer runtime. Avoid that
model.

## Phase 5: Align electron-app With Root Management

Make the root the normal command surface.

The preferred near-term structure is npm workspaces:

```json
{
 "workspaces": ["electron-app", "docusaurus"]
}
```

Root scripts should become the default:

```json
{
 "scripts": {
  "start": "npm --workspace electron-app start",
  "build": "npm --workspace electron-app run build",
  "package": "npm --workspace electron-app run package",
  "test": "npm --workspace electron-app test",
  "lint": "npm run lint:root && npm --workspace electron-app run lint && npm --workspace docusaurus run lint",
  "typecheck": "npm --workspace electron-app run typecheck"
 }
}
```

The goal is that contributors rarely need to cd electron-app.

Move shared repo-level tooling to root where appropriate:

- shared lint orchestration
- formatting
- markdown/remark/stylelint orchestration
- release scripts
- dependency audit scripts
- workspace install/update flow

Keep app-specific Electron Builder config near the app until paths are stable. Do not relocate Electron Builder config to root unless packaging output, asset paths, icons, file inclusions, and auto-update
metadata have been tested.

## Phase 6: Optional Physical Restructure

Only after root workspace management is stable, decide whether to physically move Electron app files.

Possible target:

```folders
/
src/
main/
preload/
renderer/
shared/
assets/
icons/
package.json
electron-builder config
```

But do not do this unless the benefit outweighs the path churn.

A workspace-managed electron-app/ can already be easy to manage. Flattening the repo is optional, not required.

If flattening happens:

- Move files in small batches.
- Update import paths with TypeScript-aware tooling.
- Update Electron Builder files, icon paths, extra resources, and output paths.
- Update tests and fixtures.
- Update documentation.
- Update CI workflows.
- Run full lint, typecheck, unit tests, Playwright tests, and package verification.
- Avoid mixing dependency migration and physical file movement in the same PR.

## Required Validation Gates

At minimum, each phase must pass:

npm install
npm run lint
npm run typecheck
npm test
npm run package

For renderer/vendor migration phases, also run:

npm --workspace electron-app run test:playwright

Then manually or automatically verify:

- App starts.
- A real .fit file opens.
- Charts render.
- Map tab renders.
- Leaflet controls work.
- MapLibre layer works.
- Export features still work.
- CSP errors are not introduced.
- Packaged app works, not just dev mode.

If a validation gate fails, stop and fix that phase before continuing.

## Non-Goals

Do not:

- Remove vendor/ wholesale before a renderer bundle is working.
- Load production app scripts directly from node_modules.
- Move the entire electron-app/ tree to root in the same change as renderer bundling.
- Convert every module style at once.
- Rewrite app architecture while migrating assets.
- Silence CSP errors by weakening security.
- Assume tests cover packaged Electron behavior without actually packaging or smoke testing.

## Desired Final Outcome

The final repo should be easier to operate from root, easier to update with npm, and less dependent on manually curated browser files.

A future maintainer should be able to update Chart.js, Leaflet, MapLibre, DOMPurify, JSZip, or similar packages with normal npm tooling, run the validation gates, and trust that the packaged Electron app
uses the updated bundled assets without manually copying random files into vendor/.

Any vendored file that remains should have a clear reason, such as CSP compatibility, upstream package defects, file-size control, or Electron/file-protocol behavior.

Commit as you go.
