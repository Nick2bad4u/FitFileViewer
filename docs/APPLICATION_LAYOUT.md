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
├── docs/                               # Root engineering documentation
├── docusaurus/                         # Documentation site workspace
├── electron-app/                       # Electron source compiled by root scripts
├── fit-test-files/                     # Real FIT files for development and smoke tests
├── scripts/                            # Root-owned build, lint, test, and release helpers
├── static/                             # Canonical app shell, icons, and embedded viewer assets
├── tests/                              # Root-owned Vitest and Electron Playwright tests
├── README.md                           # Project overview & usage
├── LICENSE.md                          # Project license
├── CHANGELOG.md                        # Version history
├── package.json                        # Root app manifest, scripts, and dependencies
└── [Config Files]                      # Root-owned lint, format, build, and TypeScript configs
```

## Core Application Files

### Entry Points & Process Management

```text
electron-app/
├── main.ts                           # Main Electron process source
│   ├── App lifecycle management
│   ├── Window creation & management
│   ├── IPC handlers (50+ handlers)
│   ├── Menu system
│   ├── File dialogs
│   ├── Auto-updater integration
│   └── Security configuration
│
├── renderer.ts                       # Renderer process source entry point
│   ├── Module loading system
│   ├── Error boundary setup
│   ├── Theme initialization
│   ├── Global event handlers
│   └── Performance monitoring
│
├── preload.ts                        # Security bridge root emitted as dist/preload.js
│   ├── Context bridge setup
│   ├── IPC API exposure
│   ├── Security validation
│   └── Safe DOM access
│
└── main-ui.ts                        # UI management source
    ├── Tab system management
    ├── User interaction handlers
    ├── Dynamic UI updates
    └── Component coordination
```

### Core Application Logic

```text
electron-app/
├── fitParser.ts                      # FIT file parsing source (Garmin SDK integration)
└── windowStateUtils.ts               # Window state persistence source
```

## Utility Module Organization

### Current Utility Domains

```text
electron-app/utils/
├── app/          # Application lifecycle, menu, environment, and performance helpers
├── async/        # Small async compatibility helpers
├── charts/       # Chart components, rendering, plugins, theming, and chart DOM helpers
├── config/       # Shared constants and configuration exports
├── data/         # Data lookups, processors, summaries, and derived metrics
├── debug/        # Debug overlays, state devtools, and targeted diagnostics
├── docs/         # Runtime documentation metadata helpers
├── dom/          # DOM escaping and sanitization helpers
├── errors/       # Error normalization and reporting helpers
├── files/        # FIT import, export, recent-file, and file browser workflows
├── formatting/   # Unit conversion and display formatters
├── logging/      # Renderer/main logging utilities
├── maps/         # Leaflet controls, filters, layers, markers, and map rendering
├── net/          # Network and remote-resource helpers
├── performance/  # Runtime performance helpers
├── rendering/    # Summary, table, and shared render helpers
├── runtime/      # Runtime environment guards such as process env access
├── state/        # State core, domain managers, and main-process integration
├── storage/      # Storage abstractions
├── theming/      # Theme core and map-specific theme integration
├── types/        # Shared lightweight runtime types
└── ui/           # Controls, modals, notifications, tabs, browser tab, and layout helpers
```

Utility source is TypeScript-first now. The runtime build compiles these modules
from `electron-app/` into root `dist/`; do not document generated `.js`
files as source files. Use the repository tree or `rg --files electron-app/utils`
for exact module names when adding or changing utilities.

## Configuration & Build System

### Build Configuration

```text
/
├── package.json                     # Root app manifest, scripts, tooling, and runtime dependencies
├── node_modules/                    # Root workspace dependencies
├── playwright.config.ts             # Root-owned Electron Playwright configuration
├── vite.renderer.config.mjs         # Root-owned renderer compatibility bundle configuration
├── vitest.config.ts                 # Root-owned Vitest configuration for electron-app tests
├── tsconfig.vitest-typecheck.json   # Root-owned Vitest typecheck configuration
├── tsconfig.app.eslint.json # Root-owned ESLint parser project for electron-app
├── electron-builder.config.cjs      # Root-owned Electron Builder targets, file associations, and package allowlist
├── global.d.ts                      # Root-owned shared renderer/main global type declarations
├── renderer-style-imports.d.ts      # Root-owned renderer CSS/SVG/package module shims
├── scripts/
│   ├── analyze-coverage.mjs         # Root-owned coverage analysis helper
│   ├── bundle-preload.mjs           # Root-owned preload bundling helper
│   ├── clean-runtime-dist.mjs       # Root-owned runtime output cleanup helper
│   ├── format-runtime-output.mjs    # Root-owned runtime output formatter
│   ├── generate-api-categories.mjs  # Root-owned generated API docs category helper
│   ├── normalize-coverage-lcov.mjs  # Root-owned coverage path normalization helper
│   └── prepare-runtime-dist.mjs     # Root-owned runtime package asset helper
└── electron-app/                    # Runtime Electron source tree
```

### Environment Configuration

```text
/
├── node_modules/                    # Root npm install tree for the app and docs workspace
├── dist/                            # Generated runtime output; remove with `npm run clean:workspace`
└── electron-app/
    └── ...                          # Electron source tree
