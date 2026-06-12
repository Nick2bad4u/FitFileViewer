1. Retire Runtime CommonJS Compatibility (Fully finish)

This is the biggest remaining deprecation track. The ledger still lists CommonJS-style preload/runtime
bridge modules as an intentional temporary surface: /C:/Repos/FitFileViewer/docs/DEPRECATION_LEDGER.md:146.
The current preload path still emits/consumes CommonJS-compatible output for Electron packaging, and preload
modules still use module.exports/require heavily.

Progress: `electron-app/preload/apiAssembly.ts` now consumes API assembly-context and domain factory dependencies
from the injected preload module registry instead of requiring sibling preload modules directly. The new
`electron-app/preload/preloadApiAssemblyModuleLoader.ts` keeps those dependencies behind the existing
`requireModule` handoff while the packaged Electron preload output remains CommonJS-compatible.
`electron-app/preload/ipcHelpers.ts` and `electron-app/preload/devtoolsMenuApi.ts` now consume shared validation
policies from injected registry entries loaded by `electron-app/preload/preloadPolicyModuleLoader.ts` instead
of requiring shared policy modules directly.
The small preload API assembly-domain factory modules now use named source exports instead of `module.exports`,
while the runtime build still emits CommonJS-compatible package output.
The first preload app API leaf factories (`apiDiagnostics.ts`, `appInfoApi.ts`, `gyazoExternalApi.ts`,
`shellExternalApi.ts`, and `themeApi.ts`) now use named source exports too, with source tests loading those
modules through the preload source-require bridge.
The preload file and clipboard leaf factories (`clipboardBridge.ts`, `fileApi.ts`, and `fitBrowserApi.ts`)
also use named source exports, while their loader boundaries still provide CommonJS-compatible package output.
The preload state leaf factories (`mainStateApi.ts` and `mainStateBridge.ts`) now use named source exports
too, with direct source tests loading them through the preload source-require bridge.

Long-term target: make preload/runtime modules ESM-first or at least isolate CommonJS to the build boundary
only. The exit criteria should be: app source is typed ESM-style, preload bundling handles Electron's
requirements, and tests no longer need special CommonJS-in-ESM mock patterns.

2. Replace Remaining Vendor Compatibility Bundles With Import-Driven Feature Loading (Fully finish)

The renderer dependency inventory says the app still loads browser libraries through split renderer
compatibility bundles: /C:/Repos/FitFileViewer/docs/RENDERER_DEPENDENCY_INVENTORY.md:9. The important
remaining problem is the Vite transform around Leaflet.draw, MiniMap, and markercluster: /C:/Repos/
FitFileViewer/docs/DEPRECATION_LEDGER.md:127.

Long-term target: replace or wrap those Leaflet plugins with modules that accept explicit imports natively,
remove the Vite legacy-plugin transform, and eventually reduce or remove vendorGlobals\* compatibility
entries where feature-local dynamic imports can do the job cleanly.

3. Finish Shrinking The Renderer Composition Root (Complete)

Progress: electron-app/main-ui.ts no longer declares itself as the legacy renderer composition root, no longer
carries the max-dependencies lint exception, and no longer owns the managed-state/legacy-global unload wording.
It is now only the renderer entrypoint/export bridge. Startup coordination lives in
electron-app/renderer/mainUiStartup.ts, while preload API validation, theme synchronization, FIT unload
cleanup/listener registration, summary selector registration, external-link startup, shutdown hooks, menu
injection, development cleanup, drag/drop construction, state-startup logging, and vendor/fullscreen startup
live in focused modules under electron-app/renderer/.

Maintenance target: keep `main-ui.ts` as an entrypoint-only bridge through architecture coverage. The explicit
module exports for the drag/drop handler, menu injection request, and development cleanup stay as the narrow
startup-test/dev-tool compatibility surface.

4. Remove The Last Legacy State Preservation Semantics (Complete)

Progress: the state-integration preservation tests for pre-existing plain `globalData` and `AppState`
objects have been removed, and the ledger now says legacy `globalData` writes are unsupported with no
preserved state-integration compatibility coverage. The deprecated no-op `migrateChartControlsState` export
has also been removed; chart controls visibility must use the explicit `charts.controlsVisible` state path.

Maintenance target: keep the removed global bridge covered by architecture tests while callers continue using
typed state APIs.

