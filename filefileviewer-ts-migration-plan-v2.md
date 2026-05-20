---
description: FitFileViewer Behavior-Preserving TypeScript Migration Goal v2
---

# FitFileViewer TypeScript Migration and Modernization Goal

## Summary

Migrate `C:\Repos\FitFileViewer` to a first-class TypeScript codebase through small, reviewable, validated increments. The goal is not blind behavior preservation; the goal is a **correct, maintainable, strongly typed, modernized application that still works properly as an Electron app for real users**.

Behavior may change when necessary to:

- fix bugs
- remove unsafe or obsolete patterns
- simplify architecture
- improve maintainability
- align with modern Electron / Vite / TypeScript best practices
- eliminate brittle dependency loading and module-boundary problems

Do **not** preserve legacy behavior if that behavior is broken, undefined, unsafe, or a barrier to a clean TypeScript architecture.

---

## Primary Objective

Produce a clean, strict, maintainable TypeScript architecture for `FitFileViewer` that:

- builds reliably
- typechecks strictly
- passes linting
- passes tests
- packages successfully
- launches correctly in Electron
- opens and analyzes FIT files correctly
- uses modern, explicit module boundaries
- avoids legacy typing crutches and unsafe runtime patterns

The standard is **working software with a high-quality codebase**, not line-for-line behavioral preservation.

---

## Migration Strategy

Work incrementally in small, coherent slices. Each slice should leave the repository in a better state than before. Feel free to use subagents if you think they will be beneficial for managing the complexity of the migration, but ensure that all work is well-coordinated and integrated into a cohesive whole. If you need to create a document to keep track of the migration and your actual steps, feel free to do so, but ensure that the document is well-organized and communicates the migration plan, progress, and current state.

Preferred migration order:

1. **Baseline and diagnostics**
   - Record current build, lint, typecheck, test, and packaging status.
   - Separate pre-existing failures from migration-introduced regressions.
   - Identify high-risk areas: Electron main/preload boundaries, parser modules, shared state, renderer bootstrapping, and runtime asset/dependency loading.

2. **Shared foundations**
   - Migrate shared types, constants, utility modules, and reusable helpers first.
   - Establish canonical domain types for FIT data, app state, IPC payloads, settings, and parser outputs.
   - Remove weak typing at the boundaries before deep feature work.

3. **Core application logic**
   - Migrate FIT parser, transformation logic, derived data, selectors, and stateful modules.
   - Replace broad `any`, unsafe casts, and implicit data contracts with explicit types and validated adapters.
   - Add targeted tests around critical parsing and transformation behavior before or during migration where useful.

4. **Renderer process**
   - Migrate UI modules, Zustand stores, hooks, DOM access, and view-layer utilities.
   - Replace unsafe DOM queries and event handling with typed, defensive patterns.
   - Normalize imports and module structure for Vite-managed builds.

5. **Preload and IPC contracts**
   - Define explicit, typed IPC contracts.
   - Ensure preload exposes a minimal, safe, documented API surface.
   - Remove implicit globals and replace them with typed interfaces.

6. **Electron main process**
   - Migrate app lifecycle, window creation, file opening flows, menu wiring, dialogs, and platform integration.
   - Modernize Node/Electron imports and remove legacy CommonJS/ESM inconsistencies.
   - Keep packaging and startup behavior working throughout.

---

## Required Modernization Work

Treat the following as core migration work, not optional cleanup:

- Replace JavaScript modules with TypeScript modules where appropriate.
- Eliminate `@ts-nocheck`, broad `any`, fake declaration-file band-aids, and unsafe assertions unless narrowly justified.
- Remove generated `.d.ts` files used as substitutes for proper source typing.
- Replace direct runtime imports from `node_modules` in HTML, import maps, vendor references, or brittle filesystem paths.
- Use package public APIs, proper wrappers, Vite-managed imports, or curated static vendor assets instead.
- Normalize CommonJS / ESM boundaries intentionally rather than tolerating accidental mixed-module behavior.
- Prefer `node:` protocol imports where applicable.
- Improve package export hygiene and module boundaries.
- Introduce typed third-party adapters where library typings are weak or incomplete.
- Replace magic globals and ad hoc cross-process contracts with explicit types.
- Reduce architectural ambiguity wherever encountered.

---

## Rules for Behavior Changes

Behavior changes are allowed when they improve the software.

Allowed changes include:

