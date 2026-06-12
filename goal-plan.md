1. Retire Runtime CommonJS Compatibility (Complete)

The CommonJS compatibility surface is now isolated to the generated Electron package boundary. The current
preload/main build still emits CommonJS-compatible output because Electron packaging launches the generated
`dist/` files from a CommonJS root package manifest, but app source no longer owns source-level
`module.exports` wrappers, injected preload `requireModule` handoffs, direct source `require(...)` calls,
`createRequire`/`require.cache` test bridges, global `require` patches, or the generic runtime
`loadNodeModule` escape hatch.

Progress: `electron-app/preload/apiAssembly.ts` now consumes API assembly-context and domain factory dependencies
from the injected preload module registry instead of requiring sibling preload modules directly. The new
`electron-app/preload/preloadApiAssemblyModuleLoader.ts` now imports the API assembly context and domain
modules natively and returns those imports directly instead of resolving those assembly modules through the
existing `requireModule` handoff or compatibility type-cast aliases while the packaged Electron preload output
remains CommonJS-compatible.
`electron-app/preload/ipcHelpers.ts` and `electron-app/preload/devtoolsMenuApi.ts` now consume shared validation
policies from injected registry entries loaded by `electron-app/preload/preloadPolicyModuleLoader.ts` instead
of requiring shared policy modules directly.
`electron-app/preload/preloadIpcModuleLoader.ts` now imports validators, environment policy, preload event/menu
APIs, Electron API exposure, IPC helpers, logger, bridge catalog, and the Electron bridge resolver natively
instead of resolving those IPC modules through `requireModule`; the resolver imports the Electron package
bridge natively and the runtime build leaves that package as the Electron external boundary.
`electron-app/preload/preloadModuleLoader.ts` now imports the focused app, file, state, policy, API-assembly,
and IPC loader modules natively instead of resolving those loader modules through `requireModule`.
`electron-app/preload/preloadRuntime.ts` now imports preload module loading, API assembly, and Electron API
factory composition natively instead of resolving those composition modules through `requireModule`, and the
runtime object no longer stores the preload `requireModule`.
`electron-app/preload/preloadBootstrap.ts` now imports preload runtime creation and default runtime-environment
discovery natively instead of resolving those bootstrap dependencies through `requireModule`, and it no longer
passes a preload `requireModule` into the Electron bridge resolver.
`electron-app/preload/preloadEntrypoint.ts` now imports only the preload bootstrap module natively instead of
resolving entrypoint dependencies through fallback `requireModule` path rewriting; it no longer accepts or
passes Electron's packaged `require`.
The small preload API assembly-domain factory modules now use named source exports instead of `module.exports`,
while the runtime build still emits CommonJS-compatible package output.
The first preload app API leaf factories (`apiDiagnostics.ts`, `appInfoApi.ts`, `gyazoExternalApi.ts`,
`shellExternalApi.ts`, and `themeApi.ts`) now use named source exports too, with direct unit tests importing
those named source exports natively, and `preloadAppModuleLoader.ts` now imports app, clipboard, devtools,
external, theme, environment, and before-exit leaf modules natively instead of resolving them through
`requireModule`.
The preload file and clipboard leaf factories (`clipboardBridge.ts`, `fileApi.ts`, and `fitBrowserApi.ts`)
also use named source exports, and `preloadFileModuleLoader.ts` now imports the file/FIT-browser leaf modules
natively instead of resolving them through the injected `requireModule` boundary while the remaining loader
boundaries still provide CommonJS-compatible package output.
The preload state leaf factories (`mainStateApi.ts` and `mainStateBridge.ts`) now use named source exports
too, with direct unit tests importing those named source exports natively, and `preloadStateModuleLoader.ts`
now imports those state leaf modules natively instead of resolving them through the injected `requireModule`
boundary.
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
tests start the entrypoint directly with explicit Electron bridge overrides instead of simulating an injected
`requireModule` boundary.
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
and `electronAccess.ts` now imports the Electron package natively through the main build's external package
boundary instead of owning a direct package `require("electron")` or `loadNodeModule("electron")` call; its
unused default namespace export has also been removed.
The app-menu creation boundary (`createAppMenu.ts` plus `utils/app/menu/index.ts`) now uses named source
exports/imports instead of source-level `module.exports` or a barrel `require`, and `safeCreateAppMenu.ts`
imports the menu creator natively. `createAppMenu.ts` also imports recent-file and file-access helpers
natively instead of requiring those source modules.
The auto-updater access helper now uses named source exports too, and setup/menu/bootstrap consumers import
the updater resolver boundary natively instead of requiring its source file. Electron-updater now resolves
through the async native import path instead of a synchronous `loadNodeModule` or direct package
`require("electron-updater")` fallback, and the redundant Node ESM `module.exports` namespace branch plus
the unused default namespace export have been removed.
The Node runtime module boundary now imports Node built-ins natively for `path`, `fs`, and `httpRef`; its
generic `loadNodeModule` package-compatibility escape hatch and unused default namespace export have been
removed. File-access, IPC sender policy, Gyazo OAuth, application-event, menu-event, IPC setup, and Electron
access consumers import that boundary natively instead of requiring its source file or owning separate direct
package-load fallbacks.
Electron-conf access is now centralized in `electron-app/main/runtime/electronConfAccess.ts`; the adapter
imports Electron-conf natively, exposes named source exports only, and keeps app state, FIT-parser integration,
app-menu creation, menu event handling, and browser/info IPC handlers off direct source-level
`require("electron-conf")` calls.
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
source-level `module.exports` fallback, and the test-only default export object has been removed so tests use
named exports directly.
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
The main-process state-manager test now relies on the typed Electron access override plus native Electron mock
instead of patching `global.require` to intercept `require("electron")`, with architecture coverage blocking
that CommonJS-in-ESM test bridge from returning.
The obsolete `tests/unit/preload.debug.test.ts` module-cache injection test has been removed because the dist
preload tests already execute `dist/preload.js` with controlled `require`, `process`, and `console` doubles;
architecture coverage keeps that old debug cache-injection test from returning.
The dist-preload test helper now recognizes the current bundled preload entrypoint shape, so a valid runtime
build is reused instead of each worker attempting a redundant `dist/` rebuild.
FIT parser and preload IPC documentation now show ESM-style app-code imports instead of `require(...)` examples,
with docs-alignment coverage preventing those stale CommonJS examples from returning.

