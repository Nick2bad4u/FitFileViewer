# Repository Guidelines

## Project Structure & Module Organization

FitFileViewer is centered on `electron-app/`, the Electron desktop app for opening, parsing, and visualizing `.fit` activity files. Main runtime entry points are `electron-app/main.js`, `preload.js`, `renderer.js`, and `main-ui.js`. Domain code belongs under `electron-app/utils/`; shared TypeScript contracts live in `electron-app/shared/`; Vitest suites and fixtures live in `tests/unit/`, `tests/integration/`, and `tests/fixtures/`. Chart, file, lifecycle, main-process, map, menu, preload, rendering, runtime, strict regression, tab, theming, utility, packaging, and shared behavior suites live under `tests/unit/`; Electron Playwright smoke tests live in `tests/playwright/`. App assets are in `static/app/`, `static/icons/`, and related UI folders. Documentation lives in `docs/` and the Docusaurus site in `docusaurus/`. Real sample activities are kept in `fit-test-files/`.

## Build, Test, and Development Commands

- `npm install`: install root workspace, Electron app, and Docusaurus dependencies.
- `npm run lint`: run root, Electron, and Docusaurus lint workflows.
- `npm start`: build runtime TypeScript, then launch Electron.
- `npm run typecheck`: run the app TypeScript check.
- `npm test`: run the Vitest suite.
- `npm run test:playwright`: run the Electron Playwright smoke test.
- `npm run package`: run runtime TypeScript build and create an unpacked Electron package.
- `npm run docs:start`: run the docs site locally.
- `npm run docs:build`: generate API docs and build the static site.

## Coding Style & Naming Conventions

Use the existing CommonJS runtime style unless a file is already TypeScript or part of the ongoing TypeScript migration. Keep modules small and place new utilities under `electron-app/utils/<domain>/`. Use descriptive behavior-based filenames such as `formatDuration.ts`, `renderMap.js`, or `stateMiddleware.branches.test.ts`. Formatting and linting are enforced with ESLint, Prettier, Stylelint, Remark, Markdownlint, and Secretlint.

## Testing Guidelines

Use Vitest for app tests. Prefer `*.test.ts` for new Vitest tests and place them under `tests/unit/` or `tests/integration/` as appropriate. Place Electron Playwright smoke tests under `tests/playwright/`. Use `tests/fixtures/` for reusable Vitest fixtures and `fit-test-files/` for real FIT-file coverage. Run targeted tests while developing, then run `npm test` before opening a PR.

## Commit & Pull Request Guidelines

Recent history uses an emoji plus bracketed type format, for example `sparkles [feat] Add route comparison` or `wrench [build] Update package configuration`. Keep subjects imperative and concise. Pull requests should summarize behavior changes, link issues, list verification commands, and include screenshots or GIFs for UI work. Note platform coverage for Electron startup, packaging, file-open, or filesystem changes.

## Agent-Specific Instructions

Keep edits scoped to the requested change. Verify with the relevant npm scripts before claiming completion, and call out any remaining failing gate directly.