- fixing incorrect behavior
- removing dead code or obsolete compatibility paths
- tightening invalid input handling
- improving error reporting
- simplifying state flow
- replacing fragile runtime loading with supported patterns
- restructuring modules to make boundaries explicit
- changing internal implementation details freely

However, the application must still satisfy its functional purpose:

- Electron app starts successfully
- user can open FIT files
- FIT data is parsed and displayed correctly
- major workflows remain usable
- packaging still works for supported platforms unless a documented blocker already exists

If a legacy behavior is ambiguous, inconsistent, or harmful, prefer the technically correct and maintainable implementation.

---

## Engineering Standards

### TypeScript

- Use strict TypeScript.
- Prefer precise domain models over generic utility types.
- Avoid `any`, `unknown`, `null`, and `undefined` where a better model is possible.
- Use discriminated unions, branded types, type guards, assertion functions, and narrow interfaces where appropriate.
- Do not hide type problems behind casts unless there is a documented boundary reason.

### Architecture

- Favor explicit boundaries between:
  - parser/domain logic
  - renderer UI logic
  - preload bridge
  - Electron main process
- Keep side effects localized.
- Separate pure transformation logic from I/O and UI orchestration.
- Prefer composable utilities over large god modules.
- Avoid global mutable state and implicit cross-module contracts.
- Use modern module syntax and Vite-compatible patterns.
- Normalize imports and module structure for clarity and maintainability.

### Dependencies

- Import dependencies through supported public entry points only.
- Do not depend on internal package files unless absolutely necessary and documented.
- Remove brittle dependency-path hacks.
- Wrap poorly typed third-party libraries behind local typed adapters when needed.
- Avoid dynamic runtime imports of dependencies in favor of static imports or Vite-managed assets.

### Electron Safety

- Keep preload minimal and secure.
- Expose only necessary APIs.
- Type all IPC channels, request payloads, and responses.
- Avoid accidental renderer access to privileged Node/Electron APIs.

### Testing

- Add or improve tests where migration risk is high.
- Focus especially on:
  - FIT parsing
  - derived data transformations
  - state transitions
  - IPC contract behavior
  - file open workflows
  - Electron lifecycle events
  - critical UI interactions
  - cross-process data flow
  - runtime dependency loading behavior
- Use unit, integration, and end-to-end tests where they provide real confidence.
- Add property-based tests for critical pure logic if valuable.
- Avoid over-testing trivial getters/setters or implementation details that provide little confidence.

---

## Validation Workflow

### At the start

- Capture baseline status for:
  - install
  - lint
  - typecheck
  - tests
  - build
  - package
- Record existing failures separately from new regressions.

### For each migration slice

Before each local commit:

- run the narrowest relevant tests
- run `npm --prefix electron-app run typecheck`

When a slice touches broad/shared infrastructure, also run:

- `npm --prefix electron-app run lint:all`
- `npm --prefix electron-app test`
- `npm --prefix electron-app run typecheck`

### Final confidence gate

Run all of the following:

- full lint
- full typecheck
- full test suite
- build/package smoke validation such as:
  - `npm --prefix electron-app run package`

Also smoke test:

- Electron startup
- opening FIT files from `fit-test-files`
- core analysis/display workflow

---

## Working Method

- Read the relevant code before changing it.
- Understand the existing architecture and data flow before refactoring.
- Keep a running to-do list for multi-step work.
- Make small, coherent, reviewable commits locally.
- Do **not** push.
- Document important migration decisions in commit messages or brief notes.
- If a major architectural choice is unclear, stop and evaluate options instead of guessing.

---

## Anti-Goals

Do **not**:

- preserve broken behavior just because it is legacy
- silence type errors globally
- add broad escape hatches to “finish faster”
- keep unsafe runtime dependency hacks for convenience
- introduce large speculative rewrites without validation
- make cosmetic refactors that obscure real migration intent
- create fake type coverage through declarations instead of typing real source modules

---

## Definition of Done

The migration is successful when:

- the codebase is primarily first-class TypeScript
- strict typing is meaningful and enforced
- lint/typecheck/test/build/package workflows are reliable
- Electron startup works
- FIT file open/analyze workflows work correctly
- IPC and preload boundaries are explicit and typed
- runtime dependency loading is clean and maintainable
- legacy unsafe patterns have been removed or sharply isolated
- the resulting architecture is easier to understand, extend, and debug
