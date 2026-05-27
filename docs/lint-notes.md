# Lint Notes

## Root lint scripts

The repository root now provides a lint entry point that orchestrates linting
across the workspace:

- `npm run lint` runs root linting, Electron app linting, and Docusaurus
  linting.
- `npm run lint:root` lints root-level code (excluding `electron-app` and
  `docusaurus`) using the Electron ESLint config.

## Docusaurus lint scripts

Run Docusaurus linting from the repository root:

- `npm run lint:docusaurus` runs both code and content linting.
- `npm run lint:docusaurus:fix` fixes Docusaurus code lint issues and then
  runs content linting.
- `npm run lint:docusaurus:content` runs the Docusaurus markdown/content lint
  gate.
