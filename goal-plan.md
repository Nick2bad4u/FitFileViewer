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
while the runtime build still emits CommonJS-compatible package output. Native open-file, open-folder, and overlay
dialog access now flows through explicit dialog assembly and final electron API domains instead of being carried by the
file/browser domain.
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
The preload runtime environment, bootstrap, entrypoint, and preload source tests no longer carry a generic
`globalScope` option; preload startup now resolves only the console and process references it actually consumes.
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
requiring the source files directly. FIT parser state-integration test reset and adapter overrides now stay in
module-local state behind named test helper exports instead of custom `globalThis` properties.
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
and eventually reduce or remove rendererVendor\* compatibility
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
Generated split renderer vendor assets now use `renderer-vendor*.js/css` filenames instead of the retired
`vendor-globals*.js/css` compatibility wording, while preserving the typed loader entry semantics and runtime
readiness event flow.
Renderer vendor loader readiness polling, readiness-event listener registration, clock reads, AbortController
creation, and vendor script lookup/injection now route through `vendorBundleLoaderRuntime.ts` instead of calling
browser globals directly in `vendorBundleLoader.ts`, with adapter tests and architecture coverage blocking direct
vendor-loader browser globals from returning.
Renderer vendor map minimap toggle icon document-element style writes now route through
`rendererVendorMapRuntime.ts` instead of probing `globalThis.document` directly inside `rendererVendorMap.ts`,
with focused runtime coverage and architecture guardrails blocking direct document probes from returning.
Renderer vendor map package-created `L`/`Leaflet` alias cleanup now also uses a focused
`deleteGlobalProperty` provider instead of a broad `getGlobalScope` provider, with runtime and architecture
coverage blocking that whole-global handoff from returning.
The installed `leaflet-draw` package still exposes only `dist/leaflet.draw.js` through `main` and has no
`module` or `exports` entry, so the remaining virtual runtime wrapper is now covered as an explicit package
surface constraint instead of an untracked cleanup candidate.

3. Finish Shrinking The Renderer Composition Root (Complete)

