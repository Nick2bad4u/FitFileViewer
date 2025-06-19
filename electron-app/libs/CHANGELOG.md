<!-- markdownlint-disable -->
<!-- eslint-disable markdown/no-missing-label-refs -->
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]


[[a09e7e1](https://github.com/Nick2bad4u/FitFileViewer/commit/a09e7e1ba6cae2d8715497930ed78fe72fa3f12c)...
[a09e7e1](https://github.com/Nick2bad4u/FitFileViewer/commit/a09e7e1ba6cae2d8715497930ed78fe72fa3f12c)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/a09e7e1ba6cae2d8715497930ed78fe72fa3f12c...a09e7e1ba6cae2d8715497930ed78fe72fa3f12c))


### 🚀 Features

- Implement comprehensive state management system with advanced features [`(a09e7e1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a09e7e1ba6cae2d8715497930ed78fe72fa3f12c)




## [24.2.0] - 2025-06-18


[[e8ed10d](https://github.com/Nick2bad4u/FitFileViewer/commit/e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27)...
[e8ed10d](https://github.com/Nick2bad4u/FitFileViewer/commit/e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27...e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27))


### 💼 Other

- Refactor heart rate and power zone color controls to use inline color selectors

- Replaced the existing openZoneColorPicker function with createInlineZoneColorSelector in both heart rate and power zone control files.
- Introduced a new utility for creating inline zone color selectors, allowing for a more compact and user-friendly interface for customizing zone colors.
- Updated the reset functionality in openZoneColorPicker to ensure all relevant zone fields are reset to custom color schemes.
- Enhanced the zone color utility functions to support additional color schemes, including pastel, dark, rainbow, ocean, earth, fire, forest, sunset, grayscale, neon, autumn, spring, cycling, and runner.
- Improved the persistence of zone colors in localStorage and ensured proper synchronization between chart-specific and generic zone color storage. [`(e8ed10d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27)




## [24.1.0] - 2025-06-18


[[d5c18e4](https://github.com/Nick2bad4u/FitFileViewer/commit/d5c18e4b82598d1df4a24aca265504a0bbf52af3)...
[39fb2f4](https://github.com/Nick2bad4u/FitFileViewer/commit/39fb2f4e23ccaf99173697a68eb2883aa00c04ca)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/d5c18e4b82598d1df4a24aca265504a0bbf52af3...39fb2f4e23ccaf99173697a68eb2883aa00c04ca))


### 💼 Other

- Refactor code structure for improved readability and maintainability [`(39fb2f4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/39fb2f4e23ccaf99173697a68eb2883aa00c04ca)


- Update setTimeout callbacks to use function expressions for consistency [`(19ba8e6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/19ba8e60f80467e8b8531eaad257c5d95f875ad4)


- Refactor and enhance modal functionality; remove unused chart tab, optimize notification delay, and improve theme configurations

- Removed the "chart" tab functionality from the setupWindow.js file.
- Reduced the notification processing delay from 200ms to 50ms in showNotification.js.
- Updated theme.js to adjust surface color opacity and added new color zones for various functionalities.
- Modified toggleTabVisibility.js to exclude the "content-chart" from the tab content IDs.
- Fixed import path for throttledAnimLog in updateChartAnimations.js.
- Added new utility functions for about modal management, including ensureAboutModal.js, loadVersionInfo.js, updateSystemInfo.js, and injectModalStyles.js.
- Implemented a throttled animation logging utility in lastAnimLog.js for better performance during development.
- Created exportAllCharts.js to handle exporting multiple charts with notifications for success or failure. [`(d5c18e4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d5c18e4b82598d1df4a24aca265504a0bbf52af3)




## [22.1.0] - 2025-06-14


[[25c3b5e](https://github.com/Nick2bad4u/FitFileViewer/commit/25c3b5e09fc01799a354e00c97ea827a48a5dfc8)...
[25c3b5e](https://github.com/Nick2bad4u/FitFileViewer/commit/25c3b5e09fc01799a354e00c97ea827a48a5dfc8)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/25c3b5e09fc01799a354e00c97ea827a48a5dfc8...25c3b5e09fc01799a354e00c97ea827a48a5dfc8))


### 💼 Other

- Standardizes YAML, JSON, and config formatting across repo

Improves consistency by normalizing quotes, indentation, and
key/value styles in all GitHub Actions workflows, project config,
and markdown files. Adds Prettier ignore rules, updates settings,
and syncs formatting to reduce lint noise and tooling friction.

Prepares for cleaner future diffs and better cross-platform collaboration. [`(25c3b5e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/25c3b5e09fc01799a354e00c97ea827a48a5dfc8)




## [22.0.0] - 2025-06-14


[[62e5f5e](https://github.com/Nick2bad4u/FitFileViewer/commit/62e5f5e3f578560be51d00761c2f28aa52ee9250)...
[21bf6c1](https://github.com/Nick2bad4u/FitFileViewer/commit/21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/62e5f5e3f578560be51d00761c2f28aa52ee9250...21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034))


### 🚀 Features

- *(theme)* Enhance theme management with auto mode and smooth transitions [`(9411374)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9411374418655f6be63e2d0c2c11b9e520d9541b)



### 💼 Other

- Run Prettier on all Files. [`(21bf6c1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034)


- Revamps Chart.js integration with advanced controls and exports

Overhauls the chart rendering system to add a modern, toggleable controls panel, advanced export and sharing options (PNG, CSV, JSON, ZIP, clipboard, Imgur), and improved accessibility and error handling. Introduces support for zone data visualization, lap analysis charts, and professional styling with theme-aware design. Optimizes performance, code structure, and user feedback for a richer FIT file data experience.

Fixes chart layout, enhances maintainability, and prepares for future extensibility. [`(f852b00)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f852b00b5b566dd1b1126cf0dfa108b96a425a46)


- Improves Linux menu handling and adds menu injection support

Refactors Linux menu logic to remove minimal menu fallback and enhance menu initialization logging for better troubleshooting.
Introduces a DevTools-accessible function to manually inject or reset the application menu from the renderer, streamlining menu debugging and development workflow.
Simplifies theme synchronization and adds safeguards to prevent invalid menu setups, improving stability and UI consistency across platforms. [`(43dee75)`](https://github.com/Nick2bad4u/FitFileViewer/commit/43dee75c0ea2854e268bd89d97581101dae59e4c)


- Refactors menu theme sync and adds menu setup safeguards

Simplifies menu theme handling by removing redundant logic and updating the menu only after renderer load for better sync. Adds safety checks and debug logging to prevent setting invalid or empty application menus, improving stability and troubleshooting of menu initialization.

Streamlines menu theme sync and adds menu safety checks

Simplifies theme synchronization by removing redundant menu update logic and ensuring menus are set only after renderer load for improved UI consistency. Adds debug logging and template validation to prevent invalid or empty menu setups, aiding stability and troubleshooting. [`(aea7282)`](https://github.com/Nick2bad4u/FitFileViewer/commit/aea7282b428ca2ef68ce33c5c3907e224b368e2a)



### 🛡️ Security

- Improves Linux menu logic and adds menu injection support

Refactors Linux menu handling to remove the minimal menu fallback and adds enhanced logging for improved troubleshooting. Introduces a DevTools-accessible function allowing manual injection or reset of the application menu from the renderer, making menu debugging and development more efficient. Streamlines theme synchronization and implements safeguards to prevent invalid menu setups, boosting stability and UI consistency across platforms.

Also bumps version to 20.5.0 and updates npm dependencies, including a major Jest upgrade and multiple minor and patch updates, enhancing overall security and reliability. [`(aae539e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/aae539eeb94eef693613b973fcac471d1b78690b)


- Streamlines workflows, settings, and updates versioning

Refactors repository workflows for improved metrics and Flatpak
builds, replaces settings storage to reduce dependencies, and
enhances UI consistency across platforms. Updates auto-update
handling and Linux messaging, clarifies documentation, and bumps
version to 19.7.0. Improves security by updating GitHub Actions
dependencies. [`(62e5f5e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/62e5f5e3f578560be51d00761c2f28aa52ee9250)




## [19.0.0] - 2025-06-07


[[c7e0304](https://github.com/Nick2bad4u/FitFileViewer/commit/c7e030415cf69e25ba5674b857b87058ec44247b)...
[5debf80](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/c7e030415cf69e25ba5674b857b87058ec44247b...5debf805345db114c8a0ff6749ae0be9c5818ee5))


### 🚀 Features

- Update GitHub workflows with concurrency settings and add new badges to README [`(4ec7375)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4ec7375d9152866d92948135f2bc85f4588b0028)


- Update GitHub workflows for improved linting and scanning processes [`(c7e0304)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c7e030415cf69e25ba5674b857b87058ec44247b)



### 🔀 Merge Commits

- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer [`(6fbade0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6fbade08a71ac0bb93bc39fa316b6d11514e0530)



### 💼 Other

- Enhance workflows and documentation for Flatpak build process, including versioning updates and new download options [`(5debf80)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)


- Update changelogs and version numbers for releases 16.4.0, 16.5.0, and 16.6.0; enhance GitHub Actions and implement release cleanup script [`(24a9a97)`](https://github.com/Nick2bad4u/FitFileViewer/commit/24a9a97718f3058e1b0a537d7e41096386388202)


- Update changelogs and scripts: Add new version numbers, enhance GitHub Actions, and implement release cleanup script [`(8593346)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8593346c7d028dc0a02661bcdf9b353846e99e9d)


- Refactor code structure and improve readability; no functional changes made.
Removed a ton of un-needed files. [`(077d18c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/077d18cdbfa39b9c68b8e86abdcfbe6e9d101c15)


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

Relates to #456 [`(6a3864f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6a3864fef2ec99526e7ce10cad8db863a66dbb12)


- Refactor code structure and remove redundant sections for improved readability and maintainability [`(85ec8d0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/85ec8d0b188bec04e99ea841b2239bc20229bef3)



### ⚙️ Miscellaneous Tasks

- Update changelogs and scripts for versioning and GitHub Actions enhancements [`(1fc3c44)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1fc3c44efbc84701690e71b9c43ab2d510bfe15a)


- Update changelogs and scripts for versioning and GitHub Actions enhancements [`(27471d3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/27471d38f7b7749f7b57665551aeb8696b5fbcbe)


- Add changelog files for electron-app, tests, and utils [`(b9d2e0a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b9d2e0a4df3224672415510d505e98054a593934)


- Update GitHub Actions workflows and dependencies; fix badge link in README [`(c401c26)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c401c26b48c572958c7a8cb8a3e58fd556c88d12)



### 📦 Dependencies

- Merge pull request #92 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-2f20eee292

[dependency] Update the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 1 update [`(0f19a8b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0f19a8b4a7075920959ef7b850a02d2847627a88)


- [dependency] Update the npm_and_yarn group

[dependency] Updates the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 2 updates:  and [tar-fs](https://github.com/mafintosh/tar-fs).


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

Signed-off-by: dependabot[bot] <support@github.com> [`(63781ba)`](https://github.com/Nick2bad4u/FitFileViewer/commit/63781bae41cd85498120d205b5567c8b3ca7d7bb)


- Merge pull request #81 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/npm-all-8289ba21ba

[dependency] Update the npm-all group in /electron-app/libs/zwiftmap-main/browser-extension with 29 updates [`(fe8d700)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fe8d7002fb62202a43ca2629c17dd5e4cac74ccf)


- [dependency] Update the npm-all group

[dependency] Update npm dependencies:

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

Signed-off-by: dependabot[bot] <support@github.com> [`(4b99ffb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4b99ffbcc4e4b64e0068db309a5ba8b6e2c958f5)


- Merge pull request #82 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/npm-all-3319742fda

[dependency] Update the npm-all group in /electron-app/libs/zwiftmap-main/backend with 34 updates [`(d0fdef4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d0fdef4913d2cbb774c68000366779de6042a304)


- [dependency] Update the npm-all group

[dependency] Update npm dependencies:

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

Signed-off-by: dependabot[bot] <support@github.com> [`(77b452e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/77b452e5354a0d812ecf09a90844ccf6e9f05eb3)


- Merge pull request #79 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-0523d757ec

[dependency] Update the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 2 updates [`(f7edef8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f7edef872e5c64e12b5d6e098b4c7848ab77c599)


- [dependency] Update the npm_and_yarn group

[dependency] Updates the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 2 updates: [fastify](https://github.com/fastify/fastify) and [netlify-cli](https://github.com/netlify/cli).


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

Signed-off-by: dependabot[bot] <support@github.com> [`(f22c16d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f22c16d54b66a5503bdaa88877d2c066e45d9af8)



### 🛡️ Security

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
- Created enableTabButtons.js utility to manage tab button states. [`(ccacc58)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ccacc58627a7877220fa43fd16da97a3f9db74d2)




## [8.0.0] - 2025-05-07


[[2c36135](https://github.com/Nick2bad4u/FitFileViewer/commit/2c361351eea58127515e76586589728407410b6c)...
[f7f3de8](https://github.com/Nick2bad4u/FitFileViewer/commit/f7f3de831c09658b6c78e414fd7ab27d148baed9)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/2c361351eea58127515e76586589728407410b6c...f7f3de831c09658b6c78e414fd7ab27d148baed9))


### 🚀 Features

- Add listener for decoder options changes and update data table [`(236b7ae)`](https://github.com/Nick2bad4u/FitFileViewer/commit/236b7ae7449a7424ae74e4e969dca624b192a62e)


- Unify file open logic and ensure both readers update from all sources [`(b4a5fa1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b4a5fa18762b02e939708dcdd8ec0c1acaa8d82d)


- Add core files for FIT File Viewer application [`(194d975)`](https://github.com/Nick2bad4u/FitFileViewer/commit/194d975ac042f443bdbe18d918f9880d1f230271)


- Implement FIT reader library with core functionalities [`(70da6da)`](https://github.com/Nick2bad4u/FitFileViewer/commit/70da6dadb7c3ba252b5dcb7cbe6bfabfce9edf0a)


- Add custom map type selection button and zoom slider for enhanced user interaction [`(e38d3f7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e38d3f7ac05c1a118f06f1ac53e37f37772dc561)


- Implement feed entries fetching and image replacement for Zwift map extension [`(7fa1685)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7fa1685983dab707b3f299cac7b6d41b8918cb30)



### 🐛 Bug Fixes

- Update vite version to 6.3.4; enhance measurement tool UI with SVG icons and add GPX export functionality [`(47e4081)`](https://github.com/Nick2bad4u/FitFileViewer/commit/47e4081ac773f830c2a3025cb4eeb3e925434339)



### 💼 Other

- Add Vitest configuration and Stylelint configuration files

- Created vitest.config.js to set up testing environment with jsdom and specified setup files.
- Added stylelint.config.js to enforce standard stylelint rules, including preventing empty blocks. [`(f7f3de8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f7f3de831c09658b6c78e414fd7ab27d148baed9)


- Remove unused FIT reader utility functions and related code

- Deleted datetime.js, getBits.js, getFieldData.js, index.js, isInvalid.js, nTimes.js, namedFields.js, readData.js, readDefinition.js, readFileHeader.js, and readRecordHeader.js.
- These files contained functions and logic that are no longer needed in the FIT reader implementation.
- This cleanup helps streamline the codebase and improve maintainability. [`(21d4380)`](https://github.com/Nick2bad4u/FitFileViewer/commit/21d4380e29e10ec83be9edd34b5ac57f58a6da59)


- Merge PR #42

build(deps): bump @turf/buffer from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend [`(46bbbf0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/46bbbf0b8e607fdf43287bf05930139777c22670)


- Merge PR #43

build(deps): bump @turf/difference from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend [`(3eeab68)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3eeab68721b8163cc093eee517843b49b7534c86)


- Merge PR #44

build(deps-dev): bump @types/validator from 13.12.2 to 13.15.0 in /electron-app/libs/zwiftmap-main/backend [`(e2c8f21)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e2c8f21a21ff9ea258121febcaa605008af8d0d8)


- Merge PR #45

build(deps): bump @turf/length from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend [`(ceaad0c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ceaad0c160d4edcbe60f0f58588ea756d5534849)


- Merge PR #46

build(deps): bump @sentry/node from 8.53.0 to 9.15.0 in /electron-app/libs/zwiftmap-main/backend [`(9ee9418)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9ee9418e2731c821d7b4f3639e05b532ce396d29)


- Refactor code structure for improved readability and maintainability [`(88e148c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/88e148c7504be074165b837e32c5106784533367)


- Merge PR #15

build(deps): bump the npm_and_yarn group across 2 directories with 21 updates [`(a9a6dbf)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a9a6dbfdbf6f306556ffb9524e16a0fea657af25)


- Refactor code structure and remove redundant sections for improved readability and maintainability [`(e9edc96)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e9edc96add46c5b3c36e3c45875348fa19797ace)


- Delete 34 files [`(bd197e2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/bd197e2a1259499db9f1169a771461956d4c47dd)


- Fix path to Chart.js library in renderMap function for elevation profile chart [`(a469870)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a469870f4989ed5a0436c9986acf939cf97ce006)


- Refactor code structure for improved readability and maintainability [`(2c36135)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2c361351eea58127515e76586589728407410b6c)



### 🎨 Styling

- Clean up CSS formatting and organization for improved readability [`(bc46c8d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/bc46c8d68c2462dda976d9cfd5f199adb84fa0ac)



### ⚙️ Miscellaneous Tasks

- Update Babel dependencies to version 7.27.1 [`(fbeb156)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fbeb156ccc108c5f1e3e5a9090080aca534fd2b8)



### 📦 Dependencies

- Merge pull request #56 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/npm-all-ccf39fe968

build(deps-dev): bump @types/chrome from 0.0.317 to 0.0.318 in /electron-app/libs/zwiftmap-main/browser-extension in the npm-all group [`(cee5a22)`](https://github.com/Nick2bad4u/FitFileViewer/commit/cee5a22c7faa70ae3a646f753d19d7c36a7b10ef)


- *(deps-dev)* [dependency] Update @types/chrome [`(a59337b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a59337b63b93eac6efc95e0b23046b7baf8f81d4)


- Merge pull request #54 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/npm-all-4c4c415551

build(deps): bump the npm-all group in /electron-app/libs/zwiftmap-main/backend with 56 updates [`(531bf14)`](https://github.com/Nick2bad4u/FitFileViewer/commit/531bf1469a478452eba20dd338009a07510ca70c)


- *(deps)* [dependency] Update the npm-all group [`(2cfd615)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2cfd615e1a31d54da11cd13ad97475dc8c105af2)


- Merge pull request #50 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-de653eece3

build(deps-dev): bump vite from 6.3.3 to 6.3.4 in /electron-app/libs/zwiftmap-main/frontend in the npm_and_yarn group [`(0e23c4c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0e23c4c717c0ad669e56b1c18937359e6cffd9e3)


- *(deps-dev)* [dependency] Update vite [`(19315db)`](https://github.com/Nick2bad4u/FitFileViewer/commit/19315dbbe99675c1ed6c0f6da0b1bcb8607d5d20)


- Merge pull request #40 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/turf/buffer-7.2.0

build(deps): bump @turf/buffer from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/frontend [`(f82f76a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f82f76aed4f8576ce341248b1dbcea50d4773bbe)


- *(deps)* [dependency] Update @turf/buffer [`(09c3577)`](https://github.com/Nick2bad4u/FitFileViewer/commit/09c35777c55bf67ed1c53234f9c82b621a524668)


- Merge pull request #38 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/types/leaflet-1.9.17

build(deps): bump @types/leaflet from 1.9.5 to 1.9.17 in /electron-app/libs/zwiftmap-main/frontend [`(717fa75)`](https://github.com/Nick2bad4u/FitFileViewer/commit/717fa75ee627bc3986103f130c27e9f5586bc2eb)


- *(deps)* [dependency] Update @types/leaflet [`(2b15a12)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2b15a124e1e91286bdf1a2d617114333e0d63685)


- Merge pull request #37 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/turf/length-7.2.0

build(deps): bump @turf/length from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/frontend [`(2d4cb7b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2d4cb7b3a8fa0e9d62a7e6472fbbfc6a6120f039)


- *(deps)* [dependency] Update @turf/length [`(cf9fe0e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/cf9fe0e5c2fcdd3cbb4a9bb2c5ac1fa333f4ffe1)


- Merge pull request #36 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/vitest-3.1.2

build(deps-dev): bump vitest from 2.1.9 to 3.1.2 in /electron-app/libs/zwiftmap-main/frontend [`(4f5e14c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4f5e14c990e32800232e0798ba4036067c46f585)


- *(deps-dev)* [dependency] Update vitest [`(6902ed0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6902ed06fb410a7dccef11c1fa32373dea588334)


- *(deps)* [dependency] Update @turf/buffer [`(b9b3e0f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b9b3e0f85274c8b2f0e3e964bfbb4fc8f2a35bd3)


- Merge PR #47

build(deps): bump the npm-all group in /electron-app/libs/zwiftmap-main/browser-extension with 4 updates [`(5276af4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5276af48ed962371707829a351c57bd9f468f011)


- *(deps)* [dependency] Update the npm-all group [`(153f603)`](https://github.com/Nick2bad4u/FitFileViewer/commit/153f6039644760b9b47a9091c9a519ec2c8a87da)


- *(deps)* [dependency] Update @turf/difference [`(4581fde)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4581fde817c0d701d12702a626ca7844ee298e02)


- *(deps-dev)* [dependency] Update @types/validator [`(22e1b26)`](https://github.com/Nick2bad4u/FitFileViewer/commit/22e1b2602f209fcc4591061757dd18f094bf3592)


- *(deps)* [dependency] Update @turf/length [`(d81250d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d81250d99aca78e657290c60030e3e8df9025710)


- *(deps)* [dependency] Update @sentry/node [`(71931a7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/71931a712d2fe8df2baabf8532c9761e1fa9daa9)


- Merge pull request #28 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/tanstack/react-query-5.74.9

build(deps): bump @tanstack/react-query from 5.66.0 to 5.74.9 in /electron-app/libs/zwiftmap-main/frontend [`(c0d8e59)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c0d8e595af3b6bbb57db24509a235f04defe5a0e)


- *(deps)* [dependency] Update @tanstack/react-query [`(d86310c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d86310ccfb8051eb392f932f89e51d373d105613)


- Merge pull request #25 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/types/chrome-0.0.317

build(deps-dev): bump @types/chrome from 0.0.316 to 0.0.317 in /electron-app/libs/zwiftmap-main/browser-extension [`(6b1c566)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6b1c56621c09c7caede4c68838c5ef5c277bf534)


- *(deps-dev)* [dependency] Update @types/chrome [`(f7df652)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f7df652e33cc8c945ff710779f0c40e976f33e35)


- Merge pull request #23 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/typescript-5.8.3

build(deps-dev): bump typescript from 5.7.3 to 5.8.3 in /electron-app/libs/zwiftmap-main/frontend [`(b138e98)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b138e98051778452f93321fceb60e12e3a516fc3)


- *(deps-dev)* [dependency] Update typescript [`(5bef1f9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5bef1f99dcd1da75c872138e00277c178d53e3ca)


- Merge pull request #22 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/dotenv-16.5.0

build(deps): bump dotenv from 16.4.7 to 16.5.0 in /electron-app/libs/zwiftmap-main/backend [`(a0cf8e4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a0cf8e4b00f3617f885ee7473fe3f088c79ed1be)


- *(deps)* [dependency] Update dotenv in /electron-app/libs/zwiftmap-main/backend [`(e43e6a2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e43e6a28e04bee492df8c68fb967c3a24726cfd9)


- Merge pull request #21 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/esbuild-0.25.3

build(deps-dev): bump esbuild from 0.25.0 to 0.25.3 in /electron-app/libs/zwiftmap-main/browser-extension [`(c7c99d8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c7c99d80a100b2dadfdb50fc0ff4eeca9390b2e0)


- *(deps-dev)* [dependency] Update esbuild [`(e3da0b7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e3da0b7867dd9462f45e60a9d7755ba815855a24)


- Merge pull request #29 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/fast-xml-parser-5.2.1

build(deps): bump fast-xml-parser from 4.5.1 to 5.2.1 in /electron-app/libs/zwiftmap-main/backend [`(942fea0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/942fea08c7a22f78b3b3b55fe8cb5835080bccd4)


- *(deps)* [dependency] Update fast-xml-parser [`(e8acf85)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e8acf85cfc01ff14a5b8d88ea943633c983dd5bb)


- Merge pull request #30 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/types/node-22.15.3

build(deps-dev): bump @types/node from 22.13.0 to 22.15.3 in /electron-app/libs/zwiftmap-main/backend [`(b57f7df)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b57f7df29825459108df635293354a40c94a2a22)


- *(deps-dev)* [dependency] Update @types/node [`(aad952d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/aad952de6fc8328a008f4ae6b045c31c4e97403c)


- Merge pull request #31 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/sentry/react-9.15.0

build(deps): bump @sentry/react from 8.53.0 to 9.15.0 in /electron-app/libs/zwiftmap-main/frontend [`(1ecba53)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1ecba535729c28b45f458c3ee1dda6a6d473f3a1)


- *(deps)* [dependency] Update @sentry/react [`(1fec258)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1fec258a5fa65a83b813438eb8b9eab1755fc644)


- Merge pull request #20 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/google-cloud/secret-manager-6.0.1

build(deps): bump @google-cloud/secret-manager from 5.6.0 to 6.0.1 in /electron-app/libs/zwiftmap-main/backend [`(e6cf64c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e6cf64c5d147038a65e10a94a73c3fe57b0d521c)


- *(deps)* [dependency] Update @google-cloud/secret-manager [`(3b55e3e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3b55e3ea9431fb54fe90800b050b2c6d11ec452a)


- Merge pull request #24 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/zwift-data-1.43.0

build(deps): bump zwift-data from 1.42.0 to 1.43.0 in /electron-app/libs/zwiftmap-main/browser-extension [`(7fa5ad9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7fa5ad93defda3749fa8a26e07d8a4d921d8fce3)


- *(deps)* [dependency] Update zwift-data [`(e4db4c3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e4db4c3409f25ef7f6e6e82594af772175f23d77)


- Merge pull request #26 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/turf/nearest-point-on-line-7.2.0

build(deps): bump @turf/nearest-point-on-line from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend [`(4695f64)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4695f641f4d7243e557b5829998a5ba17fd1b751)


- *(deps)* [dependency] Update @turf/nearest-point-on-line [`(6383274)`](https://github.com/Nick2bad4u/FitFileViewer/commit/638327498cf49f452fa6b8474f9750fc990633cc)


- Merge pull request #32 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/tanstack/react-query-devtools-5.74.9

build(deps): bump @tanstack/react-query-devtools from 5.66.0 to 5.74.9 in /electron-app/libs/zwiftmap-main/frontend [`(4cf2959)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4cf29592f26fee4661ca007c296e2b0e2a8832ed)


- *(deps)* [dependency] Update @tanstack/react-query-devtools [`(849c73c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/849c73c498353f3ef988818dd35e0c70c089c9e7)


- Merge pull request #33 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/multi-1dbe629cdc

build(deps): bump react-dom and @types/react-dom in /electron-app/libs/zwiftmap-main/frontend [`(2a0614b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2a0614babab6547c48b19933cda8e321c9cfd11c)


- *(deps)* [dependency] Update react-dom and @types/react-dom [`(1de9279)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1de9279450ffec958dbdac3ef8d9ffafc0f30946)


- *(deps)* [dependency] Update the npm_and_yarn group across 2 directories with 21 updates [`(80ff77e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/80ff77e4e5bebe3a33c3246b3b273268c71bee1c)



### 🛡️ Security

- Refactor and enhance Electron app functionality

- Added global variable declaration in renderTable.js for jQuery usage.
- Simplified error handling in setupTheme.js by removing the error parameter.
- Improved showFitData.js by refactoring file name handling and UI updates for better readability and performance.
- Updated windowStateUtils.js to include global variable declarations for better compatibility.
- Removed package-lock.json and package.json to streamline dependencies.
- Introduced GitHub Actions workflows for automated greetings, security scanning with Sobelow, style linting, and code linting with Super Linter.
- Added screenfull.min.js library for fullscreen functionality.
- Implemented setupWindow.js to manage window load events and tab interactions more efficiently. [`(a27cf89)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a27cf8946699acf9c65a5799041abce0c653bc3e)




## Contributors
Thanks to all the [contributors](https://github.com/Nick2bad4u/FitFileViewer/graphs/contributors) for their hard work!
## License
This project is licensed under the [MIT License](https://github.com/Nick2bad4u/FitFileViewer/blob/main/LICENSE.md)
*This changelog was automatically generated with [git-cliff](https://github.com/orhun/git-cliff).*
