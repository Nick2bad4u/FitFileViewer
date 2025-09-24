# FitFileViewer Remediation Plan – State & Module Consistency

_Last updated: 2025-09-23_

This document captures the full execution plan for resolving the three inconsistencies surfaced during the recent audit:

1. Duplicate initialization of the renderer state system leading to multiplied subscriptions.
2. The dormant FIT parser ↔ state manager integration in the main process.
3. The `recentFiles` CommonJS export that is re-exported from an ES module barrel.

Everything below is meant to be actionable when we circle back to implement the fixes. Feel free to extend with checkboxes as work progresses.

---

## 0. TL;DR Navigator

| Workstream | Goal | Primary Files |
|------------|------|---------------|
| **A** | Ensure `initializeStateManager()` and related subscriptions run exactly once per renderer boot. | `electron-app/renderer.js`, `electron-app/utils/state/core/stateManager.js`, renderer Vitest suites |
| **B** | Wire `fitParser` to the app’s state managers so decode progress & metadata reach the renderer. | `electron-app/main.js`, `electron-app/fitParser.js`, `electron-app/utils/files/import/fitParserIntegration.js` |
| **C** | Convert `recentFiles` helpers to ES module exports (or bridge them) so barrel re-exports remain valid. | `electron-app/utils/files/recent/recentFiles.js`, dependent import sites |

Keep sections 3–5 handy—they are the detailed playbooks for each workstream.

---

## 1. Background & Goals

### 1.1 Observed Symptoms

- **Renderer state duplication:** Multiple invocations of `initializeStateManager()` (see `renderer.js` lines ~420 and ~1050) re-register subscriptions (`subscribe("app.isOpeningFile", …)`) and persistence hooks, causing duplicate IPC traffic and stale UI state after prolonged sessions.
- **FIT parser integration gap:** `fitParser.initializeStateManagement({ … })` is never executed by the main process, so `fitFileStateManager.updateLoadingProgress()` and related calls in `fitParser.js` silently no-op.
- **Mixed module export for recent files:** `electron-app/utils/files/recent/recentFiles.js` is CommonJS but is re-exported via `export * from "./recentFiles.js";`. ES-module consumers receive `undefined` values.

### 1.2 Desired Outcomes

1. Renderer state management is initialized once, and legacy compatibility hooks remain intact.
2. Decode progress, errors, and metadata flow from the main process into state-managed UI surfaces.
3. Recent file helpers are importable from both ES modules and the CommonJS bridge without ambiguity.

### 1.3 Constraints & Assumptions

- Changes must remain compatible with existing Vitest mocks (tests rely on `vi.doMock` and path trickery).
- Electron security posture (contextIsolation, sandbox) cannot be relaxed.
- Windows + PowerShell is the primary environment, but plan should not assume platform-specific paths beyond existing code.
- No net-new third-party dependencies unless absolutely necessary (preferred: stick to Node/Electron APIs).

---

## 2. Environment Preparation

1. **Sync repository**
   - `git checkout main`
   - `git pull origin main`
2. **Install dependencies** (if not already):
   - `npm install`
   - `npm --prefix electron-app install`
3. **Verify Node/Electron versions**
   - Document `node -v` and `npm -v` in commit notes for reproducibility.
4. **Run baseline tests** (capture current failures for comparison):
   - `npm --prefix electron-app test`
   - `npm --prefix electron-app run lint`
   - `npm --prefix electron-app run type-check`
5. **Optional instrumentation**
   - Enable verbose logging in `renderer.js` (temporary) to confirm duplicate subscription behavior before fixes.

Keep raw command logs; they will be useful when drafting release notes.

---

## 3. Workstream A – Harden Renderer State Initialization

### A.1 Target Files & Artifacts

- `electron-app/renderer.js`
- `electron-app/utils/state/core/stateManager.js`
- Vitest suites touching renderer initialization (`electron-app/tests/renderer/**/*.test.*`)

### A.2 Step-by-Step Execution

1. **Audit call sites**
   - Confirm exactly where `initializeStateManager()` is invoked (DOM ready section, top-level IIFE, any tests).
   - Note that tests may expect the eager call—preserve compatibility.
2. **Design initialization guard**
   - Option 1: Local boolean flag inside `renderer.js` to prevent repeated `ensureCoreModules()` + `subscribe()` calls.
   - Option 2: Add idempotence logic inside `stateManager.initializeStateManager()` that short-circuits after first run.
   - Choose whichever keeps test mocks simplest (likely flag in renderer + exported `__reset` helper for tests).
3. **Implement guard**
   - Wrap the existing invocation(s) with `if (!stateInit.hasRun) { … }` or similar.
   - Ensure fallback error path still sets `appState` legacy object.
   - Update any direct imports of `initializeStateManager` in test utilities to reset the guard between tests (e.g., expose `resetRendererStateInitForTests`).
4. **Clean up redundant calls**
   - If the top-level IIFE becomes redundant, remove or convert to `void initializeStateManagerOnce()` that returns a promise reused by callers.
5. **Update tests**
   - Add/extend Vitest spec verifying guard prevents multiple `subscribe` calls.
   - Use spies on `masterStateManager.initialize` to assert EXACTLY one invocation per DOM cycle.
6. **Smoke test renderer boot**
   - Run `npm --prefix electron-app test -- runInBand renderer` (narrow suite) while the guard is in place.
   - Launch app manually if desired to validate no regression in startup.

