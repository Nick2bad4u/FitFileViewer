<!-- markdownlint-disable -->
# Changelog

All notable changes to this project will be documented in this file.

## [19.0.0] - 2025-06-07

### 🚀 Features

- Update GitHub workflows for improved linting and scanning processes

- Update GitHub workflows with concurrency settings and add new badges to README


### 💼 Other

- Refactor GitHub Actions workflows and enhance application features

- Updated ESLint workflow to remove unnecessary working directory specification.
- Simplified Prettier workflow by removing SARIF conversion and upload steps, added continue-on-error option.
- Cleaned up repo-stats workflow by removing redundant plugin configurations.
- Enhanced README.md with additional visuals and badges for better project visibility.
- Improved accessibility by adding title attributes to iframes in index.html.
- Obfuscated API keys in index-CQWboq_8.js for security.
- Added IPC handlers in main.js to retrieve app, Electron, Node.js, and Chrome versions.
- Implemented tab button enabling/disabling functionality in main UI and utility functions.
- Added hover effects and improved close button functionality in about modal.
- Removed unnecessary tsconfig.json file.
- Created enableTabButtons.js utility to manage tab button states.

- Refactor code structure and remove redundant sections for improved readability and maintainability

- Enhances Charts and Libraries Integration

Replaces outdated screenshots and descriptions in README
Introduces new "Charts v2" tab with Chart.js support
Adds Hammer.js for touch/pinch functionality in charts
Updates dependencies, icons, and credits for improved clarity
Refines tab visibility and loading behavior for better UX

Enhances charts and updates documentation

Introduces "Charts v2" tab with Chart.js and touch/pinch support
Replaces outdated screenshots and descriptions in README
Updates dependencies, icons, and credits for clarity
Improves tab visibility and loading behavior for better UX

Relates to #456

- Merge pull request #79 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-0523d757ec

Bump the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 2 updates

- Merge pull request #82 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/npm-all-3319742fda

Bump the npm-all group in /electron-app/libs/zwiftmap-main/backend with 34 updates

- Merge pull request #81 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/npm-all-8289ba21ba

Bump the npm-all group in /electron-app/libs/zwiftmap-main/browser-extension with 29 updates

- Merge pull request #92 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-2f20eee292

Bump the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 1 update

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Refactor code structure and improve readability; no functional changes made.
Removed a ton of un-needed files.

- Update changelogs and scripts: Add new version numbers, enhance GitHub Actions, and implement release cleanup script

- Update changelogs and version numbers for releases 16.4.0, 16.5.0, and 16.6.0; enhance GitHub Actions and implement release cleanup script

- Enhance workflows and documentation for Flatpak build process, including versioning updates and new download options


### ⚙️ Miscellaneous Tasks

- Update GitHub Actions workflows and dependencies; fix badge link in README

- Add changelog files for electron-app, tests, and utils

- Update changelogs and scripts for versioning and GitHub Actions enhancements

- Update changelogs and scripts for versioning and GitHub Actions enhancements


### 🛡️ Security

- Bump the npm_and_yarn group

