# Recommended Next Steps

## 1. Make `renderer.ts` stop being the gravity well

The global bridge is smaller now, but `electron-app/renderer.ts` is still too large and too central. Split it into real bootstrap modules, such as:

- app startup
- tab wiring
- file input wiring
- debug hooks
- drag-and-drop
- menu listeners
- test-only helpers

This will make UI bugs easier to isolate and reduce the blast radius of renderer changes.

---

## 2. Add an architecture boundary test

Add tests that fail if new code reintroduces problematic dependencies. For example:

- renderer modules importing main-process-only modules
- preload modules reaching into renderer state
- new direct `window.globalData` writes
- new broad `rendererUtils` globals
- new files added under old loose utility/global patterns

This is a cheap safeguard that will help prevent the repo from sliding backward.

---

## 3. Finish deleting compatibility globals, not just routing around them

`globalDataStore` is now the right temporary center, but the end goal should be removing the need for:

- `window.globalData`
- legacy `AppState.globalData`
- renderer utility globals

A good way to finish this is:

- create a migration checklist
- remove remaining direct usages incrementally
- add a final lint rule or test that blocks new direct usage

---

## 4. Shrink and split the renderer bundle

The renderer vendor bundle is still large. Review heavy dependencies such as:

- Leaflet
- Chart.js
- DataTables
- related plugins

Load tab-specific dependencies only when the relevant tab is opened. This should improve startup time and make blank-tab regressions easier to detect.

---

## 5. Build a release rehearsal workflow

Separate from normal CI, add a manual `workflow_dispatch` release rehearsal that:

- runs `npm run release:verify`
- builds unsigned artifacts
- checks signing availability without publishing
- uploads artifacts
- proves the packaged app starts

This gives you a safe “are we ready to tag?” button.

---

## 6. Add performance baselines for real FIT files

Use representative fixture sizes and track:

- parse time
- render time
- map route render time
- chart render time
- memory usage after loading and unloading

FIT viewers can silently get slower as features accumulate, so baseline coverage will help catch regressions early.

### Related follow-up

The preload split helped. The next step is stricter IPC schema validation and clearer domain ownership. In particular:

- file access
- external links
- browser folder listing
- app state
- dev tools

Each should have narrow, validated payloads and tests for invalid input.

---

## 7. Make packaged-app smoke tests closer to release reality

Current Playwright coverage is useful. The next step is to add smoke tests against the packaged or unpacked app after `npm run package`, not just the dev/runtime build path.

This will help catch packaging-only asset and preload failures.

---

## 8. Create a deprecation ledger

Keep a small document listing temporary bridges and their exit criteria, such as:

- `window.globalData`
- legacy `AppState`
- `rendererUtils`
- `vendorGlobals`
- old runtime CommonJS compatibility pieces

Whenever one of these shrinks, update the ledger. Otherwise, "temporary" tends to become permanent.

---

## Overall assessment

The biggest remaining technical risk is still renderer complexity.

The release gate is now in much better shape, and the next serious win is making it harder for one tab's old global/state behavior to break another tab.

If you want, I can also turn this into:

- a **GitHub review comment**
- a **polished engineering memo**
- or a **prioritized action plan with impact/effort labels**.
