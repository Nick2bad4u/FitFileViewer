<!-- markdownlint-disable -->
<!-- eslint-disable markdown/no-missing-label-refs -->
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]


[[a09e7e1](https://github.com/Nick2bad4u/FitFileViewer/commit/a09e7e1ba6cae2d8715497930ed78fe72fa3f12c)...
[b64b260](https://github.com/Nick2bad4u/FitFileViewer/commit/b64b260c00bee59c9a8528ef91ccbde6fee954fa)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/a09e7e1ba6cae2d8715497930ed78fe72fa3f12c...b64b260c00bee59c9a8528ef91ccbde6fee954fa))


### 🚀 Features

- Implement comprehensive state management system with advanced features [`(a09e7e1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a09e7e1ba6cae2d8715497930ed78fe72fa3f12c)



### ⚙️ Miscellaneous Tasks

- Format code with Prettier (#129) [`(b64b260)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b64b260c00bee59c9a8528ef91ccbde6fee954fa)




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


[[851a688](https://github.com/Nick2bad4u/FitFileViewer/commit/851a688d8887756645fd3519897260e367e6f922)...
[39fb2f4](https://github.com/Nick2bad4u/FitFileViewer/commit/39fb2f4e23ccaf99173697a68eb2883aa00c04ca)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/851a688d8887756645fd3519897260e367e6f922...39fb2f4e23ccaf99173697a68eb2883aa00c04ca))


### 🚀 Features

- Enhance settings header with chart status indicators and field toggles [`(851a688)`](https://github.com/Nick2bad4u/FitFileViewer/commit/851a688d8887756645fd3519897260e367e6f922)



### 💼 Other

- Refactor code structure for improved readability and maintainability [`(39fb2f4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/39fb2f4e23ccaf99173697a68eb2883aa00c04ca)


- Adds unified HR and power zone chart controls with color pickers

Separates heart rate and power zone chart toggles into dedicated, collapsible UI sections for better organization and discoverability. Introduces unified color pickers for customizing zone colors per chart type, enhancing user control and visual clarity. Refactors chart rendering and zone data logic to support these improvements, streamlines field toggle handling, and updates related components and configuration for consistency.

Improves accessibility and maintainability of chart settings, while removing redundant bar zone charts and simplifying toggles. Updates documentation and housekeeping files to reflect structural changes. [`(b2eb217)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b2eb217baf56fcb0c886567544f070f7dc504d43)


- Update setTimeout callbacks to use function expressions for consistency [`(19ba8e6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/19ba8e60f80467e8b8531eaad257c5d95f875ad4)




## [23.6.0] - 2025-06-17


[[e84588e](https://github.com/Nick2bad4u/FitFileViewer/commit/e84588e7c6e1ae1e4d5408c550b5997488eb3e28)...
[e84588e](https://github.com/Nick2bad4u/FitFileViewer/commit/e84588e7c6e1ae1e4d5408c550b5997488eb3e28)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/e84588e7c6e1ae1e4d5408c550b5997488eb3e28...e84588e7c6e1ae1e4d5408c550b5997488eb3e28))


### 💼 Other

- Refactor sensor and manufacturer handling in chart rendering

- Removed extensive hardcoded manufacturer and product mappings from formatAntNames.js, replacing them with imports from separate files for better modularity and maintainability.
- Updated formatSensorName.js to prioritize manufacturer and product names when both are available, improving sensor name formatting logic.
- Enhanced renderChartJS.js by importing chartFields for consistency, improving error handling display, and cleaning up chart data processing logic for better readability and maintainability. [`(e84588e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e84588e7c6e1ae1e4d5408c550b5997488eb3e28)




## [23.4.0] - 2025-06-17


[[97fbe38](https://github.com/Nick2bad4u/FitFileViewer/commit/97fbe38163151bc6a9e2f1a1d139e71aa97f661a)...
[09898cd](https://github.com/Nick2bad4u/FitFileViewer/commit/09898cd59263e4987cff89af00d8caaf2abe9372)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/97fbe38163151bc6a9e2f1a1d139e71aa97f661a...09898cd59263e4987cff89af00d8caaf2abe9372))


### 🐛 Bug Fixes

- Update theme colors in marker count selector for improved UI consistency [`(97fbe38)`](https://github.com/Nick2bad4u/FitFileViewer/commit/97fbe38163151bc6a9e2f1a1d139e71aa97f661a)



### 💼 Other

- Refactor manufacturer and product formatting utilities

- Updated import paths to use new formatAntNames.js module instead of manufacturerIds.js for manufacturer and product name retrieval.
- Enhanced formatProduct function to handle edge cases for manufacturer and product IDs, ensuring robust error handling and improved user feedback.
- Modified formatSensorName to ensure garminProduct is formatted correctly as a string.
- Removed manufacturerIds.js file as its functionality has been integrated into formatAntNames.js.
- Updated testFormatting.js to reflect changes in import paths and validate new formatting logic. [`(09898cd)`](https://github.com/Nick2bad4u/FitFileViewer/commit/09898cd59263e4987cff89af00d8caaf2abe9372)


- Adds independent map theme toggle and sensor formatting fixes

Enables users to switch map theme between light and dark modes independently of the app theme, improving visibility and user preference handling. Introduces a new toggle button with persistent preference, immediate UI feedback, and updated CSS for consistent appearance. Refactors marker count selector and overlay management for modularity and theme-awareness. Implements robust manufacturer and product ID mappings with formatting utilities, fixing legacy and edge cases for sensor naming. Improves test/debug utilities for sensor data and formatting.

Enhances user control, accessibility, and code maintainability, while resolving previous issues with sensor name formatting and color contrast. [`(80b2e44)`](https://github.com/Nick2bad4u/FitFileViewer/commit/80b2e44b1c969a47ae740dbac675eda3a7c39931)


- Refactor and improve code readability across multiple utility files

- Updated various functions in `patchSummaryFields.js` to enhance readability by formatting conditional statements.
- Improved the structure of `renderAltitudeProfileChart.js`, `renderChartJS.js`, `renderGPSTrackChart.js`, `renderPowerVsHeartRateChart.js`, and `renderSpeedVsDistanceChart.js` for better clarity.
- Enhanced logging messages in `renderChartsWithData` and `shouldShowRenderNotification` for improved debugging.
- Cleaned up import statements in `renderMap.js` and `setupWindow.js` for consistency.
- Removed sensitive data from `gitleaks-report.json` and added configuration files for various tools including Checkov, Markdown Link Check, and Lychee.
- Updated `setupZoneData.js` to improve the extraction of heart rate zones.
- General code formatting and style improvements across multiple files to adhere to best practices. [`(2128d98)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2128d98c47634f38e04784341efb2ce36492a205)




## [22.9.0] - 2025-06-15


[[d5c18e4](https://github.com/Nick2bad4u/FitFileViewer/commit/d5c18e4b82598d1df4a24aca265504a0bbf52af3)...
[0931bbd](https://github.com/Nick2bad4u/FitFileViewer/commit/0931bbd36523cdc74818b12147c6434c6866ce4e)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/d5c18e4b82598d1df4a24aca265504a0bbf52af3...0931bbd36523cdc74818b12147c6434c6866ce4e))


### 💼 Other

- Modularizes map actions and adds themed UI utilities

Refactors map action button logic into dedicated modules for better maintainability and separation of concerns. Introduces new utility classes and theme-aware helper functions to ensure consistent styling across interactive map controls. Adds robust error handling and notification feedback for overlay file operations. Enhances user experience by improving overlay loading, theming, and map centering logic, and updates workflow and linter configurations for improved CI/CD feedback. [`(0931bbd)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0931bbd36523cdc74818b12147c6434c6866ce4e)


- Refactor chart utilities and enhance theme handling

- Removed the chart specification generation code from chartSpec.js, streamlining the chart rendering process.
- Improved the chart theme listener in chartThemeListener.js for better event handling and performance.
- Updated ensureAboutModal.js to enhance modal initialization and styling.
- Cleaned up exportAllCharts.js by removing unnecessary whitespace.
- Refined modal styles injection in injectModalStyles.js to prevent duplicate style applications.
- Enhanced animation logging utility in lastAnimLog.js for better performance tracking during development.
- Improved version information loading in loadVersionInfo.js for dynamic updates.
- Updated system information display logic in updateSystemInfo.js for better clarity.
- Added gitleaks-report.json to track potential API key exposure in the codebase. [`(07f01c6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/07f01c601ecc9c3c5e720de2231ecebd734fa321)


- Refactor and enhance modal functionality; remove unused chart tab, optimize notification delay, and improve theme configurations

- Removed the "chart" tab functionality from the setupWindow.js file.
- Reduced the notification processing delay from 200ms to 50ms in showNotification.js.
- Updated theme.js to adjust surface color opacity and added new color zones for various functionalities.
- Modified toggleTabVisibility.js to exclude the "content-chart" from the tab content IDs.
- Fixed import path for throttledAnimLog in updateChartAnimations.js.
- Added new utility functions for about modal management, including ensureAboutModal.js, loadVersionInfo.js, updateSystemInfo.js, and injectModalStyles.js.
- Implemented a throttled animation logging utility in lastAnimLog.js for better performance during development.
- Created exportAllCharts.js to handle exporting multiple charts with notifications for success or failure. [`(d5c18e4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d5c18e4b82598d1df4a24aca265504a0bbf52af3)




## [22.7.0] - 2025-06-15


[[4064001](https://github.com/Nick2bad4u/FitFileViewer/commit/4064001df17fce67d9fde5eb04a9b5743464476c)...
[4030638](https://github.com/Nick2bad4u/FitFileViewer/commit/403063838cdda2c7a496838806b54909461420f3)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/4064001df17fce67d9fde5eb04a9b5743464476c...403063838cdda2c7a496838806b54909461420f3))


### 🚜 Refactor

- Update Gyazo configuration data with new obfuscation method [`(4030638)`](https://github.com/Nick2bad4u/FitFileViewer/commit/403063838cdda2c7a496838806b54909461420f3)



### 🛡️ Security

- Improves obfuscation for default Gyazo credentials

Adds extra encoding and transformation layers to default credential obfuscation, making demo credentials less easily extracted from the code. Enhances onboarding security without impacting user experience. [`(7bbab40)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7bbab4003ff4d9186b5c0b1e8690cd10a08e0f82)


- Obfuscate default Gyazo credentials for improved security [`(4064001)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4064001df17fce67d9fde5eb04a9b5743464476c)




## [22.4.0] - 2025-06-15


[[4c52de5](https://github.com/Nick2bad4u/FitFileViewer/commit/4c52de52f856fd4bd6670b1e04c2e01044982cf1)...
[5d82f2e](https://github.com/Nick2bad4u/FitFileViewer/commit/5d82f2efe8b8c44eb0ff0a882a70606ac66d28bf)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/4c52de52f856fd4bd6670b1e04c2e01044982cf1...5d82f2efe8b8c44eb0ff0a882a70606ac66d28bf))


### 💼 Other

- Adds Gyazo integration with OAuth upload and theming

Implements direct Gyazo chart upload using a secure OAuth flow, including automatic local callback server management and user credential configuration via new settings UI. Updates export utilities, modal flows, and introduces account management and onboarding guides for Gyazo. Refactors chart and UI theming to use a robust, centralized theme configuration, improving color consistency and dark mode support. Enhances chart selection modals, hover effects, and settings controls for better UX and maintainability. [`(5d82f2e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5d82f2efe8b8c44eb0ff0a882a70606ac66d28bf)


- Unifies styling with CSS variables and refactors theme logic

Migrates hardcoded colors to CSS variables for consistent theming and easier maintenance across dark and light modes. Refactors chart re-rendering on theme change to ensure proper cleanup and real-time updates. Removes duplicated or redundant style logic, adds and adjusts hover/focus effects, and updates color opacities for modern, accessible visuals. Deletes the separate developer fields chart renderer, integrating its logic for better maintainability. Improves visual consistency and user experience in modals, dropdowns, and controls. [`(2790ed7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2790ed7f694fac0348c7986840950e0c88f548eb)


- Adds Gyazo integration with OAuth upload and theming

Implements direct Gyazo chart upload using a secure OAuth flow, including automatic local callback server management and user credential configuration via new settings UI. Updates export utilities, modal flows, and introduces account management and onboarding guides for Gyazo. Refactors chart and UI theming to use a robust, centralized theme configuration, improving color consistency and dark mode support. Enhances chart selection modals, hover effects, and settings controls for better UX and maintainability. [`(c75cddb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c75cddb9f3239ff300c4259ba665a0bf526b47e0)


- Unifies styling with CSS variables and refactors theme logic

Migrates hardcoded colors to CSS variables for consistent theming and easier maintenance across dark and light modes. Refactors chart re-rendering on theme change to ensure proper cleanup and real-time updates. Removes duplicated or redundant style logic, adds and adjusts hover/focus effects, and updates color opacities for modern, accessible visuals. Deletes the separate developer fields chart renderer, integrating its logic for better maintainability. Improves visual consistency and user experience in modals, dropdowns, and controls. [`(4c52de5)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4c52de52f856fd4bd6670b1e04c2e01044982cf1)



### 🛡️ Security

- Obfuscate default Gyazo credentials for improved security

[dependency] Update version 22.4.0

Improves obfuscation for default Gyazo credentials

Adds extra encoding and transformation layers to default credential obfuscation, making demo credentials less easily extracted from the code. Enhances onboarding security without impacting user experience. [`(b048580)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b0485801c3ba885a6a585c429c9063be2ea64eef)




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


[[79339d2](https://github.com/Nick2bad4u/FitFileViewer/commit/79339d2324cd2efbf5b4342617daac2daf922851)...
[21bf6c1](https://github.com/Nick2bad4u/FitFileViewer/commit/21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/79339d2324cd2efbf5b4342617daac2daf922851...21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034))


### 🚀 Features

- *(theme)* Enhance theme management with auto mode and smooth transitions [`(9411374)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9411374418655f6be63e2d0c2c11b9e520d9541b)



### 💼 Other

- Run Prettier on all Files. [`(21bf6c1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034)


- Modularizes chart rendering and improves data/unit handling

Refactors chart rendering logic into smaller, focused modules to enhance maintainability and scalability. Improves developer field chart support and ensures unit conversion follows user preferences per field. Streamlines imports, reduces duplication, and enhances chart debugging and logging for better chart data quality and troubleshooting.

Modularizes chart rendering and improves unit handling

Splits chart rendering logic into focused modules for better maintainability and scalability. Enhances support for developer fields and applies user-specific unit conversions per metric. Streamlines imports, reduces code duplication, and improves debugging/logging to aid troubleshooting and ensure chart data quality. [`(6e6ec92)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6e6ec9239bc393c804d8acb45ed7c0b6b8e78e62)


- Improves Chart.js theming with robust dark/light detection

Unifies and strengthens theme detection for all Chart.js charts, ensuring consistent light/dark appearance regardless of app state or user preference.

Adds a global background color plugin for Chart.js, enabling reliable theme-aware chart backgrounds. Refactors chart rendering functions to use this theme detection and plugin, improving chart readability and polish.

Cleans up legacy code, removes redundant theme logic, and enhances UI component event handler management to prevent memory leaks. [`(fad6333)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fad6333373c7a154c878deb90dafa81c6366faac)


- Revamps Chart.js integration with advanced controls and exports

Overhauls the chart rendering system to add a modern, toggleable controls panel, advanced export and sharing options (PNG, CSV, JSON, ZIP, clipboard, Imgur), and improved accessibility and error handling. Introduces support for zone data visualization, lap analysis charts, and professional styling with theme-aware design. Optimizes performance, code structure, and user feedback for a richer FIT file data experience.

Fixes chart layout, enhances maintainability, and prepares for future extensibility. [`(f852b00)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f852b00b5b566dd1b1126cf0dfa108b96a425a46)


- Enhances UI polish, modals, and notification system

Modernizes the UI with improved notification styles, icons, and queue management for better user feedback. Revamps the about modal with togglable system info and feature views, and introduces a dedicated, animated keyboard shortcuts modal. Refines initialization, error handling, and performance monitoring in the renderer process for greater robustness and developer experience. Updates style and linting configurations to support new visual components and ensures accessibility and consistency across dialogs. [`(a082640)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a082640df2aeae666efa952d526efc6c54065154)


- Modernizes UI with glassmorphism and improves UX

Revamps the user interface with a modern glassmorphism style, adding gradients, depth, and refined animations for a visually appealing and professional look.

Enhances modal dialogs, tab navigation, notifications, and overlay effects for consistency and accessibility. Unifies style constants, improves dark/light theming, and ensures responsive, accessible design throughout.

Refactors code for better modularity, state management, and error handling, including improved event cleanup and external link handling. Upgrades About modal with dynamic content, branding, and feature highlights.

Improves maintainability and performance with utility function organization, window state management, and development helpers.

Relates to UI/UX modernization and maintainability goals. [`(99bca90)`](https://github.com/Nick2bad4u/FitFileViewer/commit/99bca9067403a202d647d7942da8fd2df71ec662)


- Improves Linux menu handling and adds menu injection support

Refactors Linux menu logic to remove minimal menu fallback and enhance menu initialization logging for better troubleshooting.
Introduces a DevTools-accessible function to manually inject or reset the application menu from the renderer, streamlining menu debugging and development workflow.
Simplifies theme synchronization and adds safeguards to prevent invalid menu setups, improving stability and UI consistency across platforms. [`(43dee75)`](https://github.com/Nick2bad4u/FitFileViewer/commit/43dee75c0ea2854e268bd89d97581101dae59e4c)


- Enhance menu handling for Linux by adding minimal menu support and improving logging in buildAppMenu [`(e95fcae)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e95fcaeabdb7e080ea1333b466a75daf2537387a)


- Fix menu persistence on Linux by storing a reference to the main menu [`(b81d9eb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b81d9ebdb3025d2b430b17304b5f67d0282ec706)


- Refactors menu theme sync and adds menu setup safeguards

Simplifies menu theme handling by removing redundant logic and updating the menu only after renderer load for better sync. Adds safety checks and debug logging to prevent setting invalid or empty application menus, improving stability and troubleshooting of menu initialization.

Streamlines menu theme sync and adds menu safety checks

Simplifies theme synchronization by removing redundant menu update logic and ensuring menus are set only after renderer load for improved UI consistency. Adds debug logging and template validation to prevent invalid or empty menu setups, aiding stability and troubleshooting. [`(aea7282)`](https://github.com/Nick2bad4u/FitFileViewer/commit/aea7282b428ca2ef68ce33c5c3907e224b368e2a)


- Update dependencies, clarify UI, and add basic test

Upgrades several dev dependencies, including vitest and rollup,
to address stability and compatibility. Clarifies the UI by
marking the Zwift tab as work in progress. Adds a simple test
to verify chart rendering utility presence. Ensures the menu
bar stays visible in the application window for improved
usability. [`(710f13c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/710f13cbd9145feebd547f0c155e750eada85063)


- Replaces electron-store with electron-conf for settings

Switches settings persistence from electron-store to electron-conf
throughout the app to reduce dependencies and simplify configuration.
Removes electron-store and related packages, updates logic to use
electron-conf API for all settings access and storage. [`(79339d2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/79339d2324cd2efbf5b4342617daac2daf922851)



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


[[3d9898f](https://github.com/Nick2bad4u/FitFileViewer/commit/3d9898f277748fe63ad88425ef3c890f7a9145a6)...
[5debf80](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/3d9898f277748fe63ad88425ef3c890f7a9145a6...5debf805345db114c8a0ff6749ae0be9c5818ee5))


### 🚀 Features

- Enhance drag-and-drop functionality for Zwift iframe and improve tab management [`(f37ec72)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f37ec72fb276c31e9a693a75ef7bdbb28d2055a8)


- Update workflows to download all release assets and improve chart rendering options [`(55838f7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/55838f757ffcc227aef3bbe0b11a769575429e74)


- Add support for uploading distributables to archive.org and enhance drag-and-drop functionality in the UI [`(05ff7fd)`](https://github.com/Nick2bad4u/FitFileViewer/commit/05ff7fd76a85cba8eb20700f1df336a48d428afc)



### 💼 Other

- Enhance workflows and documentation for Flatpak build process, including versioning updates and new download options [`(5debf80)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)


- Update changelogs and version numbers for releases 16.4.0, 16.5.0, and 16.6.0; enhance GitHub Actions and implement release cleanup script [`(24a9a97)`](https://github.com/Nick2bad4u/FitFileViewer/commit/24a9a97718f3058e1b0a537d7e41096386388202)


- Update changelogs and scripts: Add new version numbers, enhance GitHub Actions, and implement release cleanup script [`(8593346)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8593346c7d028dc0a02661bcdf9b353846e99e9d)


- Refactor build workflow and update artifact naming conventions; improve CSS stylelint rules and fix README formatting [`(7e98645)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7e98645c576e0961a125d8aa8edb4df627d43dc7)


- Improves UI robustness and fullscreen handling

Refactors UI utility functions for better error handling, DOM validation, and code clarity. Enhances fullscreen logic for reliability and accessibility, including robust event management and overlay cleanup. Updates map layer attributions and usage notes, improves notification display, and adds more defensive checks throughout tab and table-related utilities. Also updates version metadata and minor menu text.

These improvements aim to make the app's interface more resilient to edge cases and DOM inconsistencies while streamlining the codebase for maintainability. [`(79f905d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/79f905d7769e8c4cad6d4830679adb6a104b2dd7)


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



### ⚙️ Miscellaneous Tasks

- Update changelogs and scripts for versioning and GitHub Actions enhancements [`(1fc3c44)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1fc3c44efbc84701690e71b9c43ab2d510bfe15a)


- Update changelogs and scripts for versioning and GitHub Actions enhancements [`(27471d3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/27471d38f7b7749f7b57665551aeb8696b5fbcbe)


- Add changelog files for electron-app, tests, and utils [`(b9d2e0a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b9d2e0a4df3224672415510d505e98054a593934)


- Update dependencies and improve map rendering logic [`(3d9898f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3d9898f277748fe63ad88425ef3c890f7a9145a6)



### 🛡️ Security

- Improves event handling and security, streamlines startup

Refines event listener options for better touch and scroll control, enhancing responsiveness and preventing unwanted behavior. Strengthens security by blocking navigation to untrusted URLs in new and existing windows. Simplifies tab setup logic and startup functions for maintainability. Excludes certain library files from automated workflows and linting to speed up CI. Small UI and code hygiene improvements. [`(95a1c15)`](https://github.com/Nick2bad4u/FitFileViewer/commit/95a1c15c5c64964801264db90b143e7d68620662)




## [11.0.0] - 2025-05-14


[[4dcb5f7](https://github.com/Nick2bad4u/FitFileViewer/commit/4dcb5f7f3ba754fdc51d7c2d81c9447da0952b46)...
[2316116](https://github.com/Nick2bad4u/FitFileViewer/commit/23161160c246c69a6b8aa749c6e2f89fc4157a88)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/4dcb5f7f3ba754fdc51d7c2d81c9447da0952b46...23161160c246c69a6b8aa749c6e2f89fc4157a88))


### 💼 Other

- Refactors and optimizes codebase formatting and structure

Applies consistent formatting across files to enhance readability
Reduces nested conditions and simplifies logic for maintainability
Improves performance by optimizing loops and reducing redundant calculations
Updates Prettier configuration for ES5 trailing comma style

No functional changes introduced [`(c97927a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c97927a1115ca0fa18917f9f2ea45425de938371)


- Enhances map visualization and chart customization

Adds refined tooltip styling and animations for Vega charts
Improves chart theming and axis/legend configuration for clarity
Optimizes map drawing logic and lap data handling for better accuracy
Introduces error handling for missing location data

Fixes #123 [`(7b71cbc)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7b71cbcd657014b5ec678b9f14fbf534d0c4b1e2)


- Refactor code structure and remove redundant sections for improved readability and maintainability [`(85ec8d0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/85ec8d0b188bec04e99ea841b2239bc20229bef3)


- Enhance theme handling and improve map rendering performance; update version to 10.4.0 [`(ebd1489)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ebd14896dbd1591d82ae28dd3981dca74b3e7bb5)


- Enhance GPX export button validation and improve file loading error handling [`(bb93488)`](https://github.com/Nick2bad4u/FitFileViewer/commit/bb9348828a81f2ae7d40e7bda833ef4077d9d502)


- Enhance elevation profile button and loading overlay functionality [`(4aa9c63)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4aa9c63d6326854d402a9b2024bbe6d318b7fca2)



### 📦 Dependencies

- [dependency] Update version 10.9.0 and enhance overlay handling in map rendering

Enhances map overlay handling and updates version

Improves map rendering by refining overlay management, ensuring precise zoom behavior, and adding robustness to polyline handling. Updates overlay color palette to exclude similar colors and introduces logic to highlight active overlays. [dependency] Updates application version to 10.9.0 for feature enhancement.

Relates to improved user experience in map visualization. [`(2316116)`](https://github.com/Nick2bad4u/FitFileViewer/commit/23161160c246c69a6b8aa749c6e2f89fc4157a88)


- [dependency] Update version 10.1.0 and enhance overlay file management with accessibility checks and clear all functionality [`(4dcb5f7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4dcb5f7f3ba754fdc51d7c2d81c9447da0952b46)




## [10.0.0] - 2025-05-11


[[4e606a3](https://github.com/Nick2bad4u/FitFileViewer/commit/4e606a3ce5c39d88f68fe7999379ac64ffc15eb0)...
[ea9ba1a](https://github.com/Nick2bad4u/FitFileViewer/commit/ea9ba1a537b246d8e257744abbd9d3d08f8c6d74)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/4e606a3ce5c39d88f68fe7999379ac64ffc15eb0...ea9ba1a537b246d8e257744abbd9d3d08f8c6d74))


### 🚀 Features

- Update Node.js version to 20 in workflows [`(106a149)`](https://github.com/Nick2bad4u/FitFileViewer/commit/106a149f47fc0291246bb2ede3625de104419ea4)


- Enhance Electron app functionality and UI [`(012b014)`](https://github.com/Nick2bad4u/FitFileViewer/commit/012b0141eb04038847bdbae1e4e56ae2ab74af8e)


- Refactor UI components and enhance fullscreen functionality with new utilities [`(988adb5)`](https://github.com/Nick2bad4u/FitFileViewer/commit/988adb5463cb938635570ad03c49e84e2877de5b)


- Enhance UI and functionality with modern modal dialog and improved notifications [`(2a544bc)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2a544bc72bf7513bdf3ffe77a452b72760511ee4)


- Update credits section in index.html and enhance accessibility features in the app menu [`(94b964c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/94b964c73525caf9fd9b7166000ec22368057dcb)


- Enhance accessibility features with font size and high contrast options [`(2ae1eb2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2ae1eb2bd1d40d766947b41a8d7f71def0a98928)


- Unify file open logic and ensure both readers update from all sources [`(b4a5fa1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b4a5fa18762b02e939708dcdd8ec0c1acaa8d82d)


- Add mapping for unknown FIT messages and enhance label application logic [`(c0bb2e0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c0bb2e04a790d92079591e6b919e08b0e554fd92)


- Enhance lap row rendering to include start time in summary table [`(3a04266)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3a042665850f928f6ff8f8708535b5b10e497ad5)


- Add marker count selector and update map rendering logic [`(fbf0cc4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fbf0cc4f1afd264fb4709bbb4526b1633ba2b081)


- Implement multi-select mode for lap selection and add simple measurement tool [`(675b10d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/675b10d46669e4462935ae02fc6cdbe8b4f4ae50)


- Enhance map rendering with lap selection UI and improved control styles [`(7500912)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7500912e02570b1f2c2e026128d3316648d30366)


- Add custom map type selection button and zoom slider for enhanced user interaction [`(e38d3f7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e38d3f7ac05c1a118f06f1ac53e37f37772dc561)


- Add scroll wheel support for filter selection in renderTable function [`(e6dbd66)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e6dbd6635377996560cae07d6a2814b400fe2ed3)


- Implement theme switching and persistence with utility functions [`(4f8446b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4f8446b3c7739395e4cabaa8e05e0a96c721c244)


- Implement theme switching and persistence across the Electron app [`(583dc67)`](https://github.com/Nick2bad4u/FitFileViewer/commit/583dc67e21bf752fdb04935e040240509e9a12a9)


- Add comprehensive tests for main UI, preload, and window state utilities [`(59bc75d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/59bc75daaa134915200ae207a4bdc8964af97843)


- Enhance utility functions with detailed JSDoc comments for better documentation [`(992b602)`](https://github.com/Nick2bad4u/FitFileViewer/commit/992b60253bdb058f31d2ad00e0b7e5ddb3589527)


- Add window resize handler for responsive chart rendering [`(51cfc34)`](https://github.com/Nick2bad4u/FitFileViewer/commit/51cfc34532a7b9b6e8862717e64004ed41902e08)


- Refactor and modularize recent files and renderer utilities [`(6f675d2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6f675d2b4c40a544e203937397fd0dda2ee013d0)


- Move recent files utility functions to separate module [`(4df97de)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4df97de69cb305043197309a1ca949375e9aaf05)


- Refactor showFitData and tab management functions into separate utility modules [`(12cb3c9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/12cb3c90288a9c4522f1d6679f7ba0545d3a6344)


- Implement window state management and add utility functions for formatting speed and arrays [`(a3d9fa8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a3d9fa84f609522bd1e5048fd82f8aada4bb664d)


- Add utility functions for CSV export, distance and duration formatting, and summary patching [`(4e606a3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4e606a3ce5c39d88f68fe7999379ac64ffc15eb0)



### 🐛 Bug Fixes

- Update vite version to 6.3.4; enhance measurement tool UI with SVG icons and add GPX export functionality [`(47e4081)`](https://github.com/Nick2bad4u/FitFileViewer/commit/47e4081ac773f830c2a3025cb4eeb3e925434339)



### 💼 Other

- Enhances map overlay functionality and fixes workflow issues

Refines map rendering with dynamic overlay highlights and improved color management. Updates tooltip display to include filenames and enhances UI accessibility. Exports color palette for consistency across components.

Fixes unsupported input in repo-stats workflow and corrects artifact path in eslint workflow. Updates dependencies to version 9.9.0. [`(ea9ba1a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ea9ba1a537b246d8e257744abbd9d3d08f8c6d74)


- Enhance map rendering functionality with fit file overlays and new controls

- Integrated functionality to add fit files to the map, including a button for adding fit files and a list to display shown files.
- Implemented overlay drawing for loaded fit files, allowing for visual representation on the map.
- Updated marker count selector to refresh the shown files list when the marker count changes.
- Improved map controls by adding a simple measurement tool and ensuring proper bounds fitting for overlays.
- Added favicon.ico to the project. [`(70011db)`](https://github.com/Nick2bad4u/FitFileViewer/commit/70011dbd3aeb0317b05a1cf83f419e15831d9dd6)


- Implement fullscreen toggle functionality and update version to 6.8.0 [`(b54ecfd)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b54ecfd45132c456b200b11b1a9e75051a618467)


- Enhance application menu with About and Keyboard Shortcuts options, and enable restart after updates [`(02c6a7c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/02c6a7c8f5c02f0780e839bddd7454b5e1cc01ee)


- Update version to 6.3.0 and enhance artifact handling in package.json; modify buildAppMenu.js for menu item updates [`(3b8e4d7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3b8e4d729f8ee430a4a089370c71bfb25f4e31aa)


- Add IPC handlers for file menu actions and enhance export functionality [`(58b851b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/58b851b2c40682059c4a163d7c1397542089e3e7)


- Refactor buildAppMenu function parameters for improved readability and update package version to 5.2.0 [`(cb7b5b9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/cb7b5b9350f68551dfb3866b559a34eb944cbdc6)


- Implement theme management and decoder options persistence using electron-store [`(052bd8e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/052bd8ea49898cd2ab322e90b69dc3451fc2416a)


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
Enhances dark/light mode theme compatibility [`(86e03ae)`](https://github.com/Nick2bad4u/FitFileViewer/commit/86e03ae872fb5ee91f2e047e5a76b21373621708)


- Add point-to-point measurement tool for Leaflet maps [`(fca1c97)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fca1c9700fdb4b57e9a56b1d7608d3181604bec2)


- Refactor code structure for improved readability and maintainability [`(88e148c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/88e148c7504be074165b837e32c5106784533367)


- Refactor code structure for improved readability and maintainability [`(7d47ed4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7d47ed47819331fbaeb1b72d46bbd091a84f400e)


- Refactor code structure and remove redundant sections for improved readability and maintainability [`(e9edc96)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e9edc96add46c5b3c36e3c45875348fa19797ace)


- Fix path to Chart.js library in renderMap function for elevation profile chart [`(a469870)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a469870f4989ed5a0436c9986acf939cf97ce006)


- Refactor code structure for improved readability and maintainability [`(0c59119)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0c591197cb36f33685bf0ed1753ee0edfa5f6bc5)


- Enhance theme handling in chart rendering; support light and dark themes in getChartSpec and re-render chart on theme change [`(513275c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/513275cf6d0712e5b9e23677a9da81ad8102d367)


- Remove obsolete test files for chart, map, summary, table, renderer, and utility functions

- Deleted tests for renderChart, renderMap, renderSummary, renderTable, and showFitData.
- Removed tests for rendererUtils, toggleTabVisibility, and windowStateUtils.
- Cleaned up theme and style tests, along with utility tests.
- Removed associated CSS files used for testing styles. [`(c946ca2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c946ca2766237441eeb8cb3e6b9f9d2323dda35f)


- Refactor renderSummary and add helper functions for improved column management; enhance summary rendering and UI interactions [`(fedd7dd)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fedd7dd1385b135bb56ea8e54a39ef4cb2399aa3)


- Refactor showFitData function and add unload file functionality; enhance summary rendering and UI updates [`(b6df0a9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b6df0a9c223f4b0ede21c4d4e4d72896ec041401)


- Add column width synchronization for summary and lap tables [`(06e4f6e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/06e4f6ebe7ba6910551af2ed508c8d51499b9f2b)


- Enhance FIT file loading functionality and menu integration

- Implemented global state management for loaded FIT file path.
- Updated IPC communication to notify main process of loaded FIT files.
- Modified buildAppMenu to enable/disable Summary Columns based on loaded FIT file.
- Improved recent files path handling for better compatibility in different environments. [`(f620d76)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f620d76293c3502ed7912bfebb7e16809721b51f)


- Add summary column selector functionality and modal for column preferences [`(35e10a1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/35e10a15e675c6c0632f68c695df00be38acbd58)


- Refactor renderSummary function to use CSS classes for summary and lap section styling [`(3afbb44)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3afbb4408aaa7d5d0280d7286b073d8ff5555148)


- Refactor renderSummary function layout for improved styling and alignment [`(59b0337)`](https://github.com/Nick2bad4u/FitFileViewer/commit/59b0337bc846615a2bf2b2cd51fd4d55002718a8)


- Enhance renderSummary function layout with improved styling for summary section and header bar [`(caf86a5)`](https://github.com/Nick2bad4u/FitFileViewer/commit/caf86a55f6d1f24a5284d04023201b6311dfefd0)


- Refactor null checks in patchSummaryFields utility functions for consistency and clarity [`(9d9f8bf)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9d9f8bf09f32ca0c638138b38305ea5dea62c2c5)


- Enhance documentation for getChartSpec function with detailed parameter and return descriptions [`(29f7503)`](https://github.com/Nick2bad4u/FitFileViewer/commit/29f7503bace5761d4a285e801c3a2d10de9c8d18)


- Enhance renderChart function with improved error handling and validation for chart data [`(193eeaa)`](https://github.com/Nick2bad4u/FitFileViewer/commit/193eeaad6e68535f3fbe90ec4465930d7172845e)


- Improve error handling and formatting in renderChart function [`(a9c6d30)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a9c6d30ab5367e2b05871807d1e3df34ce60ec32)


- Add chart specification and enhance chart rendering logic with error handling [`(6aff529)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6aff529476d3326bb0fd61d08fa806f1d15c4f04)


- Enhance chart rendering logic to filter allowed fields and provide user feedback for missing data; update ESLint config to disable console warnings. [`(5feb564)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5feb5647700f52ce5aaf9cb69b888abef031c072)


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
- Add tests for toggleTabVisibility to ensure correct visibility toggling of tab content. [`(76ee05e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/76ee05e2e718c642184eeb42f7428f8ba499a0c4)



### 🚜 Refactor

- Remove unused VS Code extension files and assets [`(5dee8ce)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5dee8ce6b99dfcb7c38b3a18220009aa39a1c3e8)


- Change Dependabot update schedule from daily to monthly for all ecosystems; add lap selection UI logic to a new module [`(23e22ea)`](https://github.com/Nick2bad4u/FitFileViewer/commit/23e22ea4a3b382f4f6dbce8a3f46d3f791cff3d5)


- Update ESLint configuration to use ES module syntax and simplify filter value persistence in renderTable function [`(16e1620)`](https://github.com/Nick2bad4u/FitFileViewer/commit/16e1620912942d0a26f7454e74cc011d6d0cf854)


- Improve error handling in theme persistence and loading functions [`(9ce7585)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9ce7585cb45d03d64b315c25e51ee7e8435f4e7f)


- Refactor: improve formatDuration function to handle string inputs and ensure finite number validation
refactor: enhance renderSummary function to filter out empty or invalid summary columns
fix: add logic to renderTable for destroying existing DataTable instances before reinitialization [`(4e0792e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4e0792edf5fb370652d1a6a631627786a18fa11a)


- Remove unused roles from the application menu [`(117200a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/117200a9778e21a627e18489e1d48b377c121332)


- Remove unused test_index.html and update utility functions for theme management [`(fc8a013)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fc8a0131517cad16e9f95ffa888b8e343fe7f447)


- Optimize chart rendering and enhance tab visibility handling; improve styling for better layout [`(dd091ec)`](https://github.com/Nick2bad4u/FitFileViewer/commit/dd091ec4f9c09089b0db6dde6b7a717662910eeb)


- Enhance background data pre-rendering and improve DataTables pagination in night mode [`(4b0bfe7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4b0bfe72c43eb7daf82ae419145c6ae52a0b1d1b)


- Improve patchSummaryFields function; enhance readability and validation for summary metrics [`(a2bdb9c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a2bdb9c863ac7ef3c9cd3ea4cfe164b20052a335)


- Enhance formatting functions for distance and duration; improve validation and error handling [`(ad25e6e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ad25e6ebc902f0d8586fcbc055ecea566614f331)


- Improve object serialization in copyTableAsCSV function; enhance performance and prevent redundant serialization [`(9f3399d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9f3399d72e377a3f3b32a5d554ea9d66cb39b20d)


- Enhance error handling and key sorting in displayTables function; improve code clarity and robustness [`(9f8478e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9f8478eaf1735c0f3c71a5d2df808c73e63e7998)


- Improve code formatting and organization across multiple files for better readability [`(5092827)`](https://github.com/Nick2bad4u/FitFileViewer/commit/50928276602fbb3f80bb2dbea8383b5bc392bbca)



### 📚 Documentation

- Enhance .gitkeep with guidelines for organizing Jest test files [`(69bc1cb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/69bc1cb4a32f57c60927426f795c10a52144cd87)



### 🎨 Styling

- Add elevation profile CSS for dark and light themes [`(64cb888)`](https://github.com/Nick2bad4u/FitFileViewer/commit/64cb88893772d7c02ad51c62565a84e8372da391)



### 🧪 Testing

- Add unit tests for theme management functions [`(d4fb1ea)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d4fb1ea9f72873a997bace674a3ac98c662baf93)



### ⚙️ Miscellaneous Tasks

- Update GitHub Actions workflows and dependencies; fix badge link in README [`(c401c26)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c401c26b48c572958c7a8cb8a3e58fd556c88d12)


- Update dependencies and version to 2.3.10 [`(962ac81)`](https://github.com/Nick2bad4u/FitFileViewer/commit/962ac81455aa0861558c517356bcae038c4695d9)



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
