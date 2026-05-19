# Repository Guidelines

## Project Structure & Module Organization

FitFileViewer is centered on `electron-app/`, the Electron desktop app for opening, parsing, and visualizing `.fit` activity files. Main runtime entry points are `electron-app/main.js`, `preload.js`, `renderer.js`, and `main-ui.js`. Domain code belongs under `electron-app/utils/`; shared TypeScript contracts live in `electron-app/shared/`; tests live in `electron-app/tests/`. App assets are in `electron-app/assets/`, `icons/`, and related UI folders. Documentation lives in `docs/` and the Docusaurus site in `docusaurus/`. Real sample activities are kept in `fit-test-files/`.

## Build, Test, and Development Commands

- `npm install`: install root tooling.
- `cd electron-app && npm install`: install app dependencies.
- `npm run lint`: run root, Electron, and Docusaurus lint workflows.
- `cd electron-app && npm start`: build runtime TypeScript, then launch Electron.
- `cd electron-app && npm run typecheck`: run the app TypeScript check.
- `cd electron-app && npm test`: run the Vitest suite.
- `cd electron-app && npm run package`: run runtime TypeScript build and create an unpacked Electron package.
- `cd docusaurus && npm start`: run the docs site locally.
- `cd docusaurus && npm run build`: generate API docs and build the static site.

## Coding Style & Naming Conventions

Use the existing CommonJS runtime style unless a file is already TypeScript or part of the ongoing TypeScript migration. Keep modules small and place new utilities under `electron-app/utils/<domain>/`. Use descriptive behavior-based filenames such as `formatDuration.ts`, `renderMap.js`, or `stateMiddleware.branches.test.ts`. Formatting and linting are enforced with ESLint, Prettier, Stylelint, Remark, Markdownlint, and Secretlint.

## Testing Guidelines

Use Vitest for app tests. Prefer `*.test.ts` for new tests and place them under the relevant `electron-app/tests/` area. Use `electron-app/tests/fixtures/` for reusable fixtures and `fit-test-files/` for real FIT-file coverage. Run targeted tests while developing, then run `cd electron-app && npm test` before opening a PR.

## Commit & Pull Request Guidelines

Recent history uses an emoji plus bracketed type format, for example `sparkles [feat] Add route comparison` or `wrench [build] Update package configuration`. Keep subjects imperative and concise. Pull requests should summarize behavior changes, link issues, list verification commands, and include screenshots or GIFs for UI work. Note platform coverage for Electron startup, packaging, file-open, or filesystem changes.

## Agent-Specific Instructions

Keep edits scoped to the requested change. Verify with the relevant npm scripts before claiming completion, and call out any remaining failing gate directly.
