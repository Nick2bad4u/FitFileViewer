<!-- markdownlint-disable -->
# Changelog

All notable changes to this project will be documented in this file.

## [unreleased]

### 💼 Other

- Replaces electron-store with electron-conf for settings

Switches settings persistence from electron-store to electron-conf
throughout the app to reduce dependencies and simplify configuration.
Removes electron-store and related packages, updates logic to use
electron-conf API for all settings access and storage.

- Update dependencies, clarify UI, and add basic test

Upgrades several dev dependencies, including vitest and rollup,
to address stability and compatibility. Clarifies the UI by
marking the Zwift tab as work in progress. Adds a simple test
to verify chart rendering utility presence. Ensures the menu
bar stays visible in the application window for improved
usability.

- Streamlines workflows, settings, and updates versioning

Refactors repository workflows for improved metrics and Flatpak
builds, replaces settings storage to reduce dependencies, and
enhances UI consistency across platforms. Updates auto-update
handling and Linux messaging, clarifies documentation, and bumps
version to 19.7.0. Improves security by updating GitHub Actions
dependencies.

- Refactors menu theme sync and adds menu setup safeguards

Simplifies menu theme handling by removing redundant logic and updating the menu only after renderer load for better sync. Adds safety checks and debug logging to prevent setting invalid or empty application menus, improving stability and troubleshooting of menu initialization.

Streamlines menu theme sync and adds menu safety checks

Simplifies theme synchronization by removing redundant menu update logic and ensuring menus are set only after renderer load for improved UI consistency. Adds debug logging and template validation to prevent invalid or empty menu setups, aiding stability and troubleshooting.

- Fix menu persistence on Linux by storing a reference to the main menu

- Enhance menu handling for Linux by adding minimal menu support and improving logging in buildAppMenu

- Improves Linux menu handling and adds menu injection support

Refactors Linux menu logic to remove minimal menu fallback and enhance menu initialization logging for better troubleshooting.
Introduces a DevTools-accessible function to manually inject or reset the application menu from the renderer, streamlining menu debugging and development workflow.
Simplifies theme synchronization and adds safeguards to prevent invalid menu setups, improving stability and UI consistency across platforms.


## [19.0.0] - 2025-06-07

### 🚀 Features

- Add support for uploading distributables to archive.org and enhance drag-and-drop functionality in the UI

- Update workflows to download all release assets and improve chart rendering options

- Enhance drag-and-drop functionality for Zwift iframe and improve tab management


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

- Improves UI robustness and fullscreen handling

Refactors UI utility functions for better error handling, DOM validation, and code clarity. Enhances fullscreen logic for reliability and accessibility, including robust event management and overlay cleanup. Updates map layer attributions and usage notes, improves notification display, and adds more defensive checks throughout tab and table-related utilities. Also updates version metadata and minor menu text.

These improvements aim to make the app's interface more resilient to edge cases and DOM inconsistencies while streamlining the codebase for maintainability.

- Improves event handling and security, streamlines startup

Refines event listener options for better touch and scroll control, enhancing responsiveness and preventing unwanted behavior. Strengthens security by blocking navigation to untrusted URLs in new and existing windows. Simplifies tab setup logic and startup functions for maintainability. Excludes certain library files from automated workflows and linting to speed up CI. Small UI and code hygiene improvements.

- Refactor build workflow and update artifact naming conventions; improve CSS stylelint rules and fix README formatting

- Update changelogs and scripts: Add new version numbers, enhance GitHub Actions, and implement release cleanup script

- Update changelogs and version numbers for releases 16.4.0, 16.5.0, and 16.6.0; enhance GitHub Actions and implement release cleanup script

- Enhance workflows and documentation for Flatpak build process, including versioning updates and new download options


### ⚙️ Miscellaneous Tasks

- Update dependencies and improve map rendering logic

- Add changelog files for electron-app, tests, and utils

- Update changelogs and scripts for versioning and GitHub Actions enhancements

- Update changelogs and scripts for versioning and GitHub Actions enhancements


## [11.0.0] - 2025-05-14

### 🆕 New Version Number