Maintenance target: keep CommonJS isolated to the generated build/package boundary until the Electron preload
and main launch path can move to native ESM output. App source should stay typed ESM-style, preload bundling
must continue to handle Electron's packaging requirements, and tests should stay off special
CommonJS-in-ESM mock patterns.

2. Replace Remaining Vendor Compatibility Bundles With Import-Driven Feature Loading (Fully finish)

The renderer dependency inventory says the app still loads browser libraries through split renderer
compatibility bundles: /C:/Repos/FitFileViewer/docs/RENDERER_DEPENDENCY_INVENTORY.md:9. The important
remaining vendor problem is shrinking those split bundles further now that Leaflet.draw no longer needs a
Vite package transform.

Long-term target: replace the remaining Leaflet.draw virtual runtime wrapper with a package or local module that accepts explicit imports natively,
and eventually reduce or remove vendorGlobals\* compatibility
entries where feature-local dynamic imports can do the job cleanly.

Progress: the map vendor bundle now imports MiniMap as a constructor and registers it explicitly on the typed
Leaflet runtime object. The disabled markercluster
path has also been removed from the map vendor bundle and root dependency manifest instead of keeping a
global-`L` plugin in the runtime bundle, and map drawing no longer threads the stale `markerClusterGroup`
option through route/overlay marker rendering. The bundle still removes package-created `L`/`Leaflet` aliases
after Leaflet.draw, MapLibre, and the local measurement control are registered. The Playwright map smoke path now
resolves Leaflet through `leafletRuntime.ts` instead of depending on `window.L`, and the old Vite package
transform for Leaflet.draw has been removed. Leaflet.draw now loads through the
`fitfileviewer:leaflet-draw-runtime` virtual side-effect module, which gives the package dist file a
module-scoped Leaflet import without publishing a persistent `L` global. Leaflet runtime unit tests now reset only the typed module-local adapter instead of
deleting retired `L` globals from `globalThis`.

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
The renderChartJS comprehensive test now uses ESM mocks without the old `utils.require` module-cache bridge,
and architecture coverage keeps that require-hook pattern from returning.

