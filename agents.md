# Repository Guidelines

## Project Structure & Module Organization

FitFileViewer is a JavaScript/TypeScript workspace centered on `electron-app/`, the desktop app for parsing and visualizing `.fit` activity files. App entry points are `electron-app/main.js`, `preload.js`, `renderer.js`, and `main-ui.js`. Feature modules live under `electron-app/utils/` by domain, including `charts/`, `maps/`, `state/`, `storage/`, `theming/`, and `ui/`. Tests live in `electron-app/tests/`; Docusaurus docs live in `docusaurus/`; repo guides live in `docs/`. Sample FIT files are in `fit-test-files/`.

## Build, Test, and Development Commands

- `npm install`: install root tooling; also run inside `electron-app/` and `docusaurus/` as needed.
- `npm run lint`: run root, Electron, and Docusaurus lint workflows.
- `cd electron-app && npm start`: launch the Electron app.
- `cd electron-app && npm test`: run the Vitest suite.
- `cd electron-app && npm run typecheck`: check TypeScript declarations and tests.
- `cd electron-app && npm run build`: package with `electron-builder`.
- `cd docusaurus && npm start`: run docs locally.
- `cd docusaurus && npm run build`: generate API docs and build the static site.

## Coding Style & Naming Conventions

Follow the existing CommonJS app style in `electron-app/` and TypeScript where it is already used for tests, declarations, and docs tooling. Use Prettier, ESLint, Stylelint, Remark/Markdownlint, and Secretlint through the checked-in configs. Name files by behavior, for example `renderMap.js`, `formatDuration.js`, or `stateMiddleware.branches.test.ts`. Prefer small modules under `electron-app/utils/<area>/` instead of expanding entry-point files.

## Testing Guidelines

Use Vitest for primary app tests and Jest only for existing Jest/e2e paths. Place new tests near the relevant domain under `electron-app/tests/`, using `*.test.ts` or `*.test.js`. Add reusable fixtures under `electron-app/tests/fixtures/`, and use `fit-test-files/` for real FIT-file scenarios. Run targeted tests during development, then run `cd electron-app && npm test` before a PR.

## Commit & Pull Request Guidelines

Commit messages use the repository’s emoji and bracketed type format, for example `✨ [feat] Add map lap selector` or `🛠️ [fix] Correct FIT parser error handling`. Prioritize source changes before test or tooling notes. Pull requests should fill the matching template, link issues, summarize changed files, describe test coverage, and include screenshots or GIFs for UI changes. Note platform coverage when behavior or packaging changes.

## Agent-Specific Instructions

Keep changes scoped, verify with the relevant npm scripts, and do not report work as complete while lint, typecheck, or tests that apply to the change are still failing.