Bumps the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 2 updates: [fastify](https://github.com/fastify/fastify) and [netlify-cli](https://github.com/netlify/cli).


Removes `fastify`

Updates `netlify-cli` from 20.1.1 to 21.5.0
- [Release notes](https://github.com/netlify/cli/releases)
- [Changelog](https://github.com/netlify/cli/blob/main/CHANGELOG.md)
- [Commits](https://github.com/netlify/cli/compare/v20.1.1...v21.5.0)

---
updated-dependencies:
- dependency-name: fastify
  dependency-version: 
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: netlify-cli
  dependency-version: 21.5.0
  dependency-type: direct:development
  dependency-group: npm_and_yarn
...

Signed-off-by: dependabot[bot] <support@github.com>

- Bump the npm-all group

Bumps the npm-all group in /electron-app/libs/zwiftmap-main/backend with 34 updates:

| Package | From | To |
| --- | --- | --- |
| [@google-cloud/firestore](https://github.com/googleapis/nodejs-firestore) | `7.11.0` | `7.11.1` |
| [@google-cloud/logging-winston](https://github.com/googleapis/nodejs-logging-winston) | `6.0.0` | `6.0.1` |
| [@sentry/node](https://github.com/getsentry/sentry-javascript) | `9.15.0` | `9.24.0` |
| [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) | `5.2.1` | `5.2.3` |
| [sharp](https://github.com/lovell/sharp) | `0.34.1` | `0.34.2` |
| [@types/compression](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/compression) | `1.7.5` | `1.8.0` |
| [@types/cors](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/cors) | `2.8.17` | `2.8.18` |
| [@types/express](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/express) | `5.0.1` | `5.0.2` |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node) | `22.15.3` | `22.15.29` |
| [@types/validator](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/validator) | `13.15.0` | `13.15.1` |
| [tsc-watch](https://github.com/gilamran/tsc-watch) | `6.2.1` | `7.1.1` |
| [google-gax](https://github.com/googleapis/gax-nodejs/tree/HEAD/gax) | `4.6.0` | `4.6.1` |
| [@grpc/grpc-js](https://github.com/grpc/grpc-node) | `1.13.3` | `1.13.4` |
| [@img/sharp-darwin-arm64](https://github.com/lovell/sharp/tree/HEAD/npm/darwin-arm64) | `0.34.1` | `0.34.2` |
| [@img/sharp-darwin-x64](https://github.com/lovell/sharp/tree/HEAD/npm/darwin-x64) | `0.34.1` | `0.34.2` |
| [@img/sharp-linux-arm](https://github.com/lovell/sharp/tree/HEAD/npm/linux-arm) | `0.34.1` | `0.34.2` |
| [@img/sharp-linux-arm64](https://github.com/lovell/sharp/tree/HEAD/npm/linux-arm64) | `0.34.1` | `0.34.2` |
| [@img/sharp-linux-s390x](https://github.com/lovell/sharp/tree/HEAD/npm/linux-s390x) | `0.34.1` | `0.34.2` |
| [@img/sharp-linux-x64](https://github.com/lovell/sharp/tree/HEAD/npm/linux-x64) | `0.34.1` | `0.34.2` |
| [@img/sharp-linuxmusl-arm64](https://github.com/lovell/sharp/tree/HEAD/npm/linuxmusl-arm64) | `0.34.1` | `0.34.2` |
| [@img/sharp-linuxmusl-x64](https://github.com/lovell/sharp/tree/HEAD/npm/linuxmusl-x64) | `0.34.1` | `0.34.2` |
| [@img/sharp-wasm32](https://github.com/lovell/sharp/tree/HEAD/npm/wasm32) | `0.34.1` | `0.34.2` |
| [@img/sharp-win32-ia32](https://github.com/lovell/sharp/tree/HEAD/npm/win32-ia32) | `0.34.1` | `0.34.2` |
| [@img/sharp-win32-x64](https://github.com/lovell/sharp/tree/HEAD/npm/win32-x64) | `0.34.1` | `0.34.2` |
| [@prisma/instrumentation](https://github.com/prisma/prisma/tree/HEAD/packages/instrumentation) | `6.6.0` | `6.8.2` |
| [@sentry/core](https://github.com/getsentry/sentry-javascript) | `9.15.0` | `9.24.0` |
| [@sentry/opentelemetry](https://github.com/getsentry/sentry-javascript) | `9.15.0` | `9.24.0` |
| [@types/lodash](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/lodash) | `4.17.16` | `4.17.17` |
| [@types/qs](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/qs) | `6.9.18` | `6.14.0` |
| [http-cache-semantics](https://github.com/kornelski/http-cache-semantics) | `4.1.1` | `4.2.0` |
| [import-in-the-middle](https://github.com/nodejs/import-in-the-middle) | `1.13.1` | `1.14.0` |
| [jwa](https://github.com/brianloveswords/node-jwa) | `2.0.0` | `2.0.1` |
| [pg-protocol](https://github.com/brianc/node-postgres/tree/HEAD/packages/pg-protocol) | `1.9.5` | `1.10.0` |
| [protobufjs](https://github.com/protobufjs/protobuf.js) | `7.5.0` | `7.5.3` |


Updates `@google-cloud/firestore` from 7.11.0 to 7.11.1
- [Release notes](https://github.com/googleapis/nodejs-firestore/releases)
- [Changelog](https://github.com/googleapis/nodejs-firestore/blob/main/CHANGELOG.md)
- [Commits](https://github.com/googleapis/nodejs-firestore/compare/v7.11.0...v7.11.1)

Updates `@google-cloud/logging-winston` from 6.0.0 to 6.0.1
- [Release notes](https://github.com/googleapis/nodejs-logging-winston/releases)
- [Changelog](https://github.com/googleapis/nodejs-logging-winston/blob/main/CHANGELOG.md)
- [Commits](https://github.com/googleapis/nodejs-logging-winston/compare/v6.0.0...v6.0.1)

Updates `@sentry/node` from 9.15.0 to 9.24.0
- [Release notes](https://github.com/getsentry/sentry-javascript/releases)
- [Changelog](https://github.com/getsentry/sentry-javascript/blob/develop/CHANGELOG.md)
- [Commits](https://github.com/getsentry/sentry-javascript/compare/9.15.0...9.24.0)

Updates `fast-xml-parser` from 5.2.1 to 5.2.3
- [Release notes](https://github.com/NaturalIntelligence/fast-xml-parser/releases)
- [Changelog](https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/CHANGELOG.md)
- [Commits](https://github.com/NaturalIntelligence/fast-xml-parser/compare/v5.2.1...v5.2.3)

Updates `sharp` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/compare/v0.34.1...v0.34.2)

Updates `@types/compression` from 1.7.5 to 1.8.0
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/compression)

Updates `@types/cors` from 2.8.17 to 2.8.18
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/cors)

Updates `@types/express` from 5.0.1 to 5.0.2
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/express)

Updates `@types/node` from 22.15.3 to 22.15.29
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node)

Updates `@types/validator` from 13.15.0 to 13.15.1
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/validator)

Updates `tsc-watch` from 6.2.1 to 7.1.1
- [Release notes](https://github.com/gilamran/tsc-watch/releases)
- [Changelog](https://github.com/gilamran/tsc-watch/blob/master/CHANGELOG.md)
- [Commits](https://github.com/gilamran/tsc-watch/commits)

Updates `google-gax` from 4.6.0 to 4.6.1
- [Release notes](https://github.com/googleapis/gax-nodejs/releases)
- [Changelog](https://github.com/googleapis/gax-nodejs/blob/main/gax/CHANGELOG.md)
- [Commits](https://github.com/googleapis/gax-nodejs/commits/google-gax-v4.6.1/gax)

Updates `@grpc/grpc-js` from 1.13.3 to 1.13.4
- [Release notes](https://github.com/grpc/grpc-node/releases)
- [Commits](https://github.com/grpc/grpc-node/compare/@grpc/grpc-js@1.13.3...@grpc/grpc-js@1.13.4)

Updates `@img/sharp-darwin-arm64` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.2/npm/darwin-arm64)

Updates `@img/sharp-darwin-x64` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.2/npm/darwin-x64)

Updates `@img/sharp-linux-arm` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.2/npm/linux-arm)

Updates `@img/sharp-linux-arm64` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.2/npm/linux-arm64)

Updates `@img/sharp-linux-s390x` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.2/npm/linux-s390x)

Updates `@img/sharp-linux-x64` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.2/npm/linux-x64)

Updates `@img/sharp-linuxmusl-arm64` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.2/npm/linuxmusl-arm64)

Updates `@img/sharp-linuxmusl-x64` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.2/npm/linuxmusl-x64)

Updates `@img/sharp-wasm32` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.2/npm/wasm32)

Updates `@img/sharp-win32-ia32` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.2/npm/win32-ia32)

Updates `@img/sharp-win32-x64` from 0.34.1 to 0.34.2
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.2/npm/win32-x64)

Updates `@prisma/instrumentation` from 6.6.0 to 6.8.2
- [Release notes](https://github.com/prisma/prisma/releases)
- [Commits](https://github.com/prisma/prisma/commits/6.8.2/packages/instrumentation)

Updates `@sentry/core` from 9.15.0 to 9.24.0
- [Release notes](https://github.com/getsentry/sentry-javascript/releases)
- [Changelog](https://github.com/getsentry/sentry-javascript/blob/develop/CHANGELOG.md)
- [Commits](https://github.com/getsentry/sentry-javascript/compare/9.15.0...9.24.0)

Updates `@sentry/opentelemetry` from 9.15.0 to 9.24.0
- [Release notes](https://github.com/getsentry/sentry-javascript/releases)
- [Changelog](https://github.com/getsentry/sentry-javascript/blob/develop/CHANGELOG.md)
- [Commits](https://github.com/getsentry/sentry-javascript/compare/9.15.0...9.24.0)

Updates `@types/lodash` from 4.17.16 to 4.17.17
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/lodash)

Updates `@types/qs` from 6.9.18 to 6.14.0
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/qs)

Updates `http-cache-semantics` from 4.1.1 to 4.2.0
- [Commits](https://github.com/kornelski/http-cache-semantics/commits)

Updates `import-in-the-middle` from 1.13.1 to 1.14.0
- [Release notes](https://github.com/nodejs/import-in-the-middle/releases)
- [Changelog](https://github.com/nodejs/import-in-the-middle/blob/main/CHANGELOG.md)
- [Commits](https://github.com/nodejs/import-in-the-middle/compare/import-in-the-middle-v1.13.1...import-in-the-middle-v1.14.0)

Updates `jwa` from 2.0.0 to 2.0.1
- [Release notes](https://github.com/brianloveswords/node-jwa/releases)
- [Commits](https://github.com/brianloveswords/node-jwa/compare/v2.0.0...v2.0.1)

Updates `pg-protocol` from 1.9.5 to 1.10.0
- [Changelog](https://github.com/brianc/node-postgres/blob/master/CHANGELOG.md)
- [Commits](https://github.com/brianc/node-postgres/commits/pg-protocol@1.10.0/packages/pg-protocol)

Updates `protobufjs` from 7.5.0 to 7.5.3
- [Release notes](https://github.com/protobufjs/protobuf.js/releases)
- [Changelog](https://github.com/protobufjs/protobuf.js/blob/master/CHANGELOG.md)
- [Commits](https://github.com/protobufjs/protobuf.js/compare/protobufjs-v7.5.0...protobufjs-v7.5.3)

---
updated-dependencies:
- dependency-name: "@google-cloud/firestore"
  dependency-version: 7.11.1
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@google-cloud/logging-winston"
  dependency-version: 6.0.1
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@sentry/node"
  dependency-version: 9.24.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: fast-xml-parser
  dependency-version: 5.2.3
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: sharp
  dependency-version: 0.34.2
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@types/compression"
  dependency-version: 1.8.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@types/cors"
  dependency-version: 2.8.18
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@types/express"
  dependency-version: 5.0.2
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@types/node"
  dependency-version: 22.15.29
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@types/validator"
  dependency-version: 13.15.1
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: tsc-watch
  dependency-version: 7.1.1
  dependency-type: direct:development
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: google-gax
  dependency-version: 4.6.1
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@grpc/grpc-js"
  dependency-version: 1.13.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-darwin-arm64"
  dependency-version: 0.34.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-darwin-x64"
  dependency-version: 0.34.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-linux-arm"
  dependency-version: 0.34.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-linux-arm64"
  dependency-version: 0.34.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-linux-s390x"
  dependency-version: 0.34.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-linux-x64"
  dependency-version: 0.34.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-linuxmusl-arm64"
  dependency-version: 0.34.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-linuxmusl-x64"
  dependency-version: 0.34.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-wasm32"
  dependency-version: 0.34.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-win32-ia32"
  dependency-version: 0.34.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-win32-x64"
  dependency-version: 0.34.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@prisma/instrumentation"
  dependency-version: 6.8.2
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@sentry/core"
  dependency-version: 9.24.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@sentry/opentelemetry"
  dependency-version: 9.24.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@types/lodash"
  dependency-version: 4.17.17
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@types/qs"
  dependency-version: 6.14.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: http-cache-semantics
  dependency-version: 4.2.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: import-in-the-middle
  dependency-version: 1.14.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: jwa
  dependency-version: 2.0.1
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: pg-protocol
  dependency-version: 1.10.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: protobufjs
  dependency-version: 7.5.3
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
...

Signed-off-by: dependabot[bot] <support@github.com>

- Bump the npm-all group

Bumps the npm-all group in /electron-app/libs/zwiftmap-main/browser-extension with 29 updates:

| Package | From | To |
| --- | --- | --- |
| [@types/chrome](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/chrome) | `0.0.318` | `0.0.326` |
| [@types/leaflet](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/leaflet) | `1.9.17` | `1.9.18` |
| [esbuild](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/aix-ppc64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/android-arm](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/android-arm64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/android-x64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/darwin-arm64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/darwin-x64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/freebsd-arm64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/freebsd-x64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/linux-arm](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/linux-arm64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/linux-ia32](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/linux-loong64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/linux-mips64el](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/linux-ppc64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/linux-riscv64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/linux-s390x](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/linux-x64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/netbsd-arm64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/netbsd-x64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/openbsd-arm64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/openbsd-x64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/sunos-x64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/win32-arm64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/win32-ia32](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@esbuild/win32-x64](https://github.com/evanw/esbuild) | `0.25.3` | `0.25.5` |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node) | `22.15.3` | `22.15.29` |


Updates `@types/chrome` from 0.0.318 to 0.0.326
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/chrome)

Updates `@types/leaflet` from 1.9.17 to 1.9.18
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/leaflet)

Updates `esbuild` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/aix-ppc64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/android-arm` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/android-arm64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/android-x64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/darwin-arm64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/darwin-x64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/freebsd-arm64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/freebsd-x64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/linux-arm` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/linux-arm64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/linux-ia32` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/linux-loong64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/linux-mips64el` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/linux-ppc64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/linux-riscv64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/linux-s390x` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/linux-x64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/netbsd-arm64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/netbsd-x64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/openbsd-arm64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/openbsd-x64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/sunos-x64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/win32-arm64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/win32-ia32` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@esbuild/win32-x64` from 0.25.3 to 0.25.5
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.3...v0.25.5)

Updates `@types/node` from 22.15.3 to 22.15.29
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node)

---
updated-dependencies:
- dependency-name: "@types/chrome"
  dependency-version: 0.0.326
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@types/leaflet"
  dependency-version: 1.9.18
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: esbuild
  dependency-version: 0.25.5
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/aix-ppc64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/android-arm"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/android-arm64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/android-x64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/darwin-arm64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/darwin-x64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/freebsd-arm64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/freebsd-x64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/linux-arm"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/linux-arm64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/linux-ia32"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/linux-loong64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/linux-mips64el"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/linux-ppc64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/linux-riscv64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/linux-s390x"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/linux-x64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/netbsd-arm64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/netbsd-x64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/openbsd-arm64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/openbsd-x64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/sunos-x64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/win32-arm64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/win32-ia32"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/win32-x64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@types/node"
  dependency-version: 22.15.29
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
...

Signed-off-by: dependabot[bot] <support@github.com>

- Bump the npm_and_yarn group

Bumps the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 2 updates:  and [tar-fs](https://github.com/mafintosh/tar-fs).


Updates `tar-fs` from 2.1.2 to 3.0.9
- [Commits](https://github.com/mafintosh/tar-fs/compare/v2.1.2...v3.0.9)

Updates `tar-fs` from 3.0.8 to 3.0.9
- [Commits](https://github.com/mafintosh/tar-fs/compare/v2.1.2...v3.0.9)

---
updated-dependencies:
- dependency-name: tar-fs
  dependency-version: 3.0.9
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: tar-fs
  dependency-version: 3.0.9
  dependency-type: indirect
  dependency-group: npm_and_yarn
...

Signed-off-by: dependabot[bot] <support@github.com>


## [8.0.0] - 2025-05-07

### 🚀 Features

- Implement feed entries fetching and image replacement for Zwift map extension

- Add custom map type selection button and zoom slider for enhanced user interaction

- Implement FIT reader library with core functionalities

- Add core files for FIT File Viewer application

- Unify file open logic and ensure both readers update from all sources

- Add listener for decoder options changes and update data table


### 🐛 Bug Fixes

- Update vite version to 6.3.4; enhance measurement tool UI with SVG icons and add GPX export functionality


### 🛠️ GitHub Actions

- *(deps-dev)* Bump typescript

- *(deps)* Bump the npm-all group


### 💼 Other

- Refactor code structure for improved readability and maintainability

- Fix path to Chart.js library in renderMap function for elevation profile chart

- Delete 34 files

- Refactor code structure and remove redundant sections for improved readability and maintainability

- *(deps)* Bump the npm_and_yarn group across 2 directories with 21 updates

- Merge PR #15

build(deps): bump the npm_and_yarn group across 2 directories with 21 updates

- *(deps)* Bump react-dom and @types/react-dom

- Merge pull request #33 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/multi-1dbe629cdc

build(deps): bump react-dom and @types/react-dom in /electron-app/libs/zwiftmap-main/frontend

- *(deps)* Bump @tanstack/react-query-devtools

- Merge pull request #32 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/tanstack/react-query-devtools-5.74.9

build(deps): bump @tanstack/react-query-devtools from 5.66.0 to 5.74.9 in /electron-app/libs/zwiftmap-main/frontend

- *(deps)* Bump @turf/nearest-point-on-line

- Merge pull request #26 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/turf/nearest-point-on-line-7.2.0

build(deps): bump @turf/nearest-point-on-line from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend

- *(deps)* Bump zwift-data

- Merge pull request #24 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/zwift-data-1.43.0

build(deps): bump zwift-data from 1.42.0 to 1.43.0 in /electron-app/libs/zwiftmap-main/browser-extension

- *(deps)* Bump @google-cloud/secret-manager

- Merge pull request #20 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/google-cloud/secret-manager-6.0.1

build(deps): bump @google-cloud/secret-manager from 5.6.0 to 6.0.1 in /electron-app/libs/zwiftmap-main/backend

- *(deps)* Bump @sentry/react

- Merge pull request #31 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/sentry/react-9.15.0

build(deps): bump @sentry/react from 8.53.0 to 9.15.0 in /electron-app/libs/zwiftmap-main/frontend

- *(deps-dev)* Bump @types/node

- Merge pull request #30 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/types/node-22.15.3

build(deps-dev): bump @types/node from 22.13.0 to 22.15.3 in /electron-app/libs/zwiftmap-main/backend

- *(deps)* Bump fast-xml-parser

- Merge pull request #29 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/fast-xml-parser-5.2.1

build(deps): bump fast-xml-parser from 4.5.1 to 5.2.1 in /electron-app/libs/zwiftmap-main/backend

- *(deps-dev)* Bump esbuild

- Merge pull request #21 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/esbuild-0.25.3

build(deps-dev): bump esbuild from 0.25.0 to 0.25.3 in /electron-app/libs/zwiftmap-main/browser-extension

- *(deps)* Bump dotenv in /electron-app/libs/zwiftmap-main/backend

- Merge pull request #22 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/dotenv-16.5.0

build(deps): bump dotenv from 16.4.7 to 16.5.0 in /electron-app/libs/zwiftmap-main/backend

- Merge pull request #23 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/typescript-5.8.3

build(deps-dev): bump typescript from 5.7.3 to 5.8.3 in /electron-app/libs/zwiftmap-main/frontend

- *(deps-dev)* Bump @types/chrome

- Merge pull request #25 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/types/chrome-0.0.317

build(deps-dev): bump @types/chrome from 0.0.316 to 0.0.317 in /electron-app/libs/zwiftmap-main/browser-extension

- *(deps)* Bump @tanstack/react-query

- Merge pull request #28 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/tanstack/react-query-5.74.9

build(deps): bump @tanstack/react-query from 5.66.0 to 5.74.9 in /electron-app/libs/zwiftmap-main/frontend

- Refactor code structure for improved readability and maintainability

- *(deps)* Bump @sentry/node

- Merge PR #46

build(deps): bump @sentry/node from 8.53.0 to 9.15.0 in /electron-app/libs/zwiftmap-main/backend

- *(deps)* Bump @turf/length

- Merge PR #45

build(deps): bump @turf/length from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend

- *(deps-dev)* Bump @types/validator

- Merge PR #44

build(deps-dev): bump @types/validator from 13.12.2 to 13.15.0 in /electron-app/libs/zwiftmap-main/backend

- *(deps)* Bump @turf/difference

- Merge PR #43

build(deps): bump @turf/difference from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend

- *(deps)* Bump the npm-all group

- Merge PR #47

build(deps): bump the npm-all group in /electron-app/libs/zwiftmap-main/browser-extension with 4 updates

- *(deps)* Bump @turf/buffer

- Merge PR #42

build(deps): bump @turf/buffer from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend

- *(deps-dev)* Bump vitest

- Merge pull request #36 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/vitest-3.1.2

build(deps-dev): bump vitest from 2.1.9 to 3.1.2 in /electron-app/libs/zwiftmap-main/frontend

- *(deps)* Bump @turf/length

- Merge pull request #37 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/turf/length-7.2.0

build(deps): bump @turf/length from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/frontend

- *(deps)* Bump @types/leaflet

- Merge pull request #38 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/types/leaflet-1.9.17

build(deps): bump @types/leaflet from 1.9.5 to 1.9.17 in /electron-app/libs/zwiftmap-main/frontend

- *(deps)* Bump @turf/buffer

- Merge pull request #40 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/turf/buffer-7.2.0

build(deps): bump @turf/buffer from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/frontend

- *(deps-dev)* Bump vite

- Merge pull request #50 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-de653eece3

build(deps-dev): bump vite from 6.3.3 to 6.3.4 in /electron-app/libs/zwiftmap-main/frontend in the npm_and_yarn group

- Merge pull request #54 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/npm-all-4c4c415551

build(deps): bump the npm-all group in /electron-app/libs/zwiftmap-main/backend with 56 updates

- Remove unused FIT reader utility functions and related code

- Deleted datetime.js, getBits.js, getFieldData.js, index.js, isInvalid.js, nTimes.js, namedFields.js, readData.js, readDefinition.js, readFileHeader.js, and readRecordHeader.js.
- These files contained functions and logic that are no longer needed in the FIT reader implementation.
- This cleanup helps streamline the codebase and improve maintainability.

- *(deps-dev)* Bump @types/chrome

- Merge pull request #56 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/npm-all-ccf39fe968

build(deps-dev): bump @types/chrome from 0.0.317 to 0.0.318 in /electron-app/libs/zwiftmap-main/browser-extension in the npm-all group

- Refactor and enhance Electron app functionality

- Added global variable declaration in renderTable.js for jQuery usage.
- Simplified error handling in setupTheme.js by removing the error parameter.
- Improved showFitData.js by refactoring file name handling and UI updates for better readability and performance.
- Updated windowStateUtils.js to include global variable declarations for better compatibility.
- Removed package-lock.json and package.json to streamline dependencies.
- Introduced GitHub Actions workflows for automated greetings, security scanning with Sobelow, style linting, and code linting with Super Linter.
- Added screenfull.min.js library for fullscreen functionality.
- Implemented setupWindow.js to manage window load events and tab interactions more efficiently.

- Add Vitest configuration and Stylelint configuration files

- Created vitest.config.js to set up testing environment with jsdom and specified setup files.
- Added stylelint.config.js to enforce standard stylelint rules, including preventing empty blocks.


### 🎨 Styling

- Clean up CSS formatting and organization for improved readability


### ⚙️ Miscellaneous Tasks

- Update Babel dependencies to version 7.27.1


<!-- generated by git-cliff -->