Progress: electron-app/main-ui.ts no longer declares itself as the legacy renderer composition root, no longer
carries the max-dependencies lint exception, and no longer owns the managed-state/legacy-global unload wording.
It is now only the renderer entrypoint/export bridge. Startup coordination lives in
electron-app/renderer/mainUiStartup.ts, while preload API validation, theme synchronization, FIT unload
cleanup/listener registration, summary selector registration, external-link startup, shutdown hooks, menu
injection, development cleanup, drag/drop construction, state-startup logging, and vendor/fullscreen startup
live in focused modules under electron-app/renderer/.
FIT unload operation IDs now read time through `mainUiRuntimeEnvironment.ts` instead of calling `Date.now`
directly in `mainUiUnloadFlow.ts`, with runtime-environment and architecture coverage blocking the direct clock
global from returning.

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
or a map-style manual-mock override API. Export utility print image-load cleanup, Gyazo modal cleanup, and Imgur
modal cleanup now create abort controllers through `exportUtilsRuntime.ts`, and destructive-action confirmation
prompts now route through the same runtime instead of probing `globalThis.window` directly inside
`exportUtils.ts`; default export browser helpers now bind confirm/open calls to `globalThis` without a module-level
`browserGlobal` alias, with focused runtime coverage and architecture guardrails blocking direct export utility
browser-runtime access from returning. Default export browser helpers no longer use ad hoc optional browser-global
fields. The
fullscreen control startup path no longer exports the deprecated `setupDOMContentLoaded` alias; callers must
use `setupFullscreenListeners`, and fullscreen button listener abort-controller creation now routes through
`addFullScreenButtonRuntime.ts` instead of constructing `AbortController` directly inside
`addFullScreenButton.ts`. Fullscreen button loaded-file state now also resolves the button and body class through
`addFullScreenButtonRuntime.ts` instead of reading `document.getElementById` and `document.body.classList` in that
state update path. `showFitData` no longer accepts the deprecated `resetRenderStates` option;
render-state resets belong to `AppActions` and typed renderer state facades. Chart state-manager and chart-tab
integration cleanup now calls `destroy()` directly instead of retaining `cleanup()` compatibility aliases.
Chart render lifecycle helpers now use `getChartLifecycleActions` instead of the retired global action bridge
wording. `createAppMenu` Electron menu tests now use module-local fixture state instead of `__electron*` and
call-log globals on `globalThis`. `masterStateManager.ts` now uses module-local test override maps plus typed
imports instead of probing CJS module caches through `node:module`.
Chart canvas element creation now routes through `createChartCanvasRuntime.ts` instead of calling
`document.createElement` directly inside `createChartCanvas.ts`, with focused runtime coverage and architecture
guardrails blocking direct canvas document access and legacy direct runtime scope properties from returning.
Chart no-data message element creation now routes through `renderChartDomHelpersRuntime.ts` instead of calling
`document.createElement` directly inside `renderChartDomHelpers.ts`, with focused runtime/behavior coverage and
architecture guardrails blocking direct chart DOM-helper document access and legacy direct runtime scope properties
from returning.
Overlay file load concurrency and active-tab preservation now resolve browser metadata and active-tab DOM state
through `loadOverlayFilesRuntime.ts` instead of probing `globalThis.navigator` or querying `document` directly
inside `loadOverlayFiles.ts`; production defaults and explicit runtime scopes stay behind named provider functions
instead of a broad `globalThis` default scope or direct `document`/`navigator` properties, with focused runtime
coverage and architecture coverage blocking direct navigator and active-tab document access from returning.
Single overlay FileReader fallback listener abort-controller creation now routes through
`loadSingleOverlayFileRuntime.ts` instead of constructing `AbortController` directly inside
`loadSingleOverlayFile.ts`; production defaults and explicit runtime scopes now use a named provider function
instead of a broad `globalThis` default scope or direct `AbortController` property, with focused runtime coverage
and architecture guardrails blocking direct single-overlay controller construction from returning.
Open-file selector hidden input creation, jsdom detection, microtask fallback, timeout cleanup, and
abort-controller creation now route through `openFileSelectorRuntime.ts` instead of calling browser primitives or
constructing controllers directly inside `openFileSelector.ts`, with focused runtime coverage and architecture
guardrails blocking those direct selector runtime primitives from returning.
Browser tab container/status/view-button lookups, Files/Calendar/Library view path/content/control lookups, open-file
button lookup, Browser tab scaffold/row/card/control element and text-node creation, HTMLElement/input/select checks, and
managed listener abort-controller creation now route through `fileBrowserTabRuntime.ts` instead of reading those Browser
tab DOM primitives or constructing `AbortController` directly inside `fileBrowserTab.ts`, with focused runtime coverage
and architecture guardrails blocking those direct Browser tab DOM primitives from returning.
Power-estimation settings modal listener abort-controller creation, Escape-key document listener registration,
modal element creation, body attachment, and body containment checks now route through
`openPowerEstimationSettingsModalRuntime.ts` instead of constructing `AbortController`, registering document
listeners, creating elements through `document`, or reading `document.body` directly inside
`openPowerEstimationSettingsModal.ts`, with focused runtime coverage and architecture guardrails blocking
direct modal controller and document access from returning.
CSV table clipboard fallback now routes browser clipboard writes and legacy textarea copy through
`copyTableAsCSVRuntime.ts` instead of probing `navigator.clipboard` or calling document copy APIs directly inside
`copyTableAsCSV.ts`; production defaults and explicit runtime scopes now use named provider functions instead of
a broad `globalThis` default scope or direct document/navigator properties, with focused runtime coverage and
architecture guardrails blocking those direct browser clipboard paths from returning.
App performance debounce, throttle, batch, and idle-callback helpers now route timeout scheduling/clearing,
idle-callback scheduling/cancellation, and clock reads through `performanceUtilsRuntime.ts` instead of calling
timer, idle-callback, or `Date.now` globals directly inside `performanceUtils.ts`, with focused behavior/runtime
coverage and architecture guardrails blocking those direct scheduling globals from returning. Performance runtime
production defaults now live behind named provider functions, and explicit runtime scopes must now provide timer,
idle-callback, and clock providers instead of direct properties or falling back to `globalThis` or `Date.now`, with
focused coverage blocking those ambient fallbacks from returning.
Lazy-rendering timeout fallback scheduling now routes through `lazyRenderingRuntime.ts`, and explicit runtime
scopes must provide `setTimeout` instead of falling back to `globalThis`, with focused coverage blocking that
ambient fallback from returning.
Async cancellation token helpers now route timeout-backed token cancellation and cancellable delay scheduling
through `cancellationTokenRuntime.ts` instead of calling timer globals directly inside `cancellationToken.ts`,
with focused runtime/token coverage and architecture guardrails blocking those direct timer globals from returning.
Explicit cancellation runtime scopes must now provide timer primitives instead of falling back to `globalThis`,
with focused coverage blocking those ambient fallbacks from returning.
Chart hover effects now route fullscreen resize scheduling, fullscreen target waits, ripple cleanup timers, and
fullscreen cleanup abort-controller creation through `addChartHoverEffectsRuntime.ts` instead of calling
animation-frame/timer globals or constructing `AbortController` directly inside `addChartHoverEffects.ts`, with
focused runtime coverage and architecture guardrails blocking those direct scheduling/controller globals from
returning.
Chart listener lifecycle abort-controller creation now routes through `chartListenerStateRuntime.ts`, and explicit
runtime scopes must provide their controller instead of falling back to `globalThis.AbortController`, with focused
runtime coverage and architecture guardrails blocking the ambient controller fallback from returning.
Chart hover effects scheduling, abort-controller creation, and document listener wiring now use named runtime provider
functions instead of a broad `globalThis` default scope or legacy direct scope properties.
Inline SVG creation now routes through focused runtime facades for the app icon factory, global fullscreen button,
exit-fullscreen overlay, chart hover overlays, chart hover effect runtime SVG creation, keyboard-shortcuts modal,
quick color switcher icons, settings modal icons, about modal icons,
map export/print controls, loading overlay, add-FIT-to-map control, marker-count selector, data-point filter icons, render-summary controls, map theme toggle,
elevation-profile button, map fullscreen control, and map measurement toolbar instead of calling
`document.createElementNS` directly, with architecture coverage blocking raw SVG DOM creation from returning to
Electron app source.
Elevation-profile popup and chart-overlay palette defaults now resolve through focused global-property helpers in
`createElevationProfileButtonRuntime.ts` instead of casting `globalThis` to a feature-specific runtime scope or
using generic `Reflect.get(globalThis, ...)` probes.
Field-toggle DOM construction, custom event dispatch, listener abort-controller creation, input checks, and fallback
timers now route through `createFieldTogglesSectionRuntime.ts`; production defaults and explicit runtime scopes now
use named provider functions instead of a broad `globalThis` default scope, direct scope properties, or
document-window fallbacks, with focused runtime coverage and architecture guardrails blocking those ambient
fallbacks from returning.
Field-toggle individual and bulk chart re-render requests now resolve the chart state manager through
`chartStateManagerRegistry.ts` instead of importing the concrete singleton directly, with fallback requests still
going through the chart-actions registry and render-request event path.
Zone color picker render-request event construction/dispatch, modal element creation, active-element reads, body
attachment/containment, document lookup for chart settings, body access for inline selector refreshes, Escape-key
document listener registration, and element/keyboard-event type checks now route through
`openZoneColorPickerRuntime.ts`; production defaults and explicit runtime scopes now use named provider functions
instead of a broad `globalThis` default scope, direct scope properties, document-window fallbacks, or ambient DOM
constructor checks in the picker, and zone-color reset/apply rerender requests now resolve the chart state manager
through `chartStateManagerRegistry.ts` instead of importing the concrete singleton directly, with focused runtime
coverage and architecture guardrails blocking those direct dependencies from returning.
Quick color switcher delayed dropdown close scheduling and cleanup now route through
`quickColorSwitcherRuntime.ts` instead of calling timer globals directly inside `quickColorSwitcher.ts`, with
focused runtime coverage and architecture guardrails blocking those direct timer globals from returning. Quick
color switcher listener cleanup now also creates abort controllers through `quickColorSwitcherRuntime.ts`
instead of constructing `AbortController` directly in `quickColorSwitcher.ts`, with focused runtime coverage
and architecture coverage blocking direct quick-color switcher abort-controller construction from returning.
Quick color switcher outside-click document listener registration now also routes through
`quickColorSwitcherRuntime.ts` instead of registering that document listener directly inside
`quickColorSwitcher.ts`, with focused runtime coverage and architecture coverage blocking direct quick-color
switcher document listener registration from returning. Explicit quick color switcher runtime scopes must now
provide their document and delayed-close timer primitives instead of falling back to `globalThis`, with focused
runtime coverage and architecture coverage blocking those fallbacks from returning.
Quick color switcher DOM construction, SVG construction, text-node creation, document query/append operations, and
outside-click node checks now also route through `quickColorSwitcherRuntime.ts` instead of using direct document APIs
or `instanceof Node` inside `quickColorSwitcher.ts`, with runtime tests and architecture coverage blocking those
direct browser APIs from returning.
Map theme toggle delayed refresh scheduling and cleanup now route through `mapThemeToggleRuntime.ts` instead of
calling timer globals directly inside `mapThemeToggleState.ts`, with focused runtime coverage and architecture
guardrails blocking those direct timer globals from returning. Map theme toggle listener abort-controller
creation and document listener registration now also route through `mapThemeToggleRuntime.ts` instead of
constructing `AbortController` or registering document listeners directly inside `mapThemeToggleState.ts`, with
focused runtime coverage and architecture coverage blocking those direct browser APIs from returning. Explicit
map theme toggle runtime scopes must now provide their document and timer primitives instead of falling back to
`globalThis`, with focused runtime coverage and architecture coverage blocking those fallbacks from returning. The map theme toggle
button listener controller now also comes from `mapThemeToggleRuntime.ts` instead of constructing `AbortController`
directly inside `createMapThemeToggle.ts`, with architecture coverage blocking that direct controller construction
from returning. Existing map theme toggle lookup now also goes through `mapThemeToggleRuntime.ts` instead of querying
`document` directly inside `createMapThemeToggle.ts`, with focused runtime coverage and architecture coverage blocking
that direct selector from returning. Map theme toggle button/span/SVG/fallback DOM creation now also routes through
`mapThemeToggleRuntime.ts` instead of calling `document.createElement` or `document.createElementNS` directly inside
`createMapThemeToggle.ts`, with focused runtime coverage and architecture coverage blocking those direct creation APIs
from returning. Map theme toggle body dark-theme reads now also route through `mapThemeToggleRuntime.ts`
instead of reading `document.body.classList` inside `createMapThemeToggle.ts`, with focused runtime coverage
and architecture coverage blocking that direct body read from returning. Map theme update listener cleanup now creates its abort controller through
`updateMapThemeRuntime.ts` instead of constructing `AbortController` directly inside `updateMapTheme.ts`, with
focused runtime coverage and architecture coverage blocking that direct controller construction from returning.
Core theme transition-class removal scheduling, system-theme media-query lookup, theme-change window target access,
and system-theme listener abort-controller creation now route through `themeRuntime.ts` instead of probing
`globalThis.window`, probing `globalThis.matchMedia`, calling timer globals, or constructing `AbortController`
directly inside `theme.ts`, with focused runtime coverage and architecture guardrails blocking those direct
browser/timer/controller globals from returning. Explicit core theme runtime scopes must now provide timer
primitives instead of falling back to `globalThis`, with focused runtime coverage and architecture coverage blocking
those fallbacks from returning. Default media-query helpers now use typed provider picks instead of direct optional
browser-global shapes, and the default media-query provider now binds `matchMedia` to `globalThis` without a
module-level `browserGlobal` alias.
Core theme transition-style injection and meta theme-color updates now also route through `themeRuntime.ts` instead
of querying, creating, or appending through `document` directly inside `theme.ts`, with focused runtime coverage and
architecture guardrails blocking those direct theme DOM calls from returning.
Accent color target lookup and persisted color storage access now route through `accentColorRuntime.ts` instead of
probing `document`, `HTMLElement`, or `localStorage` directly inside `accentColor.ts`, with focused runtime/behavior
coverage and architecture coverage blocking those direct browser/storage calls from returning.
Show FIT data post-load map-container detection, scroll availability checks, reduced-motion media queries,
microtask scheduling, and scroll calls now route through `showFitDataRuntime.ts` instead of probing `document`,
`globalThis.scrollTo`, `globalThis.matchMedia`, or `queueMicrotask` directly inside `showFitData.ts`, with
focused runtime/behavior coverage and architecture guardrails blocking those direct browser APIs from returning.
Data tab table container lookup now routes through `createTablesRuntime.ts` instead of querying `document` directly
inside `createTables.ts`, with focused runtime/behavior coverage and architecture guardrails blocking direct
container queries and legacy direct document runtime-scope properties from returning.
Setup theme main-process fetch timeout scheduling and cleanup now route through `setupThemeRuntime.ts` instead
of calling timer globals directly inside `setupTheme.ts`, with focused runtime coverage and architecture
guardrails blocking those direct timer globals from returning. Explicit setup-theme runtime scopes must now
provide timer primitives instead of falling back to `globalThis`, with focused coverage and architecture coverage
blocking those ambient fallbacks from returning.
Map document listener abort-controller creation, Leaflet layers-control lookup, and document/window listener registration
now route through `mapDocumentListenersRuntime.ts` instead of constructing `AbortController`, querying `document`, or
registering document/window listeners directly inside `mapDocumentListeners.ts`, with focused runtime coverage and
architecture guardrails blocking those direct browser APIs from returning. Explicit map document listener runtime scopes
must now provide their document/window targets instead of falling back to `globalThis.document` or `globalThis.window`,
with focused runtime coverage and architecture coverage blocking those fallbacks from returning.
Map document listener HTMLElement and Node checks now also route through `mapDocumentListenersRuntime.ts` instead of
using direct `instanceof HTMLElement` or `instanceof Node` checks inside `mapDocumentListeners.ts`, with focused runtime
coverage and architecture coverage blocking those direct browser constructor checks from returning.
Shared configuration loading now routes URL search reads, chart-refresh timer scheduling, and chart-refresh
timer cleanup through `loadSharedConfigurationRuntime.ts` instead of probing location or calling timer globals
directly inside `loadSharedConfiguration.ts`, with focused runtime coverage and architecture guardrails blocking
those direct location/timer globals from returning. Explicit shared-configuration runtime scopes must now provide
timer primitives instead of falling back to `globalThis`, with focused coverage blocking those ambient fallbacks
from returning.
System-info DOM lookup now routes through `updateSystemInfoRuntime.ts` instead of querying `document` directly inside
`updateSystemInfo.ts`, with focused runtime coverage and architecture coverage blocking that direct document lookup
from returning.
Version-info DOM lookup now routes through `loadVersionInfoRuntime.ts` instead of querying `document` directly inside
`loadVersionInfo.ts`, with focused runtime coverage and architecture coverage blocking that direct document lookup
from returning.
Shown-files list tooltip cleanup, delayed tooltip display, polyline highlight fade timing, stored tooltip
timeout cleanup, listener abort-controller creation, body theme-listener registration, tooltip mousemove
registration, and viewport reads now route through `shownFilesListRuntime.ts` instead of calling timer,
listener, controller, or viewport globals directly inside the shown-files list modules, with focused runtime
coverage and architecture guardrails blocking those direct browser globals from returning. Explicit shown-files
list runtime scopes must now provide document body, mousemove event-target, viewport, and timer primitives instead
of falling back to `globalThis`; production defaults now live in an explicit provider object instead of a broad
`globalThis` default scope, with focused runtime coverage and architecture coverage blocking those fallbacks
from returning.
Shown-files overlay tooltip element creation, body append, and existing-tooltip queries now also route through
`shownFilesListRuntime.ts` instead of touching `document` directly inside `shownFilesListItemHandlers.ts`, with
runtime coverage and architecture guardrails blocking those direct tooltip DOM calls from returning.
Fallback map measurement button re-enable scheduling and cleanup now route through `mapMeasureToolRuntime.ts`
instead of calling timer globals directly inside `mapMeasureTool.ts`, with focused runtime coverage and
architecture guardrails blocking those direct timer globals from returning. Map measurement Escape-key listener
abort-controller creation and document keydown listener registration/removal now also route through
`mapMeasureToolRuntime.ts` instead of constructing `AbortController` or registering/removing document listeners
directly inside `mapMeasureTool.ts`, with focused runtime coverage and architecture guardrails blocking those
direct browser APIs from returning. Explicit map measurement runtime scopes must now provide their document and
timer primitives instead of falling back to `globalThis`, with focused runtime coverage and architecture coverage
blocking those fallbacks from returning.
Map measurement button/label/SVG element creation, text-node creation, and HTMLElement target checks now also
route through `mapMeasureToolRuntime.ts` instead of calling document element factories or relying on the
ambient `HTMLElement` constructor directly inside `mapMeasureTool.ts`, with focused runtime coverage and
architecture guardrails blocking those direct browser APIs from returning. Map measurement runtime scopes now
provide document, element-constructor, timer, and abort-controller access through named provider functions
instead of a broad `globalThis` default scope or legacy direct scope properties.
Map lap selector listener abort-controller creation and document mouse/key listener registration/removal now route
through `mapLapSelectorRuntime.ts` instead of constructing `AbortController` or touching document listeners
directly inside `mapLapSelector.ts`, with focused runtime coverage and architecture guardrails blocking those
direct browser APIs from returning. Explicit map lap selector runtime scopes must now provide their document
instead of falling back to `globalThis.document`, with focused runtime coverage and architecture coverage blocking
that fallback from returning.
Map lap selector runtime scopes now provide document and abort-controller access through named provider functions
instead of a broad `globalThis` default scope or legacy direct scope properties.
Map lap selector control, label, option, and help-tooltip element creation now also routes through
`mapLapSelectorRuntime.ts`, with focused runtime coverage and architecture guardrails blocking direct
`document.createElement` calls from returning to `mapLapSelector.ts`.
Chart settings header reset-button feedback timing, range-slider re-render debounce, and listener
abort-controller creation now route through `createSettingsHeaderRuntime.ts` instead of calling timer globals or
constructing `AbortController` directly inside `createSettingsHeader.ts`, with focused runtime coverage and
architecture guardrails blocking those direct timer/controller globals from returning. Explicit settings-header
runtime scopes must now provide timer primitives instead of falling back to `globalThis`, with focused coverage
and architecture coverage blocking those ambient fallbacks from returning.
Chart settings header settings-panel DOM creation, chart-selection modal DOM creation, export link body append, and
range-slider style head append now also route through `createSettingsHeaderRuntime.ts`, with focused runtime
coverage and architecture guardrails blocking direct `document.createElement`, `document.body`, and `document.head`
access from returning to `createSettingsHeader.ts`.
Current chart settings reset UI timer scheduling and cleanup now route through `getCurrentSettingsRuntime.ts`
instead of calling timer globals directly inside `getCurrentSettings.ts`, with focused runtime coverage and
architecture guardrails blocking those direct timer globals from returning. Explicit current-settings runtime scopes
must now provide timer primitives instead of falling back to `globalThis`, with focused coverage blocking those
ambient fallbacks from returning.
Controls-state chart settings DOM lookups and computed-style reads now route through
`updateControlsStateRuntime.ts`, with focused runtime coverage and architecture guardrails blocking direct
`document` and computed-style globals from returning to `updateControlsState.ts`.
Shared DOM helper omitted-root queries now resolve their default document through `domHelpersRuntime.ts`
instead of using `document` as a default parameter, with focused runtime/helper coverage and architecture
guardrails blocking direct helper document roots from returning.
Main-UI external-link and unload flows now resolve default documents through `mainUiRuntimeEnvironment.ts`
instead of defaulting function parameters to `document`, with runtime and architecture coverage blocking
direct main-UI document defaults and legacy direct document runtime-scope properties from returning.
Chart settings fallback rerender paths now resolve chart container and body fallback documents through
`chartSettingsRenderRuntime.ts` instead of calling `getChartRenderContainer(document)` or using
`document.body` directly, with runtime and architecture coverage blocking those document fallbacks from returning.
Custom map fullscreen-control delayed Leaflet map size invalidation now routes through
`mapFullscreenControlRuntime.ts` instead of calling timer globals directly inside `mapFullscreenControl.ts`,
with focused runtime coverage and architecture guardrails blocking those direct timer globals from returning.
Custom map fullscreen-control listener abort-controller creation and document fullscreen-change listener
registration now also route through `mapFullscreenControlRuntime.ts` instead of constructing `AbortController`
or registering document listeners directly inside `mapFullscreenControl.ts`, with focused runtime coverage and
architecture guardrails blocking those direct browser APIs from returning. Explicit custom map fullscreen-control
map-container lookup, fullscreen state reads, fullscreen exit, document body containment, and old-button cleanup now
also route through `mapFullscreenControlRuntime.ts` instead of querying or reading `document` directly inside
`mapFullscreenControl.ts`, with focused runtime coverage and architecture coverage blocking those direct browser APIs
from returning. Custom map fullscreen-control button/container/SVG creation now also routes through
`mapFullscreenControlRuntime.ts` instead of calling `document.createElement` or `document.createElementNS` directly
inside `mapFullscreenControl.ts`, with focused runtime coverage and architecture coverage blocking those direct
creation APIs from returning. Explicit custom map fullscreen-control runtime scopes must now provide their document and timer
primitives instead of falling back to `globalThis`, with focused runtime coverage and architecture coverage blocking
those fallbacks from returning. Production defaults now stay behind named provider scope functions, and explicit
runtime scopes no longer accept legacy direct document, timer, or abort-controller properties.
Map draw-laps overlay fit-bounds retry scheduling and cleanup now route through `mapDrawLapsRuntime.ts` instead
of calling timer globals directly inside `mapDrawLaps.ts`, with focused runtime coverage and architecture
guardrails blocking those direct timer globals from returning. Explicit map draw-laps runtime scopes must now
provide timer primitives instead of falling back to `globalThis`, with focused coverage and architecture coverage
blocking those ambient fallbacks from returning.
Renderer state integration example subscription cleanup scheduling, cleanup, state-aware event-handler
abort-controller creation, reactive UI document access, and state-aware event target/content element checks now route
through `rendererStateIntegrationRuntime.ts` instead of calling timer globals, constructing `AbortController`,
reading/writing the document, or checking ambient DOM constructors directly inside `rendererStateIntegration.ts`, with
focused runtime coverage and architecture guardrails blocking those direct timer/controller/document/constructor
globals from returning. Explicit renderer state integration runtime scopes must now provide timer, document, document
event-target, Element, and HTMLElement primitives instead of falling back to `globalThis`, with focused runtime coverage
and architecture coverage blocking those fallbacks from returning.
Main UI summary selector tab lookup, gear-button lookup, and delayed gear-button scheduling now route through
`mainUiSummaryColumnSelectorRuntime.ts` instead of keeping DOM and timer globals inside
`mainUiSummaryColumnSelector.ts`, with focused runtime coverage and architecture guardrails blocking those direct
DOM/timer globals from returning. Main UI summary selector runtime scopes now also resolve document access,
HTMLElement checks, and timer scheduling through named provider functions instead of a broad `globalThis` default
scope or direct document/constructor/timer properties, with focused coverage and architecture coverage blocking the
legacy runtime shape from returning.
Summary column modal tooltip viewport reads and modal listener abort-controller creation now route through
`summaryColModalRuntime.ts` instead of reading viewport globals or constructing `AbortController` directly inside
`summaryColModal.ts`, with focused runtime coverage and architecture guardrails blocking those direct runtime
globals from returning.
Summary column modal active-element lookup, body append, DOM element creation, and text-node creation now also route
through `summaryColModalRuntime.ts`, with focused runtime coverage and architecture guardrails blocking direct
`document` and `HTMLElement` access from returning to `summaryColModal.ts`.
User/device info box listener cleanup now creates abort controllers through `createUserDeviceInfoBoxRuntime.ts`
instead of constructing `AbortController` directly inside `createUserDeviceInfoBox.ts`, with focused runtime
coverage and architecture guardrails blocking direct controller construction from returning. User/device info box
top-level DOM element creation now also routes through `createUserDeviceInfoBoxRuntime.ts` instead of calling
`document.createElement` directly inside `createUserDeviceInfoBox.ts`, with focused runtime coverage and
architecture guardrails blocking those direct creation APIs from returning.
Map print button listener cleanup, DOM creation, and print dispatch now route through
`createPrintButtonRuntime.ts` instead of constructing `AbortController` directly inside `createPrintButton.ts`
or reading document/print globals in the feature module. Production defaults and explicit runtime scopes now use
named provider functions instead of a broad `globalThis` default scope or direct controller/document/print
properties, with focused runtime coverage and architecture guardrails blocking those direct properties from
returning.
Map GPX export button listener cleanup now creates abort controllers through `createExportGPXButtonRuntime.ts`
instead of constructing `AbortController` directly inside `createExportGPXButton.ts`, and object-URL cleanup
scheduling now uses that same runtime instead of falling back to `globalThis`; explicit runtime scopes must now
provide timer primitives, with focused runtime coverage and architecture guardrails blocking direct controller
construction and ambient timer fallbacks from returning. Map GPX export runtime defaults now live in an explicit
provider object instead of a broad `globalThis` default scope, and explicit scopes use named providers instead of
direct controller/document/timer/URL properties.
State integration persistence debounce, performance-monitoring interval, storage lookup, performance-memory read,
and clock reads now route through `stateIntegrationRuntime.ts` instead of calling runtime globals directly inside
`stateIntegration.ts`, with focused runtime coverage and architecture guardrails blocking those direct runtime
globals from returning.
Master state manager comprehensive tests now install and restore document, window, location, storage,
performance, timer, and listener globals through descriptor-scoped helpers instead of deleting globals during
cleanup, with architecture coverage blocking that fixture mutation pattern.
Chart notification/loading suppression tests and createAppMenu export tests no longer create or read retired
`__FFV_suppressNotifications`, `__FFV_suppressLoadingState`, or `__FFV_createAppMenuExports` globals; architecture
coverage now keeps those retired renderer compatibility names out of ordinary tests.
Renderer loading sync DOM and disableable form-control access now uses named runtime provider functions instead of
a broad `globalThis` default scope, legacy direct scope properties, or `document.defaultView` constructor fallbacks.
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
Tab-state manager document helpers now resolve documents through the scoped `tabDocumentRuntime.ts` adapter
instead of probing `globalThis.document` inside each helper module, with architecture coverage blocking that
direct runtime lookup from returning. Tab-state click handling now also checks click targets through
`tabDocumentRuntime.ts` provider-backed `Element`/`HTMLElement` guards instead of using ambient DOM constructors
inside `tabStateManager.ts`, with focused runtime coverage and architecture guardrails blocking direct
constructor checks from returning.
Flexible element ID lookup now checks DOM elements through `elementIdUtilsRuntime.ts` instead of using the
ambient `HTMLElement` constructor inside `elementIdUtils.ts`, with focused runtime coverage and architecture
guardrails blocking direct constructor checks from returning.
Active-tab updates now resolve tab documents through the scoped `updateActiveTabRuntime.ts` adapter instead of
probing `globalThis.document` or `globalThis.window` inside the feature module, with architecture coverage
blocking those direct runtime lookups from returning to `updateActiveTab.ts`. Explicit active-tab runtime scopes
now provide documents through named providers instead of direct `document` properties. Active-tab keyboard
navigation also checks keydown events through `updateActiveTabRuntime.ts` instead of checking the ambient
`KeyboardEvent` constructor inside `updateActiveTab.ts`, with focused runtime coverage and architecture
guardrails blocking direct event-constructor checks from returning.
Active-tab content helper lookup now routes tab-content queries, active class/ARIA fallbacks, active tab-button
lookup, and flexible content ID lookup through `getActiveTabContentRuntime.ts` instead of querying `document`
directly inside `getActiveTabContent.ts`, with focused runtime coverage and architecture coverage blocking those
direct rendering-helper document queries from returning.
Animation debug logging tests no longer seed the retired `__renderer_dev` global when proving typed renderer
debug logging state controls animation logs, and architecture coverage keeps that test off the old global.
Chart background, zoom-reset, and animation debug logging callers now check renderer availability through
`rendererDebugRuntime.ts` instead of probing `globalThis.window` directly, while still taking the debug-enabled
state from `rendererDebugLoggingState.ts`; focused runtime coverage and architecture guardrails block the direct
renderer-window checks from returning.
Animation debug logging clock reads now route through `lastAnimLogRuntime.ts` instead of calling `Date.now` or
`performance.now` directly in `lastAnimLog.ts`, with focused runtime coverage and architecture coverage blocking
direct animation debug logging clock globals from returning. Production defaults now live behind named provider
functions, default performance lookup binds `performance.now` to `globalThis.performance` without a partial-global cast,
and explicit runtime scopes must provide clock providers instead of direct properties or falling back to
ambient clocks.
Strict renderer startup tests also no longer delete the retired `__renderer_dev` global during fresh imports,
with architecture coverage keeping that startup test on the typed renderer development helpers.
Renderer development debug tests no longer clean up retired debug globals such as `__renderer_debug`,
`__renderer_dev`, `__sensorDebug`, or `__debugChartFormatting`; their coverage now checks absence without
mutating those names, and architecture coverage blocks those mutations from returning.
Renderer development debug runtime metadata now resolves location, navigator, and performance-memory records
through `developmentDebugToolsRuntime.ts` instead of probing `globalThis` directly inside
`developmentDebugTools.ts`, with focused runtime coverage and architecture guardrails blocking those direct
metadata lookups from returning. Renderer development debug production defaults now live in an explicit provider
object instead of a broad `globalThis` default scope, and explicit scopes use named providers instead of direct
metadata properties.
Shared error handling no longer probes `globalRef.performanceMonitor` for ambient telemetry, and global
error-listener abort-controller creation now routes through `errorHandlingRuntime.ts` instead of constructing
`AbortController` directly inside `errorHandling.ts`; its tests no longer install or delete a temporary
performance-monitor global fixture; architecture coverage blocks the source fallback, direct controller
construction, and test-global mutation pattern from returning. Error-handling runtime defaults now read
`AbortController` and `addEventListener` explicitly through focused helpers instead of generic
`Reflect.get(globalThis, ...)` probes.
Accent color picker modal lookup/body append, element and text-node creation, style element creation/head append, focus
tracking, preview DOM queries, element-list queries, element constructor checks, listener abort-controller creation, and
Escape-key document listener registration now route through `accentColorPickerRuntime.ts` instead of using ambient
document open/style/focus/preview/construction access or constructing `AbortController` directly inside
`accentColorPicker.ts`, with focused runtime coverage and architecture guardrails blocking direct accent picker
open/style/focus/preview/construction/controller access from returning.
State development tools now check development-scope availability through the scoped `stateDevToolsRuntime.ts`
adapter instead of probing `globalThis.window` or `globalThis.location` directly, with architecture coverage
blocking those runtime-global lookups from returning.
Settings state-core storage synchronization listener abort-controller creation now routes through
`settingsStateCoreRuntime.ts` instead of constructing `AbortController` directly inside `settingsStateCore.ts`,
with focused runtime coverage and architecture guardrails blocking direct settings state-core controller
construction from returning. Settings state-core runtime scopes now also resolve storage listener registration,
abort-controller creation, and localStorage access through named provider functions instead of a broad `globalThis`
default scope or direct scope properties, with focused coverage and architecture coverage blocking those legacy
runtime shapes from returning.
Generic storage helpers now keep default `localStorage` access inside `storageUtilsRuntime.ts` and use an explicit
`globalThis.localStorage` provider instead of a generic `Reflect.get(globalThis, "localStorage")` probe.
State development tools also route performance-monitor interval scheduling and clearing through that runtime
adapter instead of calling interval globals directly, with focused runtime coverage and architecture guardrails
blocking those direct timer calls from returning. Explicit state devtools runtime scopes must now provide interval
primitives instead of falling back to `globalThis`, with focused runtime coverage and architecture coverage blocking
those fallbacks from returning.
State manager defaults now resolve startup timestamps and document titles through the scoped
`stateManagerDefaultsRuntime.ts` adapter instead of probing `globalThis.performance`, `Date.now`,
`typeof document`, or `document.title` directly inside `stateManagerDefaults.ts`, with focused runtime coverage
and architecture guardrails blocking those direct lookups from returning.
Computed state manager auto-theme dark-scheme checks now resolve through the scoped
`computedStateManagerRuntime.ts` adapter instead of probing `globalThis.matchMedia` directly inside
`computedStateManager.ts`, with focused runtime coverage and architecture guardrails blocking that direct
media-query lookup from returning.
Main-process state-manager duration timing, completed-operation cleanup timers, and deferred IPC setup retry
timers now go through the scoped `mainProcessStateRuntime.ts` adapter instead of probing
`globalThis.performance` or `performance.now` or calling timer globals directly inside
`mainProcessStateManager.ts`, with focused runtime coverage and architecture guardrails blocking those direct
timing globals from returning. Explicit main-process state runtime scopes must now provide timer primitives instead
of falling back to `globalThis`, with focused runtime coverage and architecture coverage blocking those fallbacks
from returning.
Master state manager development-scope checks, global error listeners, theme-change dispatch, window lifecycle
listeners, and listener abort-controller creation now go through the scoped `masterStateRuntime.ts` adapter instead of probing
`globalThis.window`, `globalThis.location`, `globalThis.addEventListener`, `globalThis.dispatchEvent`, or
registering on `window.addEventListener`, or constructing `AbortController` directly, with focused adapter coverage and architecture guardrails blocking those direct runtime
operations from returning.
Master state manager loading-sensitive element lookup now also routes through `masterStateRuntime.ts` instead of
querying `document` directly inside `masterStateManager.ts`; drag-over body class updates and development-mode
document-element checks now also route through that runtime instead of reading `document.body` or
`document.documentElement` directly, with runtime coverage and architecture guardrails blocking direct
`document.querySelectorAll`, `document.body`, and `document.documentElement` access plus legacy direct scope
properties from returning. The default master-state runtime no longer reads ambient `globalThis.__DEVELOPMENT__`;
development flag checks now require an explicit runtime provider or the existing location/DOM/options signals.
Resource-manager unload cleanup listener registration and registered timer cleanup now go through the scoped
`resourceManagerRuntime.ts` adapter instead of probing `globalThis.window`, calling `window.addEventListener`,
constructing `AbortController`, or calling `clearTimeout` directly inside `resourceManager.ts`, with focused
runtime coverage and architecture guardrails blocking those direct operations from returning. Explicit resource
manager runtime scopes must now provide timer cleanup primitives instead of falling back to `globalThis`, with
focused runtime coverage and architecture coverage blocking that fallback from returning.
Recent-files context-menu viewport clamping, focus-delay scheduling/cleanup, listener abort-controller creation, menu lookup/creation/body attachment, attachment verification, body debug reads, and outside-click target Node checks now go through the scoped
`recentFilesContextMenuRuntime.ts` adapter instead of probing `globalThis.window`, `window.innerWidth`, or
`window.innerHeight`, calling timer globals, constructing `AbortController`, querying/creating through `document`, reading `document.body`, or checking ambient `Node` directly inside
`recentFilesContextMenu.ts`, with focused runtime coverage and architecture guardrails blocking those direct
viewport, timer, controller, document, and constructor globals from returning. Explicit recent-files context-menu runtime scopes must now
provide timer, document, and Node primitives instead of falling back to `globalThis`, with focused runtime coverage
and architecture coverage blocking those fallbacks from returning.
State integration unit tests no longer seed or delete retired AppState, chart-controls, globalData,
render-state, timer, development, or state-debug globals while proving initialization leaves them absent;
architecture coverage now blocks those retired state-integration global mutations from returning.
State integration tests now install and restore localStorage, performance, and performance-memory browser fixtures
through descriptor-scoped helpers instead of assigning, reflecting directly onto `globalThis`, or deleting globals
during cleanup, with architecture coverage blocking that fixture mutation pattern.
Debug sensor unit tests also no longer define or delete a stale `globalData` property when proving sensor
availability comes from active FIT state, and architecture coverage keeps that retired global mutation out.
Loaded FIT file state tests no longer assign or delete the retired `loadedFitFiles` global while proving
loaded-file storage stays in explicit state, and architecture coverage blocks that mutation from returning.
App event listener tests no longer define or delete retired `globalData` or `loadedFitFiles` globals; they seed
active FIT data and loaded-file fixtures through typed domain state helpers, and architecture coverage blocks
those test-global mutations from returning.
Lifecycle listener export cleanup timer scheduling/cleanup and Open File click-listener abort-controller creation now
route through `listenersRuntime.ts` instead of calling timer globals or constructing `AbortController` directly inside
`listeners.ts`, with focused runtime coverage and architecture guardrails blocking those direct timer/controller
globals from returning. Explicit lifecycle listener runtime scopes must now provide timer primitives instead of
falling back to `globalThis`, with focused runtime coverage and architecture coverage blocking those fallbacks from
returning. Lifecycle listener production defaults now live in an explicit provider object instead of a broad
`globalThis` default scope, and explicit scopes use named providers instead of direct scope properties for
AbortController, timer, print, and process access. The default process and print providers now read
`globalThis.process` and `globalThis.print` explicitly instead of using generic `Reflect.get(globalThis, ...)`
probes.
GPX export button, chart theme listener, and user/device info tests no longer type or clean retired
`globalData`/`loadedFitFiles` globals; they rely on typed state resets and active FIT data fixtures, and
architecture coverage blocks those cleanup patterns from returning.
Strict chart settings dropdown tests no longer seed the mocked state manager through the retired `globalData`
path; they use the current `fitFile.rawData` fixture path that `FitFileSelectors` reads, with architecture
coverage blocking the stale fixture from returning.
Chart settings dropdown deferred setup scheduling and listener abort-controller creation now stay behind
`ensureChartSettingsDropdownsRuntime.ts`; explicit runtime scopes must provide timer primitives and abort-controller
providers instead of falling back to `globalThis`, with focused coverage and architecture coverage blocking those
ambient fallbacks from returning. Chart settings dropdown production defaults now live in an explicit provider object
instead of a broad `globalThis` default scope, and explicit scopes use named providers instead of direct
controller/document/element/timer properties.
Strict render-map tests no longer type or assign retired FIT data globals on `window`; they seed loaded-file
fixtures through `loadedFitFilesState`, and architecture coverage blocks the stale window fixture from returning.
Render-map cleanup timers, layer-control hover timers, zoom-slider debounce timers, layout animation-frame
scheduling, and render abort-controller creation now route through `renderMapRuntime.ts` instead of calling
timer/animation-frame globals or constructing `AbortController` directly inside `renderMap.ts`, with focused
runtime coverage and architecture guardrails blocking those direct timing/controller globals from returning.
Map draw-laps tests now install and restore their temporary jsdom `window` through a captured descriptor instead
of assigning or deleting `testGlobal.window` directly, with architecture coverage blocking that fixture mutation.
Tab visibility state tests now use the `updateTabVisibility.fitRawDataState.test.ts` filename and active raw FIT
data callback/mocked-selector naming instead of retired `globalData` terminology, with architecture coverage
blocking the old filename and fixture vocabulary. That raw-data state coverage now also installs its jsdom
`window`/`document` globals through descriptor-scoped helpers instead of assigning or deleting direct
browser-global fixtures, with architecture coverage blocking those mutations.
Tab visibility fallback timers now route through `updateTabVisibilityRuntime.ts`; explicit runtime scopes must
provide timer primitives instead of falling back to `globalThis`, with focused runtime coverage and architecture
coverage blocking those ambient fallbacks from returning. Tab visibility runtime scopes now also resolve document
access and animation-frame scheduling through named provider functions instead of a broad `globalThis` default scope
or direct document/timer/frame properties, with focused coverage and architecture coverage blocking those legacy
runtime shapes from returning.
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
fullscreen resize uses registered chart instances, with architecture coverage preventing those mutations. Chart
resize listener cleanup now creates abort controllers through `listenersResizeRuntime.ts` instead of
constructing `AbortController` directly in `listenersResize.ts`, with focused runtime coverage and architecture
coverage blocking direct resize-listener abort-controller construction from returning. Explicit resize-listener
runtime scopes must now provide timer primitives instead of falling back to `globalThis`, with focused runtime
coverage and architecture coverage blocking those fallbacks from returning.
RenderChartJS comprehensive tests no longer delete retired Chart.js runtime globals such as `Chart`,
`ChartZoom`, or `chartjsPluginZoom`; they use the typed chart runtime test API, and architecture coverage
blocks those mutations from returning.
RenderChartJS render session timing, prepared-render timing, chart-data render timing, completion timestamps, and
devtools window availability now route through `renderChartJSRuntime.ts` instead of probing `performance.now`,
`Date.now`, or `globalThis.window` directly inside `renderChartJS.ts`, with focused runtime coverage and
architecture guardrails blocking those direct chart-render runtime probes from returning.
Render chart runtime helper bootstrap now registers plugins without passing a mutable global-like chart
environment, and `process.nextTick` shimming goes through focused process providers instead of returning
`globalThis` from `renderChartRuntimeHelpersRuntime.ts`. The default process shim provider now uses explicit
named get/set helpers instead of generic `Reflect.get`/`Reflect.set` process probes.
Chart zoom reset plugin tests now use Vitest-scoped `CanvasRenderingContext2D` stubs when exercising the
roundRect polyfill instead of defining or deleting `globalThis.CanvasRenderingContext2D` directly, with
architecture coverage blocking that fixture mutation.
RenderChartJS comprehensive tests now install and restore mocked document, window, and browser runtime globals
through descriptor-scoped helpers instead of assigning browser fixtures directly onto global objects or deleting
globals during cleanup, with architecture coverage blocking those fixture mutations.
RenderChartJS state API tests no longer install a retired `window.Chart` fixture for state-only helper
coverage, their chart-data fixtures now default through `fitFile.rawData` instead of retired `globalData`,
and architecture coverage blocks those stale fixtures from returning.
Strict lap-zone chart tests now name their raw-data fixtures as active FIT data instead of retired `globalData`,
matching the production `getActiveFitActivityData()` path, and architecture coverage blocks the stale fixture
names from returning.
Strict create-enhanced-chart and zone-chart tests now install and restore browser globals through
descriptor-scoped fixtures instead of assigning or deleting `globalThis` properties directly, with architecture
coverage blocking that test-harness mutation pattern.
Chart zone color utility tests now install and restore localStorage through a descriptor-scoped fixture instead of
assigning or deleting `globalThis.localStorage` directly, with architecture coverage blocking that fixture
mutation pattern.
State middleware branch tests now exercise localStorage write failures through a scoped `Storage.prototype.setItem`
spy instead of assigning `localStorage.setItem` back during cleanup, with architecture coverage blocking that
storage-method fixture mutation.
Chart status indicator tests now install and restore temporary document, window, constructor, timer, and
event-listener fixtures through captured descriptors instead of assigning browser globals, assigning event
handlers, or deleting globals during cleanup, with architecture coverage blocking that fixture mutation pattern.
Chart status indicator DOM lookup, element/text-node creation, body appends, event-listener, viewport, timer, and
constructor access now uses named runtime provider functions instead of a broad `globalThis` default scope or legacy
direct scope properties; the default viewport provider now reads named `innerHeight`/`innerWidth` dimensions instead
of routing through a generic `Reflect.get(globalThis, key)` helper.
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
Alt FIT iframe lookup, logging, location reads, and load-listener abort-controller creation now route through
`altFitSenderRuntime.ts` instead of probing global defaults or constructing controllers directly inside
`sendFitFileToAltFitReader.ts`, with focused runtime coverage and architecture coverage blocking those direct
Alt FIT sender runtime primitives from returning.
Lifecycle listener strict tests now mock `window.print` through a Vitest spy instead of assigning
`window.print` directly, with architecture coverage blocking that direct print fixture.
Tab-button behavior tests no longer delete retired enabled-state, observer, or diagnostic helper globals such
as `tabButtonsCurrentlyEnabled`, `tabButtonObserver`, `areTabButtonsEnabled`, or `forceFixTabButtons`; they
now assert those names stay absent, and architecture coverage blocks those mutations from returning.
Vitest setup no longer disconnects or deletes a retired `window.tabButtonObserver` cleanup hook; tab-button
observer lifecycle stays in the typed tab-button module state.
Chart tab integration tests no longer delete the retired `chartTabIntegration` global before each case; they
now assert the typed singleton stays absent from `globalThis`, and architecture coverage blocks that mutation
from returning. Chart tab integration DOM lookups now use named runtime provider functions for document and
HTMLElement access instead of a broad `globalThis` default scope or legacy direct scope properties.
Chart tab integration chart-state access now routes through `chartStateManagerBootstrap.ts` and
`chartStateManagerRegistry.ts` instead of importing the concrete chart-state singleton directly inside the
integration module.
Direct chart rerender container lookups now use named runtime provider functions for document and HTMLElement
access instead of a broad `globalThis` default scope or legacy direct scope properties.
Chart request listener registration, fallback containers, HTMLElement checks, and CustomEvent checks now use named
runtime provider functions instead of a broad `globalThis` default scope or legacy direct scope properties.
Chart state-manager DOM and timer access now uses named runtime provider functions instead of a broad `globalThis`
default scope or legacy direct scope properties.
Chart updater status/update/theme-change paths and chart theme listener handoff now resolve the chart state
manager through `chartStateManagerRegistry.ts` instead of importing the concrete singleton directly, with
architecture coverage blocking direct singleton imports from returning in those update entrypoints.
App cleanup, shared-configuration refreshes, and chart-settings rerender requests now also resolve the chart state
manager through `chartStateManagerRegistry.ts` instead of importing the concrete singleton directly.
Field-toggle chart re-render requests now also use `chartStateManagerRegistry.ts`, so chart settings UI no longer
imports the concrete chart-state singleton for individual or bulk toggle updates.
State devtools tests no longer delete the retired `__stateDebug` debug global around cleanup or initialization;
they now assert typed debug utilities stay off `globalThis`, and architecture coverage blocks that mutation
from returning.
Vitest setup no longer deletes a retired `window.__chartjs_dev` cleanup global; chart development helpers stay
behind `chartDevToolsRegistry`.
Render chart runtime helper tests no longer create or delete retired `chartActions` or `chartStateManager`
globals when proving registry-based resolution; architecture coverage blocks those mutations from returning.
Those chart runtime helper tests now also restore process/window fixtures through captured descriptors instead
of deleting those globals during cleanup, with architecture coverage blocking those fixture delete fallbacks.
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
Active-tab fallback tests now install and restore missing-document and window-document browser fixtures through
descriptor-scoped helpers instead of reflecting directly onto `globalThis` or deleting those globals during
cleanup, with architecture coverage blocking that fallback fixture mutation pattern.
Additional theme tests now install and restore temporary `matchMedia`, `localStorage`, and `getComputedStyle`
browser fixtures through descriptor-scoped helpers instead of reflecting directly onto `globalThis` or deleting
globals during cleanup, with architecture coverage blocking that fixture mutation pattern.
UI state manager theme tests now install and restore temporary `matchMedia` fixtures through a descriptor-scoped
helper instead of defining or deleting `globalThis.matchMedia` directly, with architecture coverage blocking
that fixture mutation pattern.
UI state manager system-theme media-query lookup, theme root/toggle element lookup, document title reads/writes, active-file body state updates, active-file display element lookup and span creation, chart-controls element lookup, drop-overlay element lookup, loading indicator/main-content/progress lookup, sidebar element lookup, measurement-mode element/listener lookup, tab button/content lookup, unload-button element lookup, loading cursor updates, listener abort-controller creation, and module-level window
resize/beforeunload listener registration now route through `uiStateManagerRuntime.ts` instead of probing
`globalThis.window`, probing `globalThis.matchMedia`, reading or writing `document.title`, toggling
`document.body` file-state classes/dataset fields, querying active-file display, chart-controls, drop-overlay, loading-state, sidebar, measurement-mode, tab, theme, or unload-button DOM elements directly, creating active-file display spans directly, checking tab/theme elements against the ambient `HTMLElement` constructor directly, writing
`document.body.style.cursor`, registering on `window.addEventListener`, or constructing `AbortController` directly inside `uiStateManager.ts`, with focused runtime coverage and architecture guardrails
blocking those direct browser/controller operations from returning. Default document access inside the runtime now
centralizes through `getGlobalDocument()` instead of repeating `globalThis.document` across the provider table.
Credits marquee tests now pass explicit observer and animation runtimes into `setupCreditsMarquee` instead of
stubbing, defining, assigning, or deleting `ResizeObserver`, `requestAnimationFrame`, or
`cancelAnimationFrame` globals, with architecture coverage blocking that fixture mutation pattern.
Credits marquee resize-listener fallback cleanup now creates abort controllers through
`enhanceCreditsSectionRuntime.ts` instead of constructing `AbortController` directly in
`enhanceCreditsSection.ts`, with focused runtime coverage and architecture coverage blocking direct credits
marquee abort-controller construction from returning. Credits marquee runtime defaults now live in an explicit
provider object instead of a broad `globalThis` default scope, and explicit scopes use named providers instead of
direct controller/document/event-target/constructor/frame properties.
Filename auto-scroll resize-listener registration, cleanup timers, cleanup abort-controller creation, document
access, element checks, and mutation-observer creation now route through `unifiedControlBarRuntime.ts`; production
defaults now live behind named provider functions, and explicit runtime scopes must provide controller, document,
event-target, element-constructor, observer, and timer providers instead of direct properties or `globalThis`
fallbacks, with focused runtime coverage and architecture coverage blocking direct unified-control-bar browser
primitives and ambient fallback restoration from returning.
Strict about modal tests now install their immediate `requestAnimationFrame` fixture through a Vitest-scoped
global stub instead of assigning, defining, or deleting `globalThis.requestAnimationFrame` directly, with
architecture coverage blocking that fixture mutation pattern.
Strict notification branch tests now rely on Vitest mock restoration for `window.requestAnimationFrame` instead
of assigning the original callback back during cleanup, with architecture coverage blocking that direct
animation-fixture assignment.
Single HR-zone bar tests now install and restore jsdom browser globals through descriptor-scoped helpers and mock
console methods through per-test Vitest spies instead of assigning or deleting browser globals or replacing
`global.console` directly, with architecture coverage blocking those fixture patterns.
Strict altitude profile chart tests now install jsdom browser globals and localStorage through
descriptor-scoped helpers and mock console methods through per-test Vitest spies instead of assigning browser
globals or a replacement `global.console` directly, with architecture coverage blocking those fixture patterns.
Strict speed-vs-distance chart tests now install jsdom browser globals and localStorage through descriptor-scoped
helpers and mock console methods through per-test Vitest spies instead of assigning browser globals or a
replacement `global.console` directly, with architecture coverage blocking those fixture patterns.
Strict power-vs-heart-rate chart tests now install jsdom browser globals and localStorage through
descriptor-scoped helpers and mock console methods through per-test Vitest spies instead of assigning browser
globals or a replacement `global.console` directly, with architecture coverage blocking those fixture patterns.
Strict event-message chart tests now rely on the jsdom-provided window object instead of assigning
`global.window = window` during setup, with architecture coverage blocking that direct window fixture.
Complete file-open tests now install and restore temporary `process.env` coverage through a descriptor-scoped
fixture instead of assigning or deleting `globalThis.process` directly, with architecture coverage blocking that
fixture mutation pattern.
Runtime process-environment tests now restore the captured `globalThis.process` descriptor instead of deleting
the process fixture during cleanup, with architecture coverage blocking that cleanup-time process deletion.
Gyazo OAuth state tests now install and restore the unavailable-crypto fixture through a descriptor-scoped helper
instead of deleting `globalThis.crypto` during cleanup, with architecture coverage blocking that cleanup-time
crypto deletion.
Data-point filter control tests now install and restore temporary animation-frame and microtask fixtures through
descriptor-scoped helpers instead of assigning or deleting `globalThis.requestAnimationFrame`,
`globalThis.cancelAnimationFrame`, or `globalThis.queueMicrotask` directly, with architecture coverage blocking
that fixture mutation pattern.
The data-point filter control runtime facade now resolves AbortController, document access, and microtask
scheduling through named provider functions instead of broad `globalThis` default scopes, direct scope
properties, or document-window fallbacks, with architecture coverage blocking those ambient fallbacks.
The data-point filter element factory runtime now resolves document access through a named provider function
instead of a broad `globalThis` default scope or direct `document` scope property, with focused coverage and
architecture coverage blocking the legacy shape from returning.
The data-point filter panel-controller runtime now resolves document access, viewport reads/listeners, Node
checks, abort-controller creation, and animation-frame scheduling/cleanup through named provider functions instead
of a broad `globalThis` default scope, direct scope properties, or document-window fallbacks.
The inline zone color selector runtime facade now resolves DOM access, event constructors/dispatch, element
constructors, abort-controller creation, and delayed updates through named provider functions instead of a broad
`globalThis` default scope, direct scope properties, or document-window fallbacks, with focused coverage and
architecture coverage blocking those legacy runtime shapes from returning.
Inline zone color selector scheme changes, resets, and color changes now also resolve the chart state manager
through `chartStateManagerRegistry.ts` instead of importing the concrete singleton directly, with focused selector
coverage and architecture guardrails blocking that direct dependency from returning.
Render-summary virtualized lap-row scheduling now routes request/cancel animation-frame access and resize listener
registration through `renderSummaryRuntime.ts` instead of direct `globalThis` probes in `renderSummaryHelpers.ts`,
with adapter tests and architecture coverage blocking those direct scheduling globals from returning. Summary render
and virtualized lap-row cleanup abort-controller creation now also routes through `renderSummaryRuntime.ts` instead
of constructing `AbortController` directly inside `renderSummaryHelpers.ts`, with focused runtime coverage and
architecture coverage blocking that direct controller construction from returning. Summary container lookup and
summary gear-button/SVG creation now also route through `renderSummaryRuntime.ts` instead of calling
`getElementByIdFlexible(document, ...)`, `document.createElement`, or `document.createElementNS` directly inside
`renderSummary.ts`, with focused runtime coverage and architecture coverage blocking those direct document APIs from
returning.
Render summary filter/table/virtual-row DOM creation and document-fragment creation now also route through
`renderSummaryRuntime.ts`, with focused runtime coverage and architecture guardrails blocking direct
`document.createElement` and `document.createDocumentFragment` calls from returning to `renderSummaryHelpers.ts`.
Tab-state map invalidation scheduling now routes frame scheduling, frame cancellation, fallback timers, timer
clearing, Zwift iframe/status DOM construction, and Zwift iframe load-listener cleanup through
`tabStateManagerHandlersRuntime.ts` instead of calling those globals, constructing `AbortController`, or creating
Zwift DOM nodes directly in `tabStateManagerHandlers.ts`; explicit runtime scopes must provide document, fallback
timer, and controller primitives instead of falling back to `globalThis`, with adapter tests and architecture coverage
blocking direct map-tab timing globals, direct controller construction, direct Zwift DOM creation, and ambient
timer/controller fallbacks from returning.
Renderer application startup listener cleanup and update-check scheduling now route the startup abort controller,
production update-check timer, and before-unload timer clearing through `applicationStartupRuntime.ts` instead of
calling those browser primitives directly in `applicationStartup.ts`, with adapter tests, startup behavior coverage,
and architecture coverage blocking direct startup browser primitives from returning. Explicit startup runtime scopes
must now provide controller/timer primitives instead of falling back to `globalThis`, with focused coverage blocking
that ambient fallback from returning.
Renderer application lifecycle DOMContentLoaded and beforeunload listener cleanup now creates abort controllers
through `applicationLifecycleWiringRuntime.ts` instead of constructing `AbortController` directly in
`applicationLifecycleWiring.ts`, with focused runtime coverage and architecture coverage blocking direct lifecycle
abort-controller construction from returning.
Renderer file-input delegated and import-time listener cleanup now creates abort controllers through
`fileInputStartupRuntime.ts` instead of constructing `AbortController` directly in `fileInputStartup.ts`, with
focused runtime coverage and architecture coverage blocking direct file-input abort-controller construction from
returning.
Renderer test-only bootstrap DOMContentLoaded and window-load listener cleanup now creates abort controllers through
`testOnlyBootstrapRuntime.ts` instead of constructing `AbortController` directly in `testOnlyBootstrap.ts`, with
focused runtime coverage and architecture coverage blocking direct test-only bootstrap abort-controller construction
from returning.
Network utility fetch, AbortController creation, and fetch-timeout scheduling now route through
`networkUtilsRuntime.ts` instead of calling network or timer globals directly in `networkUtils.ts`, with adapter
tests and architecture coverage blocking direct network utility globals from returning. Explicit network runtime
scopes must now provide fetch/timer primitives instead of falling back to `globalThis`, with focused coverage
blocking those ambient fallbacks from returning.
Shared configuration tests now install and restore the throwing `URLSearchParams` fixture through a
descriptor-scoped helper instead of assigning or deleting `global.URLSearchParams` directly, with architecture
coverage blocking that fixture mutation pattern.
Tab-button behavior tests now install and restore temporary `window`, `getComputedStyle`, and
`MutationObserver` browser fixtures through descriptor-scoped helpers instead of assigning or deleting
`globalThis.window`, `(global as any).window`, `globalThis.getComputedStyle`, `global.MutationObserver`, or
`global.window.MutationObserver` directly, with architecture coverage blocking that fixture mutation pattern.
Tab-button state runtime no longer carries a secondary compatibility MutationObserver provider or creates a
throwaway compatibility observer for test callback capture; tab-button observer creation now uses the single typed
MutationObserver provider path, with focused runtime coverage and architecture coverage blocking the retired hook
from returning.
Settings modal show/close animation timing now routes close timers, timer clearing, frame scheduling, and frame
cancellation through `settingsModalRuntime.ts` instead of calling those globals directly in `settingsModal.ts`,
with explicit runtime scopes now required to provide close-timer primitives instead of falling back to
`globalThis`, and runtime adapter tests plus architecture coverage blocking direct timing globals and ambient
timer fallbacks from returning.
Settings modal browser access now also routes modal/style lookup, DOM and SVG element creation, body/head appends,
active-element lookup, document keydown listener target lookup, and browser event/element constructor checks through
`settingsModalRuntime.ts`, with runtime adapter tests plus architecture coverage blocking direct document and
constructor access from returning to `settingsModal.ts`.
Drag/drop overlay animation timing and file-reader listener cleanup now route animation-frame scheduling,
cancellation, and abort-controller creation through `dragDropHandlerRuntime.ts` instead of calling those globals or
constructing controllers directly in `dragDropHandler.ts`, with runtime adapter tests and architecture coverage
blocking direct drag/drop animation-frame globals and direct controller construction from returning.
Leaflet runtime tests no longer delete retired `L` or `Leaflet` globals while proving the typed adapter
resolves only explicitly registered runtimes, and architecture coverage blocks those test-global mutations
from returning.
Shown-files list tests now pass an explicit local Leaflet runtime fixture to `setLeafletRuntime()` instead of
stashing the fixture on `window.L` or reaching markers through `global.window.L`, with architecture coverage
blocking that retired test fixture pattern.
Map action-button strict tests now pass their `CircleMarker` fixture through the typed Leaflet runtime instead
of stashing or clearing it on `window.L`, with architecture coverage blocking that retired fixture pattern.
Map action-button active-file centering retry scheduling and cleanup now route through
`mapActionButtonsRuntime.ts`; explicit runtime scopes must now provide timer primitives instead of falling back
to `globalThis`, with focused coverage and architecture coverage blocking those ambient fallbacks from returning.
Map action-button active filename/map-tab DOM lookup, document readiness checks, DOMContentLoaded registration, and
HTMLElement checks now also route through `mapActionButtonsRuntime.ts`, with focused runtime coverage and
architecture guardrails blocking direct `document` and `HTMLElement` access from returning to
`mapActionButtons.ts`.
The shared Vitest Leaflet mock no longer advertises the removed markercluster package path through a
`markerClusterGroup` helper, and architecture coverage keeps that stale plugin mock out of setup.
Vitest setup no longer registers a default Leaflet runtime for every test; map-related tests install explicit
Leaflet runtime fixtures when they need one, and architecture coverage keeps setup off `setLeafletRuntime`.
The unused setup-level Leaflet module mock object has also been removed; map tests now own their focused
Leaflet fixtures instead of inheriting a broad fake map library from global setup.
The broad setup fallback that fabricated `window.addEventListener`, `window.removeEventListener`, and no-op
`window.dispatchEvent` implementations has been removed; tests now rely on jsdom's real event-target APIs or
their own focused fixtures.
Keyboard-shortcuts modal show/close animation timing now routes close timers, timer clearing, frame scheduling, and
frame cancellation through `keyboardShortcutsModalRuntime.ts` instead of calling those globals directly in
`keyboardShortcutsModal.ts`; its unit tests mock that runtime instead of stubbing animation-frame globals, with
explicit runtime scopes now required to provide close-timer primitives instead of falling back to `globalThis`,
and architecture coverage blocking direct source globals, ambient timer fallbacks, and direct test stubs from
returning.
About modal show/hide animation timing now routes hide timers, focus timers, copy-feedback timers, frame scheduling,
and frame cancellation through `aboutModalRuntime.ts` instead of calling those globals directly in `aboutModal.ts`;
explicit runtime scopes now required to provide hide/focus/copy-feedback timer primitives instead of falling back
to `globalThis`, and strict about-modal tests mock that runtime instead of stubbing animation-frame globals, with
architecture coverage blocking direct source globals, ambient timer fallbacks, and direct test stubs from returning.
About modal creation and stylesheet injection now resolve document access through `aboutModalRuntime.ts` instead of
querying or creating through `document` directly inside `ensureAboutModal.ts` or `injectModalStyles.ts`, with focused
helper coverage and architecture coverage blocking those direct document calls from returning.
About modal presenter browser access now routes content element creation, modal/system-info lookup, active-element
lookup, document event-target lookup, injected-body parsing, sanitizer tree walking, and browser constructor checks
through `aboutModalRuntime.ts`, with runtime adapter tests and architecture coverage blocking direct document,
parser, node-filter, and constructor access from returning to `aboutModal.ts`.
Renderer notification queue timing now routes animation-frame scheduling/cancellation, auto-hide timers, and serialized
display timers through `showNotificationRuntime.ts` instead of calling timing globals directly in `showNotification.ts`,
with adapter tests and architecture coverage blocking direct notification timing globals from returning. Default browser
frame helpers now bind animation-frame calls to `globalThis` without a module-level `browserGlobal` alias or direct
optional browser-global shapes.
Renderer notification host lookup, reset/clear lookup, content container creation, icon/message element creation,
action button creation, and persistent close-button creation now route through `showNotificationRuntime.ts` instead
of querying or creating through `document` directly inside `showNotification.ts`, with focused runtime coverage and
architecture coverage blocking those direct document calls from returning.
Modal focus-trap keydown listener target lookup, active-element lookup, and keyboard-event checks now route through
`modalFocusTrapRuntime.ts` instead of reading `document` or `KeyboardEvent` directly inside `modalFocusTrap.ts`, with
focused runtime/behavior coverage and architecture coverage blocking those direct browser calls from returning.
Update notification auto-hide timers and renderer-state synced notification hide timers now route through
`notificationTimerRuntime.ts` instead of calling timer globals directly in their notification modules, with adapter tests
and architecture coverage blocking direct timer globals from returning.
Update notification element lookup and action/message element creation now route through
`showUpdateNotificationRuntime.ts` instead of querying or creating through `document` directly inside
`showUpdateNotification.ts`, with focused runtime coverage and architecture coverage blocking those direct document
calls from returning.
Runtime facade lint cleanup now keeps resource-manager unload registration, render-summary scheduling, master-state event
forwarding, modal timing adapters, and tab document runtime helpers aligned with the app lint gate by removing stale bound-call
patterns, naming animation-frame fallback callbacks explicitly, documenting caller-owned listener cleanup contracts, and dropping
duplicate optional `undefined` type constituents.
The setup-level `global.HTMLElement = window.HTMLElement` bridge has also been removed; jsdom-backed suites now
use the environment's native element constructors without another shared global assignment.
Unified state facade legacy-path synchronization has been removed; `unifiedStateManager.ts` now only guards retired
state paths such as `globalData` and otherwise routes directly through the modern state manager, with focused coverage
and architecture coverage blocking `LEGACY_PATHS`, `syncLegacy`, `legacy-sync`, and `setSyncEnabled` from returning.
Setup console hardening now uses the existing `ensureConsoleAlive()` path instead of separately patching
`window.console.group`, `window.console.groupEnd`, and `window.console.groupCollapsed` in another global block.
Vitest setup now aligns `window.console` through the descriptor-scoped `setConsoleObject()` helper instead of
assigning `window.console` directly, with architecture coverage blocking that setup-level console assignment.
Vitest env setup now installs jsdom warning filters through a descriptor-scoped helper instead of assigning
`console.error` or `console.warn` directly, with architecture coverage blocking that setup-level console-method
assignment pattern.
Preload and main-UI runtime-environment tests now install temporary console handles through descriptor-scoped
fixtures instead of direct `globalThis.console` assignment, with architecture coverage blocking that pattern.
Preload source execution tests now install and restore their temporary development-log console through
descriptor-scoped helpers instead of direct `global.console` assignment or cleanup-time console deletion, with
architecture coverage blocking those fixture patterns.
Settings state-manager tests now mock console methods through per-test Vitest spies instead of assigning a
replacement `global.console` object at module scope, with architecture coverage blocking that direct console
fixture.
Handle-open-file tests now use scoped Vitest console spies and one-shot throwing mock implementations instead
of assigning `console.log`, `console.info`, `console.warn`, or `console.error` directly, with architecture
coverage blocking that direct console-method fixture.
Tab-state manager behavior tests now restore log/warn/error capture through scoped Vitest spies instead of
assigning console methods back during cleanup, with architecture coverage blocking that direct console-method
fixture.
Data-point filter state helper tests now rely on scoped Vitest console spies and mock restoration instead of
assigning `console.error` directly during setup or cleanup, with architecture coverage blocking that direct
console-method fixture.
Tab-button behavior tests now restore log/warn capture through scoped Vitest spies instead of assigning console
methods back during cleanup, with architecture coverage blocking that direct console-method fixture.
Chart status indicator tests now restore error capture through a scoped Vitest spy instead of assigning
`console.error` back during cleanup, with architecture coverage blocking that direct console-method fixture.
Preload development-mode and edge-case tests now capture mocked `contextBridge.exposeInMainWorld` calls in
module-local exposure maps instead of clearing or restoring `electronAPI`/`devTools` globals, with architecture
coverage blocking global fixture definitions or cleanup in those source tests.
Electron API runtime tests now prove the default runtime ignores ambient `electronAPI` globals and relies on a
registered startup candidate or explicit scoped provider instead of defining or deleting `globalThis.electronAPI`
directly, with architecture coverage blocking that direct fixture mutation and the retired default global lookup.
Renderer startup hooks now accept explicit Electron API lookup only through `getElectronApiScope`, not raw
`RendererElectronApiScope` arguments or ambient global fallbacks, with runtime coverage and architecture coverage
blocking those compatibility shapes from returning.
Renderer runtime environment startup now captures the preload API candidate through the named
`getElectronApiCandidate` provider instead of reading `electronAPI` inline from `rendererGlobal` while assembling
the runtime environment object, with unit and architecture coverage blocking the direct probe from returning.
Renderer runtime environment startup now also returns a narrow `rendererEventTarget` instead of exporting the broad
`rendererGlobal` object to the renderer entrypoint; lifecycle, test bootstrap, and file-input wiring receive only
the event target they use, with architecture coverage blocking the broad handoff from returning.
The runtime-environment scope contract no longer exposes `getRendererScope` or `RendererRuntimeScope`; default
ambient lookup stays private to `runtimeEnvironment.ts`, and callers can provide only focused providers such as
`getElectronApiCandidate` and `getRendererEventTarget`.
The runtime-environment default implementation no longer has a private whole-renderer-object helper; Electron API
candidate capture and event-target capture stay on their focused default providers, and the default Electron API
candidate reader now uses a focused `RendererRuntimeGlobalScope` instead of a generic `Record<PropertyKey, unknown>`
cast, with architecture coverage
blocking that broad helper from returning.
Renderer environment detection now uses focused `RendererEnvironmentInput` values for location, document,
development-flag, and Electron API dev-mode checks instead of receiving a broad renderer-global object through a
`getGlobalScope` provider, with runtime tests and architecture coverage blocking that broad handoff from returning.
The default development-flag and Electron API candidate providers now use named explicit global readers instead of
generic `Reflect.get(globalThis, ...)` probes.
Main UI DOM utility tests now use registered Electron API candidates for validation coverage instead of ambient
`electronAPI` stubs or defining/deleting `globalThis.electronAPI` directly, with architecture coverage blocking
that direct fixture mutation.
Main UI DOM utility listener cleanup now creates abort controllers through `mainUiDomUtilsRuntime.ts` instead of
constructing `AbortController` directly in `mainUiDomUtils.ts`, with focused runtime coverage and architecture
coverage blocking direct main UI DOM utility abort-controller construction from returning.
Shared event listener manager drag/drop default target resolution and tracked listener cleanup now route through
`eventListenerManagerRuntime.ts` instead of probing `globalThis.window` or constructing `AbortController`
directly in `eventListenerManager.ts`, with focused runtime coverage and architecture coverage blocking direct
manager window and abort-controller access from returning.
Shared DOM helper listener cleanup now creates abort controllers through `domHelpersRuntime.ts` instead of
constructing `AbortController` directly in `domHelpers.ts`, with focused runtime coverage and architecture
coverage blocking direct DOM helper abort-controller construction from returning.
Sanitize HTML allowlist fallback fragment creation, DOMParser construction, element tree walking, text-node
creation, and Element checks now route through `sanitizeHtmlAllowlistRuntime.ts` instead of using direct
document, DOMParser, NodeFilter, or Element globals inside `sanitizeHtmlAllowlist.ts`, with focused runtime
coverage and architecture coverage blocking those direct sanitizer fallback browser APIs from returning.
Setup process-nextTick stabilization now uses descriptor-scoped `process` and `nextTick` helpers inside
`ensureProcessNextTick()` instead of assigning `globalThis.process` or `globalThis.process.nextTick` directly,
with architecture coverage blocking those direct setup mutations.
The Playwright map elevation popup smoke path now installs and restores its temporary `window.open` override
through the original property descriptor instead of assigning or deleting `window.open` directly, with
architecture coverage blocking that popup-fixture mutation.
Tab-button helper element filtering now resolves the HTMLElement constructor through
`enableTabButtonsHelpersRuntime.ts` instead of checking the ambient constructor directly, with focused runtime
coverage and architecture coverage blocking direct helper constructor access from returning.
Open-FIT-file path button disable/enable checks now resolve the HTMLElement constructor through
`openFitFileFromPathRuntime.ts` instead of checking the ambient constructor directly in `openFitFileFromPath.ts`,
with focused runtime coverage and architecture coverage blocking direct constructor access and legacy direct
runtime-scope properties from returning.

Long-term target: move from global test environment mutation toward per-test explicit runtime objects,
module-local test overrides, and focused fixtures. The recent createAppMenu cleanup is the right pattern.

7. Re-evaluate Windows 7 Compatibility (Complete)

Progress: the local `build:win7` script, Electron 22 build helper, Win7 release-dist workspace path, and Win7
build tests have been removed. The GitHub workflow now carries forward the newest prior
`Fit-File-Viewer-win7-*` release assets onto the target release without installing Node or rebuilding a
Windows 7 binary. README, release, development, Docusaurus, and layout docs now describe Windows 7 as a
legacy snapshot only.

You may commit during this process. You may update this file to keep track of your current progress and where you stand. You must complete all of these FULLY, with no shortcuts, to consider this goal complete.
