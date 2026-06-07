1. Retire the legacy renderer/global bridge

   This is the biggest long-term win. The repo still has a lot of compatibility plumbing around window.\*, globalData,
   legacy appState, and renderer utility globals in places like electron-app/main-ui.ts, electron-app/renderer.ts,
   electron-app/utils.ts, and electron-app/utils/ui/mainUiGlobals.ts.

   Bluntly: continuing to fix UI regressions one by one without shrinking that bridge will keep producing weird "this
   tab stopped loading" style bugs. Move toward typed imports, explicit services, and centralized state paths.

2. Add one real release/readiness gate

   The repo has useful scripts, but no single obvious release:verify style command. Add something like:

   npm run verify:release

   That should run the real pre-release gates in order: formatting, linting, CSS linting, docs typecheck/build, audit,
   Vitest, Playwright, packaging/build checks, and signing checks where applicable.

3. Finish the renderer dependency migration

   docs/RENDERER_DEPENDENCY_INVENTORY.md already treats the current renderer dependency setup as a migration baseline.
   Next step is reducing compatibility globals from vendorGlobals.ts and moving more browser libraries to normal typed
   imports where practical.

   This matters most around map/chart/DataTables code because those areas are user-visible and regression-prone.

4. Split the preload/main-process API surface by domain

   electron-app/preload.ts is doing too much. Move toward small typed preload modules for file access, exports,
   Gyazo auth, app state, dev tools, etc., with preload.ts composing and exposing the final API.

   That makes security review, signing readiness, and test coverage much easier.

5. Make signing and release packaging boring

   Since signing has already come up, make it explicit and testable:
   - document required signing env vars/secrets by platform
   - make unsigned local packaging and signed release packaging separate paths
   - fail with a direct error when signing is required but unavailable
   - keep the Windows 7 legacy build path isolated so it does not contaminate the normal release path

   The recent regressions are exactly the kind that unit tests miss. Add smoke coverage for:
   - selected FIT file auto-loads into the Data tab
   - Zwift tab loads or shows a clear fallback
   - file browser shows loading/loaded/empty states
   - map measurement clear removes distance and area measurements
   - AltFit handoff still works
   - tab switching preserves expected loaded state

6. Make app state more explicit

   FIT file loading, tab readiness, chart readiness, map readiness, and file-browser selection should behave like a
   small state machine, not scattered DOM side effects. This would reduce the "it is on the main URL but the selected
   file did not load" class of problems.

7. Keep dependency risk under control

   Electron, Playwright, TypeScript, and renderer libraries can break quietly. Add a scheduled dependency
   validation workflow that runs the full release gate and package build, then only merge updates when the app-level
   smoke tests pass.

Current tree looked clean when inspected, and these recommendations are based on the current checkout plus the recent
release/tooling cleanup context. The main strategic point: stop letting legacy renderer compatibility be the center of
gravity. That is the debt most likely to keep costing you time.
