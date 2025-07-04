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


[[19ba8e6](https://github.com/Nick2bad4u/FitFileViewer/commit/19ba8e60f80467e8b8531eaad257c5d95f875ad4)...
[39fb2f4](https://github.com/Nick2bad4u/FitFileViewer/commit/39fb2f4e23ccaf99173697a68eb2883aa00c04ca)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/19ba8e60f80467e8b8531eaad257c5d95f875ad4...39fb2f4e23ccaf99173697a68eb2883aa00c04ca))


### 💼 Other

- Refactor code structure for improved readability and maintainability [`(39fb2f4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/39fb2f4e23ccaf99173697a68eb2883aa00c04ca)


- Update setTimeout callbacks to use function expressions for consistency [`(19ba8e6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/19ba8e60f80467e8b8531eaad257c5d95f875ad4)




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


- Modularizes chart rendering and improves data/unit handling

Refactors chart rendering logic into smaller, focused modules to enhance maintainability and scalability. Improves developer field chart support and ensures unit conversion follows user preferences per field. Streamlines imports, reduces duplication, and enhances chart debugging and logging for better chart data quality and troubleshooting.

Modularizes chart rendering and improves unit handling

Splits chart rendering logic into focused modules for better maintainability and scalability. Enhances support for developer fields and applies user-specific unit conversions per metric. Streamlines imports, reduces code duplication, and improves debugging/logging to aid troubleshooting and ensure chart data quality. [`(6e6ec92)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6e6ec9239bc393c804d8acb45ed7c0b6b8e78e62)


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


[[dd4a28d](https://github.com/Nick2bad4u/FitFileViewer/commit/dd4a28d356e254bc9160d1c4cc722691c8ad4dd3)...
[5debf80](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/dd4a28d356e254bc9160d1c4cc722691c8ad4dd3...5debf805345db114c8a0ff6749ae0be9c5818ee5))


### 💼 Other

- Enhance workflows and documentation for Flatpak build process, including versioning updates and new download options [`(5debf80)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)


- Update changelogs and version numbers for releases 16.4.0, 16.5.0, and 16.6.0; enhance GitHub Actions and implement release cleanup script [`(24a9a97)`](https://github.com/Nick2bad4u/FitFileViewer/commit/24a9a97718f3058e1b0a537d7e41096386388202)


- Update changelogs and scripts: Add new version numbers, enhance GitHub Actions, and implement release cleanup script [`(8593346)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8593346c7d028dc0a02661bcdf9b353846e99e9d)


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


- Refactor code structure for improved readability and maintainability [`(829fd2f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/829fd2f4610020d853e8268116d12c21539e1ed9)


- Implement code changes to enhance functionality and improve performance [`(dd4a28d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/dd4a28d356e254bc9160d1c4cc722691c8ad4dd3)



### ⚙️ Miscellaneous Tasks

- Update changelogs and scripts for versioning and GitHub Actions enhancements [`(1fc3c44)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1fc3c44efbc84701690e71b9c43ab2d510bfe15a)


- Update changelogs and scripts for versioning and GitHub Actions enhancements [`(27471d3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/27471d38f7b7749f7b57665551aeb8696b5fbcbe)


- Add changelog files for electron-app, tests, and utils [`(b9d2e0a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b9d2e0a4df3224672415510d505e98054a593934)




## Contributors
Thanks to all the [contributors](https://github.com/Nick2bad4u/FitFileViewer/graphs/contributors) for their hard work!
## License
This project is licensed under the [MIT License](https://github.com/Nick2bad4u/FitFileViewer/blob/main/LICENSE.md)
*This changelog was automatically generated with [git-cliff](https://github.com/orhun/git-cliff).*
