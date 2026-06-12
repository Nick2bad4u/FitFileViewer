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
Direct preload module unit tests now import named source exports natively; the regular preload source behavior
test and preload source-execution test now use the native preload module-mock registry, and the old
`createPreloadSourceRequire` CommonJS-in-ESM test bridge has been removed.
Preload shared-policy unit tests now import the policy modules natively instead of using `createRequire`, with
architecture coverage to keep those tests off CommonJS-in-ESM loading patterns.
The preload dist-test module-mock fixture now imports preload source modules natively too, and preload source
tests simulate the injected `requireModule` boundary through the native module-mock registry instead of a
CommonJS source transform.
The obsolete `docs/MOCK_COMMONJS_IN_ESM.md` guide has been removed, and architecture coverage now guards
against restoring the retired global `require()` override/mock-interoperability recipe.
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
Strict Electron main-handler tests now import Electron access, file-access policy, filesystem, and
file-system handler modules natively instead of using `createRequire`, `requireCjs`, or inline `require(...)`
test bridges.
Main-process FIT IPC payload, file-read payload, file-access policy, and file-access policy state helpers now
use named source exports too, while file/FIT IPC handlers import those migrated helpers natively instead of
requiring their source modules directly.
Main-process file, FIT, browser, dialog, and recent-file IPC handler modules now use named source exports too;
`setupIPCHandlers.ts` imports those migrated handler and file-access policy boundaries natively.
Main-process clipboard, external integration, and info IPC handler modules now use named source exports as well,
and `setupIPCHandlers.ts` imports those migrated handler boundaries natively too.
The main IPC sender policy and IPC registry now use named source exports too, and the registry/setup IPC
boundary plus main-process state manager import those migrated pieces natively instead of requiring their
source files. The IPC sender-policy unit test now imports the Electron access override natively instead of
using a `createRequire`/`requireCjs` test bridge.
The main renderer-send helper and window validation helper now use named source exports too, and direct
main-process consumers import those migrated helpers natively instead of requiring their source files.
The main theme retrieval helper and auto-updater setup helper now use named source exports too; initialize
application and IPC setup import those migrated helper boundaries natively. `setupAutoUpdater.ts` now imports
`electron-log` natively instead of resolving it through a source-level `require(...)` boundary.
Main bootstrap/IPC setup source (`initializeApplication.ts`, `setupIPCHandlers.ts`, and `gyazoOAuthServer.ts`)
now uses named source exports too; initialize application, IPC setup, and Gyazo OAuth import migrated
constants/app-state/OAuth helper boundaries natively where those sources have already been retired from
source-level CommonJS wrappers.
Clipboard, external, and filesystem IPC validation handlers now import `zod` natively instead of requiring
that package at source level.
Main logging, menu-creation, Electron access, and blocked-request support helpers (`logWithContext.ts`,
`safeCreateAppMenu.ts`, `electronAccess.ts`, and `setupBlockedRequests.ts`) now use named source exports too;
already-migrated runtime consumers import those helper boundaries natively instead of requiring their source
files. Main-process source and the state/menu utility consumers no longer require `electronAccess.ts` directly,
and `electronAccess.ts` now resolves the Electron package through the centralized `loadNodeModule`
compatibility boundary instead of owning a direct package `require("electron")` call.
The app-menu creation boundary (`createAppMenu.ts` plus `utils/app/menu/index.ts`) now uses named source
exports/imports instead of source-level `module.exports` or a barrel `require`, and `safeCreateAppMenu.ts`
imports the menu creator natively. `createAppMenu.ts` also imports recent-file and file-access helpers
natively instead of requiring those source modules.
The auto-updater access helper now uses named source exports too, and setup/menu/bootstrap consumers import
the updater resolver boundary natively instead of requiring its source file. Its synchronous
Electron-updater fallback now resolves through the centralized `loadNodeModule` compatibility boundary instead
of a direct package `require("electron-updater")` call, and the redundant Node ESM `module.exports` namespace
branch has been removed because Electron-updater's `default` namespace covers the same object shape.
The Node runtime module boundary now uses named source exports for `path`, `fs`, `httpRef`, and the scoped
package loader used by runtime compatibility adapters; file-access, IPC sender policy, Gyazo OAuth,
application-event, menu-event, IPC setup, Electron access, and updater access consumers import that boundary
natively instead of requiring its source file or owning separate direct package-load fallbacks.
Electron-conf access is now centralized in `electron-app/main/runtime/electronConfAccess.ts` because the
package's ESM entry is not safe under the current Electron CommonJS module shape. App state, FIT-parser
integration, app-menu creation, menu event handling, and browser/info IPC handlers use that typed adapter
instead of direct source-level `require("electron-conf")` calls.
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
The menu-event setup boundary now uses a named source export and imports migrated constants, IPC registry,
logging, file-access policy, app-state, and safe menu helpers natively instead of requiring those source
modules.
The application-event setup boundary now imports migrated logging, safe menu creation, Gyazo OAuth, theme,
window-validation helpers natively.
The window-state utility boundary now uses named source exports instead of a source-level `module.exports`
wrapper, and application-event/window-bootstrap/window-initialization source imports `createWindow` natively
instead of requiring `windowStateUtils`.
The main entrypoint now imports runtime helpers natively instead of using its `mainRequire` table or
source-level `module.exports` fallback, while keeping the existing default export object for tests.
The recent-files utility now uses named source exports, and `setupIPCHandlers.ts` imports it natively instead
of requiring the source helper.
Root-context package CLI helper scripts now resolve package entrypoints through `import.meta.resolve`, the
macOS builder dependency helper checks optional package availability through native resolution, and the
preload bundler imports `esbuild` natively instead of using `createRequire`/`require.resolve`; cross-workspace
package resolvers stay intentionally separate because they resolve from another package root.
The runtime build now also bundles `electron-app/main.ts` to the generated CommonJS `dist/main.js` boundary,
allowing Electron to launch through the root CommonJS package manifest while app source stays typed ESM-style.
The main-process module test no longer clears CJS require cache for the ESM-imported main entrypoint, and the
Electron builder file-list test imports the CJS config through native dynamic import instead of `createRequire`.
The env-sensitive Electron Builder identity/signing test now loads the CJS config in a fresh Node dynamic-import
subprocess for each environment case instead of owning a `createRequire`/`require.cache` test bridge.
FIT parser and preload IPC documentation now show ESM-style app-code imports instead of `require(...)` examples,
with docs-alignment coverage preventing those stale CommonJS examples from returning.

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

