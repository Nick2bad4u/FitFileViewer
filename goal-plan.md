1. Retire Runtime CommonJS Compatibility (Fully finish)

This is the biggest remaining deprecation track. The ledger still lists CommonJS-style preload/runtime
bridge modules as an intentional temporary surface: /C:/Repos/FitFileViewer/docs/DEPRECATION_LEDGER.md:157.
The current preload path still emits/consumes CommonJS-compatible output for Electron packaging, and preload
modules still depend on the injected `requireModule`/packaged CommonJS boundary even though source-level
`module.exports` wrappers have been removed.

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
`shellExternalApi.ts`, and `themeApi.ts`) now use named source exports too, with direct unit tests importing
those named source exports natively.
The preload file and clipboard leaf factories (`clipboardBridge.ts`, `fileApi.ts`, and `fitBrowserApi.ts`)
also use named source exports, while their loader boundaries still provide CommonJS-compatible package output.
The preload state leaf factories (`mainStateApi.ts` and `mainStateBridge.ts`) now use named source exports
too, with direct unit tests importing those named source exports natively.
The preload runtime utility helpers (`environment.ts`, `logger.ts`, `preloadRuntimeEnvironment.ts`, and
`validators.ts`) now use named source exports as well.
The preload event API factories (`ipcEventApiDomain.ts`, `menuEventApi.ts`, and `preloadEventApi.ts`) now
use named source exports too.
The preload catalog and API assembly context helpers (`ipcBridgeCatalog.ts` and `apiAssemblyContext.ts`) now
use named source exports too.
The preload before-exit, development-tools, and Electron API exposure helpers (`beforeExitHandler.ts`,
`developmentToolsGlobal.ts`, and `electronApiExposure.ts`) now use named source exports too.
The preload devtools menu, IPC helper, Electron API factory, and Electron bridge resolver modules
(`devtoolsMenuApi.ts`, `ipcHelpers.ts`, `electronApiFactory.ts`, and `electronBridge.ts`) now use named
source exports too.
The remaining preload API assembly, runtime, bootstrap, and module-loader files now use named source exports;
`electron-app/preload/*.ts` no longer contains source-level `module.exports` wrappers.
Direct preload module unit tests now import named source exports natively; the preload source-require bridge
remains only for source execution/module-mock fixtures that intentionally exercise the injected `requireModule`
boundary.
Preload shared-policy unit tests now import the policy modules natively instead of using `createRequire`, with
architecture coverage to keep those tests off CommonJS-in-ESM loading patterns.
The preload dist-test module-mock fixture now imports preload source modules natively too; the source-require
bridge is confined to the source execution tests that intentionally simulate the injected `requireModule`
boundary.
Shared validation and FIT-label policy modules now use named source exports instead of `module.exports` wrappers
too, while existing CommonJS runtime consumers continue destructuring the compiled named exports.
The redundant main-process external URL policy facade has been removed; callers and tests now use the shared
policy module directly.
The FIT parser source now exposes named exports plus a default module object instead of assigning
`module.exports`, while the compiled CommonJS runtime still presents the same named API. The parser facade and
FIT parser state integration now import the parser/state-manager source through typed ESM imports instead of
requiring the source files directly.
Main-process constants, the main app-state facade, the state-integration barrel, and application event handler
source now use named source exports/imports instead of source-level `module.exports` or direct source requires
for constants/app-state/state-manager dependencies; app-event OAuth/theme/window-validation dependencies are
lazy so permission-handler source tests can import the ESM source boundary natively.
Gyazo startup timer state and main-process test priming now use named source exports too, and the app-event
handler imports the timer setter natively instead of requiring that source module.
Main-process FIT IPC payload, file-read payload, file-access policy, and file-access policy state helpers now
use named source exports too, while file/FIT IPC handlers import those migrated helpers natively instead of
requiring their source modules directly.
Main-process file, FIT, browser, dialog, and recent-file IPC handler modules now use named source exports too;
`setupIPCHandlers.ts` imports those migrated handler and file-access policy boundaries natively.
Main-process clipboard, external integration, and info IPC handler modules now use named source exports as well,
and `setupIPCHandlers.ts` imports those migrated handler boundaries natively too.
The main IPC sender policy and IPC registry now use named source exports too, and the registry/setup IPC
boundary plus main-process state manager import those migrated pieces natively instead of requiring their
source files.
The main renderer-send helper and window validation helper now use named source exports too, and direct
main-process consumers import those migrated helpers natively instead of requiring their source files.
The main theme retrieval helper and auto-updater setup helper now use named source exports too; initialize
application and IPC setup import those migrated helper boundaries natively.
Main bootstrap/IPC setup source (`initializeApplication.ts`, `setupIPCHandlers.ts`, and `gyazoOAuthServer.ts`)
now uses named source exports too; initialize application, IPC setup, and Gyazo OAuth import migrated
constants/app-state/OAuth helper boundaries natively where those sources have already been retired from
source-level CommonJS wrappers.
Main logging, menu-creation, Electron access, and blocked-request support helpers (`logWithContext.ts`,
`safeCreateAppMenu.ts`, `electronAccess.ts`, and `setupBlockedRequests.ts`) now use named source exports too;
already-migrated runtime consumers import those helper boundaries natively instead of requiring their source
files. Main-process source and the state/menu utility consumers no longer require `electronAccess.ts` directly.
The auto-updater access helper now uses named source exports too, and setup/menu/bootstrap consumers import
the updater resolver boundary natively instead of requiring its source file.
The Node runtime module boundary now uses named source exports for `path`, `fs`, and `httpRef`; file-access,
IPC sender policy, Gyazo OAuth, application-event, menu-event, and IPC setup consumers import that boundary
natively instead of requiring its source file.
The main lifecycle setup boundary now uses a named source export instead of a source-level `module.exports`
wrapper.
The main development-helper boundary now uses a named source export and imports app-state helpers natively
instead of requiring the app-state source file.
The window bootstrap/initialization boundaries now use named source exports, and `initializeApplication.ts`
imports `bootstrapMainWindow` natively instead of requiring that source file.
The FIT parser integration boundary now uses named source exports and imports constants/logging natively;
`setupIPCHandlers.ts` imports the integration helper natively instead of requiring its source file.
The main-process state manager boundary now uses named source exports instead of a source-level
`module.exports` fallback, while the state-integration barrel continues importing it natively.

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
