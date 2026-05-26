# FitFileViewer - Complete Application Layout Guide

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Core Application Files](#core-application-files)
- [Utility Module Organization](#utility-module-organization)
- [Configuration & Build System](#configuration--build-system)
- [Testing Infrastructure](#testing-infrastructure)
- [Documentation & Assets](#documentation--assets)
- [CI/CD & Automation](#cicd--automation)

## Project Structure

```text
FitFileViewer/                          # Root directory
├── .github/                            # GitHub configuration & workflows
├── docs/                              # Documentation files
├── electron-app/                      # Main application directory
├── fit-test-files/                   # Test FIT files for development
├── logs/                             # Application logs
├── utils/                            # Shared utilities (legacy)
├── README.md                         # Project overview & usage
├── LICENSE.md                        # Project license
├── CHANGELOG.md                      # Version history
├── package.json                      # Root package configuration
└── [Config Files]                    # Various configuration files
```

## Core Application Files

### Entry Points & Process Management

```text
electron-app/
├── main.js                           # Main Electron process (2,000+ lines)
│   ├── App lifecycle management
│   ├── Window creation & management
│   ├── IPC handlers (50+ handlers)
│   ├── Menu system
│   ├── File dialogs
│   ├── Auto-updater integration
│   └── Security configuration
│
├── renderer.js                       # Renderer process entry point
│   ├── Module loading system
│   ├── Error boundary setup
│   ├── Theme initialization
│   ├── Global event handlers
│   └── Performance monitoring
│
├── preload.js                        # Security bridge
│   ├── Context bridge setup
│   ├── IPC API exposure
│   ├── Security validation
│   └── Safe DOM access
│
└── main-ui.js                        # UI management
    ├── Tab system management
    ├── User interaction handlers
    ├── Dynamic UI updates
    └── Component coordination
```

### Core Application Logic

```text
electron-app/
├── fitParser.js                      # FIT file parsing (Garmin SDK integration)
├── windowStateUtils.js               # Window state persistence
├── index.html                        # Main application HTML
├── style.css                         # Application styling & themes
└── utils.js                          # Legacy utilities (being phased out)
```

## Utility Module Organization

### Complete Module Breakdown (50+ Modules)

```text
electron-app/utils/
├── app/                              # Application-level utilities
│   ├── aboutModal.js                # About dialog management
│   ├── appMenu.js                   # Application menu creation
│   ├── appMenuHelpers.js            # Menu helper functions
│   ├── appVersion.js                # Version information
│   ├── contextMenu.js               # Right-click context menus
│   ├── devTools.js                  # Development tools integration
│   ├── electronUtils.js             # Electron-specific utilities
│   ├── processInfo.js               # Process information
│   ├── relaunch.js                  # Application restart functionality
│   ├── startup.js                   # Application startup routines
│   ├── systemInfo.js                # System information gathering
│   └── updateChecker.js             # Application update checking
│
├── charts/                           # Data visualization components
│   ├── chartColors.js               # Chart color schemes
│   ├── chartConfig.js               # Chart configuration
│   ├── chartExport.js               # Chart export functionality
│   ├── chartInteractions.js         # Chart user interactions
│   ├── chartjsHelpers.js            # Chart.js helper functions
│   ├── chartRendering.js            # Chart rendering logic
│   ├── chartSpec.js                 # Chart specifications
│   ├── chartThemes.js               # Chart theming
│   ├── chartTypes.js                # Different chart type configurations
│   ├── chartUtils.js                # Chart utility functions
│   ├── dataProcessing.js            # Chart data processing
│   ├── renderChartJS.js             # Chart.js integration
│   ├── vegaLiteCharts.js           # Vega-Lite chart rendering
│   └── vegaLiteHelpers.js          # Vega-Lite utilities
│
├── config/                           # Configuration management
│   ├── constants.js                 # Centralized constants + config helpers
│   │   ├── CONVERSION_FACTORS       # Unit conversion factors
│   │   ├── DISTANCE_UNITS          # Distance unit definitions
│   │   ├── TIME_UNITS              # Time unit definitions
│   │   ├── UI_CONSTANTS            # UI configuration
│   │   ├── CHART_CONSTANTS         # Chart configuration
│   │   ├── MAP_CONSTANTS           # Map configuration
│   │   └── ERROR_MESSAGES          # Error message templates
│   └── index.js                     # Barrel & namespace export for config
│
├── data/                             # Data processing & management
│   ├── arrayUtils.js                # Array manipulation utilities
│   ├── cacheManager.js              # Data caching system
│   ├── calculations.js              # Mathematical calculations
│   ├── createTables.js              # Table generation logic
│   ├── dataExport.js                # Data export functionality
│   ├── dataImport.js                # Data import functionality
│   ├── dataProcessing.js            # General data processing
│   ├── dataTransformation.js        # Data transformation utilities
│   ├── dataValidation.js            # Data validation functions
│   ├── filterUtils.js               # Data filtering utilities
│   ├── formatUtils.js               # Data formatting utilities
│   ├── mathUtils.js                 # Mathematical utility functions
│   ├── objectUtils.js               # Object manipulation utilities
│   ├── patchSummaryFields.js        # Summary data patching
│   ├── sortUtils.js                 # Data sorting utilities
│   ├── statisticalAnalysis.js       # Statistical analysis functions
│   ├── stringUtils.js               # String manipulation utilities
│   └── unitConversions.js           # Unit conversion utilities
│
├── debug/                            # Debugging & development tools
│   ├── devConsole.js                # Development console
│   ├── errorReporting.js            # Error reporting system
│   ├── memoryProfiler.js            # Memory usage profiling
│   ├── performanceMonitor.js        # Performance monitoring
│   └── testHelpers.js               # Testing utility functions
│
├── dom/                              # DOM manipulation utilities
│   ├── domUtils.js                  # General DOM utilities
│   ├── eventHandlers.js             # Event handling utilities
│   ├── elementCreation.js           # Element creation helpers
│   ├── elementSelection.js          # Element selection utilities
│   └── styleUtils.js                # Style manipulation utilities
│
├── errors/                           # Error handling system
│   ├── errorHandling.js             # Unified error handling (400+ lines)
│   │   ├── AppError class          # Custom error types
│   │   ├── ValidationError class   # Validation-specific errors
│   │   ├── withErrorHandling()     # Error wrapper function
│   │   ├── makeResilient()         # Resilient function wrapper
│   │   ├── validateInput()         # Input validation
│   │   └── Error recovery strategies
│   ├── errorBoundary.js             # Error boundary implementation
│   ├── errorLogger.js               # Error logging system
│   ├── errorRecovery.js             # Error recovery mechanisms
│   ├── errorReporting.js            # Error reporting utilities
│   └── validationUtils.js           # Validation helper functions
│
├── files/                            # File system operations
│   ├── dragDrop.js                  # Drag & drop functionality
│   ├── fileAccess.js                # File access utilities
│   ├── fileDialogs.js               # File dialog utilities
│   ├── fileExport.js                # File export functionality
│   ├── fileImport.js                # File import functionality
│   ├── fileMetadata.js              # File metadata extraction
│   ├── fileUtils.js                 # General file utilities
│   ├── fileValidation.js            # File validation functions
│   ├── handleOpenFile.js            # File opening logic
│   ├── pathUtils.js                 # Path manipulation utilities
│   ├── recentFiles.js               # Recent files management
│   └── tempFiles.js                 # Temporary file management
│
├── formatting/                       # Data formatting utilities
│   ├── converters/                  # Unit conversion functions
│   │   ├── convertDistanceUnits.js # Distance unit conversion
│   │   ├── convertSpeedUnits.js    # Speed unit conversion
│   │   ├── convertTemperatureUnits.js # Temperature conversion
│   │   ├── convertTimeUnits.js     # Time unit conversion
│   │   └── convertWeightUnits.js   # Weight unit conversion
│   ├── formatters/                  # Display formatting functions
│   │   ├── formatDistance.js       # Distance formatting
│   │   ├── formatDuration.js       # Duration formatting
│   │   ├── formatHeight.js         # Height formatting
│   │   ├── formatPace.js           # Pace formatting
│   │   ├── formatSpeed.js          # Speed formatting
│   │   ├── formatTemperature.js    # Temperature formatting
│   │   ├── formatTime.js           # Time formatting
│   │   ├── formatTooltipData.js    # Tooltip data formatting
│   │   └── formatWeight.js         # Weight formatting
│   ├── index.js                     # Barrel exports for formatters
│   ├── numberFormatting.js          # Number formatting utilities
│   ├── textFormatting.js            # Text formatting utilities
│   └── unitUtils.js                 # Unit utility functions
│
├── logging/                          # Logging system
│   ├── consoleLogger.js             # Console logging
│   ├── fileLogger.js                # File-based logging
│   ├── logFormatter.js              # Log message formatting
│   ├── logLevels.js                 # Log level definitions
│   └── logUtils.js                  # Logging utilities
│
├── maps/                             # Map visualization components
│   ├── elevationProfile.js          # Elevation profile rendering
│   ├── gpsUtils.js                  # GPS coordinate utilities
│   ├── lapMarkers.js                # Lap marker functionality
│   ├── mapActionButtons.js          # Map action buttons
│   ├── mapAnimations.js             # Map animation utilities
│   ├── mapBaseLayers.js             # Map base layer management
│   ├── mapColors.js                 # Map color schemes
│   ├── mapControls.js               # Map control widgets
│   ├── mapDrawLaps.js               # Route/lap visualization
│   ├── mapExport.js                 # Map export functionality
│   ├── mapFullscreenControl.js      # Fullscreen map control
│   ├── mapIcons.js                  # Map icon definitions
│   ├── mapInteractions.js           # Map user interactions
│   ├── mapLapSelector.js            # Lap selection widget
│   ├── mapLayers.js                 # Map layer management
│   ├── mapMeasureTool.js            # Distance measurement tool
│   ├── mapPopups.js                 # Map popup functionality
│   ├── mapRouteAnalysis.js          # Route analysis tools
│   ├── mapTheme.js                  # Map theming system
│   ├── mapUtils.js                  # Map utility functions
│   ├── renderMap.js                 # Main map rendering logic
│   ├── routeOptimization.js         # Route optimization
│   └── trackingUtils.js             # GPS tracking utilities
│
├── performance/                      # Performance optimization
│   ├── caching.js                   # Caching strategies
│   ├── debounce.js                  # Debouncing utilities
│   ├── lazyLoading.js               # Lazy loading system
│   ├── memoryManagement.js          # Memory management
│   ├── performanceMetrics.js        # Performance measurement
│   ├── resourceOptimization.js      # Resource optimization
│   └── throttle.js                  # Throttling utilities
│
├── rendering/                        # Rendering utilities
│   ├── canvasUtils.js               # Canvas rendering utilities
│   ├── renderOptimization.js        # Rendering optimization
│   ├── renderQueue.js               # Rendering queue management
│   ├── renderSummary.js             # Summary rendering
│   ├── renderSummaryHelpers.js      # Summary rendering helpers
│   ├── renderTable.js               # Table rendering
│   ├── renderUtils.js               # General rendering utilities
│   └── svgUtils.js                  # SVG rendering utilities
│
├── state/                            # State management system
│   ├── core/                        # Core state management
│   │   ├── stateManager.js          # Legacy state manager
│   │   ├── unifiedStateManager.js   # Unified state facade
│   │   └── stateValidation.js       # State validation
│   ├── managers/                    # Specialized state managers
│   │   ├── appStateManager.js       # Application state
│   │   ├── fileStateManager.js      # File-related state
│   │   ├── themeStateManager.js     # Theme state
│   │   └── uiStateManager.js        # UI state
│   ├── persistence/                 # State persistence
│   │   ├── localStorage.js          # Local storage integration
│   │   ├── sessionStorage.js        # Session storage
│   │   └── stateSync.js             # State synchronization
│   └── reactivity/                  # Reactive state system
│       ├── observers.js             # State observers
│       ├── subscribers.js           # State subscribers
│       └── watchers.js              # State watchers
│
├── theming/                          # Theme management system
│   ├── colorSchemes.js              # Color scheme definitions
│   ├── cssVariables.js              # CSS custom properties
│   ├── darkTheme.js                 # Dark theme configuration
│   ├── lightTheme.js                # Light theme configuration
│   ├── setupTheme.js                # Theme initialization
│   ├── themeManager.js              # Theme management
│   ├── themePersistence.js          # Theme preference storage
│   ├── themeUtils.js                # Theme utility functions
│   └── updateMapTheme.js            # Map theme synchronization
│
├── types/                            # Type definitions & validation
│   ├── dataTypes.js                 # Data type definitions
│   ├── interfaceTypes.js            # Interface type definitions
│   ├── typeChecking.js              # Runtime type checking
│   ├── typeGuards.js                # Type guard functions
│   └── typeValidation.js            # Type validation utilities
│
└── ui/                               # User interface utilities
    ├── animations.js                # UI animations
    ├── buttonUtils.js               # Button utility functions
    ├── copyTableAsCSV.js            # Table CSV export
    ├── dialogUtils.js               # Dialog utilities
    ├── enableTabButtons.js          # Tab button management
    ├── fullScreenUtils.js           # Fullscreen utilities
    ├── getActiveTabContent.js       # Active tab management
    ├── inputUtils.js                # Input handling utilities
    ├── listeners.js                 # Event listener management
    ├── modalUtils.js                # Modal dialog utilities
    ├── notifications.js             # Notification system
    ├── setupTabButton.js            # Tab button setup
    ├── setupWindow.js               # Window initialization
    ├── showFitData.js               # FIT data display
    ├── showNotification.js          # Notification display
    ├── tabManager.js                # Tab management system
    ├── tooltipUtils.js              # Tooltip utilities
    ├── updateActiveTab.js           # Tab state updates
    ├── updateTabVisibility.js       # Tab visibility management
    ├── uiHelpers.js                 # UI helper functions
    └── widgetUtils.js               # Widget utilities
```

## Configuration & Build System

### Build Configuration

```text
/
├── package.json                     # Root workspace scripts and shared tooling dependencies
├── playwright.config.ts             # Root-owned Electron Playwright configuration
├── vitest.config.ts                 # Root-owned Vitest configuration for electron-app tests
├── tsconfig.vitest-typecheck.json   # Root-owned Vitest typecheck configuration
├── tsconfig.electron-app.eslint.json # Root-owned ESLint parser project for electron-app
├── scripts/
│   └── analyze-coverage.mjs         # Root-owned coverage analysis helper
└── electron-app/
    ├── package.json                 # Electron app metadata and packaging configuration
    │   ├── Electron Builder configuration
    │   ├── Multi-platform build targets
    │   ├── File associations (.fit files)
    │   └── Runtime/build scripts still scoped to the app
    │
    └── tsconfig.json                # TypeScript configuration
```

### Environment Configuration

```text
electron-app/
├── .cache/                          # Build cache
└── node_modules/                    # Workspace dependencies
```

## Testing Infrastructure

### Test Organization

```text
electron-app/tests/
├── unit/                            # Unit tests (4,000+ tests)
│   ├── utils/                       # Utility function tests
│   │   ├── formatting/              # Formatting function tests
│   │   ├── data/                    # Data processing tests
│   │   ├── charts/                  # Chart functionality tests
│   │   ├── maps/                    # Map functionality tests
│   │   ├── state/                   # State management tests
│   │   └── ui/                      # UI component tests
│   ├── integration/                 # Integration tests
│   ├── performance/                 # Performance tests
│   └── accessibility/               # A11y tests
│
├── e2e/                             # End-to-end tests
├── fixtures/                        # Test data & fixtures
├── mocks/                           # Test mocks & stubs
└── strictTests/                     # Strict testing scenarios
```

### Test Support Files

```text
electron-app/
├── __mocks__/                       # Module mocks
│   ├── electron.js                  # Electron API mocks
│   ├── electron.cjs                 # CommonJS Electron mocks
│   └── [Various module mocks]
├── global.d.ts                      # Global type definitions
├── fitsdk.d.ts                     # FIT SDK type definitions
└── test-errors.log                 # Test error logging
```

## Documentation & Assets

### Documentation Structure

```text
docs/
├── APPLICATION_ARCHITECTURE.md      # Architecture overview
├── APPLICATION_LAYOUT.md           # This file - complete layout
├── APPLICATION_OVERVIEW.md         # High-level application overview
├── STATE_MANAGEMENT_COMPLETE_GUIDE.md # State management guide
├── FIT_PARSER_MIGRATION_GUIDE.md   # FIT parser migration
├── MAP_THEME_TOGGLE.md             # Map theming documentation
└── [Various other documentation files]
```

### Application Assets

```text
electron-app/
├── icons/                           # Application icons
│   ├── favicon.ico                  # Main application icon
│   ├── favicon-256x256.ico         # Windows icon
│   ├── favicon-512x512.icns        # macOS icon
│   ├── favicon-256x256.png         # Linux icon
│   └── [Various sized icons]
│
├── screenshots/                     # Application screenshots
├── html/                           # Static HTML assets
├── ffv/                            # Alternative FIT viewer web app
└── node_modules/                   # Third-party libraries managed via npm
```

## CI/CD & Automation

### GitHub Workflows

```text
.github/
├── workflows/                       # GitHub Actions workflows (30+ workflows)
│   ├── Build.yml                   # Multi-platform builds
│   ├── superlinter.yml             # Code quality checks
│   ├── eslint.yml                  # JavaScript linting
│   ├── prettier.yml                # Code formatting
│   ├── codeql.yml                  # Security analysis
│   ├── dependabot/                 # Dependency updates
│   └── [Many other workflows]
│
├── CODEOWNERS                      # Code ownership
├── ISSUE_TEMPLATE/                 # Issue templates
└── PULL_REQUEST_TEMPLATE.md        # PR template
```

### Build & Release System

```text
Root Level Files:
├── .gitignore                      # Git ignore patterns
├── .gitattributes                  # Git attributes
├── .editorconfig                   # Editor configuration
├── .browserslistrc                 # Browser compatibility
├── cliff.toml                      # Changelog generation
├── codecov.yml                     # Code coverage config
└── [Various linter configurations]
```

## Key File Responsibilities

### Critical Application Files

| File                                      | Size/Complexity               | Primary Responsibility               |
| ----------------------------------------- | ----------------------------- | ------------------------------------ |
| `main.js`                                 | 2,000+ lines                  | Electron main process, app lifecycle |
| `utils/config/index.js`                   | 500+ lines via `constants.js` | Centralized configuration            |
| `utils/errors/index.js`                   | 400+ lines                    | Unified error handling               |
| `utils/state/core/unifiedStateManager.js` | 300+ lines                    | State management facade              |
| `fitParser.js`                            | 200+ lines                    | FIT file parsing logic               |
| `main-ui.js`                              | 150+ lines                    | UI management and tabs               |

### Module Distribution

- **Total Utility Modules**: 50+
- **Largest Category**: UI utilities (20+ modules)
- **Most Complex**: State management (multiple layers)
- **Most Critical**: Error handling & configuration
- **Most Tested**: Formatting utilities (4,000+ tests)

This layout provides a comprehensive foundation for understanding the complete FitFileViewer application structure, from high-level architecture down to individual module responsibilities.
