<!-- markdownlint-disable -->
<!-- eslint-disable markdown/no-missing-label-refs -->
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

[[25c3b5e](https://github.com/Nick2bad4u/FitFileViewer/commit/25c3b5e09fc01799a354e00c97ea827a48a5dfc8)...[19ba8e6](https://github.com/Nick2bad4u/FitFileViewer/commit/19ba8e60f80467e8b8531eaad257c5d95f875ad4)] ([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/25c3b5e09fc01799a354e00c97ea827a48a5dfc8...19ba8e60f80467e8b8531eaad257c5d95f875ad4))

### 💼 Other  
- Update setTimeout callbacks to use function expressions for consistency
[`(19ba8e6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/19ba8e60f80467e8b8531eaad257c5d95f875ad4)

- Refactor and enhance modal functionality; remove unused chart tab, optimize notification delay, and improve theme configurations

- Removed the "chart" tab functionality from the setupWindow.js file.
- Reduced the notification processing delay from 200ms to 50ms in showNotification.js.
- Updated theme.js to adjust surface color opacity and added new color zones for various functionalities.
- Modified toggleTabVisibility.js to exclude the "content-chart" from the tab content IDs.
- Fixed import path for throttledAnimLog in updateChartAnimations.js.
- Added new utility functions for about modal management, including ensureAboutModal.js, loadVersionInfo.js, updateSystemInfo.js, and injectModalStyles.js.
- Implemented a throttled animation logging utility in lastAnimLog.js for better performance during development.
- Created exportAllCharts.js to handle exporting multiple charts with notifications for success or failure.
[`(d5c18e4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d5c18e4b82598d1df4a24aca265504a0bbf52af3)


## [22.1.0] - 2025-06-14

[[21bf6c1](https://github.com/Nick2bad4u/FitFileViewer/commit/21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034)...[25c3b5e](https://github.com/Nick2bad4u/FitFileViewer/commit/25c3b5e09fc01799a354e00c97ea827a48a5dfc8)] ([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034...25c3b5e09fc01799a354e00c97ea827a48a5dfc8))

### 💼 Other  
- Standardizes YAML, JSON, and config formatting across repo

Improves consistency by normalizing quotes, indentation, and
key/value styles in all GitHub Actions workflows, project config,
and markdown files. Adds Prettier ignore rules, updates settings,
and syncs formatting to reduce lint noise and tooling friction.

Prepares for cleaner future diffs and better cross-platform collaboration.
[`(25c3b5e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/25c3b5e09fc01799a354e00c97ea827a48a5dfc8)


## [22.0.0] - 2025-06-14

[[5debf80](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)...[21bf6c1](https://github.com/Nick2bad4u/FitFileViewer/commit/21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034)] ([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/5debf805345db114c8a0ff6749ae0be9c5818ee5...21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034))

### 🚀 Features  
- *(theme)* Enhance theme management with auto mode and smooth transitions
- Introduced THEME_MODES constant for better theme handling.
- Added support for 'auto' theme mode that adapts to system preferences.
- Implemented smooth transitions for theme changes with CSS animations.
- Created utility functions for toggling themes and listening to system theme changes.
- Enhanced theme persistence and event dispatching for theme changes.
- Updated meta theme-color for mobile browsers based on the current theme.
- Added a function to initialize the theme system on application load.
- Provided a configuration object for external libraries to access theme details.
[`(9411374)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9411374418655f6be63e2d0c2c11b9e520d9541b)


### 💼 Other  
- Run Prettier on all Files.
[`(21bf6c1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034)

- Revamps Chart.js integration with advanced controls and exports

Overhauls the chart rendering system to add a modern, toggleable controls panel, advanced export and sharing options (PNG, CSV, JSON, ZIP, clipboard, Imgur), and improved accessibility and error handling. Introduces support for zone data visualization, lap analysis charts, and professional styling with theme-aware design. Optimizes performance, code structure, and user feedback for a richer FIT file data experience.

Fixes chart layout, enhances maintainability, and prepares for future extensibility.
[`(f852b00)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f852b00b5b566dd1b1126cf0dfa108b96a425a46)

- Improves Linux menu handling and adds menu injection support

Refactors Linux menu logic to remove minimal menu fallback and enhance menu initialization logging for better troubleshooting.
Introduces a DevTools-accessible function to manually inject or reset the application menu from the renderer, streamlining menu debugging and development workflow.
Simplifies theme synchronization and adds safeguards to prevent invalid menu setups, improving stability and UI consistency across platforms.
[`(43dee75)`](https://github.com/Nick2bad4u/FitFileViewer/commit/43dee75c0ea2854e268bd89d97581101dae59e4c)

- Refactors menu theme sync and adds menu setup safeguards

Simplifies menu theme handling by removing redundant logic and updating the menu only after renderer load for better sync. Adds safety checks and debug logging to prevent setting invalid or empty application menus, improving stability and troubleshooting of menu initialization.

Streamlines menu theme sync and adds menu safety checks

Simplifies theme synchronization by removing redundant menu update logic and ensuring menus are set only after renderer load for improved UI consistency. Adds debug logging and template validation to prevent invalid or empty menu setups, aiding stability and troubleshooting.
[`(aea7282)`](https://github.com/Nick2bad4u/FitFileViewer/commit/aea7282b428ca2ef68ce33c5c3907e224b368e2a)


### 🛡️ Security  
- Improves Linux menu logic and adds menu injection support

Refactors Linux menu handling to remove the minimal menu fallback and adds enhanced logging for improved troubleshooting. Introduces a DevTools-accessible function allowing manual injection or reset of the application menu from the renderer, making menu debugging and development more efficient. Streamlines theme synchronization and implements safeguards to prevent invalid menu setups, boosting stability and UI consistency across platforms.

Also bumps version to 20.5.0 and updates npm dependencies, including a major Jest upgrade and multiple minor and patch updates, enhancing overall security and reliability.
[`(aae539e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/aae539eeb94eef693613b973fcac471d1b78690b)

- Streamlines workflows, settings, and updates versioning

Refactors repository workflows for improved metrics and Flatpak
builds, replaces settings storage to reduce dependencies, and
enhances UI consistency across platforms. Updates auto-update
handling and Linux messaging, clarifies documentation, and bumps
version to 19.7.0. Improves security by updating GitHub Actions
dependencies.
[`(62e5f5e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/62e5f5e3f578560be51d00761c2f28aa52ee9250)


## [19.0.0] - 2025-06-07

[[f7f3de8](https://github.com/Nick2bad4u/FitFileViewer/commit/f7f3de831c09658b6c78e414fd7ab27d148baed9)...[5debf80](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)] ([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/f7f3de831c09658b6c78e414fd7ab27d148baed9...5debf805345db114c8a0ff6749ae0be9c5818ee5))

### 🚀 Features  
- Update GitHub workflows with concurrency settings and add new badges to README
- Added concurrency settings to scorecards, sitemap, stale, stylelint, summary, vscode-version workflows.
- Removed deprecated trugglehog workflow and added a new one for TruffleHog Secret Scan.
- Updated README.md to include new badges for various workflows including Build, DevSkim, Electronegativity Scan, and others.
- Updated superlinter configuration to exclude sitemap.xml from linting.
- [dependency] Updateed version in package-lock.json and package.json to 8.5.0 and added new dev dependency for ESLint formatter.
- Introduced generate-prettier-sarif.js script to convert Prettier output to SARIF format.
- Added sample prettier-output.txt for testing the SARIF generation script.
[`(4ec7375)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4ec7375d9152866d92948135f2bc85f4588b0028)

- Update GitHub workflows for improved linting and scanning processes
[`(c7e0304)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c7e030415cf69e25ba5674b857b87058ec44247b)


### 🔀 Merge Commits  
- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer
[`(6fbade0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6fbade08a71ac0bb93bc39fa316b6d11514e0530)


### 💼 Other  
- Enhance workflows and documentation for Flatpak build process, including versioning updates and new download options
[`(5debf80)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)

- Update changelogs and version numbers for releases 16.4.0, 16.5.0, and 16.6.0; enhance GitHub Actions and implement release cleanup script
[`(24a9a97)`](https://github.com/Nick2bad4u/FitFileViewer/commit/24a9a97718f3058e1b0a537d7e41096386388202)

- Update changelogs and scripts: Add new version numbers, enhance GitHub Actions, and implement release cleanup script
[`(8593346)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8593346c7d028dc0a02661bcdf9b353846e99e9d)

- Refactor code structure and improve readability; no functional changes made.
Removed a ton of un-needed files.
[`(077d18c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/077d18cdbfa39b9c68b8e86abdcfbe6e9d101c15)

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
[`(6a3864f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6a3864fef2ec99526e7ce10cad8db863a66dbb12)

- Refactor code structure and remove redundant sections for improved readability and maintainability
[`(85ec8d0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/85ec8d0b188bec04e99ea841b2239bc20229bef3)


### ⚙️ Miscellaneous Tasks  
- Update changelogs and scripts for versioning and GitHub Actions enhancements
[`(1fc3c44)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1fc3c44efbc84701690e71b9c43ab2d510bfe15a)

- Update changelogs and scripts for versioning and GitHub Actions enhancements
[`(27471d3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/27471d38f7b7749f7b57665551aeb8696b5fbcbe)

- Add changelog files for electron-app, tests, and utils
- Created CHANGELOG.md for electron-app/screenshots documenting notable changes including enhancements to charts and libraries integration, and updates to dependencies.
- Added CHANGELOG.md for electron-app/tests detailing the addition of Vitest and Stylelint configuration files.
- Introduced CHANGELOG.md for electron-app/utils with extensive updates on UI robustness, event handling, and security improvements, along with numerous feature enhancements and refactoring efforts across multiple versions.
[`(b9d2e0a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b9d2e0a4df3224672415510d505e98054a593934)

- Update GitHub Actions workflows and dependencies; fix badge link in README
[`(c401c26)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c401c26b48c572958c7a8cb8a3e58fd556c88d12)


### 📦 Dependencies  
- Merge pull request #92 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-2f20eee292

[dependency] Update the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 1 update
[`(0f19a8b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0f19a8b4a7075920959ef7b850a02d2847627a88)

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

Signed-off-by: dependabot[bot] <support@github.com>
[`(63781ba)`](https://github.com/Nick2bad4u/FitFileViewer/commit/63781bae41cd85498120d205b5567c8b3ca7d7bb)

- Merge pull request #81 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/npm-all-8289ba21ba

[dependency] Update the npm-all group in /electron-app/libs/zwiftmap-main/browser-extension with 29 updates
[`(fe8d700)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fe8d7002fb62202a43ca2629c17dd5e4cac74ccf)

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

Signed-off-by: dependabot[bot] <support@github.com>
[`(4b99ffb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4b99ffbcc4e4b64e0068db309a5ba8b6e2c958f5)

- Merge pull request #82 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/npm-all-3319742fda

[dependency] Update the npm-all group in /electron-app/libs/zwiftmap-main/backend with 34 updates
[`(d0fdef4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d0fdef4913d2cbb774c68000366779de6042a304)

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

Signed-off-by: dependabot[bot] <support@github.com>
[`(77b452e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/77b452e5354a0d812ecf09a90844ccf6e9f05eb3)

- Merge pull request #79 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-0523d757ec

[dependency] Update the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 2 updates
[`(f7edef8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f7edef872e5c64e12b5d6e098b4c7848ab77c599)

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

Signed-off-by: dependabot[bot] <support@github.com>
[`(f22c16d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f22c16d54b66a5503bdaa88877d2c066e45d9af8)


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
- Created enableTabButtons.js utility to manage tab button states.
[`(ccacc58)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ccacc58627a7877220fa43fd16da97a3f9db74d2)


## [8.0.0] - 2025-05-07

[[1a61d0e](https://github.com/Nick2bad4u/FitFileViewer/commit/1a61d0ed75293d109c66c84369d708fcfe8e9591)...[f7f3de8](https://github.com/Nick2bad4u/FitFileViewer/commit/f7f3de831c09658b6c78e414fd7ab27d148baed9)] ([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/1a61d0ed75293d109c66c84369d708fcfe8e9591...f7f3de831c09658b6c78e414fd7ab27d148baed9))

### 🚀 Features  
- Add listener for decoder options changes and update data table
- Implemented an IPC listener to handle changes in decoder options from the main process.
- On receiving new options, a notification is displayed to the user.
- If a file is currently loaded, the application re-reads and re-parses the file to update the data table.
- Added error handling for file reading and parsing processes.
[`(236b7ae)`](https://github.com/Nick2bad4u/FitFileViewer/commit/236b7ae7449a7424ae74e4e969dca624b192a62e)

- Unify file open logic and ensure both readers update from all sources
Removed duplicate file open handlers to prevent double file dialogs.
Centralized file open logic in renderer.js; now handles file selection from button, app menu, and recent files.
Ensured both the main FIT reader and Alt FIT Reader iframe receive the selected file from all open methods.
Fixed right-click recent files and app menu "Open..." so both readers update consistently.
Improved user experience by only requiring a single file selection for all readers.
[`(b4a5fa1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b4a5fa18762b02e939708dcdd8ec0c1acaa8d82d)

- Add core files for FIT File Viewer application
- Implemented useMeasure hook for responsive measurements in assets/useMeasure-Df3vRnzU.js.
- Added waypoint icons sprite in assets/waypoint_icons_sprite-Dqa_dKt2.js.
- Created index.html for the main application structure, including meta tags and linking assets.
- Developed manifest.json for Progressive Web App (PWA) configuration, including app icons and display settings.
[`(194d975)`](https://github.com/Nick2bad4u/FitFileViewer/commit/194d975ac042f443bdbe18d918f9880d1f230271)

- Implement FIT reader library with core functionalities
- Add datetime utility functions for handling FIT timestamps.
- Introduce bit manipulation utility for extracting bits from bytes.
- Create field data extraction logic to handle field descriptions and definitions.
- Develop main FIT reader function to parse FIT files and return global data.
- Implement validation for invalid values based on FIT protocol specifications.
- Add utility for generating arrays of specified length.
- Create named fields mapping function to associate field definitions with values.
- Implement data reading logic to process binary data from FIT files.
- Add definition reading functionality to parse message definitions from FIT files.
- Implement file header reading logic to validate and extract header information.
- Create record header reading functionality to handle different record types in FIT files.
[`(70da6da)`](https://github.com/Nick2bad4u/FitFileViewer/commit/70da6dadb7c3ba252b5dcb7cbe6bfabfce9edf0a)

- Add custom map type selection button and zoom slider for enhanced user interaction
[`(e38d3f7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e38d3f7ac05c1a118f06f1ac53e37f37772dc561)

- Implement feed entries fetching and image replacement for Zwift map extension
- Added functionality to create Chrome and Firefox extensions with packaging scripts.
- Developed a feed entries fetcher to handle pagination and data retrieval for dashboard, club, and profile feeds.
- Introduced utility functions for managing image replacements based on activity types.
- Created a global type definition file for better TypeScript support.
- Integrated Leaflet map overlays for Zwift worlds.
- Implemented a request utility for handling API calls with CSRF token management.
- Set up the main script to initialize feed and Leaflet functionalities.
[`(7fa1685)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7fa1685983dab707b3f299cac7b6d41b8918cb30)


### 🐛 Bug Fixes  
- Update vite version to 6.3.4; enhance measurement tool UI with SVG icons and add GPX export functionality
[`(47e4081)`](https://github.com/Nick2bad4u/FitFileViewer/commit/47e4081ac773f830c2a3025cb4eeb3e925434339)


### 💼 Other  
- Add Vitest configuration and Stylelint configuration files

- Created vitest.config.js to set up testing environment with jsdom and specified setup files.
- Added stylelint.config.js to enforce standard stylelint rules, including preventing empty blocks.
[`(f7f3de8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f7f3de831c09658b6c78e414fd7ab27d148baed9)

- Remove unused FIT reader utility functions and related code

- Deleted datetime.js, getBits.js, getFieldData.js, index.js, isInvalid.js, nTimes.js, namedFields.js, readData.js, readDefinition.js, readFileHeader.js, and readRecordHeader.js.
- These files contained functions and logic that are no longer needed in the FIT reader implementation.
- This cleanup helps streamline the codebase and improve maintainability.
[`(21d4380)`](https://github.com/Nick2bad4u/FitFileViewer/commit/21d4380e29e10ec83be9edd34b5ac57f58a6da59)

- Merge PR #42

build(deps): bump @turf/buffer from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend
[`(46bbbf0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/46bbbf0b8e607fdf43287bf05930139777c22670)

- Merge PR #43

build(deps): bump @turf/difference from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend
[`(3eeab68)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3eeab68721b8163cc093eee517843b49b7534c86)

- Merge PR #44

build(deps-dev): bump @types/validator from 13.12.2 to 13.15.0 in /electron-app/libs/zwiftmap-main/backend
[`(e2c8f21)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e2c8f21a21ff9ea258121febcaa605008af8d0d8)

- Merge PR #45

build(deps): bump @turf/length from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend
[`(ceaad0c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ceaad0c160d4edcbe60f0f58588ea756d5534849)

- Merge PR #46

build(deps): bump @sentry/node from 8.53.0 to 9.15.0 in /electron-app/libs/zwiftmap-main/backend
[`(9ee9418)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9ee9418e2731c821d7b4f3639e05b532ce396d29)

- Refactor code structure for improved readability and maintainability
[`(88e148c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/88e148c7504be074165b837e32c5106784533367)

- Merge PR #15

build(deps): bump the npm_and_yarn group across 2 directories with 21 updates
[`(a9a6dbf)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a9a6dbfdbf6f306556ffb9524e16a0fea657af25)

- Refactor code structure and remove redundant sections for improved readability and maintainability
[`(e9edc96)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e9edc96add46c5b3c36e3c45875348fa19797ace)

- Delete 34 files
[`(bd197e2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/bd197e2a1259499db9f1169a771461956d4c47dd)

- Fix path to Chart.js library in renderMap function for elevation profile chart
[`(a469870)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a469870f4989ed5a0436c9986acf939cf97ce006)

- Refactor code structure for improved readability and maintainability
[`(2c36135)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2c361351eea58127515e76586589728407410b6c)


### 🎨 Styling  
- Clean up CSS formatting and organization for improved readability
[`(bc46c8d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/bc46c8d68c2462dda976d9cfd5f199adb84fa0ac)


### ⚙️ Miscellaneous Tasks  
- Update Babel dependencies to version 7.27.1
[`(fbeb156)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fbeb156ccc108c5f1e3e5a9090080aca534fd2b8)


### 📦 Dependencies  
- Merge pull request #56 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/npm-all-ccf39fe968

build(deps-dev): bump @types/chrome from 0.0.317 to 0.0.318 in /electron-app/libs/zwiftmap-main/browser-extension in the npm-all group
[`(cee5a22)`](https://github.com/Nick2bad4u/FitFileViewer/commit/cee5a22c7faa70ae3a646f753d19d7c36a7b10ef)

- *(deps-dev)* [dependency] Update @types/chrome
[dependency] Updates the npm-all group in /electron-app/libs/zwiftmap-main/browser-extension with 1 update: [@types/chrome](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/chrome).


Updates `@types/chrome` from 0.0.317 to 0.0.318
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/chrome)

---
updated-dependencies:
- dependency-name: "@types/chrome"
  dependency-version: 0.0.318
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
...
[`(a59337b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a59337b63b93eac6efc95e0b23046b7baf8f81d4)

- Merge pull request #54 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/npm-all-4c4c415551

build(deps): bump the npm-all group in /electron-app/libs/zwiftmap-main/backend with 56 updates
[`(531bf14)`](https://github.com/Nick2bad4u/FitFileViewer/commit/531bf1469a478452eba20dd338009a07510ca70c)

- *(deps)* [dependency] Update the npm-all group
[dependency] Update npm dependencies:

| Package | From | To |
| --- | --- | --- |
| [@google-cloud/storage](https://github.com/googleapis/nodejs-storage) | `7.15.0` | `7.16.0` |
| [@turf/bbox-polygon](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [@turf/boolean-point-in-polygon](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [@turf/distance](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [@turf/helpers](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [@turf/point-to-line-distance](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [axios](https://github.com/axios/axios) | `1.8.2` | `1.9.0` |
| [compression](https://github.com/expressjs/compression) | `1.7.5` | `1.8.0` |
| [runtypes](https://github.com/runtypes/runtypes) | `6.7.0` | `7.0.4` |
| [sharp](https://github.com/lovell/sharp) | `0.33.5` | `0.34.1` |
| [zwift-data](https://github.com/andipaetzold/zwift-data) | `1.42.0` | `1.43.0` |
| [typescript](https://github.com/microsoft/TypeScript) | `5.7.3` | `5.8.3` |
| [@babel/code-frame](https://github.com/babel/babel/tree/HEAD/packages/babel-code-frame) | `7.26.2` | `7.27.1` |
| [@babel/helper-validator-identifier](https://github.com/babel/babel/tree/HEAD/packages/babel-helper-validator-identifier) | `7.25.9` | `7.27.1` |
| [@emnapi/runtime](https://github.com/toyobayashi/emnapi) | `1.3.1` | `1.4.3` |
| [gcp-metadata](https://github.com/googleapis/gcp-metadata) | `6.1.0` | `6.1.1` |
| [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs) | `9.15.0` | `9.15.1` |
| [google-gax](https://github.com/googleapis/gax-nodejs/tree/HEAD/gax) | `4.4.1` | `4.6.0` |
| [@grpc/proto-loader](https://github.com/grpc/grpc-node) | `0.7.13` | `0.7.15` |
| [@img/sharp-darwin-arm64](https://github.com/lovell/sharp/tree/HEAD/npm/darwin-arm64) | `0.33.5` | `0.34.1` |
| [@img/sharp-darwin-x64](https://github.com/lovell/sharp/tree/HEAD/npm/darwin-x64) | `0.33.5` | `0.34.1` |
| [@img/sharp-libvips-darwin-arm64](https://github.com/lovell/sharp-libvips/tree/HEAD/npm/darwin-arm64) | `1.0.4` | `1.1.0` |
| [@img/sharp-libvips-darwin-x64](https://github.com/lovell/sharp-libvips/tree/HEAD/npm/darwin-x64) | `1.0.4` | `1.1.0` |
| [@img/sharp-libvips-linux-arm](https://github.com/lovell/sharp-libvips/tree/HEAD/npm/linux-arm) | `1.0.5` | `1.1.0` |
| [@img/sharp-libvips-linux-arm64](https://github.com/lovell/sharp-libvips/tree/HEAD/npm/linux-arm64) | `1.0.4` | `1.1.0` |
| [@img/sharp-libvips-linux-s390x](https://github.com/lovell/sharp-libvips/tree/HEAD/npm/linux-s390x) | `1.0.4` | `1.1.0` |
| [@img/sharp-libvips-linux-x64](https://github.com/lovell/sharp-libvips/tree/HEAD/npm/linux-x64) | `1.0.4` | `1.1.0` |
| [@img/sharp-libvips-linuxmusl-arm64](https://github.com/lovell/sharp-libvips/tree/HEAD/npm/linuxmusl-arm64) | `1.0.4` | `1.1.0` |
| [@img/sharp-libvips-linuxmusl-x64](https://github.com/lovell/sharp-libvips/tree/HEAD/npm/linuxmusl-x64) | `1.0.4` | `1.1.0` |
| [@img/sharp-linux-arm](https://github.com/lovell/sharp/tree/HEAD/npm/linux-arm) | `0.33.5` | `0.34.1` |
| [@img/sharp-linux-arm64](https://github.com/lovell/sharp/tree/HEAD/npm/linux-arm64) | `0.33.5` | `0.34.1` |
| [@img/sharp-linux-s390x](https://github.com/lovell/sharp/tree/HEAD/npm/linux-s390x) | `0.33.5` | `0.34.1` |
| [@img/sharp-linux-x64](https://github.com/lovell/sharp/tree/HEAD/npm/linux-x64) | `0.33.5` | `0.34.1` |
| [@img/sharp-linuxmusl-arm64](https://github.com/lovell/sharp/tree/HEAD/npm/linuxmusl-arm64) | `0.33.5` | `0.34.1` |
| [@img/sharp-linuxmusl-x64](https://github.com/lovell/sharp/tree/HEAD/npm/linuxmusl-x64) | `0.33.5` | `0.34.1` |
| [@img/sharp-wasm32](https://github.com/lovell/sharp/tree/HEAD/npm/wasm32) | `0.33.5` | `0.34.1` |
| [@img/sharp-win32-ia32](https://github.com/lovell/sharp/tree/HEAD/npm/win32-ia32) | `0.33.5` | `0.34.1` |
| [@img/sharp-win32-x64](https://github.com/lovell/sharp/tree/HEAD/npm/win32-x64) | `0.33.5` | `0.34.1` |
| [@turf/meta](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [@turf/bearing](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [@turf/clone](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [@turf/projection](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [@turf/invariant](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [@turf/rhumb-bearing](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [@turf/rhumb-distance](https://github.com/Turfjs/turf) | `6.5.0` | `7.2.0` |
| [@types/lodash](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/lodash) | `4.17.13` | `4.17.16` |
| [form-data](https://github.com/form-data/form-data) | `2.5.2` | `2.5.3` |
| [bignumber.js](https://github.com/MikeMcl/bignumber.js) | `9.1.2` | `9.3.0` |
| [detect-libc](https://github.com/lovell/detect-libc) | `2.0.3` | `2.0.4` |
| [google-logging-utils](https://github.com/googleapis/gax-nodejs/tree/HEAD/logging-utils) | `1.1.1` | `0.0.2` |
| [html-entities](https://github.com/mdevils/html-entities) | `2.5.2` | `2.6.0` |
| [is-core-module](https://github.com/inspect-js/is-core-module) | `2.15.1` | `2.16.1` |
| [long](https://github.com/dcodeIO/long.js) | `5.2.3` | `5.3.2` |
| [protobufjs](https://github.com/protobufjs/protobuf.js) | `7.4.0` | `7.5.0` |
| [resolve](https://github.com/browserify/resolve) | `1.22.8` | `1.22.10` |
| [spdx-license-ids](https://github.com/jslicense/spdx-license-ids) | `3.0.20` | `3.0.21` |


Updates `@google-cloud/storage` from 7.15.0 to 7.16.0
- [Release notes](https://github.com/googleapis/nodejs-storage/releases)
- [Changelog](https://github.com/googleapis/nodejs-storage/blob/main/CHANGELOG.md)
- [Commits](https://github.com/googleapis/nodejs-storage/compare/v7.15.0...v7.16.0)

Updates `@turf/bbox-polygon` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `@turf/boolean-point-in-polygon` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `@turf/distance` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `@turf/helpers` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `@turf/point-to-line-distance` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `axios` from 1.8.2 to 1.9.0
- [Release notes](https://github.com/axios/axios/releases)
- [Changelog](https://github.com/axios/axios/blob/v1.x/CHANGELOG.md)
- [Commits](https://github.com/axios/axios/compare/v1.8.2...v1.9.0)

Updates `compression` from 1.7.5 to 1.8.0
- [Release notes](https://github.com/expressjs/compression/releases)
- [Changelog](https://github.com/expressjs/compression/blob/master/HISTORY.md)
- [Commits](https://github.com/expressjs/compression/compare/1.7.5...1.8.0)

Updates `runtypes` from 6.7.0 to 7.0.4
- [Release notes](https://github.com/runtypes/runtypes/releases)
- [Commits](https://github.com/runtypes/runtypes/compare/v6.7.0...v7.0.4)

Updates `sharp` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/compare/v0.33.5...v0.34.1)

Updates `zwift-data` from 1.42.0 to 1.43.0
- [Release notes](https://github.com/andipaetzold/zwift-data/releases)
- [Changelog](https://github.com/andipaetzold/zwift-data/blob/main/CHANGELOG.md)
- [Commits](https://github.com/andipaetzold/zwift-data/compare/v1.42.0...v1.43.0)

Updates `typescript` from 5.7.3 to 5.8.3
- [Release notes](https://github.com/microsoft/TypeScript/releases)
- [Changelog](https://github.com/microsoft/TypeScript/blob/main/azure-pipelines.release-publish.yml)
- [Commits](https://github.com/microsoft/TypeScript/compare/v5.7.3...v5.8.3)

Updates `@babel/code-frame` from 7.26.2 to 7.27.1
- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.1/packages/babel-code-frame)

Updates `@babel/helper-validator-identifier` from 7.25.9 to 7.27.1
- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.1/packages/babel-helper-validator-identifier)

Updates `@emnapi/runtime` from 1.3.1 to 1.4.3
- [Release notes](https://github.com/toyobayashi/emnapi/releases)
- [Commits](https://github.com/toyobayashi/emnapi/compare/v1.3.1...v1.4.3)

Updates `gcp-metadata` from 6.1.0 to 6.1.1
- [Release notes](https://github.com/googleapis/gcp-metadata/releases)
- [Changelog](https://github.com/googleapis/gcp-metadata/blob/v6.1.1/CHANGELOG.md)
- [Commits](https://github.com/googleapis/gcp-metadata/compare/v6.1.0...v6.1.1)

Updates `google-auth-library` from 9.15.0 to 9.15.1
- [Release notes](https://github.com/googleapis/google-auth-library-nodejs/releases)
- [Changelog](https://github.com/googleapis/google-auth-library-nodejs/blob/main/CHANGELOG.md)
- [Commits](https://github.com/googleapis/google-auth-library-nodejs/compare/v9.15.0...v9.15.1)

Updates `google-gax` from 4.4.1 to 4.6.0
- [Release notes](https://github.com/googleapis/gax-nodejs/releases)
- [Changelog](https://github.com/googleapis/gax-nodejs/blob/main/gax/CHANGELOG.md)
- [Commits](https://github.com/googleapis/gax-nodejs/commits/google-gax-v4.6.0/gax)

Updates `@grpc/proto-loader` from 0.7.13 to 0.7.15
- [Release notes](https://github.com/grpc/grpc-node/releases)
- [Commits](https://github.com/grpc/grpc-node/compare/@grpc/proto-loader@0.7.13...@grpc/proto-loader@0.7.15)

Updates `@img/sharp-darwin-arm64` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.1/npm/darwin-arm64)

Updates `@img/sharp-darwin-x64` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.1/npm/darwin-x64)

Updates `@img/sharp-libvips-darwin-arm64` from 1.0.4 to 1.1.0
- [Release notes](https://github.com/lovell/sharp-libvips/releases)
- [Commits](https://github.com/lovell/sharp-libvips/commits/HEAD/npm/darwin-arm64)

Updates `@img/sharp-libvips-darwin-x64` from 1.0.4 to 1.1.0
- [Release notes](https://github.com/lovell/sharp-libvips/releases)
- [Commits](https://github.com/lovell/sharp-libvips/commits/HEAD/npm/darwin-x64)

Updates `@img/sharp-libvips-linux-arm` from 1.0.5 to 1.1.0
- [Release notes](https://github.com/lovell/sharp-libvips/releases)
- [Commits](https://github.com/lovell/sharp-libvips/commits/HEAD/npm/linux-arm)

Updates `@img/sharp-libvips-linux-arm64` from 1.0.4 to 1.1.0
- [Release notes](https://github.com/lovell/sharp-libvips/releases)
- [Commits](https://github.com/lovell/sharp-libvips/commits/HEAD/npm/linux-arm64)

Updates `@img/sharp-libvips-linux-s390x` from 1.0.4 to 1.1.0
- [Release notes](https://github.com/lovell/sharp-libvips/releases)
- [Commits](https://github.com/lovell/sharp-libvips/commits/HEAD/npm/linux-s390x)

Updates `@img/sharp-libvips-linux-x64` from 1.0.4 to 1.1.0
- [Release notes](https://github.com/lovell/sharp-libvips/releases)
- [Commits](https://github.com/lovell/sharp-libvips/commits/HEAD/npm/linux-x64)

Updates `@img/sharp-libvips-linuxmusl-arm64` from 1.0.4 to 1.1.0
- [Release notes](https://github.com/lovell/sharp-libvips/releases)
- [Commits](https://github.com/lovell/sharp-libvips/commits/HEAD/npm/linuxmusl-arm64)

Updates `@img/sharp-libvips-linuxmusl-x64` from 1.0.4 to 1.1.0
- [Release notes](https://github.com/lovell/sharp-libvips/releases)
- [Commits](https://github.com/lovell/sharp-libvips/commits/HEAD/npm/linuxmusl-x64)

Updates `@img/sharp-linux-arm` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.1/npm/linux-arm)

Updates `@img/sharp-linux-arm64` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.1/npm/linux-arm64)

Updates `@img/sharp-linux-s390x` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.1/npm/linux-s390x)

Updates `@img/sharp-linux-x64` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.1/npm/linux-x64)

Updates `@img/sharp-linuxmusl-arm64` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.1/npm/linuxmusl-arm64)

Updates `@img/sharp-linuxmusl-x64` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.1/npm/linuxmusl-x64)

Updates `@img/sharp-wasm32` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.1/npm/wasm32)

Updates `@img/sharp-win32-ia32` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.1/npm/win32-ia32)

Updates `@img/sharp-win32-x64` from 0.33.5 to 0.34.1
- [Release notes](https://github.com/lovell/sharp/releases)
- [Commits](https://github.com/lovell/sharp/commits/v0.34.1/npm/win32-x64)

Updates `@turf/meta` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `@turf/bearing` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `@turf/clone` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `@turf/projection` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `@turf/invariant` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `@turf/rhumb-bearing` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `@turf/rhumb-distance` from 6.5.0 to 7.2.0
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

Updates `@types/lodash` from 4.17.13 to 4.17.16
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/lodash)

Updates `form-data` from 2.5.2 to 2.5.3
- [Release notes](https://github.com/form-data/form-data/releases)
- [Commits](https://github.com/form-data/form-data/compare/v2.5.2...v2.5.3)

Updates `bignumber.js` from 9.1.2 to 9.3.0
- [Release notes](https://github.com/MikeMcl/bignumber.js/releases)
- [Changelog](https://github.com/MikeMcl/bignumber.js/blob/main/CHANGELOG.md)
- [Commits](https://github.com/MikeMcl/bignumber.js/compare/v9.1.2...v9.3.0)

Updates `detect-libc` from 2.0.3 to 2.0.4
- [Commits](https://github.com/lovell/detect-libc/compare/v2.0.3...v2.0.4)

Updates `google-logging-utils` from 1.1.1 to 0.0.2
- [Release notes](https://github.com/googleapis/gax-nodejs/releases)
- [Changelog](https://github.com/googleapis/gax-nodejs/blob/main/logging-utils/CHANGELOG.md)
- [Commits](https://github.com/googleapis/gax-nodejs/commits/HEAD/logging-utils)

Updates `html-entities` from 2.5.2 to 2.6.0
- [Release notes](https://github.com/mdevils/html-entities/releases)
- [Changelog](https://github.com/mdevils/html-entities/blob/main/CHANGELOG.md)
- [Commits](https://github.com/mdevils/html-entities/compare/v2.5.2...v2.6.0)

Updates `is-core-module` from 2.15.1 to 2.16.1
- [Changelog](https://github.com/inspect-js/is-core-module/blob/main/CHANGELOG.md)
- [Commits](https://github.com/inspect-js/is-core-module/compare/v2.15.1...v2.16.1)

Updates `long` from 5.2.3 to 5.3.2
- [Release notes](https://github.com/dcodeIO/long.js/releases)
- [Commits](https://github.com/dcodeIO/long.js/compare/v5.2.3...v5.3.2)

Updates `protobufjs` from 7.4.0 to 7.5.0
- [Release notes](https://github.com/protobufjs/protobuf.js/releases)
- [Changelog](https://github.com/protobufjs/protobuf.js/blob/master/CHANGELOG.md)
- [Commits](https://github.com/protobufjs/protobuf.js/compare/protobufjs-v7.4.0...protobufjs-v7.5.0)

Updates `resolve` from 1.22.8 to 1.22.10
- [Commits](https://github.com/browserify/resolve/compare/v1.22.8...v1.22.10)

Updates `spdx-license-ids` from 3.0.20 to 3.0.21
- [Commits](https://github.com/jslicense/spdx-license-ids/compare/v3.0.20...v3.0.21)

---
updated-dependencies:
- dependency-name: "@google-cloud/storage"
  dependency-version: 7.16.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@turf/bbox-polygon"
  dependency-version: 7.2.0
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@turf/boolean-point-in-polygon"
  dependency-version: 7.2.0
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@turf/distance"
  dependency-version: 7.2.0
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@turf/helpers"
  dependency-version: 7.2.0
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@turf/point-to-line-distance"
  dependency-version: 7.2.0
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: axios
  dependency-version: 1.9.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: compression
  dependency-version: 1.8.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: runtypes
  dependency-version: 7.0.4
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: sharp
  dependency-version: 0.34.1
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: zwift-data
  dependency-version: 1.43.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: typescript
  dependency-version: 5.8.3
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@babel/code-frame"
  dependency-version: 7.27.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@babel/helper-validator-identifier"
  dependency-version: 7.27.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@emnapi/runtime"
  dependency-version: 1.4.3
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: gcp-metadata
  dependency-version: 6.1.1
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: google-auth-library
  dependency-version: 9.15.1
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: google-gax
  dependency-version: 4.6.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@grpc/proto-loader"
  dependency-version: 0.7.15
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@img/sharp-darwin-arm64"
  dependency-version: 0.34.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-darwin-x64"
  dependency-version: 0.34.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-libvips-darwin-arm64"
  dependency-version: 1.1.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-libvips-darwin-x64"
  dependency-version: 1.1.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-libvips-linux-arm"
  dependency-version: 1.1.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-libvips-linux-arm64"
  dependency-version: 1.1.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-libvips-linux-s390x"
  dependency-version: 1.1.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-libvips-linux-x64"
  dependency-version: 1.1.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-libvips-linuxmusl-arm64"
  dependency-version: 1.1.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-libvips-linuxmusl-x64"
  dependency-version: 1.1.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-linux-arm"
  dependency-version: 0.34.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-linux-arm64"
  dependency-version: 0.34.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-linux-s390x"
  dependency-version: 0.34.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-linux-x64"
  dependency-version: 0.34.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-linuxmusl-arm64"
  dependency-version: 0.34.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-linuxmusl-x64"
  dependency-version: 0.34.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-wasm32"
  dependency-version: 0.34.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-win32-ia32"
  dependency-version: 0.34.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@img/sharp-win32-x64"
  dependency-version: 0.34.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: "@turf/meta"
  dependency-version: 7.2.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@turf/bearing"
  dependency-version: 7.2.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@turf/clone"
  dependency-version: 7.2.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@turf/projection"
  dependency-version: 7.2.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@turf/invariant"
  dependency-version: 7.2.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@turf/rhumb-bearing"
  dependency-version: 7.2.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@turf/rhumb-distance"
  dependency-version: 7.2.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: "@types/lodash"
  dependency-version: 4.17.16
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: form-data
  dependency-version: 2.5.3
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: bignumber.js
  dependency-version: 9.3.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: detect-libc
  dependency-version: 2.0.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: google-logging-utils
  dependency-version: 0.0.2
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: npm-all
- dependency-name: html-entities
  dependency-version: 2.6.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: is-core-module
  dependency-version: 2.16.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: long
  dependency-version: 5.3.2
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: protobufjs
  dependency-version: 7.5.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: resolve
  dependency-version: 1.22.10
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: spdx-license-ids
  dependency-version: 3.0.21
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
...
[`(2cfd615)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2cfd615e1a31d54da11cd13ad97475dc8c105af2)

- Merge pull request #50 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/npm_and_yarn-de653eece3

build(deps-dev): bump vite from 6.3.3 to 6.3.4 in /electron-app/libs/zwiftmap-main/frontend in the npm_and_yarn group
[`(0e23c4c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0e23c4c717c0ad669e56b1c18937359e6cffd9e3)

- *(deps-dev)* [dependency] Update vite
[dependency] Updates the npm_and_yarn group in /electron-app/libs/zwiftmap-main/frontend with 1 update: [vite](https://github.com/vitejs/vite/tree/HEAD/packages/vite).


Updates `vite` from 6.3.3 to 6.3.4
- [Release notes](https://github.com/vitejs/vite/releases)
- [Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md)
- [Commits](https://github.com/vitejs/vite/commits/v6.3.4/packages/vite)

---
updated-dependencies:
- dependency-name: vite
  dependency-version: 6.3.4
  dependency-type: direct:development
  dependency-group: npm_and_yarn
...
[`(19315db)`](https://github.com/Nick2bad4u/FitFileViewer/commit/19315dbbe99675c1ed6c0f6da0b1bcb8607d5d20)

- Merge pull request #40 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/turf/buffer-7.2.0

build(deps): bump @turf/buffer from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/frontend
[`(f82f76a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f82f76aed4f8576ce341248b1dbcea50d4773bbe)

- *(deps)* [dependency] Update @turf/buffer
[dependency] Update @turf/buffer 7.2.0.
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

---
updated-dependencies:
- dependency-name: "@turf/buffer"
  dependency-version: 7.2.0
  dependency-type: direct:production
  update-type: version-update:semver-major
...
[`(09c3577)`](https://github.com/Nick2bad4u/FitFileViewer/commit/09c35777c55bf67ed1c53234f9c82b621a524668)

- Merge pull request #38 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/types/leaflet-1.9.17

build(deps): bump @types/leaflet from 1.9.5 to 1.9.17 in /electron-app/libs/zwiftmap-main/frontend
[`(717fa75)`](https://github.com/Nick2bad4u/FitFileViewer/commit/717fa75ee627bc3986103f130c27e9f5586bc2eb)

- *(deps)* [dependency] Update @types/leaflet
[dependency] Update @types/leaflet 1.9.17.
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/leaflet)

---
updated-dependencies:
- dependency-name: "@types/leaflet"
  dependency-version: 1.9.17
  dependency-type: direct:production
  update-type: version-update:semver-patch
...
[`(2b15a12)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2b15a124e1e91286bdf1a2d617114333e0d63685)

- Merge pull request #37 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/turf/length-7.2.0

build(deps): bump @turf/length from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/frontend
[`(2d4cb7b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2d4cb7b3a8fa0e9d62a7e6472fbbfc6a6120f039)

- *(deps)* [dependency] Update @turf/length
[dependency] Update @turf/length 7.2.0.
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

---
updated-dependencies:
- dependency-name: "@turf/length"
  dependency-version: 7.2.0
  dependency-type: direct:production
  update-type: version-update:semver-major
...
[`(cf9fe0e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/cf9fe0e5c2fcdd3cbb4a9bb2c5ac1fa333f4ffe1)

- Merge pull request #36 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/vitest-3.1.2

build(deps-dev): bump vitest from 2.1.9 to 3.1.2 in /electron-app/libs/zwiftmap-main/frontend
[`(4f5e14c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4f5e14c990e32800232e0798ba4036067c46f585)

- *(deps-dev)* [dependency] Update vitest
[dependency] Update vitest 3.1.2.
- [Release notes](https://github.com/vitest-dev/vitest/releases)
- [Commits](https://github.com/vitest-dev/vitest/commits/v3.1.2/packages/vitest)

---
updated-dependencies:
- dependency-name: vitest
  dependency-version: 3.1.2
  dependency-type: direct:development
  update-type: version-update:semver-major
...
[`(6902ed0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6902ed06fb410a7dccef11c1fa32373dea588334)

- *(deps)* [dependency] Update @turf/buffer
[dependency] Update @turf/buffer 7.2.0.
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

---
updated-dependencies:
- dependency-name: "@turf/buffer"
  dependency-version: 7.2.0
  dependency-type: direct:production
  update-type: version-update:semver-major
...
[`(b9b3e0f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b9b3e0f85274c8b2f0e3e964bfbb4fc8f2a35bd3)

- Merge PR #47

build(deps): bump the npm-all group in /electron-app/libs/zwiftmap-main/browser-extension with 4 updates
[`(5276af4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5276af48ed962371707829a351c57bd9f468f011)

- *(deps)* [dependency] Update the npm-all group
[dependency] Update npm dependencies: [@types/leaflet](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/leaflet), [@types/geojson](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/geojson), [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node) and [undici-types](https://github.com/nodejs/undici).


Updates `@types/leaflet` from 1.9.5 to 1.9.17
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/leaflet)

Updates `@types/geojson` from 7946.0.14 to 7946.0.16
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/geojson)

Updates `@types/node` from 22.9.3 to 22.15.3
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node)

Updates `undici-types` from 6.19.8 to 6.21.0
- [Release notes](https://github.com/nodejs/undici/releases)
- [Commits](https://github.com/nodejs/undici/compare/v6.19.8...v6.21.0)

---
updated-dependencies:
- dependency-name: "@types/leaflet"
  dependency-version: 1.9.17
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@types/geojson"
  dependency-version: 7946.0.16
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: npm-all
- dependency-name: "@types/node"
  dependency-version: 22.15.3
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
- dependency-name: undici-types
  dependency-version: 6.21.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: npm-all
...
[`(153f603)`](https://github.com/Nick2bad4u/FitFileViewer/commit/153f6039644760b9b47a9091c9a519ec2c8a87da)

- *(deps)* [dependency] Update @turf/difference
[dependency] Update @turf/difference 7.2.0.
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

---
updated-dependencies:
- dependency-name: "@turf/difference"
  dependency-version: 7.2.0
  dependency-type: direct:production
  update-type: version-update:semver-major
...
[`(4581fde)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4581fde817c0d701d12702a626ca7844ee298e02)

- *(deps-dev)* [dependency] Update @types/validator
[dependency] Update @types/validator 13.15.0.
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/validator)

---
updated-dependencies:
- dependency-name: "@types/validator"
  dependency-version: 13.15.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
...
[`(22e1b26)`](https://github.com/Nick2bad4u/FitFileViewer/commit/22e1b2602f209fcc4591061757dd18f094bf3592)

- *(deps)* [dependency] Update @turf/length
[dependency] Update @turf/length 7.2.0.
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

---
updated-dependencies:
- dependency-name: "@turf/length"
  dependency-version: 7.2.0
  dependency-type: direct:production
  update-type: version-update:semver-major
...
[`(d81250d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d81250d99aca78e657290c60030e3e8df9025710)

- *(deps)* [dependency] Update @sentry/node
[dependency] Update @sentry/node 9.15.0.
- [Release notes](https://github.com/getsentry/sentry-javascript/releases)
- [Changelog](https://github.com/getsentry/sentry-javascript/blob/9.15.0/CHANGELOG.md)
- [Commits](https://github.com/getsentry/sentry-javascript/compare/8.53.0...9.15.0)

---
updated-dependencies:
- dependency-name: "@sentry/node"
  dependency-version: 9.15.0
  dependency-type: direct:production
  update-type: version-update:semver-major
...
[`(71931a7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/71931a712d2fe8df2baabf8532c9761e1fa9daa9)

- Merge pull request #28 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/tanstack/react-query-5.74.9

build(deps): bump @tanstack/react-query from 5.66.0 to 5.74.9 in /electron-app/libs/zwiftmap-main/frontend
[`(c0d8e59)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c0d8e595af3b6bbb57db24509a235f04defe5a0e)

- *(deps)* [dependency] Update @tanstack/react-query
[dependency] Update @tanstack/react-query 5.74.9.
- [Release notes](https://github.com/TanStack/query/releases)
- [Commits](https://github.com/TanStack/query/commits/v5.74.9/packages/react-query)

---
updated-dependencies:
- dependency-name: "@tanstack/react-query"
  dependency-version: 5.74.9
  dependency-type: direct:production
  update-type: version-update:semver-minor
...
[`(d86310c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d86310ccfb8051eb392f932f89e51d373d105613)

- Merge pull request #25 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/types/chrome-0.0.317

build(deps-dev): bump @types/chrome from 0.0.316 to 0.0.317 in /electron-app/libs/zwiftmap-main/browser-extension
[`(6b1c566)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6b1c56621c09c7caede4c68838c5ef5c277bf534)

- *(deps-dev)* [dependency] Update @types/chrome
[dependency] Update @types/chrome 0.0.317.
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/chrome)

---
updated-dependencies:
- dependency-name: "@types/chrome"
  dependency-version: 0.0.317
  dependency-type: direct:development
  update-type: version-update:semver-patch
...
[`(f7df652)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f7df652e33cc8c945ff710779f0c40e976f33e35)

- Merge pull request #23 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/typescript-5.8.3

build(deps-dev): bump typescript from 5.7.3 to 5.8.3 in /electron-app/libs/zwiftmap-main/frontend
[`(b138e98)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b138e98051778452f93321fceb60e12e3a516fc3)

- *(deps-dev)* [dependency] Update typescript
[dependency] Update typescript 5.8.3.
- [Release notes](https://github.com/microsoft/TypeScript/releases)
- [Changelog](https://github.com/microsoft/TypeScript/blob/main/azure-pipelines.release-publish.yml)
- [Commits](https://github.com/microsoft/TypeScript/compare/v5.7.3...v5.8.3)

---
updated-dependencies:
- dependency-name: typescript
  dependency-version: 5.8.3
  dependency-type: direct:development
  update-type: version-update:semver-minor
...
[`(5bef1f9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5bef1f99dcd1da75c872138e00277c178d53e3ca)

- Merge pull request #22 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/dotenv-16.5.0

build(deps): bump dotenv from 16.4.7 to 16.5.0 in /electron-app/libs/zwiftmap-main/backend
[`(a0cf8e4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a0cf8e4b00f3617f885ee7473fe3f088c79ed1be)

- *(deps)* [dependency] Update dotenv in /electron-app/libs/zwiftmap-main/backend
[dependency] Update dotenv 16.5.0.
- [Changelog](https://github.com/motdotla/dotenv/blob/master/CHANGELOG.md)
- [Commits](https://github.com/motdotla/dotenv/compare/v16.4.7...v16.5.0)

---
updated-dependencies:
- dependency-name: dotenv
  dependency-version: 16.5.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
...
[`(e43e6a2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e43e6a28e04bee492df8c68fb967c3a24726cfd9)

- Merge pull request #21 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/esbuild-0.25.3

build(deps-dev): bump esbuild from 0.25.0 to 0.25.3 in /electron-app/libs/zwiftmap-main/browser-extension
[`(c7c99d8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c7c99d80a100b2dadfdb50fc0ff4eeca9390b2e0)

- *(deps-dev)* [dependency] Update esbuild
[dependency] Update esbuild 0.25.3.
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.25.0...v0.25.3)

---
updated-dependencies:
- dependency-name: esbuild
  dependency-version: 0.25.3
  dependency-type: direct:development
  update-type: version-update:semver-patch
...
[`(e3da0b7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e3da0b7867dd9462f45e60a9d7755ba815855a24)

- Merge pull request #29 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/fast-xml-parser-5.2.1

build(deps): bump fast-xml-parser from 4.5.1 to 5.2.1 in /electron-app/libs/zwiftmap-main/backend
[`(942fea0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/942fea08c7a22f78b3b3b55fe8cb5835080bccd4)

- *(deps)* [dependency] Update fast-xml-parser
[dependency] Update fast-xml-parser 5.2.1.
- [Release notes](https://github.com/NaturalIntelligence/fast-xml-parser/releases)
- [Changelog](https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/CHANGELOG.md)
- [Commits](https://github.com/NaturalIntelligence/fast-xml-parser/compare/v4.5.1...v5.2.1)

---
updated-dependencies:
- dependency-name: fast-xml-parser
  dependency-version: 5.2.1
  dependency-type: direct:production
  update-type: version-update:semver-major
...
[`(e8acf85)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e8acf85cfc01ff14a5b8d88ea943633c983dd5bb)

- Merge pull request #30 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/types/node-22.15.3

build(deps-dev): bump @types/node from 22.13.0 to 22.15.3 in /electron-app/libs/zwiftmap-main/backend
[`(b57f7df)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b57f7df29825459108df635293354a40c94a2a22)

- *(deps-dev)* [dependency] Update @types/node
[dependency] Update @types/node 22.15.3.
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node)

---
updated-dependencies:
- dependency-name: "@types/node"
  dependency-version: 22.15.3
  dependency-type: direct:development
  update-type: version-update:semver-minor
...
[`(aad952d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/aad952de6fc8328a008f4ae6b045c31c4e97403c)

- Merge pull request #31 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/sentry/react-9.15.0

build(deps): bump @sentry/react from 8.53.0 to 9.15.0 in /electron-app/libs/zwiftmap-main/frontend
[`(1ecba53)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1ecba535729c28b45f458c3ee1dda6a6d473f3a1)

- *(deps)* [dependency] Update @sentry/react
[dependency] Update @sentry/react 9.15.0.
- [Release notes](https://github.com/getsentry/sentry-javascript/releases)
- [Changelog](https://github.com/getsentry/sentry-javascript/blob/9.15.0/CHANGELOG.md)
- [Commits](https://github.com/getsentry/sentry-javascript/compare/8.53.0...9.15.0)

---
updated-dependencies:
- dependency-name: "@sentry/react"
  dependency-version: 9.15.0
  dependency-type: direct:production
  update-type: version-update:semver-major
...
[`(1fec258)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1fec258a5fa65a83b813438eb8b9eab1755fc644)

- Merge pull request #20 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/google-cloud/secret-manager-6.0.1

build(deps): bump @google-cloud/secret-manager from 5.6.0 to 6.0.1 in /electron-app/libs/zwiftmap-main/backend
[`(e6cf64c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e6cf64c5d147038a65e10a94a73c3fe57b0d521c)

- *(deps)* [dependency] Update @google-cloud/secret-manager
[dependency] Update @google-cloud/secret-manager 6.0.1.
- [Release notes](https://github.com/googleapis/google-cloud-node/releases)
- [Changelog](https://github.com/googleapis/google-cloud-node/blob/main/packages/google-cloud-secretmanager/CHANGELOG.md)
- [Commits](https://github.com/googleapis/google-cloud-node/commits/dlp-v6.0.1/packages/google-cloud-secretmanager)

---
updated-dependencies:
- dependency-name: "@google-cloud/secret-manager"
  dependency-version: 6.0.1
  dependency-type: direct:production
  update-type: version-update:semver-major
...
[`(3b55e3e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3b55e3ea9431fb54fe90800b050b2c6d11ec452a)

- Merge pull request #24 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/browser-extension/zwift-data-1.43.0

build(deps): bump zwift-data from 1.42.0 to 1.43.0 in /electron-app/libs/zwiftmap-main/browser-extension
[`(7fa5ad9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7fa5ad93defda3749fa8a26e07d8a4d921d8fce3)

- *(deps)* [dependency] Update zwift-data
[dependency] Update zwift-data 1.43.0.
- [Release notes](https://github.com/andipaetzold/zwift-data/releases)
- [Changelog](https://github.com/andipaetzold/zwift-data/blob/main/CHANGELOG.md)
- [Commits](https://github.com/andipaetzold/zwift-data/compare/v1.42.0...v1.43.0)

---
updated-dependencies:
- dependency-name: zwift-data
  dependency-version: 1.43.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
...
[`(e4db4c3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e4db4c3409f25ef7f6e6e82594af772175f23d77)

- Merge pull request #26 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/backend/turf/nearest-point-on-line-7.2.0

build(deps): bump @turf/nearest-point-on-line from 6.5.0 to 7.2.0 in /electron-app/libs/zwiftmap-main/backend
[`(4695f64)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4695f641f4d7243e557b5829998a5ba17fd1b751)

- *(deps)* [dependency] Update @turf/nearest-point-on-line
[dependency] Update @turf/nearest-point-on-line 7.2.0.
- [Release notes](https://github.com/Turfjs/turf/releases)
- [Changelog](https://github.com/Turfjs/turf/blob/master/CHANGELOG.md)
- [Commits](https://github.com/Turfjs/turf/compare/v6.5.0...v7.2.0)

---
updated-dependencies:
- dependency-name: "@turf/nearest-point-on-line"
  dependency-version: 7.2.0
  dependency-type: direct:production
  update-type: version-update:semver-major
...
[`(6383274)`](https://github.com/Nick2bad4u/FitFileViewer/commit/638327498cf49f452fa6b8474f9750fc990633cc)

- Merge pull request #32 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/tanstack/react-query-devtools-5.74.9

build(deps): bump @tanstack/react-query-devtools from 5.66.0 to 5.74.9 in /electron-app/libs/zwiftmap-main/frontend
[`(4cf2959)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4cf29592f26fee4661ca007c296e2b0e2a8832ed)

- *(deps)* [dependency] Update @tanstack/react-query-devtools
[dependency] Update @tanstack/react-query-devtools 5.74.9.
- [Release notes](https://github.com/TanStack/query/releases)
- [Commits](https://github.com/TanStack/query/commits/v5.74.9/packages/react-query-devtools)

---
updated-dependencies:
- dependency-name: "@tanstack/react-query-devtools"
  dependency-version: 5.74.9
  dependency-type: direct:production
  update-type: version-update:semver-minor
...
[`(849c73c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/849c73c498353f3ef988818dd35e0c70c089c9e7)

- Merge pull request #33 from Nick2bad4u/dependabot/npm_and_yarn/electron-app/libs/zwiftmap-main/frontend/multi-1dbe629cdc

build(deps): bump react-dom and @types/react-dom in /electron-app/libs/zwiftmap-main/frontend
[`(2a0614b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2a0614babab6547c48b19933cda8e321c9cfd11c)

- *(deps)* [dependency] Update react-dom and @types/react-dom
[dependency] Updates [react-dom](https://github.com/facebook/react/tree/HEAD/packages/react-dom) and [@types/react-dom](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/react-dom). These dependencies needed to be updated together.

Updates `react-dom` from 18.3.1 to 19.1.0
- [Release notes](https://github.com/facebook/react/releases)
- [Changelog](https://github.com/facebook/react/blob/main/CHANGELOG.md)
- [Commits](https://github.com/facebook/react/commits/v19.1.0/packages/react-dom)

Updates `@types/react-dom` from 18.3.5 to 19.1.2
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/react-dom)

---
updated-dependencies:
- dependency-name: react-dom
  dependency-version: 19.1.0
  dependency-type: direct:production
  update-type: version-update:semver-major
- dependency-name: "@types/react-dom"
  dependency-version: 19.1.2
  dependency-type: direct:production
  update-type: version-update:semver-major
...
[`(1de9279)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1de9279450ffec958dbdac3ef8d9ffafc0f30946)

- *(deps)* [dependency] Update the npm_and_yarn group across 2 directories with 21 updates
[dependency] Updates the npm_and_yarn group with 4 updates in the /electron-app/libs/zwiftmap-main/backend directory: [axios](https://github.com/axios/axios), [express](https://github.com/expressjs/express), [@types/express](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/express) and [cookie](https://github.com/jshttp/cookie).
[dependency] Updates the npm_and_yarn group with 6 updates in the /electron-app/libs/zwiftmap-main/frontend directory:

| Package | From | To |
| --- | --- | --- |
| [cookie](https://github.com/jshttp/cookie) | `0.5.0` | `removed` |
| [netlify-cli](https://github.com/netlify/cli) | `12.2.8` | `20.1.1` |
| [vite](https://github.com/vitejs/vite/tree/HEAD/packages/vite) | `6.0.14` | `6.3.3` |
| [vite](https://github.com/vitejs/vite/tree/HEAD/packages/vite) | `5.4.14` | `6.3.3` |
| [vite](https://github.com/vitejs/vite/tree/HEAD/packages/vite) | `5.4.11` | `6.3.3` |
| [@babel/runtime](https://github.com/babel/babel/tree/HEAD/packages/babel-runtime) | `7.26.0` | `7.27.0` |
| [tar-fs](https://github.com/mafintosh/tar-fs) | `2.1.1` | `3.0.8` |
| [pwa-asset-generator](https://github.com/elegantapp/pwa-asset-generator) | `6.4.0` | `8.0.4` |



Updates `axios` from 1.7.4 to 1.8.2
- [Release notes](https://github.com/axios/axios/releases)
- [Changelog](https://github.com/axios/axios/blob/v1.x/CHANGELOG.md)
- [Commits](https://github.com/axios/axios/compare/v1.7.4...v1.8.2)

Updates `express` from 4.21.2 to 5.1.0
- [Release notes](https://github.com/expressjs/express/releases)
- [Changelog](https://github.com/expressjs/express/blob/master/History.md)
- [Commits](https://github.com/expressjs/express/compare/4.21.2...v5.1.0)

Updates `@types/express` from 4.17.21 to 5.0.1
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/express)

Updates `body-parser` from 1.20.3 to 2.2.0
- [Release notes](https://github.com/expressjs/body-parser/releases)
- [Changelog](https://github.com/expressjs/body-parser/blob/master/HISTORY.md)
- [Commits](https://github.com/expressjs/body-parser/compare/1.20.3...v2.2.0)

Updates `cookie` from 0.7.1 to 0.7.2
- [Release notes](https://github.com/jshttp/cookie/releases)
- [Commits](https://github.com/jshttp/cookie/compare/v0.7.1...v0.7.2)

Updates `send` from 0.19.0 to 1.2.0
- [Release notes](https://github.com/pillarjs/send/releases)
- [Changelog](https://github.com/pillarjs/send/blob/master/HISTORY.md)
- [Commits](https://github.com/pillarjs/send/compare/0.19.0...1.2.0)

Updates `serve-static` from 1.16.2 to 2.2.0
- [Release notes](https://github.com/expressjs/serve-static/releases)
- [Changelog](https://github.com/expressjs/serve-static/blob/master/HISTORY.md)
- [Commits](https://github.com/expressjs/serve-static/compare/v1.16.2...v2.2.0)

Removes `cookie`

Updates `netlify-cli` from 12.2.8 to 20.1.1
- [Release notes](https://github.com/netlify/cli/releases)
- [Changelog](https://github.com/netlify/cli/blob/main/CHANGELOG.md)
- [Commits](https://github.com/netlify/cli/compare/v12.2.8...v20.1.1)

Updates `follow-redirects` from 1.15.1 to 1.15.6
- [Release notes](https://github.com/follow-redirects/follow-redirects/releases)
- [Commits](https://github.com/follow-redirects/follow-redirects/compare/v1.15.1...v1.15.6)

Updates `got` from 8.3.2 to 12.6.1
- [Release notes](https://github.com/sindresorhus/got/releases)
- [Commits](https://github.com/sindresorhus/got/compare/v8.3.2...v12.6.1)

Updates `send` from 0.18.0 to 0.19.0
- [Release notes](https://github.com/pillarjs/send/releases)
- [Changelog](https://github.com/pillarjs/send/blob/master/HISTORY.md)
- [Commits](https://github.com/pillarjs/send/compare/0.19.0...1.2.0)

Updates `serve-static` from 1.15.0 to 1.16.2
- [Release notes](https://github.com/expressjs/serve-static/releases)
- [Changelog](https://github.com/expressjs/serve-static/blob/master/HISTORY.md)
- [Commits](https://github.com/expressjs/serve-static/compare/v1.16.2...v2.2.0)

Updates `vite` from 6.0.14 to 6.3.3
- [Release notes](https://github.com/vitejs/vite/releases)
- [Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md)
- [Commits](https://github.com/vitejs/vite/commits/v6.3.3/packages/vite)

Updates `vite` from 5.4.14 to 6.3.3
- [Release notes](https://github.com/vitejs/vite/releases)
- [Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md)
- [Commits](https://github.com/vitejs/vite/commits/v6.3.3/packages/vite)

Updates `vite` from 5.4.11 to 6.3.3
- [Release notes](https://github.com/vitejs/vite/releases)
- [Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md)
- [Commits](https://github.com/vitejs/vite/commits/v6.3.3/packages/vite)

Updates `@babel/runtime` from 7.26.0 to 7.27.0
- [Release notes](https://github.com/babel/babel/releases)
- [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
- [Commits](https://github.com/babel/babel/commits/v7.27.0/packages/babel-runtime)

Updates `braces` from 2.3.2 to 3.0.3
- [Changelog](https://github.com/micromatch/braces/blob/master/CHANGELOG.md)
- [Commits](https://github.com/micromatch/braces/commits/3.0.3)

Updates `esbuild` from 0.21.5 to 0.19.11
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG-2023.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.21.5...v0.19.11)

Updates `nanoid` from 3.3.4 to 3.3.8
- [Release notes](https://github.com/ai/nanoid/releases)
- [Changelog](https://github.com/ai/nanoid/blob/main/CHANGELOG.md)
- [Commits](https://github.com/ai/nanoid/compare/3.3.4...3.3.8)

Updates `http-proxy-middleware` from 2.0.6 to 2.0.9
- [Release notes](https://github.com/chimurai/http-proxy-middleware/releases)
- [Changelog](https://github.com/chimurai/http-proxy-middleware/blob/v2.0.9/CHANGELOG.md)
- [Commits](https://github.com/chimurai/http-proxy-middleware/compare/v2.0.6...v2.0.9)

Updates `jsonwebtoken` from 8.5.1 to 9.0.2
- [Changelog](https://github.com/auth0/node-jsonwebtoken/blob/master/CHANGELOG.md)
- [Commits](https://github.com/auth0/node-jsonwebtoken/compare/v8.5.1...v9.0.2)

Updates `postcss` from 8.4.14 to 8.5.3
- [Release notes](https://github.com/postcss/postcss/releases)
- [Changelog](https://github.com/postcss/postcss/blob/main/CHANGELOG.md)
- [Commits](https://github.com/postcss/postcss/compare/8.4.14...8.5.3)

Updates `tar-fs` from 2.1.1 to 3.0.8
- [Commits](https://github.com/mafintosh/tar-fs/compare/v2.1.1...v3.0.8)

Updates `pwa-asset-generator` from 6.4.0 to 8.0.4
- [Release notes](https://github.com/elegantapp/pwa-asset-generator/releases)
- [Changelog](https://github.com/elegantapp/pwa-asset-generator/blob/master/CHANGELOG.md)
- [Commits](https://github.com/elegantapp/pwa-asset-generator/compare/v6.4.0...v8.0.4)

Updates `ws` from 8.5.0 to 8.18.1
- [Release notes](https://github.com/websockets/ws/releases)
- [Commits](https://github.com/websockets/ws/compare/8.5.0...8.18.1)

---
updated-dependencies:
- dependency-name: axios
  dependency-version: 1.8.2
  dependency-type: direct:production
  dependency-group: npm_and_yarn
- dependency-name: express
  dependency-version: 5.1.0
  dependency-type: direct:production
  dependency-group: npm_and_yarn
- dependency-name: "@types/express"
  dependency-version: 5.0.1
  dependency-type: direct:development
  dependency-group: npm_and_yarn
- dependency-name: body-parser
  dependency-version: 2.2.0
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: cookie
  dependency-version: 0.7.2
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: send
  dependency-version: 1.2.0
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: serve-static
  dependency-version: 2.2.0
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: cookie
  dependency-version: 
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: netlify-cli
  dependency-version: 20.1.1
  dependency-type: direct:development
  dependency-group: npm_and_yarn
- dependency-name: follow-redirects
  dependency-version: 1.15.6
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: got
  dependency-version: 12.6.1
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: send
  dependency-version: 0.19.0
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: serve-static
  dependency-version: 1.16.2
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: vite
  dependency-version: 6.3.3
  dependency-type: direct:development
  dependency-group: npm_and_yarn
- dependency-name: vite
  dependency-version: 6.3.3
  dependency-type: direct:development
  dependency-group: npm_and_yarn
- dependency-name: vite
  dependency-version: 6.3.3
  dependency-type: direct:development
  dependency-group: npm_and_yarn
- dependency-name: "@babel/runtime"
  dependency-version: 7.27.0
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: braces
  dependency-version: 3.0.3
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: esbuild
  dependency-version: 0.19.11
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: nanoid
  dependency-version: 3.3.8
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: http-proxy-middleware
  dependency-version: 2.0.9
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: jsonwebtoken
  dependency-version: 9.0.2
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: postcss
  dependency-version: 8.5.3
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: tar-fs
  dependency-version: 3.0.8
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: pwa-asset-generator
  dependency-version: 8.0.4
  dependency-type: direct:development
  dependency-group: npm_and_yarn
- dependency-name: ws
  dependency-version: 8.18.1
  dependency-type: indirect
  dependency-group: npm_and_yarn
...
[`(80ff77e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/80ff77e4e5bebe3a33c3246b3b273268c71bee1c)


### 🛡️ Security  
- Refactor and enhance Electron app functionality

- Added global variable declaration in renderTable.js for jQuery usage.
- Simplified error handling in setupTheme.js by removing the error parameter.
- Improved showFitData.js by refactoring file name handling and UI updates for better readability and performance.
- Updated windowStateUtils.js to include global variable declarations for better compatibility.
- Removed package-lock.json and package.json to streamline dependencies.
- Introduced GitHub Actions workflows for automated greetings, security scanning with Sobelow, style linting, and code linting with Super Linter.
- Added screenfull.min.js library for fullscreen functionality.
- Implemented setupWindow.js to manage window load events and tab interactions more efficiently.
[`(a27cf89)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a27cf8946699acf9c65a5799041abce0c653bc3e)


## Contributors
Thanks to all the [contributors](https://github.com/Nick2bad4u/FitFileViewer/graphs/contributors) for their hard work!
## License
This project is licensed under the [MIT License](https://github.com/Nick2bad4u/FitFileViewer/blob/main/LICENSE.md)
*This changelog was automatically generated with [git-cliff](https://github.com/orhun/git-cliff).*
