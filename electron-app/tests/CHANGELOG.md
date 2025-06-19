<!-- markdownlint-disable -->
<!-- eslint-disable markdown/no-missing-label-refs -->
# Changelog

All notable changes to this project will be documented in this file.

## [24.2.0] - 2025-06-18

[[39fb2f4](https://github.com/Nick2bad4u/FitFileViewer/commit/39fb2f4e23ccaf99173697a68eb2883aa00c04ca)...[e8ed10d](https://github.com/Nick2bad4u/FitFileViewer/commit/e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27)] ([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/39fb2f4e23ccaf99173697a68eb2883aa00c04ca...e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27))

### 💼 Other  
- Refactor heart rate and power zone color controls to use inline color selectors

- Replaced the existing openZoneColorPicker function with createInlineZoneColorSelector in both heart rate and power zone control files.
- Introduced a new utility for creating inline zone color selectors, allowing for a more compact and user-friendly interface for customizing zone colors.
- Updated the reset functionality in openZoneColorPicker to ensure all relevant zone fields are reset to custom color schemes.
- Enhanced the zone color utility functions to support additional color schemes, including pastel, dark, rainbow, ocean, earth, fire, forest, sunset, grayscale, neon, autumn, spring, cycling, and runner.
- Improved the persistence of zone colors in localStorage and ensured proper synchronization between chart-specific and generic zone color storage.
[`(e8ed10d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27)


## [24.1.0] - 2025-06-18

[[25c3b5e](https://github.com/Nick2bad4u/FitFileViewer/commit/25c3b5e09fc01799a354e00c97ea827a48a5dfc8)...[39fb2f4](https://github.com/Nick2bad4u/FitFileViewer/commit/39fb2f4e23ccaf99173697a68eb2883aa00c04ca)] ([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/25c3b5e09fc01799a354e00c97ea827a48a5dfc8...39fb2f4e23ccaf99173697a68eb2883aa00c04ca))

### 💼 Other  
- Refactor code structure for improved readability and maintainability
[`(39fb2f4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/39fb2f4e23ccaf99173697a68eb2883aa00c04ca)

- Update setTimeout callbacks to use function expressions for consistency
[`(19ba8e6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/19ba8e60f80467e8b8531eaad257c5d95f875ad4)

- Refactor chart utilities and enhance theme handling

- Removed the chart specification generation code from chartSpec.js, streamlining the chart rendering process.
- Improved the chart theme listener in chartThemeListener.js for better event handling and performance.
- Updated ensureAboutModal.js to enhance modal initialization and styling.
- Cleaned up exportAllCharts.js by removing unnecessary whitespace.
- Refined modal styles injection in injectModalStyles.js to prevent duplicate style applications.
- Enhanced animation logging utility in lastAnimLog.js for better performance tracking during development.
- Improved version information loading in loadVersionInfo.js for dynamic updates.
- Updated system information display logic in updateSystemInfo.js for better clarity.
- Added gitleaks-report.json to track potential API key exposure in the codebase.
[`(07f01c6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/07f01c601ecc9c3c5e720de2231ecebd734fa321)


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
- *(theme)* enhance theme management with auto mode and smooth transitions
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

- Update dependencies, clarify UI, and add basic test

Upgrades several dev dependencies, including vitest and rollup,
to address stability and compatibility. Clarifies the UI by
marking the Zwift tab as work in progress. Adds a simple test
to verify chart rendering utility presence. Ensures the menu
bar stays visible in the application window for improved
usability.
[`(710f13c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/710f13cbd9145feebd547f0c155e750eada85063)


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

### 💼 Other  
- Enhance workflows and documentation for Flatpak build process, including versioning updates and new download options
[`(5debf80)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)

- Update changelogs and version numbers for releases 16.4.0, 16.5.0, and 16.6.0; enhance GitHub Actions and implement release cleanup script
[`(24a9a97)`](https://github.com/Nick2bad4u/FitFileViewer/commit/24a9a97718f3058e1b0a537d7e41096386388202)

- Update changelogs and scripts: Add new version numbers, enhance GitHub Actions, and implement release cleanup script
[`(8593346)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8593346c7d028dc0a02661bcdf9b353846e99e9d)


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


## [8.0.0] - 2025-05-07

[[1a61d0e](https://github.com/Nick2bad4u/FitFileViewer/commit/1a61d0ed75293d109c66c84369d708fcfe8e9591)...[f7f3de8](https://github.com/Nick2bad4u/FitFileViewer/commit/f7f3de831c09658b6c78e414fd7ab27d148baed9)] ([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/1a61d0ed75293d109c66c84369d708fcfe8e9591...f7f3de831c09658b6c78e414fd7ab27d148baed9))

### 💼 Other  
- Add Vitest configuration and Stylelint configuration files

- Created vitest.config.js to set up testing environment with jsdom and specified setup files.
- Added stylelint.config.js to enforce standard stylelint rules, including preventing empty blocks.
[`(f7f3de8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f7f3de831c09658b6c78e414fd7ab27d148baed9)


## Contributors
Thanks to all the [contributors](https://github.com/Nick2bad4u/FitFileViewer/graphs/contributors) for their hard work!
## License
This project is licensed under the [MIT License](https://github.com/Nick2bad4u/FitFileViewer/blob/main/LICENSE.md)
*This changelog was automatically generated with [git-cliff](https://github.com/orhun/git-cliff).*