### A.3 Acceptance Criteria

- `initializeStateManager()` side effects execute once per renderer load.
- No leaking subscriptions after repeated `initializeApplication()` calls in tests.
- All renderer Vitest suites continue to pass.

### A.4 Risks & Mitigations

- **Risk:** Guard prevents legitimate re-initialization during hot reload. _Mitigation:_ expose test-only reset helper and document use.
- **Risk:** Tests relying on repeated initialization might fail. _Mitigation:_ update fixtures to call the reset helper in `beforeEach`.

---

## 4. Workstream B – Restore FIT Parser ↔ State Integration

### B.1 Target Files & Artifacts

- `electron-app/main.js`
- `electron-app/fitParser.js`
- `electron-app/utils/files/import/fitParserIntegration.js`
- IPC channel definitions in `electron-app/preload.js`

### B.2 Step-by-Step Execution

1. **Decide integration point**
   - Preferred: During app startup (after `masterStateManager.initialize`) call `fitParser.initializeStateManagement({ fitFileStateManager, settingsStateManager, performanceMonitor })`.
   - Alternate: Use the existing helper in `utils/files/import/fitParserIntegration.js` if it offers reusable logic.
2. **Wire state managers in main process**
   - Import `fitFileStateManager`, `settingsStateManager`, and `performanceMonitor` into `main.js` (respecting CommonJS vs ESM boundary).
   - Ensure imports do not load renderer-only modules (guard behind `app.isPackaged` if necessary).
3. **Call initialization function once**
   - Place the call in the same block that handles app ready / window creation to guarantee it runs before any IPC decode requests.
   - Add guard to prevent double initialization when windows are recreated.
4. **Update IPC handlers to use shared instance**
   - Confirm the existing `fit:parse` handler reuses the initialized module (CommonJS `require` caches, but be explicit in comments).
   - Consider routing through `decodeFitFileWithState` helper for clarity, or delete unused helper if redundant.
5. **Expose progress to renderer**
   - Verify renderer listens to `fitFileStateManager` updates (already subscribed via `subscribe("globalData", …)` etc.).
   - If missing, add IPC forwarding or renderer subscription to new state paths (`fitFile.loadingProgress`, `fitFile.metrics`).
6. **Testing**
   - Unit: Add a Vitest spec that stubs `fitFileStateManager` methods and asserts they run during decode.
   - Integration: Simulate decode via IPC (mock `electronAPI.parseFitFile`) and assert renderer state reflects progress.
7. **Observability**
   - Add debug logs (behind dev-mode flag) confirming integration executed, to ease troubleshooting.

### B.3 Acceptance Criteria

- `fitParser.initializeStateManagement` executes once per app boot.
- Progress and success handlers update `fitFile` state without hitting null checks.
- Existing FIT decode behavior remains unchanged from user perspective (no new errors in console).

### B.4 Risks & Mitigations

- **Risk:** Importing renderer-only modules in main process causes bundling issues. _Mitigation:_ centralize shared modules under `utils/state/domain` (already CommonJS-friendly) and document.
- **Risk:** Tests relying on mocked `fitParser` might need updates. _Mitigation:_ provide dependency injection (allow passing fake managers for tests).

---

## 5. Workstream C – Normalize Recent Files Module Exports

### C.1 Target Files & Artifacts

- `electron-app/utils/files/recent/recentFiles.js`
- Barrel files under `electron-app/utils/files/`
- Any import sites using `require("./recentFiles")` or ESM import

### C.2 Step-by-Step Execution

1. **Audit import styles**
   - Grep for `recentFiles` usage (both `require` and `import`).
   - Note testing mocks under `electron-app/__mocks__` if they rely on CommonJS signature.
2. **Choose conversion strategy**
   - **Preferred:** Convert `recentFiles.js` to an ES module (rename to `.mjs` or adjust export syntax) and provide CommonJS compatibility via `createRequire` or `module.exports` shim.
   - **Alternate:** Keep CommonJS file but adjust barrel to import default and re-export named functions manually.
3. **Implement exports**
   - If converting to ESM: replace `module.exports = { … }` with `export function addRecentFile(…) { … }`.
   - Add optional `export default` for compatibility if helpful.
   - If maintaining CJS: create `recentFiles.cjs` for legacy require; update barrel to `export { addRecentFile } from "./recentFiles.cjs";` and add `export *` from new ESM wrapper.
4. **Update importers**
   - Ensure main process (`main.js`) and any renderer utilities import the correct form.
   - Tests may require `vi.mock("../recent/recentFiles", () => ({ addRecentFile: vi.fn() }))` adjustments.
5. **Verify packaging**
   - Run `npm --prefix electron-app run lint` to catch module syntax errors.
   - Run `npm --prefix electron-app test` to ensure mocks still function.
6. **Document migration**
   - Add note to the plan (or future changelog) about module format change for developers who may copy the pattern.

### C.3 Acceptance Criteria

- ES-module consumers receive valid named exports (`addRecentFile`, `loadRecentFiles`, etc.).
- Legacy CommonJS requires continue to work (if any remain).
- No bundler warnings about mixed module systems.

### C.4 Risks & Mitigations

- **Risk:** Electron main process (CommonJS) cannot import ESM directly. _Mitigation:_ use dynamic `import()` or keep CJS bridge file.
- **Risk:** Tests or scripts run in Node 16 may choke on `.mjs`. _Mitigation:_ stick with `.js` + `