5. Keep Moving Renderer Utility Compatibility Toward Typed Services (Fully finish)

The “Renderer Utility Globals” section is close to retired, but it still says remaining focused compatibility
shims live in feature modules while migration continues: /C:/Repos/FitFileViewer/docs/
DEPRECATION_LEDGER.md:40. The next step is explicit: keep shrinking legacy renderer compatibility adapters
toward typed services/scoped adapters: /C:/Repos/FitFileViewer/docs/DEPRECATION_LEDGER.md:116.

Long-term target: feature modules should import concrete services, runtime adapters, state selectors, or
event APIs directly. Avoid generic “helper bags,” registry-like modules, broad resolver functions, or test-
only mutation seams.

Progress: renderer core module resolution now uses module-local focused test overrides instead of reading the
shared `__vitest_manual_mocks__` global registry for startup test doubles, and renderer startup callers use
test-override resolver names instead of retired manual-mock terminology. Export utility notification/theme
test doubles now use the narrow `__setTestDeps` dependency override instead of the shared manual-mock registry
or a map-style manual-mock override API. The
fullscreen control startup path no longer exports the deprecated `setupDOMContentLoaded` alias; callers must
use `setupFullscreenListeners`. `showFitData` no longer accepts the deprecated `resetRenderStates` option;
render-state resets belong to `AppActions` and typed renderer state facades. Chart state-manager and chart-tab
integration cleanup now calls `destroy()` directly instead of retaining `cleanup()` compatibility aliases.
Chart render lifecycle helpers now use `getChartLifecycleActions` instead of the retired global action bridge
wording. `createAppMenu` Electron menu tests now use module-local fixture state instead of `__electron*` and
call-log globals on `globalThis`.

6. Reduce Test Harness Global Pollution (Fully finish)

Not all globalThis usage is bad: browser/runtime abstractions need it. But tests/vitest/setupVitest.mjs
still has a lot of global shimming. That is not product deprecation, but it is a long-term maintainability
risk because it can hide dependency mistakes.

Progress: the Vitest Object.keys guard no longer publishes the retired
`__vitest_object_keys_allow_throw` flag on globalThis. It now rethrows only for the logger failure-path stack,
and architecture coverage keeps that retired test global out of tests and setup. The Vitest document guard's
native-method cache now lives in module-local WeakMap state instead of publishing
`__vitest_doc_native_methods` on globalThis, with architecture coverage for that retired harness global too.
The unused `createElectronMocks` global helper has also been removed from setup; Electron tests should use
explicit local fixtures or `vi.mock(...)` factories. Setup-level timeout, interval, and DOM listener tracking
now uses module-local state instead of `__vitest_tracked_*` and `__vitest_timers_wrapped` globals. The
generated-runtime resolver install guard now uses setup-module state instead of
`__fitFileViewerVitestDistResolverInstalled` on globalThis. The retired
`__vitest_effective_document__` setup global is no longer published; tests should use real jsdom documents,
explicit fixtures, or `tabTestEnvironment.ts`. Event-listener wrapper tracking now uses a module-local
WeakSet instead of `__vitest_wrapped` expando properties. The setup navigation shim now keeps history in a
module-local WeakMap instead of writing `__ffvNavigationHistory` on jsdom `Location` objects. Setup cleanup
comments and renderer registration fixtures no longer preserve the retired shared manual-mock registry as an
ambient global test concept. The Object.keys guard duplicate-wrapper tracking now uses module-local WeakSet
state instead of writing a `__isObjectKeysWrapper` marker property on wrapper functions.

Long-term target: move from global test environment mutation toward per-test explicit runtime objects,
module-local test overrides, and focused fixtures. The recent createAppMenu cleanup is the right pattern.

7. Re-evaluate Windows 7 Compatibility (Complete)

Progress: the local `build:win7` script, Electron 22 build helper, Win7 release-dist workspace path, and Win7
build tests have been removed. The GitHub workflow now carries forward the newest prior
`Fit-File-Viewer-win7-*` release assets onto the target release without installing Node or rebuilding a
Windows 7 binary. README, release, development, Docusaurus, and layout docs now describe Windows 7 as a
legacy snapshot only.

You may commit during this process. You may update this file to keep track of your current progress and where you stand. You must complete all of these FULLY, with no shortcuts, to consider this goal complete.
