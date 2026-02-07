# Lint Notes

## Root lint scripts

The repository root now provides a lint entry point that orchestrates linting
across the workspace:

- `npm run lint` runs root linting, Electron app linting, and Docusaurus
  linting.
- `npm run lint:root` lints root-level code (excluding `electron-app` and
  `docusaurus`) using the Electron ESLint config.
- `npm run lint:root:check` runs the same root lint pass without auto-fixes.

## Docusaurus lint scripts

The Docusaurus package now includes lint scripts:

- `npm run lint` runs both code and content linting.
- `npm run lint:code` lints TS/TSX code using the Electron ESLint config.
- `npm run lint:content` continues to run markdownlint for docs/blog/src.
