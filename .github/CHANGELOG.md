<!-- markdownlint-disable -->

# Changelog

All notable changes to this project will be documented in this file.

## [unreleased]

### 🆕 New Version Number

- Bump version to 15.8.0

### 💼 Other

- Add '.nupkg' pattern to file matching in Windows build steps

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [15.8.0] - 2025-06-05

### 🆕 New Version Number

- Bump version to 15.7.0

### 💼 Other

- Refactor Electron app build command to handle architecture and OS conditions more explicitly

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [15.7.0] - 2025-06-05

### 🆕 New Version Number

- Bump version to 15.5.0

- Bump version to 15.6.0

### 💼 Other

- Enhance electron-builder command to support multiple macOS architectures

- Clear previous onload listener for iframe before setting a new one

- Fix electron-builder command to conditionally include architecture flag for macOS builds

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Clear redundant onload listener for iframe before setting a new one

## [15.5.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 15.3.0

- Bump version to 15.4.0

### 🛠️ GitHub Actions

- Update Build.yml

### 💼 Other

- Add macOS 15 and 13 to CI workflow for ia32 architecture

- Clear previous onload listener for iframe before setting a new one

- Fix electron-builder command to correctly handle macOS OS detection

- Clear previous onload listener for iframe before setting a new one

## [15.3.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 15.2.0

### 💼 Other

- Update version to 15.2.0 and set CI environment variable in build workflow

## [15.2.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 15.1.0

## [15.1.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 15.0.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Full win32 support added

## [15.0.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 14.8.0

### 🛠️ GitHub Actions

- Update Build.yml

### 💼 Other

- Add supported builds section to README and enhance download links

- Add CI build support for win32.

adds win32 versions to the CI pipeline

## [14.8.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 14.7.0

### 🛠️ GitHub Actions

- Update build configuration and versioning

- Remove branch restriction from push event in Build.yml
- Set DEBUG_DEMB environment variable to true in build job
- Add electron-builder configuration for macOS
- Downgrade package version to 14.2.0 in package-lock.json
- Remove trailing comma in stylelint configuration

## [14.7.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 14.6.0

### 💼 Other

- Refactor Windows build file renaming process for clarity and organization

## [14.6.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 14.5.0

### 💼 Other

