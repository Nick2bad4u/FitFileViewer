# Utils Module Migration Action Plan

## 📌 Context

FitFileViewer's utility layer was recently reorganized from a flat structure into domain-based directories (charts, state, formatting, maps, ui, files, rendering, theming, data, app, debug, etc.). The reorganization landed the new folder layout and several category barrels, but imports across the codebase still rely heavily on legacy paths and compatibility exports. This plan translates the reorganization handoff into concrete engineering work so we can complete the migration safely and confidently.

## 🎯 Objectives

- Replace legacy deep imports with domain barrels and the new central `utils/index.js` entry point.
- Ensure every utility category exposes a consistent default namespace export plus named exports for individual helpers.
- Remove temporary compatibility exports only after the new structure is fully adopted.
- Maintain existing application behavior with comprehensive regression coverage.

## 🚦 Guiding Principles

- **Safety first**: stage changes by category, run lint/tests at each breakpoint, and keep commits reviewable.
- **Consistency**: every category should follow the same barrel pattern (sub-index files and namespace default export when appropriate).
- **Visibility**: document progress in this plan and update the checklist as milestones complete.
- **Instrumentation**: log or measure any regressions surfaced while updating imports; add targeted tests where coverage is weak.

## 🧭 Phased Roadmap

### Phase 0 — Discovery & Inventory (WIP)

- [x] Audit every top-level `electron-app/utils` category and subcategory to record:
  - Presence/absence of `index.js` barrels.
  - Default export shape (namespace object vs. direct functions).
  - Outstanding TODOs or legacy exports.
- [x] Produce an inventory table (appendix A) summarizing migration readiness per category.
- [x] Confirm consumers of `config`, `dom`, `errors`, and other singleton modules still compile with barrel usage.

**Exit Criteria:** Inventory table complete with clear owner/action for each uncovered gap.

### Phase 1 — Barrel Consolidation

- [x] Create or normalize `index.js` barrels for categories/subcategories lacking them (e.g., `config`, `dom`, `errors`, `logging`).
- [x] Ensure each category exports a default namespace consistent with existing patterns (`export default { ... }`) where useful.
- [x] Update `electron-app/utils/index.js` to re-export any newly created barrels while keeping transitional exports intact.
- [x] Add inline documentation comments where new barrel patterns might surprise future readers.

**Exit Criteria:** All categories reachable through consistent `import { foo } from "./utils";` or `import foo from "./utils/foo";` syntax.

### Phase 2 — Consumer Refactoring

- [ ] Identify renderer/main/preload modules that still import from legacy paths (deep relative paths into `utils`).
- [ ] Update those imports to consume the new barrels or the central entry point.
- [ ] Remove deprecated relative paths and verify tree shaking / bundling remains stable (rerun dev build if available).
- [ ] Watch for circular dependency risks introduced by new barrel usage.

**Exit Criteria:** No direct imports into deep utility files from outside their category except where explicitly justified.

### Phase 3 — Cleanup & Validation

- [ ] Remove temporary compatibility exports once all consumers use the new structure.
- [ ] Run full lint/type/test suite (`npm --prefix electron-app run lint`, `npm --prefix electron-app run type-check`, `npm --prefix electron-app test`).
- [ ] Add smoke tests or targeted unit tests covering critical utilities touched during migration.
- [ ] Update developer documentation (README / DEVELOPMENT_GUIDE) with the final import guidance.

**Exit Criteria:** Utility module landscape stabilized, automated checks green, docs aligned.

## 📑 Appendix A — Category Inventory (to be filled during Phase 0)

| Category | Barrel Status | Default Export | Legacy Exports Present? | Next Action |
|----------|---------------|----------------|-------------------------|-------------|
| `app` | ✅ `app/index.js` + sub-barrels | ❌ | 🚫 | Decide if namespace default adds value (low priority) |
| `charts` | ✅ `charts/index.js` | ✅ | ✅ | Confirm necessity of legacy exports, plan retirement |
| `config` | ✅ `config/index.js` | ✅ namespace (module object) | 🚫 | Monitor for any straggler deep imports before removing compatibility |
| `data` | ✅ `data/index.js` | ✅ | 🚫 | Await consumer audit |
| `debug` | ✅ `debug/index.js` | ✅ | 🚫 | Verify usage |
| `docs` | ⚠️ only `documentationStandards.js` | ❌ | 🚫 | Decide if surfaced via barrel or kept internal |
| `dom` | ✅ `dom/index.js` | ✅ (forwarded default) | 🚫 | Confirm all consumers/tests stay on barrel, then schedule compatibility cleanup |
| `errors` | ✅ `errors/index.js` | ✅ namespace (module object) | ✅ | Continue migrating remaining consumers prior to removing compatibility layer |
| `files` | ✅ `files/index.js` + sub-barrels | ✅ | ✅ | Remove legacy once consumers updated |
| `formatting` | ✅ `formatting/index.js` | ✅ | ✅ | Stage replacements |
| `logging` | ✅ `logging/index.js` | ✅ | 🚫 | All tests on barrel; prepare compatibility removal once app code audited |
| `maps` | ✅ `maps/index.js` | ✅ | 🚫 | Confirm |
| `performance` | ✅ `performance/index.js` | ❌ | 🚫 | Consider adding namespace exposing `performanceMonitor` |
| `rendering` | ✅ `rendering/index.js` | ✅ | 🚫 | Confirm |
| `state` | ✅ `state/index.js` | ✅ | ✅ | Plan removal |
| `theming` | ✅ `theming/index.js` | ✅ | ✅ | Evaluate |
| `types` | ⚠️ single `.d.ts` file | ❌ | 🚫 | Determine export strategy or keep types local |
| `ui` | ✅ `ui/index.js` | ✅ | ✅ | Update consumers |

Legend: ✅ complete, 🔶 partial, ⚠️ to investigate. Update this table as discovery progresses.

## 📌 Tracking & Reporting

- Maintain this document as the single source of truth for migration status.
- After each phase, append a short changelog entry summarizing progress and blockers.
- Surface risks early (e.g., unexpected regression) and capture mitigation steps here.

---

*Last updated: 2025-09-24 — Owner: GitHub Copilot assistant*