- Bump version to 10.1.0 and enhance overlay file management with accessibility checks and clear all functionality

- Bump version to 10.9.0 and enhance overlay handling in map rendering

Enhances map overlay handling and updates version

Improves map rendering by refining overlay management, ensuring precise zoom behavior, and adding robustness to polyline handling. Updates overlay color palette to exclude similar colors and introduces logic to highlight active overlays. Bumps application version to 10.9.0 for feature enhancement.

Relates to improved user experience in map visualization.


### 💼 Other

- Enhance elevation profile button and loading overlay functionality

- Enhance GPX export button validation and improve file loading error handling

- Enhance theme handling and improve map rendering performance; update version to 10.4.0

- Refactor code structure and remove redundant sections for improved readability and maintainability

- Enhances map visualization and chart customization

Adds refined tooltip styling and animations for Vega charts
Improves chart theming and axis/legend configuration for clarity
Optimizes map drawing logic and lap data handling for better accuracy
Introduces error handling for missing location data

Fixes #123

- Refactors and optimizes codebase formatting and structure

Applies consistent formatting across files to enhance readability
Reduces nested conditions and simplifies logic for maintainability
Improves performance by optimizing loops and reducing redundant calculations
Updates Prettier configuration for ES5 trailing comma style

No functional changes introduced


## [10.0.0] - 2025-05-11

### 🚀 Features

- Add utility functions for CSV export, distance and duration formatting, and summary patching

- Implement window state management and add utility functions for formatting speed and arrays

- Refactor showFitData and tab management functions into separate utility modules

- Move recent files utility functions to separate module

- Refactor and modularize recent files and renderer utilities

- Add window resize handler for responsive chart rendering

- Enhance utility functions with detailed JSDoc comments for better documentation

- Add comprehensive tests for main UI, preload, and window state utilities

- Implement theme switching and persistence across the Electron app

- Implement theme switching and persistence with utility functions

- Add scroll wheel support for filter selection in renderTable function

- Add custom map type selection button and zoom slider for enhanced user interaction

- Enhance map rendering with lap selection UI and improved control styles

- Implement multi-select mode for lap selection and add simple measurement tool

- Add marker count selector and update map rendering logic

- Enhance lap row rendering to include start time in summary table

- Add mapping for unknown FIT messages and enhance label application logic

- Unify file open logic and ensure both readers update from all sources

- Enhance accessibility features with font size and high contrast options

- Update credits section in index.html and enhance accessibility features in the app menu

- Enhance UI and functionality with modern modal dialog and improved notifications

- Refactor UI components and enhance fullscreen functionality with new utilities

- Enhance Electron app functionality and UI

- Update Node.js version to 20 in workflows


### 🐛 Bug Fixes

- Update vite version to 6.3.4; enhance measurement tool UI with SVG icons and add GPX export functionality


### 💼 Other

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

- Enhance chart rendering logic to filter allowed fields and provide user feedback for missing data; update ESLint config to disable console warnings.

- Add chart specification and enhance chart rendering logic with error handling

- Improve error handling and formatting in renderChart function

- Enhance renderChart function with improved error handling and validation for chart data

- Enhance documentation for getChartSpec function with detailed parameter and return descriptions

- Refactor null checks in patchSummaryFields utility functions for consistency and clarity

- Enhance renderSummary function layout with improved styling for summary section and header bar

- Refactor renderSummary function layout for improved styling and alignment

- Refactor renderSummary function to use CSS classes for summary and lap section styling

- Add summary column selector functionality and modal for column preferences

- Enhance FIT file loading functionality and menu integration

- Implemented global state management for loaded FIT file path.
- Updated IPC communication to notify main process of loaded FIT files.
- Modified buildAppMenu to enable/disable Summary Columns based on loaded FIT file.
- Improved recent files path handling for better compatibility in different environments.

- Add column width synchronization for summary and lap tables

- Refactor showFitData function and add unload file functionality; enhance summary rendering and UI updates

- Refactor renderSummary and add helper functions for improved column management; enhance summary rendering and UI interactions

- Remove obsolete test files for chart, map, summary, table, renderer, and utility functions