- Update Electron version to 36.3.2 and rename build step for clarity

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [14.5.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 14.4.0

### 💼 Other

- Remove fileSystem property for macOS in package.json

## [14.4.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 14.3.0

### 💼 Other

- Refactor Windows file renaming steps and add fileSystem property for macOS in package.json

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [14.3.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 14.2.0

### 🛠️ GitHub Actions

- Remove unnecessary continue-on-error flags from Build.yml steps

- Add step to rename nsis-web latest.yml to latest-squirrel.yml for Windows

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [14.2.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 14.0.0

- Bump version to 14.1.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Update version to 14.0.0 and adjust artifact naming conventions for architecture

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [14.0.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 13.9.0

### 💼 Other

- Adds support for 32-bit Windows auto-update feed

Ensures the auto-updater uses a separate feed URL and renames the update metadata for 32-bit Windows builds, preventing conflicts with other architectures and enabling correct update detection for ia32 users.

## [13.9.0] - 2025-06-04

### 🆕 New Version Number

- Bump version to 13.7.0

- Bump version to 13.6.0

- Bump version to 13.7.0

- Bump version to 13.8.0

### 🛠️ GitHub Actions

- Update codeql.yml

- Update dependabot.yml

- Update dependabot.yml

- Update dependabot.yml

- Update dependabot.yml

- Update dependabot.yml

- Update dependabot.yml

- Update dependabot.yml

- Update dependabot.yml

- Update summary.yml

- Update summary.yml

- Update dependabot.yml

- Update dependabot.yml

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Refactor code structure and improve readability; no functional changes made.
  Removed a ton of un-needed files.

- Update README.md

- Create CONTRIBUTING.md

- Update issue templates

- Create PULL_REQUEST_TEMPLATE/pull_request_template.md

- Merge pull request #94 from Nick2bad4u/dependabot/github_actions/github-actions-7d0b73f1b5

Bump the github-actions group with 2 updates

- Update metrics.repository.svg - [Skip GitHub Action]

- Refactor build workflow and update artifact naming conventions; improve CSS stylelint rules and fix README formatting

- Add branch specification for main in push event of Build workflow

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

### 🛡️ Security

- Bump the github-actions group with 2 updates

Bumps the github-actions group with 2 updates: [github/codeql-action](https://github.com/github/codeql-action) and [crate-ci/typos](https://github.com/crate-ci/typos).

Updates `github/codeql-action` from 3.28.18 to 3.28.19

- [Release notes](https://github.com/github/codeql-action/releases)
- [Changelog](https://github.com/github/codeql-action/blob/main/CHANGELOG.md)
- [Commits](https://github.com/github/codeql-action/compare/ff0a06e83cb2de871e5a09832bc6a81e7276941f...fca7ace96b7d713c7035871441bd52efbe39e27e)

Updates `crate-ci/typos` from 1.32.0 to 1.33.1

- [Release notes](https://github.com/crate-ci/typos/releases)
- [Changelog](https://github.com/crate-ci/typos/blob/master/CHANGELOG.md)
- [Commits](https://github.com/crate-ci/typos/compare/0f0ccba9ed1df83948f0c15026e4f5ccfce46109...b1ae8d918b6e85bd611117d3d9a3be4f903ee5e4)

---

updated-dependencies:

- dependency-name: github/codeql-action
  dependency-version: 3.28.19
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: crate-ci/typos
  dependency-version: 1.33.1
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
  ...

Signed-off-by: dependabot[bot] <support@github.com>

## [13.7.0] - 2025-06-03

### 🆕 New Version Number

- Bump version to 13.6.0

### 💼 Other

- Merge pull request #92 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-2f20eee292

Bump the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 1 update

## [13.6.0] - 2025-06-03

### 🆕 New Version Number

- Bump version to 13.5.0

- Bump Nick2bad4u/internet-archive-upload in the github-actions group

Bumps the github-actions group with 1 update: [Nick2bad4u/internet-archive-upload](https://github.com/nick2bad4u/internet-archive-upload).

Updates `Nick2bad4u/internet-archive-upload` from 1.5 to 1.6

- [Release notes](https://github.com/nick2bad4u/internet-archive-upload/releases)
- [Commits](https://github.com/nick2bad4u/internet-archive-upload/compare/79b45e1106a9ac95be87ba5eb660f487437d8d6e...947bc6bdf79d0bcf816b576082fd7b503d33ddc9)

---

updated-dependencies:

- dependency-name: Nick2bad4u/internet-archive-upload
  dependency-version: '1.6'
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
  ...

Signed-off-by: dependabot[bot] <support@github.com>

### 🛠️ GitHub Actions

- Update dependabot.yml

- Update npm-audit.yml

- Update npm-audit.yml

- Update npm-audit.yml

- Update npm-audit.yml

### 💼 Other

- Merge pull request #90 from Nick2bad4u/dependabot/github_actions/github-actions-3f12c82615

Bump Nick2bad4u/internet-archive-upload from 1.5 to 1.6 in the github-actions group

- Update metrics.repository.svg - [Skip GitHub Action]

- Create CODE_OF_CONDUCT.md

- Update metrics.repository.svg - [Skip GitHub Action]

- Update README.md

### ⚙️ Miscellaneous Tasks

- Update package.json dependencies and metadata

### 🛡️ Security

- Bump the npm_and_yarn group

Bumps the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 2 updates: and [tar-fs](https://github.com/mafintosh/tar-fs).

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

## [13.5.0] - 2025-06-02

### 🆕 New Version Number

- Bump version to 13.3.0

- Bump @modelcontextprotocol/sdk from 1.11.1 to 1.12.1 in /electron-app

Bumps [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) from 1.11.1 to 1.12.1.

- [Release notes](https://github.com/modelcontextprotocol/typescript-sdk/releases)
- [Commits](https://github.com/modelcontextprotocol/typescript-sdk/compare/1.11.1...1.12.1)

---

updated-dependencies:

- dependency-name: "@modelcontextprotocol/sdk"
  dependency-version: 1.12.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  ...

Signed-off-by: dependabot[bot] <support@github.com>

- Bump zod from 3.24.4 to 3.25.46 in /electron-app

Bumps [zod](https://github.com/colinhacks/zod) from 3.24.4 to 3.25.46.

- [Release notes](https://github.com/colinhacks/zod/releases)
- [Commits](https://github.com/colinhacks/zod/compare/v3.24.4...v3.25.46)

---

updated-dependencies:

- dependency-name: zod
  dependency-version: 3.25.46
  dependency-type: indirect
  update-type: version-update:semver-minor
  ...

Signed-off-by: dependabot[bot] <support@github.com>

- Bump version to 13.3.0

- Bump eventsource-parser from 3.0.1 to 3.0.2 in /electron-app

Bumps [eventsource-parser](https://github.com/rexxars/eventsource-parser) from 3.0.1 to 3.0.2.

- [Release notes](https://github.com/rexxars/eventsource-parser/releases)
- [Changelog](https://github.com/rexxars/eventsource-parser/blob/main/CHANGELOG.md)
- [Commits](https://github.com/rexxars/eventsource-parser/compare/v3.0.1...v3.0.2)

---

updated-dependencies:

- dependency-name: eventsource-parser
  dependency-version: 3.0.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  ...

Signed-off-by: dependabot[bot] <support@github.com>

- Bump @protobuf-ts/plugin-framework in /electron-app

Bumps [@protobuf-ts/plugin-framework](https://github.com/timostamm/protobuf-ts/tree/HEAD/packages/plugin-framework) from 2.10.0 to 2.11.0.

- [Release notes](https://github.com/timostamm/protobuf-ts/releases)
- [Commits](https://github.com/timostamm/protobuf-ts/commits/v2.11.0/packages/plugin-framework)

---

updated-dependencies:

- dependency-name: "@protobuf-ts/plugin-framework"
  dependency-version: 2.11.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  ...

Signed-off-by: dependabot[bot] <support@github.com>

- Bump version to 13.4.0

- Bump version to 13.4.0

### 💼 Other

- Merge pull request #81 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/npm-all-8289ba21ba

Bump the npm-all group in /electron-app/libs/zwiftmap-main/browser-extension with 29 updates

- Merge pull request #85 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/modelcontextprotocol/sdk-1.12.1

Bump @modelcontextprotocol/sdk from 1.11.1 to 1.12.1 in /electron-app

- Merge pull request #86 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/zod-3.25.46

Bump zod from 3.24.4 to 3.25.46 in /electron-app

- Merge pull request #87 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/eventsource-parser-3.0.2

Bump eventsource-parser from 3.0.1 to 3.0.2 in /electron-app

- Merge pull request #88 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/protobuf-ts/plugin-framework-2.11.0

Bump @protobuf-ts/plugin-framework from 2.10.0 to 2.11.0 in /electron-app

- Merge pull request #89 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/npm-all-bb89b57e2c

Bump the npm-all group across 1 directory with 64 updates

### 🛡️ Security

- Bump the npm-all group across 1 directory with 64 updates

Bumps the npm-all group with 24 updates in the /electron-app directory:

| Package                                                                                                                     | From       | To         |
| --------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| [@actions/artifact](https://github.com/actions/toolkit/tree/HEAD/packages/artifact)                                         | `1.1.2`    | `2.3.2`    |
| [@eslint/css](https://github.com/eslint/css)                                                                                | `0.8.0`    | `0.8.1`    |
| [@eslint/js](https://github.com/eslint/eslint/tree/HEAD/packages/js)                                                        | `9.26.0`   | `9.28.0`   |
| [@kurkle/color](https://github.com/kurkle/color)                                                                            | `0.3.4`    | `0.4.0`    |
| [electron](https://github.com/electron/electron)                                                                            | `36.2.1`   | `36.3.2`   |
| [eslint](https://github.com/eslint/eslint)                                                                                  | `9.26.0`   | `9.28.0`   |
| [globals](https://github.com/sindresorhus/globals)                                                                          | `16.1.0`   | `16.2.0`   |
| [ts-jest](https://github.com/kulshekhar/ts-jest)                                                                            | `29.3.3`   | `29.3.4`   |
| [vitest](https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest)                                                    | `3.1.3`    | `3.1.4`    |
| [@asamuzakjp/css-color](https://github.com/asamuzaK/cssColor)                                                               | `3.1.7`    | `3.2.0`    |
| [@babel/compat-data](https://github.com/babel/babel/tree/HEAD/packages/babel-compat-data)                                   | `7.27.2`   | `7.27.3`   |
| [@babel/core](https://github.com/babel/babel/tree/HEAD/packages/babel-core)                                                 | `7.27.1`   | `7.27.4`   |
| [@csstools/css-calc](https://github.com/csstools/postcss-plugins/tree/HEAD/packages/css-calc)                               | `2.1.3`    | `2.1.4`    |
| [@csstools/css-color-parser](https://github.com/csstools/postcss-plugins/tree/HEAD/packages/css-color-parser)               | `3.0.9`    | `3.0.10`   |
| [@csstools/media-query-list-parser](https://github.com/csstools/postcss-plugins/tree/HEAD/packages/media-query-list-parser) | `4.0.2`    | `4.0.3`    |
| [@eslint/css-tree](https://github.com/eslint/csstree)                                                                       | `3.5.0`    | `3.5.4`    |
| [@protobuf-ts/plugin](https://github.com/timostamm/protobuf-ts/tree/HEAD/packages/plugin)                                   | `2.10.0`   | `2.11.0`   |
| [@sigstore/protobuf-specs](https://github.com/sigstore/protobuf-specs)                                                      | `0.4.1`    | `0.4.2`    |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node)                                      | `22.15.17` | `22.15.29` |
| [browserslist](https://github.com/browserslist/browserslist)                                                                | `4.24.5`   | `4.25.0`   |
| [debug](https://github.com/debug-js/debug)                                                                                  | `4.4.0`    | `4.4.1`    |
| [postcss](https://github.com/postcss/postcss)                                                                               | `8.5.3`    | `8.5.4`    |
| [stylelint](https://github.com/stylelint/stylelint)                                                                         | `16.19.1`  | `16.20.0`  |
| [tinypool](https://github.com/tinylibs/tinypool)                                                                            | `1.0.2`    | `1.1.0`    |

Updates `@actions/artifact` from 1.1.2 to 2.3.2

- [Changelog](https://github.com/actions/toolkit/blob/main/packages/artifact/RELEASES.md)
- [Commits](https://github.com/actions/toolkit/commits/HEAD/packages/artifact)

Updates `@eslint/css` from 0.8.0 to 0.8.1

- [Release notes](https://github.com/eslint/css/releases)
- [Changelog](https://github.com/eslint/css/blob/main/CHANGELOG.md)
- [Commits](https://github.com/eslint/css/compare/css-v0.8.0...css-v0.8.1)

Updates `@eslint/js` from 9.26.0 to 9.28.0

- [Release notes](https://github.com/eslint/eslint/releases)
- [Changelog](https://github.com/eslint/eslint/blob/main/CHANGELOG.md)
- [Commits](https://github.com/eslint/eslint/commits/v9.28.0/packages/js)

Updates `@kurkle/color` from 0.3.4 to 0.4.0

- [Release notes](https://github.com/kurkle/color/releases)
- [Commits](https://github.com/kurkle/color/compare/v0.3.4...v0.4.0)

Updates `electron` from 36.2.1 to 36.3.2

- [Release notes](https://github.com/electron/electron/releases)
- [Changelog](https://github.com/electron/electron/blob/main/docs/breaking-changes.md)
- [Commits](https://github.com/electron/electron/compare/v36.2.1...v36.3.2)

Updates `eslint` from 9.26.0 to 9.28.0

- [Release notes](https://github.com/eslint/eslint/releases)
- [Changelog](https://github.com/eslint/eslint/blob/main/CHANGELOG.md)
- [Commits](https://github.com/eslint/eslint/compare/v9.26.0...v9.28.0)

Updates `globals` from 16.1.0 to 16.2.0

- [Release notes](https://github.com/sindresorhus/globals/releases)
- [Commits](https://github.com/sindresorhus/globals/compare/v16.1.0...v16.2.0)

Updates `ts-jest` from 29.3.3 to 29.3.4

- [Release notes](https://github.com/kulshekhar/ts-jest/releases)
- [Changelog](https://github.com/kulshekhar/ts-jest/blob/main/CHANGELOG.md)
- [Commits](https://github.com/kulshekhar/ts-jest/compare/v29.3.3...v29.3.4)

Updates `vitest` from 3.1.3 to 3.1.4

- [Release notes](https://github.com/vitest-dev/vitest/releases)
- [Commits](https://github.com/vitest-dev/vitest/commits/v3.1.4/packages/vitest)

Updates `@octokit/auth-token` from 4.0.0 to 2.5.0

- [Release notes](https://github.com/octokit/auth-token.js/releases)
- [Commits](https://github.com/octokit/auth-token.js/compare/v4.0.0...v2.5.0)

Updates `@octokit/core` from 5.2.1 to 3.6.0

- [Release notes](https://github.com/octokit/core.js/releases)
- [Commits](https://github.com/octokit/core.js/compare/v5.2.1...v3.6.0)

Updates `@octokit/graphql` from 7.1.1 to 4.8.0

- [Release notes](https://github.com/octokit/graphql.js/releases)
- [Commits](https://github.com/octokit/graphql.js/compare/v7.1.1...v4.8.0)

Updates `@octokit/openapi-types` from 20.0.0 to 12.11.0

- [Release notes](https://github.com/octokit/openapi-types.ts/releases)
- [Commits](https://github.com/octokit/openapi-types.ts/commits/v12.11.0/packages/openapi-types)

Updates `@octokit/plugin-retry` from 6.1.0 to 3.0.9

- [Release notes](https://github.com/octokit/plugin-retry.js/releases)
- [Commits](https://github.com/octokit/plugin-retry.js/compare/v6.1.0...v3.0.9)

Updates `@octokit/types` from 12.6.0 to 6.41.0

- [Release notes](https://github.com/octokit/types.ts/releases)
- [Commits](https://github.com/octokit/types.ts/compare/v12.6.0...v6.41.0)

Updates `@octokit/plugin-paginate-rest` from 9.2.2 to 2.21.3

- [Release notes](https://github.com/octokit/plugin-paginate-rest.js/releases)
- [Commits](https://github.com/octokit/plugin-paginate-rest.js/compare/v9.2.2...v2.21.3)

Updates `@octokit/plugin-rest-endpoint-methods` from 10.4.1 to 5.16.2

- [Release notes](https://github.com/octokit/plugin-rest-endpoint-methods.js/releases)
- [Commits](https://github.com/octokit/plugin-rest-endpoint-methods.js/compare/v10.4.1...v5.16.2)

Updates `@asamuzakjp/css-color` from 3.1.7 to 3.2.0

- [Release notes](https://github.com/asamuzaK/cssColor/releases)
- [Commits](https://github.com/asamuzaK/cssColor/compare/v3.1.7...v3.2.0)

Updates `@babel/compat-data` from 7.27.2 to 7.27.3

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.3/packages/babel-compat-data)

Updates `@babel/core` from 7.27.1 to 7.27.4

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.4/packages/babel-core)

Updates `@babel/generator` from 7.27.1 to 7.27.3

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.3/packages/babel-generator)

Updates `@babel/helper-module-transforms` from 7.27.1 to 7.27.3

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.3/packages/babel-helper-module-transforms)

Updates `@babel/helpers` from 7.27.1 to 7.27.4

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.4/packages/babel-helpers)

Updates `@babel/parser` from 7.27.2 to 7.27.4

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.4/packages/babel-parser)

Updates `@babel/traverse` from 7.27.1 to 7.27.4

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.4/packages/babel-traverse)

Updates `@babel/types` from 7.27.1 to 7.27.3

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.3/packages/babel-types)

Updates `@csstools/css-calc` from 2.1.3 to 2.1.4

- [Changelog](https://github.com/csstools/postcss-plugins/blob/main/packages/css-calc/CHANGELOG.md)
- [Commits](https://github.com/csstools/postcss-plugins/commits/HEAD/packages/css-calc)

Updates `@csstools/css-color-parser` from 3.0.9 to 3.0.10

- [Changelog](https://github.com/csstools/postcss-plugins/blob/main/packages/css-color-parser/CHANGELOG.md)
- [Commits](https://github.com/csstools/postcss-plugins/commits/HEAD/packages/css-color-parser)

Updates `@csstools/css-parser-algorithms` from 3.0.4 to 3.0.5

- [Changelog](https://github.com/csstools/postcss-plugins/blob/main/packages/css-parser-algorithms/CHANGELOG.md)
- [Commits](https://github.com/csstools/postcss-plugins/commits/HEAD/packages/css-parser-algorithms)

Updates `@csstools/css-tokenizer` from 3.0.3 to 3.0.4

- [Changelog](https://github.com/csstools/postcss-plugins/blob/main/packages/css-tokenizer/CHANGELOG.md)
- [Commits](https://github.com/csstools/postcss-plugins/commits/HEAD/packages/css-tokenizer)

Updates `@csstools/media-query-list-parser` from 4.0.2 to 4.0.3

- [Changelog](https://github.com/csstools/postcss-plugins/blob/main/packages/media-query-list-parser/CHANGELOG.md)
- [Commits](https://github.com/csstools/postcss-plugins/commits/HEAD/packages/media-query-list-parser)

Updates `@esbuild/win32-x64` from 0.25.4 to 0.25.5

- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.4...v0.25.5)

Updates `@eslint/css-tree` from 3.5.0 to 3.5.4

- [Release notes](https://github.com/eslint/csstree/releases)
- [Changelog](https://github.com/eslint/csstree/blob/main/CHANGELOG.md)
- [Commits](https://github.com/eslint/csstree/compare/css-tree-v3.5.0...css-tree-v3.5.4)

Updates `@octokit/endpoint` from 9.0.6 to 6.0.12

- [Release notes](https://github.com/octokit/endpoint.js/releases)
- [Commits](https://github.com/octokit/endpoint.js/compare/v9.0.6...v6.0.12)

Updates `@octokit/request` from 8.4.1 to 5.6.3

- [Release notes](https://github.com/octokit/request.js/releases)
- [Commits](https://github.com/octokit/request.js/compare/v8.4.1...v5.6.3)

Updates `@octokit/request-error` from 5.1.1 to 2.1.0

- [Release notes](https://github.com/octokit/request-error.js/releases)
- [Commits](https://github.com/octokit/request-error.js/compare/v5.1.1...v2.1.0)

Updates `@protobuf-ts/plugin` from 2.10.0 to 2.11.0

- [Release notes](https://github.com/timostamm/protobuf-ts/releases)
- [Commits](https://github.com/timostamm/protobuf-ts/commits/v2.11.0/packages/plugin)

Updates `@protobuf-ts/protoc` from 2.10.0 to 2.11.0

- [Release notes](https://github.com/timostamm/protobuf-ts/releases)
- [Commits](https://github.com/timostamm/protobuf-ts/commits/v2.11.0/packages/protoc)

Updates `@protobuf-ts/runtime-rpc` from 2.10.0 to 2.11.0

- [Release notes](https://github.com/timostamm/protobuf-ts/releases)
- [Commits](https://github.com/timostamm/protobuf-ts/commits/v2.11.0/packages/runtime-rpc)

Updates `@rollup/rollup-win32-x64-msvc` from 4.40.2 to 4.41.1

- [Release notes](https://github.com/rollup/rollup/releases)
- [Changelog](https://github.com/rollup/rollup/blob/master/CHANGELOG.md)
- [Commits](https://github.com/rollup/rollup/compare/v4.40.2...v4.41.1)

Updates `@sigstore/protobuf-specs` from 0.4.1 to 0.4.2

- [Release notes](https://github.com/sigstore/protobuf-specs/releases)
- [Changelog](https://github.com/sigstore/protobuf-specs/blob/main/CHANGELOG.md)
- [Commits](https://github.com/sigstore/protobuf-specs/compare/v0.4.1...v0.4.2)

Updates `@types/node` from 22.15.17 to 22.15.29

- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node)

Updates `@vitest/expect` from 3.1.3 to 3.1.4

- [Release notes](https://github.com/vitest-dev/vitest/releases)
- [Commits](https://github.com/vitest-dev/vitest/commits/v3.1.4/packages/expect)

Updates `@vitest/mocker` from 3.1.3 to 3.1.4

- [Release notes](https://github.com/vitest-dev/vitest/releases)
- [Commits](https://github.com/vitest-dev/vitest/commits/v3.1.4/packages/mocker)

Updates `@vitest/pretty-format` from 3.1.3 to 3.1.4

- [Release notes](https://github.com/vitest-dev/vitest/releases)
- [Commits](https://github.com/vitest-dev/vitest/commits/v3.1.4/packages/pretty-format)

Updates `@vitest/runner` from 3.1.3 to 3.1.4

- [Release notes](https://github.com/vitest-dev/vitest/releases)
- [Commits](https://github.com/vitest-dev/vitest/commits/v3.1.4/packages/runner)

Updates `@vitest/snapshot` from 3.1.3 to 3.1.4

- [Release notes](https://github.com/vitest-dev/vitest/releases)
- [Commits](https://github.com/vitest-dev/vitest/commits/v3.1.4/packages/snapshot)

Updates `@vitest/spy` from 3.1.3 to 3.1.4

- [Release notes](https://github.com/vitest-dev/vitest/releases)
- [Commits](https://github.com/vitest-dev/vitest/commits/v3.1.4/packages/spy)

Updates `@vitest/utils` from 3.1.3 to 3.1.4

- [Release notes](https://github.com/vitest-dev/vitest/releases)
- [Commits](https://github.com/vitest-dev/vitest/commits/v3.1.4/packages/utils)

Updates `browserslist` from 4.24.5 to 4.25.0

- [Release notes](https://github.com/browserslist/browserslist/releases)
- [Changelog](https://github.com/browserslist/browserslist/blob/main/CHANGELOG.md)
- [Commits](https://github.com/browserslist/browserslist/compare/4.24.5...4.25.0)

Updates `caniuse-lite` from 1.0.30001717 to 1.0.30001720

- [Commits](https://github.com/browserslist/caniuse-lite/compare/1.0.30001717...1.0.30001720)

Updates `debug` from 4.4.0 to 4.4.1

- [Release notes](https://github.com/debug-js/debug/releases)
- [Commits](https://github.com/debug-js/debug/compare/4.4.0...4.4.1)

Updates `electron-to-chromium` from 1.5.151 to 1.5.161

- [Changelog](https://github.com/Kilian/electron-to-chromium/blob/master/CHANGELOG.md)
- [Commits](https://github.com/kilian/electron-to-chromium/compare/v1.5.151...v1.5.161)

Updates `esbuild` from 0.25.4 to 0.25.5

- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.4...v0.25.5)

Updates `postcss` from 8.5.3 to 8.5.4

- [Release notes](https://github.com/postcss/postcss/releases)
- [Changelog](https://github.com/postcss/postcss/blob/main/CHANGELOG.md)
- [Commits](https://github.com/postcss/postcss/compare/8.5.3...8.5.4)

Updates `readable-stream` from 3.6.2 to 2.3.8

- [Release notes](https://github.com/nodejs/readable-stream/releases)
- [Commits](https://github.com/nodejs/readable-stream/compare/v3.6.2...v2.3.8)

Updates `rollup` from 4.40.2 to 4.41.1

- [Release notes](https://github.com/rollup/rollup/releases)
- [Changelog](https://github.com/rollup/rollup/blob/master/CHANGELOG.md)
- [Commits](https://github.com/rollup/rollup/compare/v4.40.2...v4.41.1)

Updates `safe-buffer` from 5.2.1 to 5.1.2

- [Commits](https://github.com/feross/safe-buffer/compare/v5.2.1...v5.1.2)

Updates `string_decoder` from 1.3.0 to 1.1.1

- [Release notes](https://github.com/nodejs/string_decoder/releases)
- [Commits](https://github.com/nodejs/string_decoder/compare/v1.3.0...v1.1.1)

Updates `stylelint` from 16.19.1 to 16.20.0

- [Release notes](https://github.com/stylelint/stylelint/releases)
- [Changelog](https://github.com/stylelint/stylelint/blob/main/CHANGELOG.md)
- [Commits](https://github.com/stylelint/stylelint/compare/16.19.1...16.20.0)

Updates `tinyglobby` from 0.2.13 to 0.2.14

- [Release notes](https://github.com/SuperchupuDev/tinyglobby/releases)
- [Changelog](https://github.com/SuperchupuDev/tinyglobby/blob/main/CHANGELOG.md)
- [Commits](https://github.com/SuperchupuDev/tinyglobby/compare/0.2.13...0.2.14)

Updates `fdir` from 6.4.4 to 6.4.5

- [Release notes](https://github.com/thecodrr/fdir/releases)
- [Commits](https://github.com/thecodrr/fdir/compare/v6.4.4...v6.4.5)

Updates `tinypool` from 1.0.2 to 1.1.0

- [Release notes](https://github.com/tinylibs/tinypool/releases)
- [Commits](https://github.com/tinylibs/tinypool/compare/v1.0.2...v1.1.0)

Updates `vite-node` from 3.1.3 to 3.1.4

- [Release notes](https://github.com/vitest-dev/vitest/releases)
- [Commits](https://github.com/vitest-dev/vitest/commits/v3.1.4/packages/vite-node)

---

updated-dependencies:

- dependency-name: "@actions/artifact"
  dependency-version: 2.3.2
  dependency-type: direct:development
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@eslint/css"
  dependency-version: 0.8.1
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@eslint/js"
  dependency-version: 9.28.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@kurkle/color"
  dependency-version: 0.4.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: electron
  dependency-version: 36.3.2
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: eslint
  dependency-version: 9.28.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: globals
  dependency-version: 16.2.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: ts-jest
  dependency-version: 29.3.4
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: vitest
  dependency-version: 3.1.4
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@octokit/auth-token"
  dependency-version: 2.5.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@octokit/core"
  dependency-version: 3.6.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@octokit/graphql"
  dependency-version: 4.8.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@octokit/openapi-types"
  dependency-version: 12.11.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@octokit/plugin-retry"
  dependency-version: 3.0.9
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@octokit/types"
  dependency-version: 6.41.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@octokit/plugin-paginate-rest"
  dependency-version: 2.21.3
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@octokit/plugin-rest-endpoint-methods"
  dependency-version: 5.16.2
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@asamuzakjp/css-color"
  dependency-version: 3.2.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@babel/compat-data"
  dependency-version: 7.27.3
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@babel/core"
  dependency-version: 7.27.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@babel/generator"
  dependency-version: 7.27.3
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@babel/helper-module-transforms"
  dependency-version: 7.27.3
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@babel/helpers"
  dependency-version: 7.27.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@babel/parser"
  dependency-version: 7.27.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@babel/traverse"
  dependency-version: 7.27.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@babel/types"
  dependency-version: 7.27.3
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@csstools/css-calc"
  dependency-version: 2.1.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@csstools/css-color-parser"
  dependency-version: 3.0.10
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@csstools/css-parser-algorithms"
  dependency-version: 3.0.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@csstools/css-tokenizer"
  dependency-version: 3.0.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@csstools/media-query-list-parser"
  dependency-version: 4.0.3
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@esbuild/win32-x64"
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@eslint/css-tree"
  dependency-version: 3.5.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@octokit/endpoint"
  dependency-version: 6.0.12
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@octokit/request"
  dependency-version: 5.6.3
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@octokit/request-error"
  dependency-version: 2.1.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@protobuf-ts/plugin"
  dependency-version: 2.11.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@protobuf-ts/protoc"
  dependency-version: 2.11.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@protobuf-ts/runtime-rpc"
  dependency-version: 2.11.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@rollup/rollup-win32-x64-msvc"
  dependency-version: 4.41.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@sigstore/protobuf-specs"
  dependency-version: 0.4.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@types/node"
  dependency-version: 22.15.29
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@vitest/expect"
  dependency-version: 3.1.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@vitest/mocker"
  dependency-version: 3.1.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@vitest/pretty-format"
  dependency-version: 3.1.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@vitest/runner"
  dependency-version: 3.1.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@vitest/snapshot"
  dependency-version: 3.1.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@vitest/spy"
  dependency-version: 3.1.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@vitest/utils"
  dependency-version: 3.1.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: browserslist
  dependency-version: 4.25.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: caniuse-lite
  dependency-version: 1.0.30001720
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: debug
  dependency-version: 4.4.1
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: electron-to-chromium
  dependency-version: 1.5.161
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: esbuild
  dependency-version: 0.25.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: postcss
  dependency-version: 8.5.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: readable-stream
  dependency-version: 2.3.8
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: rollup
  dependency-version: 4.41.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: safe-buffer
  dependency-version: 5.1.2
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: string_decoder
  dependency-version: 1.1.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: stylelint
  dependency-version: 16.20.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: tinyglobby
  dependency-version: 0.2.14
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: fdir
  dependency-version: 6.4.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: tinypool
  dependency-version: 1.1.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: vite-node
  dependency-version: 3.1.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
  ...

Signed-off-by: dependabot[bot] <support@github.com>

## [13.3.0] - 2025-06-01

### 💼 Other

- Merge pull request #83 from Nick2bad4u/dependabot/github_actions/github-actions-896f5400c9

Bump the github-actions group with 10 updates

### 🛡️ Security

- Bump the github-actions group with 10 updates

Bumps the github-actions group with 10 updates:

| Package                                                                                       | From      | To        |
| --------------------------------------------------------------------------------------------- | --------- | --------- |
| [actions/checkout](https://github.com/actions/checkout)                                       | `3.6.0`   | `4.2.2`   |
| [github/codeql-action](https://github.com/github/codeql-action)                               | `3.28.16` | `3.28.18` |
| [actions/dependency-review-action](https://github.com/actions/dependency-review-action)       | `4.7.0`   | `4.7.1`   |
| [microsoft/DevSkim-Action](https://github.com/microsoft/devskim-action)                       | `1.0.15`  | `1.0.16`  |
| [ossf/scorecard-action](https://github.com/ossf/scorecard-action)                             | `2.4.1`   | `2.4.2`   |
| [rojopolis/spellcheck-github-actions](https://github.com/rojopolis/spellcheck-github-actions) | `0.48.0`  | `0.49.0`  |
| [actions/ai-inference](https://github.com/actions/ai-inference)                               | `1.0.0`   | `1.1.0`   |
| [super-linter/super-linter](https://github.com/super-linter/super-linter)                     | `7.3.0`   | `7.4.0`   |
| [trufflesecurity/trufflehog](https://github.com/trufflesecurity/trufflehog)                   | `3.88.28` | `3.88.35` |
| [Nick2bad4u/internet-archive-upload](https://github.com/nick2bad4u/internet-archive-upload)   | `1.4`     | `1.5`     |

Updates `actions/checkout` from 3.6.0 to 4.2.2

- [Release notes](https://github.com/actions/checkout/releases)
- [Changelog](https://github.com/actions/checkout/blob/main/CHANGELOG.md)
- [Commits](https://github.com/actions/checkout/compare/v3.6.0...11bd71901bbe5b1630ceea73d27597364c9af683)

Updates `github/codeql-action` from 3.28.16 to 3.28.18

- [Release notes](https://github.com/github/codeql-action/releases)
- [Changelog](https://github.com/github/codeql-action/blob/main/CHANGELOG.md)
- [Commits](https://github.com/github/codeql-action/compare/v3.28.16...ff0a06e83cb2de871e5a09832bc6a81e7276941f)

Updates `actions/dependency-review-action` from 4.7.0 to 4.7.1

- [Release notes](https://github.com/actions/dependency-review-action/releases)
- [Commits](https://github.com/actions/dependency-review-action/compare/38ecb5b593bf0eb19e335c03f97670f792489a8b...da24556b548a50705dd671f47852072ea4c105d9)

Updates `microsoft/DevSkim-Action` from 1.0.15 to 1.0.16

- [Release notes](https://github.com/microsoft/devskim-action/releases)
- [Commits](https://github.com/microsoft/devskim-action/compare/a6b6966a33b497cd3ae2ebc406edf8f4cc2feec6...4b5047945a44163b94642a1cecc0d93a3f428cc6)

Updates `ossf/scorecard-action` from 2.4.1 to 2.4.2

- [Release notes](https://github.com/ossf/scorecard-action/releases)
- [Changelog](https://github.com/ossf/scorecard-action/blob/main/RELEASE.md)
- [Commits](https://github.com/ossf/scorecard-action/compare/f49aabe0b5af0936a0987cfb85d86b75731b0186...05b42c624433fc40578a4040d5cf5e36ddca8cde)

Updates `rojopolis/spellcheck-github-actions` from 0.48.0 to 0.49.0

- [Release notes](https://github.com/rojopolis/spellcheck-github-actions/releases)
- [Changelog](https://github.com/rojopolis/spellcheck-github-actions/blob/master/CHANGELOG.md)
- [Commits](https://github.com/rojopolis/spellcheck-github-actions/compare/23dc186319866e1de224f94fe1d31b72797aeec7...584b2ae95998967a53af7fbfb7f5b15352c38748)

Updates `actions/ai-inference` from 1.0.0 to 1.1.0

- [Release notes](https://github.com/actions/ai-inference/releases)
- [Commits](https://github.com/actions/ai-inference/compare/c7105a4c1e9d7e35f7677b5e6f830f5d631ce76e...d645f067d89ee1d5d736a5990e327e504d1c5a4a)

Updates `super-linter/super-linter` from 7.3.0 to 7.4.0

- [Release notes](https://github.com/super-linter/super-linter/releases)
- [Changelog](https://github.com/super-linter/super-linter/blob/main/CHANGELOG.md)
- [Commits](https://github.com/super-linter/super-linter/compare/4e8a7c2bf106c4c766c816b35ec612638dc9b6b2...12150456a73e248bdc94d0794898f94e23127c88)

Updates `trufflesecurity/trufflehog` from 3.88.28 to 3.88.35

- [Release notes](https://github.com/trufflesecurity/trufflehog/releases)
- [Changelog](https://github.com/trufflesecurity/trufflehog/blob/main/.goreleaser.yml)
- [Commits](https://github.com/trufflesecurity/trufflehog/compare/e42153d44a5e5c37c1bd0c70e074781e9edcb760...90694bf9af66e7536abc5824e7a87246dbf933cb)

Updates `Nick2bad4u/internet-archive-upload` from 1.4 to 1.5

- [Release notes](https://github.com/nick2bad4u/internet-archive-upload/releases)
- [Commits](https://github.com/nick2bad4u/internet-archive-upload/compare/ecf1bdea26a78610d394e48c4162759fc00c1308...79b45e1106a9ac95be87ba5eb660f487437d8d6e)

---

updated-dependencies:

- dependency-name: actions/checkout
  dependency-version: 4.2.2
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: github-actions
- dependency-name: github/codeql-action
  dependency-version: 3.28.18
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: actions/dependency-review-action
  dependency-version: 4.7.1
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: microsoft/DevSkim-Action
  dependency-version: 1.0.16
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: ossf/scorecard-action
  dependency-version: 2.4.2
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: rojopolis/spellcheck-github-actions
  dependency-version: 0.49.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
- dependency-name: actions/ai-inference
  dependency-version: 1.1.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
- dependency-name: super-linter/super-linter
  dependency-version: 7.4.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
- dependency-name: trufflesecurity/trufflehog
  dependency-version: 3.88.35
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: Nick2bad4u/internet-archive-upload
  dependency-version: '1.5'
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
  ...

Signed-off-by: dependabot[bot] <support@github.com>

- Bump the npm-all group

Bumps the npm-all group in /electron-app/libs/zwiftmap-main/browser-extension with 29 updates:

| Package                                                                                      | From      | To         |
| -------------------------------------------------------------------------------------------- | --------- | ---------- |
| [@types/chrome](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/chrome)   | `0.0.318` | `0.0.326`  |
| [@types/leaflet](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/leaflet) | `1.9.17`  | `1.9.18`   |
| [esbuild](https://github.com/evanw/esbuild)                                                  | `0.25.3`  | `0.25.5`   |
| [@esbuild/aix-ppc64](https://github.com/evanw/esbuild)                                       | `0.25.3`  | `0.25.5`   |
| [@esbuild/android-arm](https://github.com/evanw/esbuild)                                     | `0.25.3`  | `0.25.5`   |
| [@esbuild/android-arm64](https://github.com/evanw/esbuild)                                   | `0.25.3`  | `0.25.5`   |
| [@esbuild/android-x64](https://github.com/evanw/esbuild)                                     | `0.25.3`  | `0.25.5`   |
| [@esbuild/darwin-arm64](https://github.com/evanw/esbuild)                                    | `0.25.3`  | `0.25.5`   |
| [@esbuild/darwin-x64](https://github.com/evanw/esbuild)                                      | `0.25.3`  | `0.25.5`   |
| [@esbuild/freebsd-arm64](https://github.com/evanw/esbuild)                                   | `0.25.3`  | `0.25.5`   |
| [@esbuild/freebsd-x64](https://github.com/evanw/esbuild)                                     | `0.25.3`  | `0.25.5`   |
| [@esbuild/linux-arm](https://github.com/evanw/esbuild)                                       | `0.25.3`  | `0.25.5`   |
| [@esbuild/linux-arm64](https://github.com/evanw/esbuild)                                     | `0.25.3`  | `0.25.5`   |
| [@esbuild/linux-ia32](https://github.com/evanw/esbuild)                                      | `0.25.3`  | `0.25.5`   |
| [@esbuild/linux-loong64](https://github.com/evanw/esbuild)                                   | `0.25.3`  | `0.25.5`   |
| [@esbuild/linux-mips64el](https://github.com/evanw/esbuild)                                  | `0.25.3`  | `0.25.5`   |
| [@esbuild/linux-ppc64](https://github.com/evanw/esbuild)                                     | `0.25.3`  | `0.25.5`   |
| [@esbuild/linux-riscv64](https://github.com/evanw/esbuild)                                   | `0.25.3`  | `0.25.5`   |
| [@esbuild/linux-s390x](https://github.com/evanw/esbuild)                                     | `0.25.3`  | `0.25.5`   |
| [@esbuild/linux-x64](https://github.com/evanw/esbuild)                                       | `0.25.3`  | `0.25.5`   |
| [@esbuild/netbsd-arm64](https://github.com/evanw/esbuild)                                    | `0.25.3`  | `0.25.5`   |
| [@esbuild/netbsd-x64](https://github.com/evanw/esbuild)                                      | `0.25.3`  | `0.25.5`   |
| [@esbuild/openbsd-arm64](https://github.com/evanw/esbuild)                                   | `0.25.3`  | `0.25.5`   |
| [@esbuild/openbsd-x64](https://github.com/evanw/esbuild)                                     | `0.25.3`  | `0.25.5`   |
| [@esbuild/sunos-x64](https://github.com/evanw/esbuild)                                       | `0.25.3`  | `0.25.5`   |
| [@esbuild/win32-arm64](https://github.com/evanw/esbuild)                                     | `0.25.3`  | `0.25.5`   |
| [@esbuild/win32-ia32](https://github.com/evanw/esbuild)                                      | `0.25.3`  | `0.25.5`   |
| [@esbuild/win32-x64](https://github.com/evanw/esbuild)                                       | `0.25.3`  | `0.25.5`   |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node)       | `22.15.3` | `22.15.29` |

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

## [13.4.0] - 2025-06-01

### 🆕 New Version Number

- Bump version to 13.2.0

- Bump version to 13.3.0

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

- Update metrics.repository.svg - [Skip GitHub Action]

- Merge pull request #82 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/npm-all-3319742fda

Bump the npm-all group in /electron-app/libs/zwiftmap-main/backend with 34 updates

### 🛡️ Security

- Bump the npm-all group

Bumps the npm-all group in /electron-app/libs/zwiftmap-main/backend with 34 updates:

| Package                                                                                              | From      | To         |
| ---------------------------------------------------------------------------------------------------- | --------- | ---------- |
| [@google-cloud/firestore](https://github.com/googleapis/nodejs-firestore)                            | `7.11.0`  | `7.11.1`   |
| [@google-cloud/logging-winston](https://github.com/googleapis/nodejs-logging-winston)                | `6.0.0`   | `6.0.1`    |
| [@sentry/node](https://github.com/getsentry/sentry-javascript)                                       | `9.15.0`  | `9.24.0`   |
| [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)                            | `5.2.1`   | `5.2.3`    |
| [sharp](https://github.com/lovell/sharp)                                                             | `0.34.1`  | `0.34.2`   |
| [@types/compression](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/compression) | `1.7.5`   | `1.8.0`    |
| [@types/cors](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/cors)               | `2.8.17`  | `2.8.18`   |
| [@types/express](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/express)         | `5.0.1`   | `5.0.2`    |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node)               | `22.15.3` | `22.15.29` |
| [@types/validator](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/validator)     | `13.15.0` | `13.15.1`  |
| [tsc-watch](https://github.com/gilamran/tsc-watch)                                                   | `6.2.1`   | `7.1.1`    |
| [google-gax](https://github.com/googleapis/gax-nodejs/tree/HEAD/gax)                                 | `4.6.0`   | `4.6.1`    |
| [@grpc/grpc-js](https://github.com/grpc/grpc-node)                                                   | `1.13.3`  | `1.13.4`   |
| [@img/sharp-darwin-arm64](https://github.com/lovell/sharp/tree/HEAD/npm/darwin-arm64)                | `0.34.1`  | `0.34.2`   |
| [@img/sharp-darwin-x64](https://github.com/lovell/sharp/tree/HEAD/npm/darwin-x64)                    | `0.34.1`  | `0.34.2`   |
| [@img/sharp-linux-arm](https://github.com/lovell/sharp/tree/HEAD/npm/linux-arm)                      | `0.34.1`  | `0.34.2`   |
| [@img/sharp-linux-arm64](https://github.com/lovell/sharp/tree/HEAD/npm/linux-arm64)                  | `0.34.1`  | `0.34.2`   |
| [@img/sharp-linux-s390x](https://github.com/lovell/sharp/tree/HEAD/npm/linux-s390x)                  | `0.34.1`  | `0.34.2`   |
| [@img/sharp-linux-x64](https://github.com/lovell/sharp/tree/HEAD/npm/linux-x64)                      | `0.34.1`  | `0.34.2`   |
| [@img/sharp-linuxmusl-arm64](https://github.com/lovell/sharp/tree/HEAD/npm/linuxmusl-arm64)          | `0.34.1`  | `0.34.2`   |
| [@img/sharp-linuxmusl-x64](https://github.com/lovell/sharp/tree/HEAD/npm/linuxmusl-x64)              | `0.34.1`  | `0.34.2`   |
| [@img/sharp-wasm32](https://github.com/lovell/sharp/tree/HEAD/npm/wasm32)                            | `0.34.1`  | `0.34.2`   |
| [@img/sharp-win32-ia32](https://github.com/lovell/sharp/tree/HEAD/npm/win32-ia32)                    | `0.34.1`  | `0.34.2`   |
| [@img/sharp-win32-x64](https://github.com/lovell/sharp/tree/HEAD/npm/win32-x64)                      | `0.34.1`  | `0.34.2`   |
| [@prisma/instrumentation](https://github.com/prisma/prisma/tree/HEAD/packages/instrumentation)       | `6.6.0`   | `6.8.2`    |
| [@sentry/core](https://github.com/getsentry/sentry-javascript)                                       | `9.15.0`  | `9.24.0`   |
| [@sentry/opentelemetry](https://github.com/getsentry/sentry-javascript)                              | `9.15.0`  | `9.24.0`   |
| [@types/lodash](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/lodash)           | `4.17.16` | `4.17.17`  |
| [@types/qs](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/qs)                   | `6.9.18`  | `6.14.0`   |
| [http-cache-semantics](https://github.com/kornelski/http-cache-semantics)                            | `4.1.1`   | `4.2.0`    |
| [import-in-the-middle](https://github.com/nodejs/import-in-the-middle)                               | `1.13.1`  | `1.14.0`   |
| [jwa](https://github.com/brianloveswords/node-jwa)                                                   | `2.0.0`   | `2.0.1`    |
| [pg-protocol](https://github.com/brianc/node-postgres/tree/HEAD/packages/pg-protocol)                | `1.9.5`   | `1.10.0`   |
| [protobufjs](https://github.com/protobufjs/protobuf.js)                                              | `7.5.0`   | `7.5.3`    |

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

## [13.2.0] - 2025-05-31

### 🚀 Features

- Add default configuration file for git-cliff

- Add changelog section and update license links in README.md

- Add link to full changelog in release notes

### 🐛 Bug Fixes

- Update internet-archive-upload action to use the correct repository

- Remove pull_request trigger and paths-ignore from Build.yml

### 🆕 New Version Number

- Bump version to 13.1.0

### 🛠️ GitHub Actions

- Update jekyll-gh-pages.yml

- Update sitemap.yml to trigger workflow on push events only

- Update sitemap.yml

- Update upload-linux-ia.yml

### 💼 Other

- Add Git Sizer workflow for repository size analysis

- Update metrics.repository.svg - [Skip GitHub Action]

- Refactor git-sizer workflows for scheduled analysis and dispatch execution

- Refactor workflows to improve path ignore patterns and update cron schedules

- Update metrics.repository.svg - [Skip GitHub Action]

- [create-pull-request] automated change

- Merge pull request #72 from Nick2bad4u/create-pull-request/patch

Automated sitemap update

- Update metrics.repository.svg - [Skip GitHub Action]

- [create-pull-request] automated change

- Merge PR #73

Automated sitemap update

- [create-pull-request] automated change

- Merge PR #74

Automated sitemap update

- [create-pull-request] automated change

- Merge pull request #75 from Nick2bad4u/create-pull-request/patch

Automated sitemap update

- Update metrics.repository.svg - [Skip GitHub Action]

- Update metrics.repository.svg - [Skip GitHub Action]

- Update metrics.repository.svg - [Skip GitHub Action]

- [create-pull-request] automated change

- Merge pull request #77 from Nick2bad4u/create-pull-request/patch

Automated sitemap update

- Update metrics.repository.svg - [Skip GitHub Action]

- Updates archive.org upload action to new repository

Switches the GitHub Actions workflow to use an alternative maintained fork of the internet-archive-upload action for uploading distributables. Ensures continued support and compatibility with workflow dependencies.

- Update action to 1.2

- Update metrics.repository.svg - [Skip GitHub Action]

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Updates archive upload action to v1.3 in workflows

Switches the internet-archive-upload GitHub Action to version 1.3
across all platform workflows to benefit from the latest fixes and
improvements. Ensures consistency and up-to-date dependency usage.

- Update archive upload action to v1.4 in workflows

Upgrades the internet-archive-upload GitHub Action from v1.3 to v1.4
across Linux, macOS, and Windows workflows to ensure access to the
latest features, improvements, and potential bug fixes.

- [StepSecurity] ci: Harden GitHub Actions

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io>

- Merge pull request #80 from step-security-bot/chore/GHA-301837-stepsecurity-remediation

[StepSecurity] ci: Harden GitHub Actions

- Merge pull request #79 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-0523d757ec

Bump the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 2 updates

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

## [13.1.0] - 2025-05-22

### 🆕 New Version Number

- Bump version to 13.0.0

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

- Refactor code structure for improved readability and maintainability

## [13.0.0] - 2025-05-22

### 🆕 New Version Number

- Bump version to 12.9.0

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

- Improves event handling and security, streamlines startup

Refines event listener options for better touch and scroll control, enhancing responsiveness and preventing unwanted behavior. Strengthens security by blocking navigation to untrusted URLs in new and existing windows. Simplifies tab setup logic and startup functions for maintainability. Excludes certain library files from automated workflows and linting to speed up CI. Small UI and code hygiene improvements.

- [create-pull-request] automated change

- Merge pull request #71 from Nick2bad4u/create-pull-request/patch

Automated sitemap update

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [12.9.0] - 2025-05-20

### 🆕 New Version Number

- Bump version to 12.8.0

### 💼 Other

- Improves UI robustness and fullscreen handling

Refactors UI utility functions for better error handling, DOM validation, and code clarity. Enhances fullscreen logic for reliability and accessibility, including robust event management and overlay cleanup. Updates map layer attributions and usage notes, improves notification display, and adds more defensive checks throughout tab and table-related utilities. Also updates version metadata and minor menu text.

These improvements aim to make the app's interface more resilient to edge cases and DOM inconsistencies while streamlining the codebase for maintainability.

- Update metrics.repository.svg - [Skip GitHub Action]

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [12.8.0] - 2025-05-20

### 🚀 Features

- Enhance drag-and-drop functionality for Zwift iframe and improve tab management

### 🆕 New Version Number

- Bump version to 12.7.0

### 💼 Other

- Update GitHub workflows to ignore paths except for the electron-app directory and adjust schedules

Update GitHub workflows to focus on electron-app paths and adjust schedules

Refines workflows to ignore all paths except those related to the electron-app directory for push and pull_request triggers, streamlining CI/CD processes. Adjusts cron schedules for gitleaks, repo-stats, and security-devops workflows to optimize execution timing. Adds workflow_dispatch inputs to scorecards for manual triggering flexibility.

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Update MegaLinter configuration and VSCode version retrieval to improve linting and version management

- Add write all perms

- Update metrics.repository.svg - [Skip GitHub Action]

- [create-pull-request] automated change

- Merge PR #67

Automated sitemap update

- [create-pull-request] automated change

- Merge pull request #68 from Nick2bad4u/create-pull-request/patch

Automated sitemap update

- Add concurrency settings to superlinter and typos workflows for improved job management

- [StepSecurity] ci: Harden GitHub Actions

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io>

- Merge pull request #70 from step-security-bot/chore/GHA-182017-stepsecurity-remediation

[StepSecurity] ci: Harden GitHub Actions

- Update metrics.repository.svg - [Skip GitHub Action]

## [12.7.0] - 2025-05-17

### 🆕 New Version Number

- Bump version to 12.6.0

### 🛠️ GitHub Actions

- Update GitHub workflows to enhance build and linter configurations

- Modify Build.yml to include additional paths for push and pull request triggers.
- Update mega-linter.yml to set defaults for working directory and enhance linter settings.

## [12.6.0] - 2025-05-17

### 🆕 New Version Number

- Bump version to 12.5.0

### 💼 Other

- Add checkout step to MegaLinter workflow

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [12.5.0] - 2025-05-17

### 🆕 New Version Number

- Bump version to 12.4.0

### 💼 Other

- Enhance workflows to download additional Linux and macOS release assets and update Windows asset identifiers

- Tst

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Rename download step for Windows release assets to use the correct filename

- Remove redundant download steps for macOS release assets

- Add FILTER_REGEX_INCLUDE to MegaLinter for electron-app directory

## [12.4.0] - 2025-05-17

### 🆕 New Version Number

- Bump version to 12.3.0

### 💼 Other

- Refactor workflows to list and upload distributables to archive.org for Linux, macOS, and Windows

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Refactor workflows to download and upload Linux, macOS, and Windows release assets to archive.org

## [12.3.0] - 2025-05-17

### 🆕 New Version Number

- Bump version to 12.2.0

### 💼 Other

- Update MegaLinter configuration to set working directory and format disable linters list

- Adds option to disable linters for repository git diff

Introduces the `DISABLE_LINTERS` environment variable set to `REPOSITORY_GIT_DIFF` in the MegaLinter workflow, allowing selective disabling of linters based on git diff.

Improves flexibility and efficiency in linting workflows by targeting specific changes.

## [12.2.0] - 2025-05-17

### 🆕 New Version Number

- Bump version to 12.1.0

### 🛠️ GitHub Actions

- Refines GitHub Actions workflows for clarity and efficiency

Updates release note formatting in Build.yml to ensure accurate content display. Simplifies file definition syntax in upload workflows for Linux, macOS, and Windows by consolidating file lists into single-line declarations, improving readability and maintainability.

## [12.1.0] - 2025-05-17

### 🆕 New Version Number

- Bump version to 12.0.0

### 💼 Other

- Enhances workflows and updates dependencies

- Adds exclusions for libraries and node_modules in spellcheck configuration.
- Improves release notes generation with detailed commit information.
- Simplifies VirusTotal artifact scanning configuration.
- Removes redundant version checks in upload scripts for Linux, macOS, and Windows.
- Bumps application version from 11.6.0 to 12.0.0 in package-lock.json.

These changes streamline automation, improve clarity, and update dependencies for better maintainability.

## [12.0.0] - 2025-05-17

### 🆕 New Version Number

- Bump version to 11.9.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

### ⚙️ Miscellaneous Tasks

- Update workflows for concurrency and improve artifact downloads; add badges to README

## [11.9.0] - 2025-05-17

### 🆕 New Version Number

- Bump version to 11.8.0

### 💼 Other

- Remove unused workflows and update CI configurations

Deletes obsolete GitHub Actions workflows for Microsoft Defender for DevOps and OSSAR, streamlining the repository's CI setup. Updates logic in upload workflows to improve handling of archive.org metadata and switches runners to Ubuntu for macOS and Windows workflows. Adds workflow badges to README for better visibility of CI status.

These changes enhance maintainability by removing unused workflows and improving the reliability and consistency of existing workflows.

## [11.8.0] - 2025-05-17

### 🚀 Features

- Update workflows to download all release assets and improve chart rendering options

### 🆕 New Version Number

- Bump version to 11.7.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [11.7.0] - 2025-05-17

### 🚀 Features

- Add workflows to upload Linux, macOS, and Windows distributables to Archive.org

### 🆕 New Version Number

- Bump version to 11.6.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [11.6.0] - 2025-05-17

### 🚀 Features

- Integrate upload step to archive.org into Build workflow and remove UploadToIA workflow

### 🆕 New Version Number

- Bump version to 11.5.0

### 💼 Other

- Merge branches 'main' and 'main' of https://github.com/Nick2bad4u/FitFileViewer

### ⚙️ Miscellaneous Tasks

- Bump version to 11.5.0

## [11.5.0] - 2025-05-17

### 🚀 Features

- Remove upload step to archive.org from Build workflow and add new UploadToIA workflow for scheduled uploads

### 🆕 New Version Number

- Bump version to 11.4.0

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

## [11.4.0] - 2025-05-16

### 🚀 Features

- Add support for uploading distributables to archive.org and enhance drag-and-drop functionality in the UI

### 🆕 New Version Number

- Bump version to 11.3.0

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

## [11.3.0] - 2025-05-15

### 🆕 New Version Number

- Bump version to 11.2.0

### 💼 Other

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

## [11.2.0] - 2025-05-15

### 🆕 New Version Number

- Bump version to 11.1.0

### ⚙️ Miscellaneous Tasks

- Update dependencies and improve map rendering logic

## [11.1.0] - 2025-05-15

### 🆕 New Version Number

- Bump version to 11.0.0

### 🛠️ GitHub Actions

- Update Build.yml

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

## [11.0.0] - 2025-05-14

### 🆕 New Version Number

- Bump version to 10.9.0

- Bump version to 10.9.0 and enhance overlay handling in map rendering

Enhances map overlay handling and updates version

Improves map rendering by refining overlay management, ensuring precise zoom behavior, and adding robustness to polyline handling. Updates overlay color palette to exclude similar colors and introduces logic to highlight active overlays. Bumps application version to 10.9.0 for feature enhancement.

Relates to improved user experience in map visualization.

## [10.9.0] - 2025-05-14

### 🆕 New Version Number

- Bump version to 10.8.0

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

- Refactors and optimizes codebase formatting and structure

Applies consistent formatting across files to enhance readability
Reduces nested conditions and simplifies logic for maintainability
Improves performance by optimizing loops and reducing redundant calculations
Updates Prettier configuration for ES5 trailing comma style

No functional changes introduced

## [10.8.0] - 2025-05-13

### 🆕 New Version Number

- Bump version to 10.7.0

### 💼 Other

- Enhances map visualization and chart customization

Adds refined tooltip styling and animations for Vega charts
Improves chart theming and axis/legend configuration for clarity
Optimizes map drawing logic and lap data handling for better accuracy
Introduces error handling for missing location data

Fixes #123

## [10.7.0] - 2025-05-13

### 🆕 New Version Number

- Bump version to 10.6.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [10.6.0] - 2025-05-13

### 🆕 New Version Number

- Bump version to 10.5.0

### 💼 Other

- Refactor code structure and remove redundant sections for improved readability and maintainability

- Update sitemap.xml with new lastmod dates and additional URLs for electron-app resources

- Update metrics.repository.svg - [Skip GitHub Action]

- [create-pull-request] automated change

- Merge pull request #65 from Nick2bad4u/create-pull-request/patch

Automated sitemap update

## [10.5.0] - 2025-05-13

### 🆕 New Version Number

- Bump version to 10.4.0

### 💼 Other

- Enhance theme handling and improve map rendering performance; update version to 10.4.0

## [10.4.0] - 2025-05-12

### 🆕 New Version Number

- Bump version to 10.3.0

### 💼 Other

- Enhance GPX export button validation and improve file loading error handling

## [10.3.0] - 2025-05-12

### 🆕 New Version Number

- Bump version to 10.2.0

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

- Enhance elevation profile button and loading overlay functionality

## [10.2.0] - 2025-05-11

### 🆕 New Version Number

- Bump version to 10.1.0

- Bump version to 10.1.0 and enhance overlay file management with accessibility checks and clear all functionality

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

## [10.1.0] - 2025-05-11

### 🆕 New Version Number

- Bump version to 10.0.0

### 🛠️ GitHub Actions

- Update repo-stats.yml

## [10.0.0] - 2025-05-11

### 🆕 New Version Number

- Bump version to 9.9.0

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

- Enhances map overlay functionality and fixes workflow issues

Refines map rendering with dynamic overlay highlights and improved color management. Updates tooltip display to include filenames and enhances UI accessibility. Exports color palette for consistency across components.

Fixes unsupported input in repo-stats workflow and corrects artifact path in eslint workflow. Updates dependencies to version 9.9.0.

## [9.9.0] - 2025-05-10

### 🆕 New Version Number

- Bump version to 9.8.0

### 💼 Other

- Enhance map rendering functionality with fit file overlays and new controls

- Integrated functionality to add fit files to the map, including a button for adding fit files and a list to display shown files.
- Implemented overlay drawing for loaded fit files, allowing for visual representation on the map.
- Updated marker count selector to refresh the shown files list when the marker count changes.
- Improved map controls by adding a simple measurement tool and ensuring proper bounds fitting for overlays.
- Added favicon.ico to the project.

## [9.8.0] - 2025-05-10

### 🆕 New Version Number

- Bump version to 9.7.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [9.7.0] - 2025-05-10

### 🆕 New Version Number

- Bump version to 9.6.0

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

- Merge pull request #64 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/npm-all-37eee9a49a

Bump the npm-all group across 1 directory with 11 updates

### ⚙️ Miscellaneous Tasks

- Update package versions and improve workflow configurations

### 🛡️ Security

- Bump the npm-all group across 1 directory with 11 updates

Bumps the npm-all group with 10 updates in the /electron-app directory:

| Package                                                                                                                 | From      | To         |
| ----------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| [@babel/compat-data](https://github.com/babel/babel/tree/HEAD/packages/babel-compat-data)                               | `7.27.1`  | `7.27.2`   |
| [@babel/helper-compilation-targets](https://github.com/babel/babel/tree/HEAD/packages/babel-helper-compilation-targets) | `7.27.1`  | `7.27.2`   |
| [@babel/parser](https://github.com/babel/babel/tree/HEAD/packages/babel-parser)                                         | `7.27.1`  | `7.27.2`   |
| [@babel/template](https://github.com/babel/babel/tree/HEAD/packages/babel-template)                                     | `7.27.1`  | `7.27.2`   |
| [@electron/windows-sign](https://github.com/electron/windows-sign)                                                      | `1.2.1`   | `1.2.2`    |
| [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)                                     | `1.11.0`  | `1.11.1`   |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node)                                  | `22.15.3` | `22.15.17` |
| [browserslist](https://github.com/browserslist/browserslist)                                                            | `4.24.4`  | `4.24.5`   |
| [eventsource](https://github.com/EventSource/eventsource)                                                               | `3.0.6`   | `3.0.7`    |
| [http-cache-semantics](https://github.com/kornelski/http-cache-semantics)                                               | `4.1.1`   | `4.2.0`    |

Updates `@babel/compat-data` from 7.27.1 to 7.27.2

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.2/packages/babel-compat-data)

Updates `@babel/helper-compilation-targets` from 7.27.1 to 7.27.2

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.2/packages/babel-helper-compilation-targets)

Updates `@babel/parser` from 7.27.1 to 7.27.2

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.2/packages/babel-parser)

Updates `@babel/template` from 7.27.1 to 7.27.2

- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.2/packages/babel-template)

Updates `@electron/windows-sign` from 1.2.1 to 1.2.2

- [Release notes](https://github.com/electron/windows-sign/releases)
- [Changelog](https://github.com/electron/windows-sign/blob/main/.releaserc.json)
- [Commits](https://github.com/electron/windows-sign/compare/v1.2.1...v1.2.2)

Updates `@modelcontextprotocol/sdk` from 1.11.0 to 1.11.1

- [Release notes](https://github.com/modelcontextprotocol/typescript-sdk/releases)
- [Commits](https://github.com/modelcontextprotocol/typescript-sdk/compare/1.11.0...1.11.1)

Updates `@types/node` from 22.15.3 to 22.15.17

- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node)

Updates `browserslist` from 4.24.4 to 4.24.5

- [Release notes](https://github.com/browserslist/browserslist/releases)
- [Changelog](https://github.com/browserslist/browserslist/blob/main/CHANGELOG.md)
- [Commits](https://github.com/browserslist/browserslist/compare/4.24.4...4.24.5)

Updates `electron-to-chromium` from 1.5.148 to 1.5.151

- [Changelog](https://github.com/Kilian/electron-to-chromium/blob/master/CHANGELOG.md)
- [Commits](https://github.com/kilian/electron-to-chromium/compare/v1.5.148...v1.5.151)

Updates `eventsource` from 3.0.6 to 3.0.7

- [Release notes](https://github.com/EventSource/eventsource/releases)
- [Changelog](https://github.com/EventSource/eventsource/blob/main/CHANGELOG.md)
- [Commits](https://github.com/EventSource/eventsource/compare/v3.0.6...v3.0.7)

Updates `http-cache-semantics` from 4.1.1 to 4.2.0

- [Commits](https://github.com/kornelski/http-cache-semantics/commits)

---

updated-dependencies:

- dependency-name: "@babel/compat-data"
  dependency-version: 7.27.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@babel/helper-compilation-targets"
  dependency-version: 7.27.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@babel/parser"
  dependency-version: 7.27.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@babel/template"
  dependency-version: 7.27.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@electron/windows-sign"
  dependency-version: 1.2.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@modelcontextprotocol/sdk"
  dependency-version: 1.11.1
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@types/node"
  dependency-version: 22.15.17
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: browserslist
  dependency-version: 4.24.5
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: electron-to-chromium
  dependency-version: 1.5.151
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: eventsource
  dependency-version: 3.0.7
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: http-cache-semantics
  dependency-version: 4.2.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
  ...

Signed-off-by: dependabot[bot] <support@github.com>

## [9.6.0] - 2025-05-10

### 🚀 Features

- Add dmg-license workaround for macOS builds

### 🐛 Bug Fixes

- Simplify npm cache path for Windows builds

### 🆕 New Version Number

- Bump version to 9.5.0

## [9.5.0] - 2025-05-09

### 🆕 New Version Number

- Bump version to 9.4.0

### 🚜 Refactor

- Remove unused VS Code extension files and assets

## [9.4.0] - 2025-05-09

### 🆕 New Version Number

- Bump version to 9.3.0

### 🛠️ GitHub Actions

- Update eslint.yml

## [9.3.0] - 2025-05-09

### 🚀 Features

- Update ESLint installation commands and bump version to 9.2.0

### 🆕 New Version Number

- Bump version to 9.2.0

## [9.2.0] - 2025-05-09

### 🚀 Features

- Update Node.js version to 20 in workflows

### 🆕 New Version Number

- Bump version to 9.1.0

## [9.1.0] - 2025-05-09

### 🆕 New Version Number

- Bump version to 9.0.0

### 💼 Other

- Merge branch 'main' into chore/GHA-090317-stepsecurity-remediation

- Merge pull request #61 from step-security-bot/chore/GHA-090317-stepsecurity-remediation

[StepSecurity] ci: Harden GitHub Actions

## [9.0.0] - 2025-05-09

### 🆕 New Version Number

- Bump version to 8.9.0

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

- Update metrics.repository.svg - [Skip GitHub Action]

- [StepSecurity] ci: Harden GitHub Actions

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io>

- Merge pull request #60 from Nick2bad4u/dependabot/github_actions/github-actions-0ba9d3d503

Bump the github-actions group with 3 updates

### 🛡️ Security

- Bump the github-actions group with 3 updates

Bumps the github-actions group with 3 updates: [actions/dependency-review-action](https://github.com/actions/dependency-review-action), [google/osv-scanner-action](https://github.com/google/osv-scanner-action) and [trufflesecurity/trufflehog](https://github.com/trufflesecurity/trufflehog).

Updates `actions/dependency-review-action` from 4.6.0 to 4.7.0

- [Release notes](https://github.com/actions/dependency-review-action/releases)
- [Commits](https://github.com/actions/dependency-review-action/compare/ce3cf9537a52e8119d91fd484ab5b8a807627bf8...38ecb5b593bf0eb19e335c03f97670f792489a8b)

Updates `google/osv-scanner-action` from 2.0.1 to 2.0.2

- [Release notes](https://github.com/google/osv-scanner-action/releases)
- [Commits](https://github.com/google/osv-scanner-action/compare/6fc714450122bda9d00e4ad5d639ad6a39eedb1f...e69cc6c86b31f1e7e23935bbe7031b50e51082de)

Updates `trufflesecurity/trufflehog` from 3.88.28 to 3.88.29

- [Release notes](https://github.com/trufflesecurity/trufflehog/releases)
- [Changelog](https://github.com/trufflesecurity/trufflehog/blob/main/.goreleaser.yml)
- [Commits](https://github.com/trufflesecurity/trufflehog/compare/v3.88.28...v3.88.29)

---

updated-dependencies:

- dependency-name: actions/dependency-review-action
  dependency-version: 4.7.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
- dependency-name: google/osv-scanner-action
  dependency-version: 2.0.2
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: trufflesecurity/trufflehog
  dependency-version: 3.88.29
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
  ...

Signed-off-by: dependabot[bot] <support@github.com>

## [8.9.0] - 2025-05-09

### 🆕 New Version Number

- Bump version to 8.8.0

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

## [8.8.0] - 2025-05-08

### 🆕 New Version Number

- Bump version to 8.7.0

### 🛠️ GitHub Actions

- Update electronegativity.yml

## [8.7.0] - 2025-05-08

### 🆕 New Version Number

- Bump version to 8.6.0

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

### ⚙️ Miscellaneous Tasks

- Update GitHub Actions workflows and dependencies; fix badge link in README

## [8.6.0] - 2025-05-08

### 🚀 Features

- Update GitHub workflows with concurrency settings and add new badges to README

### 🆕 New Version Number

- Bump version to 8.5.0

## [8.5.0] - 2025-05-08

### 🆕 New Version Number

- Bump version to 8.4.0

### 🛠️ GitHub Actions

- Update trugglehog.yml

### 💼 Other

- Update metrics.repository.svg - [Skip GitHub Action]

## [8.4.0] - 2025-05-08

### 🚀 Features

- Update GitHub workflows for improved linting and scanning processes

### 🆕 New Version Number

- Bump version to 8.3.0

## [8.3.0] - 2025-05-08

### 🆕 New Version Number

- Bump version to 8.2.0

### 🛠️ GitHub Actions

- Update osv-scanner.yml

## [8.2.0] - 2025-05-08

### 🚀 Features

- Add GitHub Actions for Electronegativity Scan and VSCode Version Matrix

- Update Node.js version in Electronegativity workflow and remove unused plugins from repo-stats workflow

### 🆕 New Version Number

- Bump version to 8.1.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Update metrics.repository.svg - [Skip GitHub Action]

## [8.1.0] - 2025-05-08

### 🚀 Features

- Enhance Electron app functionality and UI

### 🆕 New Version Number

- Bump version to 8.0.0

## [8.0.0] - 2025-05-07

### 🆕 New Version Number

- Bump version to 7.9.0

### 💼 Other

- Add Vitest configuration and Stylelint configuration files

- Created vitest.config.js to set up testing environment with jsdom and specified setup files.
- Added stylelint.config.js to enforce standard stylelint rules, including preventing empty blocks.

## [7.9.0] - 2025-05-07

### 🆕 New Version Number

- Bump version to 7.8.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [7.8.0] - 2025-05-07

### 🆕 New Version Number

- Bump version to 7.7.0

### 🛠️ GitHub Actions

- Create devskim.yml

### 💼 Other

- Refactor and enhance Electron app functionality

- Added global variable declaration in renderTable.js for jQuery usage.
- Simplified error handling in setupTheme.js by removing the error parameter.
- Improved showFitData.js by refactoring file name handling and UI updates for better readability and performance.
- Updated windowStateUtils.js to include global variable declarations for better compatibility.
- Removed package-lock.json and package.json to streamline dependencies.
- Introduced GitHub Actions workflows for automated greetings, security scanning with Sobelow, style linting, and code linting with Super Linter.
- Added screenfull.min.js library for fullscreen functionality.
- Implemented setupWindow.js to manage window load events and tab interactions more efficiently.

## [7.7.0] - 2025-05-07

### 🚀 Features

- Refactor UI components and enhance fullscreen functionality with new utilities

### 🆕 New Version Number

- Bump version to 7.6.0

## [7.6.0] - 2025-05-06

### 🚀 Features

- Enhance UI and functionality with modern modal dialog and improved notifications

### 🆕 New Version Number

- Bump version to 7.5.0

## [7.5.0] - 2025-05-06

### 🆕 New Version Number

- Bump version to 7.4.0

### 💼 Other

- [create-pull-request] automated change

- Merge pull request #59 from Nick2bad4u/create-pull-request/patch

Automated sitemap update

## [7.4.0] - 2025-05-06

### 🆕 New Version Number

- Bump version to 7.2.0

### 💼 Other

- Update package.json

## [7.2.0] - 2025-05-06

### 🚀 Features

- Update credits section in index.html and enhance accessibility features in the app menu

### 🆕 New Version Number

- Bump version to 7.1.0

## [7.1.0] - 2025-05-06

### 🚀 Features

- Update version to 7.0.0 and enhance workflow error handling

### 🆕 New Version Number

- Bump version to 7.0.0

## [7.0.0] - 2025-05-06

### 🚀 Features

- Enhance accessibility features with font size and high contrast options

### 🆕 New Version Number

- Bump version to 6.9.0

## [6.9.0] - 2025-05-06

### 🆕 New Version Number

- Bump version to 6.8.0

### 💼 Other

- Implement fullscreen toggle functionality and update version to 6.8.0

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [6.8.0] - 2025-05-06

### 🆕 New Version Number

- Bump version to 6.7.0

### 💼 Other

- Enhance application menu with About and Keyboard Shortcuts options, and enable restart after updates

## [6.7.0] - 2025-05-06

### 🆕 New Version Number

- Bump version to 6.6.0

### 💼 Other

- Refactor code structure for improved readability and maintainability

## [6.6.0] - 2025-05-06

### 🆕 New Version Number

- Bump version to 6.5.0 and remove macOS App Store target from build configurations

- Bump version to 6.5.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [6.5.0] - 2025-05-06

### 🆕 New Version Number

- Bump version to 6.4.0

### 💼 Other

- Remove deprecated artifact names from package.json and standardize appImage key

## [6.4.0] - 2025-05-06

### 🆕 New Version Number

- Bump version to 6.3.0

- Bump version to 6.4.0

### 💼 Other

- Update version to 6.3.0 and enhance artifact handling in package.json; modify buildAppMenu.js for menu item updates

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Update version to 6.3.0 and enhance update notification handling in renderer.js

## [6.3.0] - 2025-05-06

### 🆕 New Version Number

- Bump version to 6.1.0

- Bump version to 6.2.0 in package.json

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [6.1.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 6.0.0

### 🛠️ GitHub Actions

- Update Build.yml

### 💼 Other

- Update version to 6.2.0, add makensis dependency, and include LICENSE file

## [6.0.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 5.9.0

### 💼 Other

- Enhance fullscreen functionality by ensuring tab content fills the screen and adding exit overlay button

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [5.9.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 5.8.0

### 💼 Other

- Enhance fullscreen functionality with improved button design and IPC handling for menu actions

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [5.8.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 5.7.0

### 💼 Other

- Add IPC handlers for file menu actions and enhance export functionality

## [5.7.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 5.6.0

### 🛠️ GitHub Actions

- Update version to 5.6.0 in package-lock.json and improve indentation in Build.yml

## [5.6.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 5.5.0

### 🛠️ GitHub Actions

- Update version to 5.5.0 in package-lock.json and enhance SHA512 handling in Build.yml

## [5.5.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 5.4.0

### 🛠️ GitHub Actions

- Update version to 5.4.0 in package-lock.json and improve SHA512 handling in Build.yml

## [5.4.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 5.3.0

### 💼 Other

- Fix escaping in URL handling and update sed command for sha512 hash replacement

## [5.3.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 5.2.0

### 💼 Other

- Refactor buildAppMenu function parameters for improved readability and update package version to 5.2.0

## [5.2.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 5.1.0

### 💼 Other

- Update sha512 handling in YAML files and enhance application description

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [5.1.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 5.0.0

### 🛠️ GitHub Actions

- Fix sha512 checksums in latest.yml files for accurate artifact verification

## [5.0.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 4.9.0

### 💼 Other

- Add YAML files to distribution and release artifacts

## [4.9.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 4.8.0

- Bump version to 4.8.0 and add cross-env as a dev dependency

## [4.8.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 4.7.0 and update legal trademarks; refine start-prod script for cross-platform compatibility

- Bump version to 4.7.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [4.7.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 4.6.0

### 💼 Other

- Update version to 4.6.0 and refine artifact naming in build process

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [4.6.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 4.5.0

### 💼 Other

- Refactor hash printing for Linux and macOS in build workflow

## [4.5.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 4.4.0

### 💼 Other

- Add hash printing for distributable files in Windows and Linux/macOS

## [4.4.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 4.3.0

### 💼 Other

- Use recursive copy for organizing distributables in release process

## [4.3.0] - 2025-05-05

### 🆕 New Version Number

- Bump version to 4.2.0

### 💼 Other

- Refactor release process to organize distributables by platform and architecture

## [4.2.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 4.1.0

### 💼 Other

- Comment out deduplication and validation step for distributable files in the build workflow

## [4.1.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 4.0.0

### 💼 Other

- Update auto-updater logging and bump version to 4.0.0

## [4.0.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 3.9.0

### 💼 Other

- Update caching paths for npm on Windows and enable cross-OS archive support

## [3.9.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 3.8.0 and rename latest.yml for architecture in Windows

- Bump version to 3.8.0

- Bump version to 3.9.0

- Bump version to 3.8.0 in package.json and package-lock.json

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Exclude ia32 architecture for Windows and update version to 3.7.0 in package.json

## [3.8.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 3.7.0 and update autoUpdater feed URL for Windows architecture

- Bump version to 3.7.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [3.7.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 3.6.0

- Bump version to 3.6.0 and update caching strategy for node modules in Build.yml

## [3.6.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 3.5.0

- Bump version to 3.5.0 and update artifact naming convention in package.json; add support for additional release artifacts in Build.yml

## [3.5.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 3.4.0

- Bump version to 3.4.0, update cache path for consistency, and add update notification functionality

## [3.4.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 3.3.0

- Bump version to 3.3.0 and remove unused property from package.json

## [3.3.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 3.2.0

### 💼 Other

- Update version to 3.2.0, enhance auto-updater functionality, and adjust cache path for Windows

## [3.2.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 3.1.0

### 💼 Other

- Refactor package.json to update publisher information and restructure mac desktop entry

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [3.1.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 2.9.0 and enhance auto-update notifications

- Bump version to 3.0.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [3.0.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 2.9.0

### 💼 Other

- Refactor code structure for improved readability and maintainability

## [2.9.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 2.8.0

- Bump version to 2.8.0

### 💼 Other

- Refactor code structure for improved readability and maintainability

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [2.8.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 2.7.0

### 💼 Other

- Refactor code structure for improved readability and maintainability

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [2.7.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 2.6.0

### 💼 Other

- Refactor code structure for improved readability and maintainability

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [2.6.0] - 2025-05-04

### 🐛 Bug Fixes

- Update artifact patterns to include all YAML and blockmap files

### 🆕 New Version Number

- Bump version to 2.5.0

## [2.5.0] - 2025-05-04

### 🐛 Bug Fixes

- Update artifact paths for release process

### 🆕 New Version Number

- Bump version to 2.4.0

## [2.4.0] - 2025-05-04

### 🆕 New Version Number

- Bump version to 2.3.13

### 🚜 Refactor

- Simplify version bump logic and improve update notifications in renderer

## [2.3.13] - 2025-05-04

### 🆕 New Version Number

- Bump version to 2.3.12

### 🛠️ GitHub Actions

- Update codeql.yml

## [2.3.12] - 2025-05-04

### 🆕 New Version Number

- Bump version to 2.3.11

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

### ⚙️ Miscellaneous Tasks

- Update dependencies and version to 2.3.10

## [2.3.11] - 2025-05-03

### 🚀 Features

- Add listener for decoder options changes and update data table

### 🆕 New Version Number

- Bump version to 2.3.10

## [2.3.10] - 2025-05-03

### 🆕 New Version Number

- Bump version to 2.3.9

### 🛠️ GitHub Actions

- Create summary.yml

## [2.3.9] - 2025-05-03

### 🚀 Features

- Unify file open logic and ensure both readers update from all sources

### 🆕 New Version Number

- Bump version to 2.3.8

## [2.3.8] - 2025-05-03

### 🆕 New Version Number

- Bump version to 2.3.7

### 🛠️ GitHub Actions

- Update codeql.yml

## [2.3.7] - 2025-05-03

### 🆕 New Version Number

- Bump version to 2.3.6

### 🛠️ GitHub Actions

- Update codeql.yml

## [2.3.6] - 2025-05-03

### 🆕 New Version Number

- Bump version to 2.3.5

### 💼 Other

- _(deps-dev)_ Bump @types/chrome

- Merge pull request #56 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/npm-all-ccf39fe968

build(deps-dev): bump @types/chrome from 0.0.317 to 0.0.318 in /electron-app/libs/zwiftmap-main/browser-extension in the npm-all group

- _(deps-dev)_ Bump the npm-all group in /electron-app with 3 updates

- Merge pull request #57 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/npm-all-3ba5ff75b8

build(deps-dev): bump the npm-all group in /electron-app with 3 updates

- _(deps)_ Bump the npm-all group with 8 updates

- Merge pull request #58 from Nick2bad4u/dependabot/npm_and_yarn/npm-all-ebff2fd4aa

build(deps): bump the npm-all group with 8 updates

## [2.3.5] - 2025-05-03

### 🚀 Features

- Add core files for FIT File Viewer application

### 🆕 New Version Number

- Bump version to 2.3.4

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [2.3.4] - 2025-05-02

### 🆕 New Version Number

- Bump version to 2.3.3

### 💼 Other

- Implement theme management and decoder options persistence using electron-store

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [2.3.3] - 2025-05-02

### 🆕 New Version Number

- Bump version to 2.3.1

- Bump version to 2.3.2 in package.json

- Bump version to 2.3.2

### 🛠️ GitHub Actions

- Enhance version bump logic and update release notes formatting in Build.yml

### 💼 Other

- Simplify file listing in workflow by changing path to current directory

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Enhance version bump logic to include tagging with v prefix and update versioning scheme for major and minor releases

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [2.3.0] - 2025-05-02

### 🆕 New Version Number

- Bump version to 2.3.0

### 💼 Other

- Update package version to 2.2.0 and adjust build workflow for package.json handling

## [2.2.0] - 2025-05-02

### 🆕 New Version Number

- Bump version to 2.1.0

- Bump version to 2.2.0

### 🛠️ GitHub Actions

- Update Build.yml

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

## [2.0.0] - 2025-05-02

### 🆕 New Version Number

- Bump version to 2.0.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Enhance build workflow: add validation for package.json, upload bumped version, and improve deduplication of distributable files

## [1.9.0] - 2025-05-02

### 🆕 New Version Number

- Bump version to 1.9.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Deduplicate distributable files before creating release

## [1.8.0] - 2025-05-02

### 🆕 New Version Number

- Bump version to 1.8.0

### 💼 Other

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Enhance release workflow by listing artifacts and updating file patterns for artifact uploads

## [1.7.0] - 2025-05-02

### 🆕 New Version Number

- Bump version to 1.7.0

### 💼 Other

- Update release action to include all files in artifacts directory

- Update artifact upload and release steps in CI workflow

## [1.6.0] - 2025-05-02

### 🆕 New Version Number

- Bump version to 1.6.0

### 💼 Other

- Add build-all script to package.json for building all platforms

- Fix exclusion of macOS ia32 architecture in build matrix

- Fix exclusion of ia32 architecture for ubuntu-latest in build matrix

- Implement automatic minor version bump in CI workflow

## [1.5.0] - 2025-05-02

### 🆕 New Version Number

- Bump version to 1.5.0

### 🛠️ GitHub Actions

- Update Build.yml

- Update Build.yml

- Update Build.yml

### 💼 Other

- Update package.json

- Update package.json

- Update package.json

- Update package.json

- Update package.json

## [1.4.0] - 2025-05-02

### 🚀 Features

- Implement multi-select mode for lap selection and add simple measurement tool

- Add marker count selector and update map rendering logic

- Disable text selection on footer for improved user experience

- Enhance lap row rendering to include start time in summary table

- Implement FIT reader library with core functionalities

- Add mapping for unknown FIT messages and enhance label application logic

### 🐛 Bug Fixes

- Enable cancellation of in-progress GitHub Pages deployments

- Update Dependabot configuration to use consistent group naming for npm updates

- Update vite version to 6.3.4; enhance measurement tool UI with SVG icons and add GPX export functionality

### 🆕 New Version Number

- Bump version to 1.4.0

### 🛠️ GitHub Actions

- Update dependabot.yml

- _(deps-dev)_ Bump typescript

- _(deps)_ Bump the npm-all group

- Create Build.yml

- Update Build.yml

- Update Build.yml

- Update Build.yml

- Update Build.yml

- Update Build.yml

- Update Build.yml

- Update Build.yml

### 💼 Other

- [StepSecurity] Apply security best practices

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io>

- Merge pull request #19 from step-security-bot/chore/GHA-291632-stepsecurity-remediation

[StepSecurity] Apply security best practices

- _(deps)_ Bump react-dom and @types/react-dom

- Merge pull request #33 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/multi-1dbe629cdc

build(deps): bump react-dom and @types/react-dom in /electron-app/libs/zwiftmap-main/frontend

- _(deps)_ Bump @tanstack/react-query-devtools

- Merge pull request #32 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/tanstack/react-query-devtools-5.74.9

build(deps): bump @tanstack/react-query-devtools from 5.66.0 to 5.74.9 in /electron-app/libs/zwiftmap-main/frontend

- _(deps-dev)_ Bump the npm group in /electron-app with 2 updates

- Merge pull request #34 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/npm-c916c61fa3

build(deps-dev): bump the npm group in /electron-app with 2 updates

- _(deps)_ Bump @turf/nearest-point-on-line

- Merge pull request #26 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/turf/nearest-point-on-line-7.2.0

build(deps): bump @turf/nearest-point-on-line from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend

- _(deps)_ Bump zwift-data

- Merge pull request #24 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/zwift-data-1.43.0

build(deps): bump zwift-data from 1.42.0 to 1.43.0 in /electron-app/libs/zwiftmap-main/browser-extension

- _(deps)_ Bump @google-cloud/secret-manager

- Merge pull request #20 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/google-cloud/secret-manager-6.0.1

build(deps): bump @google-cloud/secret-manager from 5.6.0 to 6.0.1 in /electron-app/libs/zwiftmap-main/backend

- _(deps)_ Bump @sentry/react

- Merge pull request #31 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/sentry/react-9.15.0

build(deps): bump @sentry/react from 8.53.0 to 9.15.0 in /electron-app/libs/zwiftmap-main/frontend

- _(deps-dev)_ Bump @types/node

- Merge pull request #30 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/types/node-22.15.3

build(deps-dev): bump @types/node from 22.13.0 to 22.15.3 in /electron-app/libs/zwiftmap-main/backend

- _(deps)_ Bump fast-xml-parser

- Merge pull request #29 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/fast-xml-parser-5.2.1

build(deps): bump fast-xml-parser from 4.5.1 to 5.2.1 in /electron-app/libs/zwiftmap-main/backend

- _(deps-dev)_ Bump esbuild

- Merge pull request #21 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/esbuild-0.25.3

build(deps-dev): bump esbuild from 0.25.0 to 0.25.3 in /electron-app/libs/zwiftmap-main/browser-extension

- _(deps)_ Bump dotenv in /electron-app/libs/zwiftmap-main/backend

- Merge pull request #22 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/dotenv-16.5.0

build(deps): bump dotenv from 16.4.7 to 16.5.0 in /electron-app/libs/zwiftmap-main/backend

- Merge pull request #23 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/typescript-5.8.3

build(deps-dev): bump typescript from 5.7.3 to 5.8.3 in /electron-app/libs/zwiftmap-main/frontend

- _(deps-dev)_ Bump @types/chrome

- Merge pull request #25 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/types/chrome-0.0.317

build(deps-dev): bump @types/chrome from 0.0.316 to 0.0.317 in /electron-app/libs/zwiftmap-main/browser-extension

- _(deps)_ Bump @tanstack/react-query

- Merge pull request #28 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/tanstack/react-query-5.74.9

build(deps): bump @tanstack/react-query from 5.66.0 to 5.74.9 in /electron-app/libs/zwiftmap-main/frontend

- _(deps-dev)_ Bump electron-to-chromium in the npm group

- Merge pull request #35 from Nick2bad4u/dependabot/npm_and_yarn/npm-693064aba8

build(deps-dev): bump electron-to-chromium from 1.5.143 to 1.5.144 in the npm group

- Refactor code structure for improved readability and maintainability

- _(deps)_ Bump @sentry/node

- Merge PR #46

build(deps): bump @sentry/node from 8.53.0 to 9.15.0 in /electron-app/libs/zwiftmap-main/backend

- _(deps)_ Bump @turf/length

- Merge PR #45

build(deps): bump @turf/length from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend

- _(deps-dev)_ Bump @types/validator

- Merge PR #44

build(deps-dev): bump @types/validator from 13.12.2 to 13.15.0 in /electron-app/libs/zwiftmap-main/backend

- _(deps)_ Bump @turf/difference

- Merge PR #43

build(deps): bump @turf/difference from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend

- _(deps)_ Bump the npm-all group

- Merge PR #47

build(deps): bump the npm-all group in /electron-app/libs/zwiftmap-main/browser-extension with 4 updates

- _(deps)_ Bump @turf/buffer

- Merge PR #42

build(deps): bump @turf/buffer from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend

- _(deps-dev)_ Bump vitest

- Merge pull request #36 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/vitest-3.1.2

build(deps-dev): bump vitest from 2.1.9 to 3.1.2 in /electron-app/libs/zwiftmap-main/frontend

- _(deps)_ Bump @turf/length

- Merge pull request #37 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/turf/length-7.2.0

build(deps): bump @turf/length from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/frontend

- _(deps)_ Bump @types/leaflet

- Merge pull request #38 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/types/leaflet-1.9.17

build(deps): bump @types/leaflet from 1.9.5 to 1.9.17 in /electron-app/libs/zwiftmap-main/frontend

- _(deps)_ Bump @turf/buffer

- Merge pull request #40 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/turf/buffer-7.2.0

build(deps): bump @turf/buffer from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/frontend

- Add point-to-point measurement tool for Leaflet maps

- _(deps-dev)_ Bump the npm-all group with 3 updates

- Merge pull request #49 from Nick2bad4u/dependabot/npm_and_yarn/npm-all-6c6b09f879

build(deps-dev): bump the npm-all group with 3 updates

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- _(deps-dev)_ Bump @babel/runtime from 7.27.0 to 7.27.1

- Merge PR #52

build(deps-dev): bump @babel/runtime from 7.27.0 to 7.27.1

- _(deps-dev)_ Bump vite

- Merge pull request #50 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-de653eece3

build(deps-dev): bump vite from 6.3.3 to 6.3.4 in /electron-app/libs/zwiftmap-main/frontend in the npm_and_yarn group

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Enhances map rendering and user interaction

Refactors map rendering logic for modularity and maintainability
Adds flexible layout for map controls with improved styling
Introduces map action buttons for printing, exporting GPX, and elevation profiles
Implements escape key and exit button handlers for measurement tool
Fixes potential issues with duplicate map instances and grey background bug
Improves theme support for dark/light mode compatibility

Refactors map rendering and enhances user interaction

Modularizes map rendering logic for maintainability
Improves map controls layout and styling
Adds action buttons for print/export/elevation profile
Introduces escape key and exit button handlers for measurement tool
Fixes duplicate map instance and grey background issues
Enhances dark/light mode theme compatibility

- _(deps)_ Bump the npm-all group across 1 directory with 96 updates

- Merge pull request #55 from Nick2bad4u/dependabot/npm_and_yarn/npm-all-3d36a931d8

build(deps): bump the npm-all group across 1 directory with 96 updates

- Merge pull request #54 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/npm-all-4c4c415551

build(deps): bump the npm-all group in /electron-app/libs/zwiftmap-main/backend with 56 updates

- _(deps)_ Bump the npm-all group in /electron-app with 22 updates

- Merge pull request #53 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/npm-all-c3615f18f2

build(deps): bump the npm-all group in /electron-app with 22 updates

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Remove unused FIT reader utility functions and related code

- Deleted datetime.js, getBits.js, getFieldData.js, index.js, isInvalid.js, nTimes.js, namedFields.js, readData.js, readDefinition.js, readFileHeader.js, and readRecordHeader.js.
- These files contained functions and logic that are no longer needed in the FIT reader implementation.
- This cleanup helps streamline the codebase and improve maintainability.

### 🚜 Refactor

- Change Dependabot update schedule from daily to monthly for all ecosystems; add lap selection UI logic to a new module

### ⚙️ Miscellaneous Tasks

- Add Copilot instructions for FitFileViewer project

- Update Babel dependencies to version 7.27.1

## [1.3] - 2025-04-29

### 🚀 Features

- Enhance accessibility and improve UI responsiveness

- Implement feed entries fetching and image replacement for Zwift map extension

- Add IPC handlers for reading and parsing FIT files

- Add custom map type selection button and zoom slider for enhanced user interaction

- Enhance map rendering with lap selection UI and improved control styles

### 💼 Other

- Refactor code structure for improved readability and maintainability

- Fix path to Chart.js library in renderMap function for elevation profile chart

- _(deps-dev)_ Bump the npm group with 2 updates

- Merge PR #12

build(deps-dev): bump the npm group with 2 updates

- _(deps)_ Bump the npm group in /electron-app with 3 updates

- Merge PR #11

build(deps): bump the npm group in /electron-app with 3 updates

- Delete 34 files

- Refactor code structure and remove redundant sections for improved readability and maintainability

- _(deps)_ Bump the npm_and_yarn group across 2 directories with 21 updates

- Merge PR #15

build(deps): bump the npm_and_yarn group across 2 directories with 21 updates

- _(deps-dev)_ Bump @types/node in the npm group

- Merge PR #14

build(deps-dev): bump @types/node from 22.15.0 to 22.15.2 in the npm group

- _(deps-dev)_ Bump @types/node in /electron-app in the npm group

- Merge PR #13

build(deps-dev): bump @types/node from 22.15.0 to 22.15.2 in /electron-app in the npm group

- Refactor code structure for improved readability and maintainability

- _(deps)_ Bump the npm group with 12 updates

- Merge pull request #18 from Nick2bad4u/dependabot/npm_and_yarn/npm-bc334dfba7

build(deps): bump the npm group with 12 updates

- _(deps-dev)_ Bump the npm group in /electron-app with 2 updates

- Merge PR #17

build(deps-dev): bump the npm group in /electron-app with 2 updates

- [create-pull-request] automated change

- Merge PR #16

Automated sitemap update

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

### 🎨 Styling

- Add elevation profile CSS for dark and light themes

### ⚙️ Miscellaneous Tasks

- Update package.json for versioning, scripts, and metadata improvements

- Update launch configuration and enable debugging for Electron app

- Update version to 1.3.0 in package.json

## [1.1.0] - 2025-04-24

### 🚀 Features

- Add ESLint configuration and update dependencies in package.json and package-lock.json

- Migrate ESLint configuration from .eslintrc.js to eslint.config.js

- Refactor showFitData and tab management functions into separate utility modules

- Add additional utility functions for global access in utils.js

- Remove unused utility functions from global exports in utils.js

- Implement recent files functionality with context menu for file opening

- Move recent files utility functions to separate module

- Refactor and modularize recent files and renderer utilities

- Move showNotification and setLoading utilities to renderer.js for better encapsulation

- Add window resize handler for responsive chart rendering

- Enhance utility functions with detailed JSDoc comments for better documentation

- Add comprehensive tests for main UI, preload, and window state utilities

- Implement theme switching and persistence across the Electron app

- Implement theme switching and persistence with utility functions

- Add scroll wheel support for filter selection in renderTable function

### 🐛 Bug Fixes

- Update link to the Releases Page in README for accurate navigation

- Update package metadata for fitfileviewer with correct name, version, and description

- Update electron version to 35.2.0 in package.json and package-lock.json

- Update base URL in sitemap generation workflow

### 🛠️ GitHub Actions

- _(deps)_ Bump the npm group with 29 updates

- Update eslint.yml

- Update eslint.yml

- Update eslint.yml

- Update eslint.yml

- Create codeql.yml

- Create jekyll-gh-pages.yml

### 💼 Other

- Merge pull request #1 from Nick2bad4u/dependabot/npm_and_yarn/npm-1952bbb91e

build(deps): bump the npm group with 29 updates

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Add comprehensive tests for utility functions in electron-app

- Implement tests for patchSummaryFields to validate formatting and rounding of various fields.
- Create tests for recentFiles utility functions to ensure correct loading, saving, and adding of recent files.
- Add tests for renderChart to verify chart rendering in different scenarios.
- Develop tests for renderMap to check map rendering and handling of coordinates.
- Implement tests for renderSummary to validate summary rendering from session and record messages.
- Create tests for renderTable to ensure proper table rendering and interaction.
- Add tests for rendererUtils to verify notification and loading overlay functionality.
- Implement tests for setActiveTab to ensure correct tab activation behavior.
- Create tests for showFitData to validate data display and tab rendering logic.
- Add tests for toggleTabVisibility to ensure correct visibility toggling of tab content.

- Add Jest as a dev dependency for testing

- Update README.md

- Create .eslintrc.js

- Update .eslintrc.js

- Remove old ESLint configuration files and add new .eslintrc.cjs with updated rules

- Add ESLint configuration file with basic rules and ECMAScript 2020 support

- Add additional badges to README for various GitHub workflows

- [StepSecurity] Apply security best practices

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io>

- Merge pull request #3 from step-security-bot/chore/GHA-211451-stepsecurity-remediation

[StepSecurity] Apply security best practices

- [create-pull-request] automated change

- Merge pull request #2 from Nick2bad4u/create-pull-request/patch

Automated sitemap update

- Refactor HTML structure for improved readability and consistency; update JavaScript files to disable console warnings and enhance theme handling logic.

- Enhance chart rendering logic to filter allowed fields and provide user feedback for missing data; update ESLint config to disable console warnings.

- Remove CodeQL workflow file as it is no longer needed for the project.

- Refactor Dependabot configuration to remove redundant whitespace and ensure consistent formatting across package ecosystems.

- Fix CodeQL badge link in README to point to the correct workflow file

- Add chart specification and enhance chart rendering logic with error handling

- Improve error handling and formatting in renderChart function

- Enhance renderChart function with improved error handling and validation for chart data

- Enhance documentation for getChartSpec function with detailed parameter and return descriptions

- Refactor null checks in patchSummaryFields utility functions for consistency and clarity

- Refactor ESLint configuration for improved structure and clarity

- Enhance renderSummary function layout with improved styling for summary section and header bar

- Refactor renderSummary function layout for improved styling and alignment

- Refactor renderSummary function to use CSS classes for summary and lap section styling

- Add summary column selector functionality and modal for column preferences

- _(deps)_ Bump the npm group with 11 updates

- Merge PR #6

build(deps): bump the npm group with 11 updates

- _(deps-dev)_ Bump electron-to-chromium

- Merge PR #5

build(deps-dev): bump electron-to-chromium from 1.5.139 to 1.5.140 in /electron-app in the npm group

- Merge PR #4

build(deps): bump step-security/harden-runner from 2.11.1 to 2.12.0 in the github-actions group

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Refactor summary column modal styles for improved readability and consistency

- Enhance FIT file loading functionality and menu integration

- Implemented global state management for loaded FIT file path.
- Updated IPC communication to notify main process of loaded FIT files.
- Modified buildAppMenu to enable/disable Summary Columns based on loaded FIT file.
- Improved recent files path handling for better compatibility in different environments.

- Refactor notification and loading utilities into separate module for cleaner code structure

- Add column width synchronization for summary and lap tables

- _(deps-dev)_ Bump the npm group with 2 updates

- Merge PR #7

build(deps-dev): bump the npm group with 2 updates

- Refactor showFitData function and add unload file functionality; enhance summary rendering and UI updates

- Refactor CSS for improved theming and layout; enhance readability and organization of styles

- Refactor renderSummary and add helper functions for improved column management; enhance summary rendering and UI interactions

- Remove obsolete test files for chart, map, summary, table, renderer, and utility functions

- Deleted tests for renderChart, renderMap, renderSummary, renderTable, and showFitData.
- Removed tests for rendererUtils, toggleTabVisibility, and windowStateUtils.
- Cleaned up theme and style tests, along with utility tests.
- Removed associated CSS files used for testing styles.

- _(deps-dev)_ Bump electron-to-chromium in the npm group

- Merge PR #10

build(deps-dev): bump electron-to-chromium from 1.5.140 to 1.5.141 in the npm group

- _(deps)_ Bump github/codeql-action in the github-actions group

- Merge PR #9

build(deps): bump github/codeql-action from 3.28.15 to 3.28.16 in the github-actions group

- _(deps-dev)_ Bump the npm group in /electron-app with 2 updates

- Merge PR #8

build(deps-dev): bump the npm group in /electron-app with 2 updates

- Enhance theme handling in chart rendering; support light and dark themes in getChartSpec and re-render chart on theme change

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

### 🚜 Refactor

- Remove unused test_index.html and update utility functions for theme management

- Remove unused roles from the application menu

- Refactor: improve formatDuration function to handle string inputs and ensure finite number validation
  refactor: enhance renderSummary function to filter out empty or invalid summary columns
  fix: add logic to renderTable for destroying existing DataTable instances before reinitialization

- Update button border style and adjust margin for copy button in content summary

- Enhance color variables and improve box shadow styles for better UI consistency

- Update documentation for global utility exposure and clarify security considerations

- Enhance theme handling in menu updates and improve filename color variable for better readability

- Improve error handling in theme persistence and loading functions

- Switch from ES module to CommonJS syntax in ESLint configuration

- Update ESLint configuration to use ES module syntax and simplify filter value persistence in renderTable function

- Simplify ESLint workflow by consolidating steps and updating action versions

- Convert ES module syntax to CommonJS in fitParser.js

### 📚 Documentation

- Enhance .gitkeep with guidelines for organizing Jest test files

### 🎨 Styling

- Update CSS variables for improved theme support and readability

### 🧪 Testing

- Add unit tests for theme management functions

### ⚙️ Miscellaneous Tasks

- Add @typescript-eslint/eslint-plugin to dependencies

- Update ESLint configuration and dependencies

- Downgrade ESLint version to 9.0.0 and update workflow for improved security and functionality

- Update eslint to version 9.25.1 and related dependencies in package.json and package-lock.json

- Update ESLint configuration import and add eslint-define-config dependency

### 🛡️ Security

- _(deps)_ Bump step-security/harden-runner

## [1.0.1] - 2025-04-20

### 🚀 Features

- Implement FIT Viewer extension with custom editor for FIT files

- Enhance patchSummaryFields function for comprehensive data formatting

- Improve comments and structure in index.html for better clarity and organization

- Refactor main UI logic into main-ui.js for improved organization and maintainability

- Refactor fitParser.js and preload.js for improved readability and consistency

- Update script loading order and enhance global data handling in main-ui.js; improve dark mode styling for the map in style.css

- Enhance pagination styles in style.css for improved visibility and user experience

- Improve loading order and enhance error handling in utils.js; update credits section in index.html for better organization

- Refactor utils.js for improved readability and consistency; enhance chart rendering and warning messages

- Update .gitignore to include additional rules for Node.js, Python, and Visual Studio Code; enhance project organization

- Add utility functions for CSV export, distance and duration formatting, and summary patching

- Implement window state management and add utility functions for formatting speed and arrays

- Add notification UI and loading overlay; enhance user feedback during file operations

- Add electron-builder configuration and build script

- Add multiple GitHub Actions workflows for enhanced CI/CD processes including ActionLint, Microsoft Defender, Dependency Review, ESLint, OSSAR, OSV-Scanner, Scorecard, Sitemap generation, Stale issue management, and Static content deployment

- Add initial Jekyll configuration with essential plugins and site metadata

### 🛠️ GitHub Actions

- Create dependabot.yml

### 💼 Other

- Initial commit

- Add Prettier configuration file for consistent code formatting

- Introduced a new .prettierrc file in the electron-app directory.
- Configured various formatting options including arrowParens, printWidth, and trailingComma.
- Added specific overrides for CSS, Stylus, HTML, and user JavaScript files to customize formatting rules.

- Moved extension files to the new directory

- Implement code changes to enhance functionality and improve performance

- Refactor code structure for improved readability and maintainability

- Refactor code structure for improved readability and maintainability

- Merge branch 'main' of https://github.com/Nick2bad4u/FitFileViewer

- Create CNAME

- Implement code changes to enhance functionality and improve performance

### 🚜 Refactor

- Remove unused imports from main-ui.js, main.js, and preload.js

- Improve code formatting and organization across multiple files for better readability

- Enhance layout and styling for app header, tab bar, and content sections for improved user experience

- Update padding and margin in app header and tab card for improved layout; remove unused styles

- Update Prettier configuration for consistent print width; improve HTML structure and readability

- Simplify credits section in HTML; enhance readability and structure in main UI JavaScript

- Consolidate utility exports in utils.js for improved organization and global access

- Enhance error handling and key sorting in displayTables function; improve code clarity and robustness

- Prevent redundant tab activation by checking active state before toggling

- Improve object serialization in copyTableAsCSV function; enhance performance and prevent redundant serialization

- Enhance formatting functions for distance and duration; improve validation and error handling

- Improve patchSummaryFields function; enhance readability and validation for summary metrics

- Enhance background data pre-rendering and improve DataTables pagination in night mode

- Optimize chart rendering and enhance tab visibility handling; improve styling for better layout

### 🎨 Styling

- Clean up CSS formatting and organization for improved readability

<!-- generated by git-cliff -->