```

## Testing Infrastructure

### Test Organization

```text
tests/integration/
└── tabs/                            # Root-owned tab integration tests

tests/unit/
├── charts/                          # Root-owned chart behavior tests
├── files/                           # Root-owned file import/export behavior tests
├── lifecycle/                       # Root-owned app lifecycle behavior tests
├── main/                            # Root-owned main-process behavior tests
├── maps/                            # Root-owned map behavior tests
├── menu/                            # Root-owned application menu behavior tests
├── packaging/                       # Root-owned build/tooling tests
├── preload/                         # Root-owned preload boundary tests
├── rendering/                       # Root-owned rendering helper and component tests
├── runtime/                         # Root-owned runtime boundary tests
├── strictTests/                     # Root-owned strict DOM/Electron regression tests
├── tabs/                            # Root-owned shared tab behavior tests
├── theming/                         # Root-owned theming behavior tests
└── utils/                           # Root-owned utility behavior tests

tests/fixtures/
└── tabFixtures.ts                   # Root-owned reusable Vitest DOM fixtures

tests/playwright/
└── app-ui.spec.ts                   # Root-owned Electron Playwright smoke coverage

tests/vitest/
├── env-setup.mjs                    # Root-owned Vitest warning/output filters
├── globalSetup.mjs                  # Root-owned Vitest global setup
├── helpers/                         # Root-owned Vitest helper modules
├── setupVitest.mjs                  # Root-owned Vitest per-test environment setup
├── shims/                           # Root-owned Vitest environment shims
└── stubs/                           # Root-owned Vitest module alias stubs
```

### Test Support Files

```text
global.d.ts                          # Root-owned ambient preload API contract
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
static/
├── app/                            # Main HTML and CSS source copied into dist
│   ├── index.html                  # Main application HTML
│   ├── style.css                   # Application styling and themes
│   └── elevProfile.css             # Elevation profile styling
├── ffv/                            # Alternative FIT viewer web app source copied into dist
└── icons/                          # Application icon source copied into dist
    ├── favicon.ico                 # Main application icon
    ├── favicon-256x256.ico         # Windows icon
    ├── favicon-512x512.icns        # macOS icon
    ├── favicon-256x256.png         # Linux icon
    └── [Various sized icons]
```

Application screenshots used by repository documentation live in
`docs/screenshots/`.

## CI/CD & Automation

### GitHub Workflows

```text
.github/
├── workflows/                       # GitHub Actions workflows (30+ workflows)
│   ├── Build.yml                   # Root lint/test/docs gate plus multi-platform builds
│   ├── build-win7.yml              # Windows 7 legacy release-asset carry-forward
│   ├── docusaurus.yml              # Documentation site build and deploy
│   ├── codeql.yml                  # Security analysis
│   ├── dependency-review.yml       # Dependency review gate
│   ├── gitleaks.yml                # Secret scanning
│   ├── trufflehog.yml              # Secret scanning
│   ├── VirusTotal.yml              # Release artifact scanning
│   ├── upload-linux-ia.yml         # Linux archive upload
│   ├── upload-macos-ia.yml         # macOS archive upload
│   ├── upload-windows-ia.yml       # Windows archive upload
│   └── [Many other workflows]
│
├── ISSUE_TEMPLATE/                 # Issue templates
└── PULL_REQUEST_TEMPLATE/          # PR templates
```

### Build & Release System

```text
Root Level Files:
├── .gitignore                       # Git ignore patterns
├── codecov.yml                      # Code coverage config
├── electron-builder.config.cjs      # Electron Builder targets and packaging policy
├── eslint.config.mjs                # Root-owned ESLint configuration
├── prettier.config.mjs              # Root-owned Prettier configuration
├── .release.yml                     # Release, signing, and updater metadata
├── stylelint.config.mjs             # Root-owned Stylelint configuration
└── vitest.config.ts                 # Root-owned Vitest configuration
```

## Key File Responsibilities

### Critical Application Files

| File                                            | Size/Complexity           | Primary Responsibility               |
| ----------------------------------------------- | ------------------------- | ------------------------------------ |
| `electron-app/main.ts`                          | Main entry source         | Electron main process, app lifecycle |
| `electron-app/utils/config/index.ts`            | Root-built runtime source | Centralized configuration            |
| `electron-app/utils/errors/index.ts`            | Root-built runtime source | Unified error handling               |
| `electron-app/utils/state/core/stateManager.ts` | Root-built runtime source | Centralized state store              |
| `electron-app/fitParser.ts`                     | Parser source             | FIT file parsing logic               |
| `electron-app/main-ui.ts`                       | UI source                 | UI management and tabs               |

### Module Distribution

- **Total Utility Modules**: 50+
- **Largest Category**: UI utilities (20+ modules)
- **Most Complex**: State management (multiple layers)
- **Most Critical**: Error handling & configuration
- **Most Tested**: Formatting utilities (4,000+ tests)

This layout provides a comprehensive foundation for understanding the complete FitFileViewer application structure, from high-level architecture down to individual module responsibilities.
