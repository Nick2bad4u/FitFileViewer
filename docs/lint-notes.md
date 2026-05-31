# Lint Notes

## Root lint scripts

The repository root now provides a lint entry point that orchestrates linting
across the workspace:

- `npm run lint` runs root linting, Electron app linting, and Docusaurus
  linting.
- `npm run lint:root` lints root-level code (excluding `electron-app` and
  `docusaurus`) with the root-owned ESLint config.
- `npm run lint:electron-app` applies the same shared ESLint config to
  `electron-app` through the root `eslint.config.mjs`, then runs the root
  TypeScript typecheck.
- `node scripts/run-eslint.mjs <path>` lints an explicit existing file or
  directory with the root `eslint.config.mjs`.
- `npm run prettier` checks the root-owned Prettier target list.
- `npm run prettier -- README.md` checks a specific path through the root
  Prettier wrapper; use `npm run prettier:fix -- <path>` to write fixes.

## Pre-commit linting

The pre-commit configuration uses local hooks that call
`node scripts/run-eslint.mjs` from the repository root. Do not reintroduce
`pre-commit/mirrors-eslint`; that installs a separate ESLint copy and bypasses
the root npm dependency tree, root ESLint cache policy, and shared config.

## Docusaurus lint scripts

Run Docusaurus linting from the repository root:

- `npm run lint:docusaurus` runs both code and content linting.
- `npm run lint:docusaurus:fix` fixes Docusaurus code lint issues and then
  runs content linting.
- `npm run lint:docusaurus:content` runs the Docusaurus markdown/content lint
  gate.