Progress: the map vendor bundle now removes package-created `L`/`Leaflet` aliases after Leaflet.draw,
MiniMap, markercluster, MapLibre, and the local measurement control are registered on the typed Leaflet
runtime object. The Playwright map smoke path now resolves Leaflet through `leafletRuntime.ts` instead of
depending on `window.L`, while still proving the legacy plugin runtime is registered.

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
call-log globals on `globalThis`. `masterStateManager.ts` now uses module-local test override maps plus typed
imports instead of probing CJS module caches through `node:module`.
Chart notification/loading suppression tests and createAppMenu export tests no longer create or read retired
`__FFV_suppressNotifications`, `__FFV_suppressLoadingState`, or `__FFV_createAppMenuExports` globals; architecture
coverage now keeps those retired renderer compatibility names out of ordinary tests.

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
state instead of writing a `__isObjectKeysWrapper` marker property on wrapper functions. Ordinary unit tests no
longer seed the retired chart suppression or createAppMenu export globals when verifying module-state behavior.

Long-term target: move from global test environment mutation toward per-test explicit runtime objects,
module-local test overrides, and focused fixtures. The recent createAppMenu cleanup is the right pattern.

7. Re-evaluate Windows 7 Compatibility (Complete)

Progress: the local `build:win7` script, Electron 22 build helper, Win7 release-dist workspace path, and Win7
build tests have been removed. The GitHub workflow now carries forward the newest prior
`Fit-File-Viewer-win7-*` release assets onto the target release without installing Node or rebuilding a
Windows 7 binary. README, release, development, Docusaurus, and layout docs now describe Windows 7 as a
legacy snapshot only.

You may commit during this process. You may update this file to keep track of your current progress and where you stand. You must complete all of these FULLY, with no shortcuts, to consider this goal complete.