6. Reduce Test Harness Global Pollution (Fully finish)

Not all globalThis usage is bad: browser/runtime abstractions need it. But tests/vitest/setupVitest.mjs
still has a lot of global shimming. That is not product deprecation, but it is a long-term maintainability
risk because it can hide dependency mistakes.

Progress: the Vitest Object.keys guard no longer publishes the retired
`__vitest_object_keys_allow_throw` flag on globalThis. It now rethrows only for the logger failure-path stack,
and architecture coverage keeps that retired test global out of tests and setup. The Vitest document guard's
native-method cache now lives in module-local WeakMap state instead of publishing
`__vitest_doc_native_methods` on globalThis, with architecture coverage for that retired harness global too.
Setup-level jsdom document restoration now goes through the descriptor-scoped `setRuntimeDocument()` helper
instead of assigning `globalThis.document` or `curWin.document` directly, with architecture coverage blocking
that realignment shortcut from returning.
The unused `createElectronMocks` global helper has also been removed from setup; Electron tests should use
explicit local fixtures or `vi.mock(...)` factories. Opaque-origin Web Storage hardening now lives in
`tests/vitest/shims/nodeWebStorage.ts` instead of an inline `StorageMock`, `ensureSafeLocalStorage`, or
`ensureSafeSessionStorage` setup block, with architecture coverage blocking direct setup storage fallback
assignments from returning. Setup-level timeout, interval, and DOM listener tracking
now uses module-local state instead of `__vitest_tracked_*` and `__vitest_timers_wrapped` globals, and timer
wrapper installation goes through the descriptor-scoped `installTrackedTimerFunction()` helper instead of
assigning `globalThis.setTimeout`, `globalThis.setInterval`, `globalThis.clearTimeout`, or
`globalThis.clearInterval` directly. The
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
The main-process state-manager test also resets its typed Electron override after each test instead of installing
an ambient `global.require` patch.
The renderChartJS comprehensive test no longer installs an ambient `utils.require` hook or carries module-cache
mocking terminology for its ESM mock setup.
Root lint no longer reports Testing Library false-positive warnings from renderer/runtime helper names in
non-React unit tests; those tests now use local aliases that avoid render-result and lifecycle-render heuristics.
Animation debug logging tests no longer seed the retired `__renderer_dev` global when proving typed renderer
debug logging state controls animation logs, and architecture coverage keeps that test off the old global.
Strict renderer startup tests also no longer delete the retired `__renderer_dev` global during fresh imports,
with architecture coverage keeping that startup test on the typed renderer development helpers.
Renderer development debug tests no longer clean up retired debug globals such as `__renderer_debug`,
`__renderer_dev`, `__sensorDebug`, or `__debugChartFormatting`; their coverage now checks absence without
mutating those names, and architecture coverage blocks those mutations from returning.
State integration unit tests no longer seed or delete retired AppState, chart-controls, globalData,
render-state, timer, development, or state-debug globals while proving initialization leaves them absent;
architecture coverage now blocks those retired state-integration global mutations from returning.
State integration comprehensive tests now install localStorage and performance browser fixtures through
descriptor-scoped helpers instead of assigning or reflecting directly onto `globalThis`, with architecture
coverage blocking that fixture mutation pattern.
Debug sensor unit tests also no longer define or delete a stale `globalData` property when proving sensor
availability comes from active FIT state, and architecture coverage keeps that retired global mutation out.
Loaded FIT file state tests no longer assign or delete the retired `loadedFitFiles` global while proving
loaded-file storage stays in explicit state, and architecture coverage blocks that mutation from returning.
App event listener tests no longer define or delete retired `globalData` or `loadedFitFiles` globals; they seed
active FIT data and loaded-file fixtures through typed domain state helpers, and architecture coverage blocks
those test-global mutations from returning.
GPX export button, chart theme listener, and user/device info tests no longer type or clean retired
`globalData`/`loadedFitFiles` globals; they rely on typed state resets and active FIT data fixtures, and
architecture coverage blocks those cleanup patterns from returning.
Strict chart settings dropdown tests no longer seed the mocked state manager through the retired `globalData`
path; they use the current `fitFile.rawData` fixture path that `FitFileSelectors` reads, with architecture
coverage blocking the stale fixture from returning.
Strict render-map tests no longer type or assign retired FIT data globals on `window`; they seed loaded-file
fixtures through `loadedFitFilesState`, and architecture coverage blocks the stale window fixture from returning.
Tab visibility state tests now use the `updateTabVisibility.fitRawDataState.test.ts` filename and active raw FIT
data callback/mocked-selector naming instead of retired `globalData` terminology, with architecture coverage
blocking the old filename and fixture vocabulary. That raw-data state coverage now also installs its jsdom
`window`/`document` globals through descriptor-scoped helpers instead of assigning `(global as any).window` or
`(global as any).document`, with architecture coverage blocking those direct browser-global fixtures.
Tab-state manager regression tests now pass `rawFitData` table fixtures into `updateTabAvailability` instead of
retired `globalData` entries, with architecture coverage blocking that stale regression vocabulary.
Tab button state integration tests now model loaded FIT data only through the active `fitFile.rawData` state
slot instead of carrying a retired `globalData` fixture slot, with architecture coverage blocking that stale
integration fixture shape.
Strict main UI tests no longer seed a retired `globalData` mock-state key while exercising renderer startup
flows, with architecture coverage blocking that stale strict-test fixture.
Computed state manager tests now use neutral `sampleData` dependencies for generic computed-value coverage
instead of normalizing the retired `globalData` state path, with architecture coverage blocking that stale fixture.
Chart resize listener tests no longer install or clean legacy Chart.js renderer globals while proving
fullscreen resize uses registered chart instances, with architecture coverage preventing those mutations.
RenderChartJS comprehensive tests no longer delete retired Chart.js runtime globals such as `Chart`,
`ChartZoom`, or `chartjsPluginZoom`; they use the typed chart runtime test API, and architecture coverage
blocks those mutations from returning.
RenderChartJS state API tests no longer install a retired `window.Chart` fixture for state-only helper
coverage, their chart-data fixtures now default through `fitFile.rawData` instead of retired `globalData`,
and architecture coverage blocks those stale fixtures from returning.
Strict lap-zone chart tests now name their raw-data fixtures as active FIT data instead of retired `globalData`,
matching the production `getActiveFitActivityData()` path, and architecture coverage blocks the stale fixture
names from returning.
Strict create-enhanced-chart and zone-chart tests now install browser globals through descriptor-scoped fixtures
instead of assigning or deleting `globalThis` properties directly, with architecture coverage blocking that
test-harness mutation pattern.
Chart zone color utility tests now install localStorage through a descriptor-scoped fixture instead of assigning
`globalThis.localStorage` directly, with architecture coverage blocking that fixture mutation pattern.
Chart status indicator tests now install temporary document, window, constructor, timer, and event-listener
fixtures through descriptor-scoped helpers instead of assigning browser globals or event handlers directly, with
architecture coverage blocking that fixture mutation pattern.
Main UI startup tests no longer delete retired renderer globals such as `devCleanup`, `injectMenu`,
`showFitData`, `renderChartJS`, or `cleanupEventListeners` while proving those globals stay absent, and
architecture coverage blocks those mutations from returning.
Zone-color picker tests no longer delete or set retired renderer helper globals such as
`clearZoneColorData`, `updateInlineZoneColorSelectors`, or `renderChartJS`; they now assert those names stay
absent while using typed ESM mocks, and architecture coverage blocks those mutations from returning.
Keyboard-shortcuts modal tests no longer delete retired modal presenter globals such as
`showKeyboardShortcutsModal` or `closeKeyboardShortcutsModal` before module import; they now assert those
names stay absent, and architecture coverage blocks those mutations from returning.
Unified state manager tests no longer delete the retired `globalData` global while proving the blocked
facade does not route to active FIT data; they now assert the global stays absent, and architecture coverage
blocks that mutation from returning.
Lifecycle listener strict tests no longer delete or define retired helper globals such as `globalData`,
`sendFitFileToAltFitReader`, `renderChartJS`, `copyTableAsCSV`, or `createExportGPXButton`; they now assert
those names stay absent, and architecture coverage blocks those mutations from returning.
Tab-button behavior tests no longer delete retired enabled-state, observer, or diagnostic helper globals such
as `tabButtonsCurrentlyEnabled`, `tabButtonObserver`, `areTabButtonsEnabled`, or `forceFixTabButtons`; they
now assert those names stay absent, and architecture coverage blocks those mutations from returning.
Vitest setup no longer disconnects or deletes a retired `window.tabButtonObserver` cleanup hook; tab-button
observer lifecycle stays in the typed tab-button module state.
Chart tab integration tests no longer delete the retired `chartTabIntegration` global before each case; they
now assert the typed singleton stays absent from `globalThis`, and architecture coverage blocks that mutation
from returning.
State devtools tests no longer delete the retired `__stateDebug` debug global around cleanup or initialization;
they now assert typed debug utilities stay off `globalThis`, and architecture coverage blocks that mutation
from returning.
Vitest setup no longer deletes a retired `window.__chartjs_dev` cleanup global; chart development helpers stay
behind `chartDevToolsRegistry`.
Render chart runtime helper tests no longer create or delete retired `chartActions` or `chartStateManager`
globals when proving registry-based resolution; architecture coverage blocks those mutations from returning.
Settings modal tests no longer delete retired `showSettingsModal` or `closeSettingsModal` globals during
fixture setup or cleanup; they now assert presenter helpers stay absent, and architecture coverage blocks
those mutations from returning.
Render-summary helper tests no longer create or delete the retired `window.activeFitFileName` fallback when
proving default storage-key behavior; architecture coverage blocks those mutations from returning.
Main-process unit tests no longer delete the retired `devHelpers` global during cleanup; they now assert
development helpers stay module-returned and absent from `globalThis`, and architecture coverage blocks that
mutation from returning.
Tab-state manager behavior tests no longer delete a retired `window.renderSummary` global before proving
summary rendering uses typed imports, and architecture coverage blocks that mutation from returning.
Active-tab fallback tests now install missing-document and window-document browser fixtures through
descriptor-scoped helpers instead of reflecting directly onto `globalThis`, with architecture coverage blocking
that fallback fixture mutation pattern.
Additional theme tests now install temporary `matchMedia`, `localStorage`, and `getComputedStyle` browser
fixtures through descriptor-scoped helpers instead of reflecting directly onto `globalThis`, with architecture
coverage blocking that fixture mutation pattern.
Credits marquee tests now install temporary `ResizeObserver` availability through a descriptor-scoped fixture
instead of assigning `globalThis.ResizeObserver` directly, with architecture coverage blocking that fixture
mutation pattern.
Strict about modal tests now install their immediate `requestAnimationFrame` fixture through a descriptor-scoped
helper instead of assigning `globalThis.requestAnimationFrame` directly, with architecture coverage blocking
that fixture mutation pattern.
Strict notification branch tests now rely on Vitest mock restoration for `window.requestAnimationFrame` instead
of assigning the original callback back during cleanup, with architecture coverage blocking that direct
animation-fixture assignment.
Complete file-open tests now install temporary `process.env` coverage through a descriptor-scoped fixture
instead of assigning `globalThis.process` directly, with architecture coverage blocking that fixture mutation
pattern.
Data-point filter control tests now install temporary animation-frame and microtask fixtures through
descriptor-scoped helpers instead of assigning `globalThis.requestAnimationFrame`,
`globalThis.cancelAnimationFrame`, or `globalThis.queueMicrotask` directly, with architecture coverage blocking
that fixture mutation pattern.
Shared configuration tests now install the throwing `URLSearchParams` fixture through a descriptor-scoped helper
instead of assigning `global.URLSearchParams` directly, with architecture coverage blocking that fixture
mutation pattern.
Tab-button behavior tests now install temporary `window`, `getComputedStyle`, and `MutationObserver` browser fixtures through
descriptor-scoped helpers instead of assigning `globalThis.window`, `(global as any).window`, or
`globalThis.getComputedStyle`, `global.MutationObserver`, or `global.window.MutationObserver` directly, with
architecture coverage blocking that fixture mutation pattern.
Leaflet runtime tests no longer delete retired `L` or `Leaflet` globals while proving the typed adapter
resolves only explicitly registered runtimes, and architecture coverage blocks those test-global mutations
from returning.
Shown-files list tests now pass an explicit local Leaflet runtime fixture to `setLeafletRuntime()` instead of
stashing the fixture on `window.L` or reaching markers through `global.window.L`, with architecture coverage
blocking that retired test fixture pattern.
The shared Vitest Leaflet mock no longer advertises the removed markercluster package path through a
`markerClusterGroup` helper, and architecture coverage keeps that stale plugin mock out of setup.
Vitest setup no longer registers a default Leaflet runtime for every test; map-related tests install explicit
Leaflet runtime fixtures when they need one, and architecture coverage keeps setup off `setLeafletRuntime`.
The unused setup-level Leaflet module mock object has also been removed; map tests now own their focused
Leaflet fixtures instead of inheriting a broad fake map library from global setup.
The broad setup fallback that fabricated `window.addEventListener`, `window.removeEventListener`, and no-op
`window.dispatchEvent` implementations has been removed; tests now rely on jsdom's real event-target APIs or
their own focused fixtures.
The setup-level `global.HTMLElement = window.HTMLElement` bridge has also been removed; jsdom-backed suites now
use the environment's native element constructors without another shared global assignment.
Setup console hardening now uses the existing `ensureConsoleAlive()` path instead of separately patching
`window.console.group`, `window.console.groupEnd`, and `window.console.groupCollapsed` in another global block.
Preload and main-UI runtime-environment tests now install temporary console handles through descriptor-scoped
fixtures instead of direct `globalThis.console` assignment, with architecture coverage blocking that pattern.
Preload source execution tests now install their temporary development-log console through a descriptor-scoped
helper instead of direct `global.console` assignment, with architecture coverage blocking that pattern too.
Preload development-mode and edge-case tests now clear and restore `electronAPI`/`devTools` globals through
descriptor-scoped helpers instead of direct global deletion, with architecture coverage blocking that cleanup
pattern.
Setup process-nextTick stabilization now uses one `ensureProcessNextTick()` helper instead of repeating the same
inline `globalThis.process.nextTick` mutation in multiple setup hooks.

Long-term target: move from global test environment mutation toward per-test explicit runtime objects,
module-local test overrides, and focused fixtures. The recent createAppMenu cleanup is the right pattern.

7. Re-evaluate Windows 7 Compatibility (Complete)

Progress: the local `build:win7` script, Electron 22 build helper, Win7 release-dist workspace path, and Win7
build tests have been removed. The GitHub workflow now carries forward the newest prior
`Fit-File-Viewer-win7-*` release assets onto the target release without installing Node or rebuilding a
Windows 7 binary. README, release, development, Docusaurus, and layout docs now describe Windows 7 as a
legacy snapshot only.

You may commit during this process. You may update this file to keep track of your current progress and where you stand. You must complete all of these FULLY, with no shortcuts, to consider this goal complete.
