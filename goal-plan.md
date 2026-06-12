1. Retire Runtime CommonJS Compatibility (Fully finish)

This is the biggest remaining deprecation track. The ledger still lists CommonJS-style preload/runtime
bridge modules as an intentional temporary surface: /C:/Repos/FitFileViewer/docs/DEPRECATION_LEDGER.md:146.
The current preload path still emits/consumes CommonJS-compatible output for Electron packaging, and preload
modules still use module.exports/require heavily.

Long-term target: make preload/runtime modules ESM-first or at least isolate CommonJS to the build boundary
only. The exit criteria should be: app source is typed ESM-style, preload bundling handles Electron’s
requirements, and tests no longer need special CommonJS-in-ESM mock patterns.

2. Replace Remaining Vendor Compatibility Bundles With Import-Driven Feature Loading (Fully finish)

The renderer dependency inventory says the app still loads browser libraries through split renderer
compatibility bundles: /C:/Repos/FitFileViewer/docs/RENDERER_DEPENDENCY_INVENTORY.md:9. The important
remaining problem is the Vite transform around Leaflet.draw, MiniMap, and markercluster: /C:/Repos/
FitFileViewer/docs/DEPRECATION_LEDGER.md:127.

Long-term target: replace or wrap those Leaflet plugins with modules that accept explicit imports natively,
remove the Vite legacy-plugin transform, and eventually reduce or remove vendorGlobals\* compatibility
entries where feature-local dynamic imports can do the job cleanly.

3. Finish Shrinking The Renderer Composition Root (In progress)

Progress: electron-app/main-ui.ts no longer declares itself as the legacy renderer composition root, no longer
carries the max-dependencies lint exception, and no longer owns the managed-state/legacy-global unload wording.
Preload API validation, theme synchronization, FIT unload cleanup/listener registration, summary selector
registration, external-link startup, shutdown hooks, menu injection, development cleanup, drag/drop
construction, state-startup logging, and vendor/fullscreen startup now live in focused modules under
electron-app/renderer/.

Remaining target: continue extracting the few pieces main-ui.ts still coordinates directly until it becomes a
thin startup coordinator. The remaining direct setup is mostly app-window startup, DOM-id wiring, and exported
compatibility handles for startup tests/dev tools.

4. Remove The Last Legacy State Preservation Semantics (Complete)

Progress: the state-integration preservation tests for pre-existing plain `globalData` and `AppState`
objects have been removed, and the ledger now says legacy `globalData` writes are unsupported with no
preserved state-integration compatibility coverage.

Maintenance target: keep the removed global bridge covered by architecture tests while callers continue using
typed state APIs.

5. Keep Moving Renderer Utility Compatibility Toward Typed Services (Fully finish)

The “Renderer Utility Globals” section is mostly retired, but it still says remaining focused compatibility
shims live in feature modules while migration continues: /C:/Repos/FitFileViewer/docs/
DEPRECATION_LEDGER.md:40. The next step is explicit: keep shrinking legacy renderer compatibility adapters
toward typed services/scoped adapters: /C:/Repos/FitFileViewer/docs/DEPRECATION_LEDGER.md:116.

Long-term target: feature modules should import concrete services, runtime adapters, state selectors, or
event APIs directly. Avoid generic “helper bags,” registry-like modules, broad resolver functions, or test-
only mutation seams.

6. Reduce Test Harness Global Pollution (Fully finish)

Not all globalThis usage is bad: browser/runtime abstractions need it. But tests/vitest/setupVitest.mjs
still has a lot of global shimming. That is not product deprecation, but it is a long-term maintainability
risk because it can hide dependency mistakes.

Long-term target: move from global test environment mutation toward per-test explicit runtime objects,
module-local test overrides, and focused fixtures. The recent createAppMenu cleanup is the right pattern.

7. Re-evaluate Windows 7 Compatibility (Complete)

Progress: the local `build:win7` script, Electron 22 build helper, Win7 release-dist workspace path, and Win7
build tests have been removed. The GitHub workflow now carries forward the newest prior
`Fit-File-Viewer-win7-*` release assets onto the target release without installing Node or rebuilding a
Windows 7 binary. README, release, development, Docusaurus, and layout docs now describe Windows 7 as a
legacy snapshot only.

You may commit during this process. You may update this file to keep track of your current progress and where you stand. You must complete all of these FULLY, with no shortcuts, to consider this goal complete.
