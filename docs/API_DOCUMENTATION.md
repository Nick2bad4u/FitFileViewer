# FitFileViewer API Documentation

Root API documentation is an index, not a second source of API truth. Keep API
contracts in source comments and the maintained Docusaurus reference pages so
the root docs do not drift into stale examples.

## Maintained References

| Area | Maintained reference |
| --- | --- |
| Core application APIs | `docusaurus/docs/api-reference/core-apis.md` |
| IPC contracts | `docusaurus/docs/api-reference/ipc-communication.md` |
| Utility APIs | `docusaurus/docs/api-reference/utility-apis.md` |
| State management | `docusaurus/docs/api-reference/state-management.md` |
| Generated TypeDoc output | `docusaurus/docs/api/` |

## Source Entrypoints

The Electron application is root-managed, but runtime source still lives under
`electron-app/`. Current primary source entrypoints are:

- `electron-app/fitParser.ts`
- `electron-app/main.ts`
- `electron-app/main-ui.ts`
- `electron-app/preload.ts`
- `electron-app/renderer.ts`

Runtime JavaScript is generated into root `dist/` by `npm run build:runtime-ts`.
Do not document generated files as source modules.

## Import Policy

Runtime import specifiers may end in `.js` because the TypeScript build emits
JavaScript into `dist/`, but documentation should point at the current
TypeScript source files. For utility APIs, use the domain paths under
`electron-app/utils/`, for example:

- `electron-app/utils/formatting/formatters/formatDistance.ts`
- `electron-app/utils/maps/core/renderMap.ts`
- `electron-app/utils/charts/core/renderChartJS.ts`
- `electron-app/utils/state/core/stateManager.ts`

## Maintenance Rules

- Keep root tooling, package metadata, and scripts in the repository root.
- Keep package-sourced renderer libraries managed through root `package.json`
  and the `renderer-vendor` bundle.
- Do not reintroduce a second API reference here with speculative plugin,
  testing, or utility examples.
- Update the Docusaurus API reference pages when API behavior changes.