- Deleted tests for renderChart, renderMap, renderSummary, renderTable, and showFitData.
- Removed tests for rendererUtils, toggleTabVisibility, and windowStateUtils.
- Cleaned up theme and style tests, along with utility tests.
- Removed associated CSS files used for testing styles.

- Enhance theme handling in chart rendering; support light and dark themes in getChartSpec and re-render chart on theme change

- Refactor code structure for improved readability and maintainability

- Fix path to Chart.js library in renderMap function for elevation profile chart

- Refactor code structure and remove redundant sections for improved readability and maintainability

- Refactor code structure for improved readability and maintainability

- Refactor code structure for improved readability and maintainability

- Add point-to-point measurement tool for Leaflet maps

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

- Implement theme management and decoder options persistence using electron-store

- Refactor buildAppMenu function parameters for improved readability and update package version to 5.2.0

- Add IPC handlers for file menu actions and enhance export functionality

- Update version to 6.3.0 and enhance artifact handling in package.json; modify buildAppMenu.js for menu item updates

- Enhance application menu with About and Keyboard Shortcuts options, and enable restart after updates

- Implement fullscreen toggle functionality and update version to 6.8.0

- Refactor and enhance Electron app functionality

- Added global variable declaration in renderTable.js for jQuery usage.
- Simplified error handling in setupTheme.js by removing the error parameter.
- Improved showFitData.js by refactoring file name handling and UI updates for better readability and performance.
- Updated windowStateUtils.js to include global variable declarations for better compatibility.
- Removed package-lock.json and package.json to streamline dependencies.
- Introduced GitHub Actions workflows for automated greetings, security scanning with Sobelow, style linting, and code linting with Super Linter.
- Added screenfull.min.js library for fullscreen functionality.
- Implemented setupWindow.js to manage window load events and tab interactions more efficiently.

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

- Enhance map rendering functionality with fit file overlays and new controls

- Integrated functionality to add fit files to the map, including a button for adding fit files and a list to display shown files.
- Implemented overlay drawing for loaded fit files, allowing for visual representation on the map.
- Updated marker count selector to refresh the shown files list when the marker count changes.
- Improved map controls by adding a simple measurement tool and ensuring proper bounds fitting for overlays.
- Added favicon.ico to the project.

- Enhances map overlay functionality and fixes workflow issues

Refines map rendering with dynamic overlay highlights and improved color management. Updates tooltip display to include filenames and enhances UI accessibility. Exports color palette for consistency across components.

Fixes unsupported input in repo-stats workflow and corrects artifact path in eslint workflow. Updates dependencies to version 9.9.0.


### 🚜 Refactor

- Improve code formatting and organization across multiple files for better readability

- Enhance error handling and key sorting in displayTables function; improve code clarity and robustness

- Improve object serialization in copyTableAsCSV function; enhance performance and prevent redundant serialization

- Enhance formatting functions for distance and duration; improve validation and error handling

- Improve patchSummaryFields function; enhance readability and validation for summary metrics

- Enhance background data pre-rendering and improve DataTables pagination in night mode

- Optimize chart rendering and enhance tab visibility handling; improve styling for better layout

- Remove unused test_index.html and update utility functions for theme management

- Remove unused roles from the application menu

- Refactor: improve formatDuration function to handle string inputs and ensure finite number validation
refactor: enhance renderSummary function to filter out empty or invalid summary columns
fix: add logic to renderTable for destroying existing DataTable instances before reinitialization

- Improve error handling in theme persistence and loading functions

- Update ESLint configuration to use ES module syntax and simplify filter value persistence in renderTable function

- Change Dependabot update schedule from daily to monthly for all ecosystems; add lap selection UI logic to a new module

- Remove unused VS Code extension files and assets


### 📚 Documentation

- Enhance .gitkeep with guidelines for organizing Jest test files


### 🎨 Styling

- Add elevation profile CSS for dark and light themes


### 🧪 Testing

- Add unit tests for theme management functions


### ⚙️ Miscellaneous Tasks

- Update dependencies and version to 2.3.10

- Update GitHub Actions workflows and dependencies; fix badge link in README


<!-- generated by git-cliff -->
