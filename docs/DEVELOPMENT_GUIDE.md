# FitFileViewer - Development Guide

## 📋 Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Code Standards & Guidelines](#code-standards--guidelines)
- [Module Development](#module-development)
- [Testing Strategy](#testing-strategy)
- [Build & Release Process](#build--release-process)
- [Debugging & Troubleshooting](#debugging--troubleshooting)
- [Contributing Guidelines](#contributing-guidelines)
- [Performance Best Practices](#performance-best-practices)

## Development Environment Setup

### Prerequisites

```bash
# Required Software
Node.js >= 22.12.0
npm >= 11.15.0
Git >= 2.0.0

# Recommended Tools
Visual Studio Code
GitHub Desktop (optional)
Electron Fiddle (for testing)
```

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/Nick2bad4u/FitFileViewer.git
cd FitFileViewer

# Install dependencies
npm install

# Run in development mode
npm start

# Run tests
npm test

# Build application
npm run build
```

### Development Scripts

```bash
# Development
npm start                    # Run app with debugging
npm run start:prod          # Run production build
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage
npm run test:playwright     # Run Electron Playwright smoke test

# Code Quality
npm run lint               # Run root, Electron, and docs lint gates
npm run lint:fix          # Fix auto-fixable lint issues
npm run lint:css           # Run Stylelint on CSS
npm run lint:css:fix       # Fix Stylelint issues
npm run typecheck         # TypeScript type checking
npm run verify:fast       # Fast local readiness gate
npm run verify:release    # Full release readiness gate, including signing preflight
npm run verify:release:signed # Full signed release gate with artifact signature verification
npm run release:verify    # Alias used by release automation

# Build & Package
npm run build             # Build for current platform
npm run build:runtime-ts  # Build runtime TypeScript and renderer assets
npm run build:all         # Build for all platforms
npm run package           # Create package without installer
```

## Code Standards & Guidelines

### JavaScript/TypeScript Standards

```javascript
// Use ES6+ features consistently
const { formatDistance, formatTime } =
 await import("./utils/formatting/index.js");

// Prefer const/let over var
const CONSTANT_VALUE = "immutable";
let mutableValue = "can change";

// Use descriptive names
function calculateAverageSpeed(distance, time) {
 return distance / time;
}

// Document functions with JSDoc
/**
 * Converts distance from meters to specified unit
 *
 * @example
 *  const km = convertDistanceUnits(1000, "kilometers"); // 1
 *
 * @param {number} meters - Distance in meters
 * @param {string} targetUnit - Target unit (km, mi, ft)
 *
 * @returns {number} Converted distance
 */
export function convertDistanceUnits(meters, targetUnit) {
 // Implementation
}
```

### File Organization

```javascript
// File structure template
/**
 * @version 2.0.0
 *
 * @file Brief description of module purpose
 *
 * @author FitFileViewer Team
 *
 * @since 1.0.0
 */

// Imports (grouped by type)
import { CONVERSION_FACTORS as CONSTANTS } from "../../config/index.js";
import { errorHandler } from "../../errors/index.js";
import externalLibrary from "external-library";

// Constants
const MODULE_CONSTANTS = {
 DEFAULT_VALUE: "default",
 MAX_RETRIES: 3,
};

// Main functionality
export function mainFunction() {
 // Implementation
}

// Helper functions (private)
function helperFunction() {
 // Implementation
}

// Default export (if applicable)
export default mainFunction;
```

### Error Handling Patterns

```javascript
// Use unified error handling
import {
 withErrorHandling,
 validators,
 validateInput,
} from "../errors/index.js";

// Standard validation pattern
export const processData = withErrorHandling(
 function processDataInternal(data, options) {
  // Validate inputs
  validateInput(data, [validators.isRequired, validators.isObject], "data");

  // Process data
  return processedData;
 },
 {
  failSafe: false,
  logError: true,
  notify: true,
 }
);

// Manual error handling for complex cases
export function complexOperation(input) {
 try {
  // Validate input
  if (!isValidInput(input)) {
   throw new ValidationError("Invalid input provided", { input });
  }

  // Process
  const result = doComplexWork(input);

  return result;
 } catch (error) {
  console.error("[complexOperation] Failed:", error);
  throw error; // Re-throw for caller to handle
 }
}
```

## Module Development

### Creating New Modules

```javascript
// 1. Choose appropriate directory
utils / [category] / newModule.js;

// 2. Use standard template
/**
 * @file Description of the new module
 *
 * @author Your Name
 *
 * @since {undefined} Version
 */

import { CONVERSION_FACTORS as CONSTANTS } from "../config/index.js";
import { withErrorHandling } from "../errors/index.js";

// Export main functionality
export const newFunction = withErrorHandling(
 function newFunctionInternal(params) {
  // Implementation
 },
 { failSafe: true, logError: true }
);

// 3. Add to barrel export (if applicable)
// In utils/[category]/index.js
export { newFunction } from "./newModule.js";

// 4. Add tests
// In tests/unit/utils/[category]/newModule.test.ts
```

### Module Categories

| Category        | Purpose                         | Standards                            |
| --------------- | ------------------------------- | ------------------------------------ |
| **app/**        | Application-level functionality | Electron-specific, global scope      |
| **charts/**     | Data visualization              | Chart.js/Vega-Lite integration       |
| **config/**     | Configuration management        | Centralized constants, settings      |
| **data/**       | Data processing                 | Pure functions, immutable operations |
| **errors/**     | Error handling                  | Consistent error patterns            |
| **files/**      | File operations                 | Secure file handling                 |
| **formatting/** | Data formatting                 | Consistent units, localization-ready |
| **maps/**       | Geographic visualization        | Leaflet integration                  |
| **state/**      | State management                | Reactive patterns, persistence       |
| **theming/**    | Visual themes                   | CSS custom properties                |
| **ui/**         | User interface                  | DOM manipulation, event handling     |

### State Management Patterns

```javascript
// Use the state manager or a typed domain state service.
import { getState, setState, subscribe } from "../state/core/stateManager.js";

// Standard state operations
export class FeatureManager {
 // Get state
 getFeatureData() {
  return getState("feature.data") ?? [];
 }

 // Set state with validation
 setFeatureData(data) {
  if (!Array.isArray(data)) {
   throw new ValidationError("Feature data must be an array");
  }

  setState("feature.data", data, { source: "feature-manager" });
  setState("feature.lastUpdated", Date.now(), {
   source: "feature-manager",
  });
 }

 // Subscribe to changes
 onFeatureChange(callback) {
  return subscribe("feature", callback);
 }
}
```

## Testing Strategy

### Test Organization

```typescript
// Test file naming convention
[ModuleName].test.ts[ModuleName].comprehensive.test.ts[ModuleName].integration // Basic tests // Comprehensive tests
 .test.ts[ModuleName].performance.test.ts; // Integration tests // Performance tests
```

### Writing Tests

```typescript
// Standard test template
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { functionToTest } from "../../../utils/category/module.js";

describe("Module Name", () => {
 beforeEach(() => {
  // Setup for each test
  vi.clearAllMocks();
 });

 afterEach(() => {
  // Cleanup after each test
 });

 describe("Function Name", () => {
  it("should handle valid input correctly", () => {
   // Arrange
   const input = { valid: "data" };
   const expected = { processed: "data" };

   // Act
   const result = functionToTest(input);

   // Assert
   expect(result).toEqual(expected);
  });

  it("should throw error for invalid input", () => {
   // Arrange
   const invalidInput = null;

   // Act & Assert
   expect(() => functionToTest(invalidInput)).toThrow("Invalid input provided");
  });

  it("should handle edge cases", () => {
   // Test edge cases
  });
 });
});
```

### Test Categories

```typescript
// Unit Tests - Pure function testing
describe("formatDistance - Pure Function Tests", () => {
 it("should convert meters to kilometers", () => {
  expect(formatDistance(1000, "km")).toBe("1.00 km");
 });
});

// Integration Tests - Component interaction
describe("Map Integration Tests", () => {
 it("should render map with track data", async () => {
  const trackData = loadTestTrackData();
  const map = await renderMap("#map-container", trackData);
  expect(map.hasLayer(trackLayer)).toBe(true);
 });
});

// Performance Tests - Performance validation
describe("Data Processing Performance", () => {
 it("should process large dataset within time limit", () => {
  const largeDataset = generateLargeDataset(10000);
  const startTime = performance.now();

  processLargeDataset(largeDataset);

  const duration = performance.now() - startTime;
  expect(duration).toBeLessThan(1000); // 1 second limit
 });
});
```

### Mock Usage

```typescript
// Mock external dependencies
vi.mock("electron", () => ({
 ipcRenderer: {
  invoke: vi.fn(),
  on: vi.fn(),
  send: vi.fn(),
 },
 shell: {
  openExternal: vi.fn(),
 },
}));

// Mock modules
vi.mock("../../../utils/config/index.js", () => ({
 DISTANCE_UNITS: { METERS: "meters", KILOMETERS: "kilometers" },
 CONVERSION_FACTORS: { METERS_PER_KILOMETER: 1000 },
}));
```

## Build & Release Process

### Development Builds

```bash
# Quick development build
npm run build:dev

# Development build with debugging
npm run build:dev:package

# Test production build locally
npm run build:prod
```

### Release Builds

```bash
# Build for all platforms
npm run build:all

# Platform-specific builds
npm run build -- --win
npm run build -- --mac
npm run build -- --linux

# Publish release (automated via GitHub Actions)
# Triggered by creating a new release tag
```

### Signing Preflight

`npm run verify:release` runs `npm run release:check-signing` before unsigned
local packaging. Use `npm run release:check-signing:required` before ad hoc
signed packaging; it fails before electron-builder starts and lists each
missing variable.

- Local `npm run package`, `npm run package:unsigned`, and release rehearsal
  builds are unsigned by default. The electron-builder wrapper strips signing
  variables and disables Windows executable signing unless
  `REQUIRE_CODE_SIGNING=true`.
- Use `npm run package:signed` for a signed current-platform release package.
  It runs the required signing preflight, then starts electron-builder with
  `REQUIRE_CODE_SIGNING=true`.
- Electron fuses are applied from the electron-builder `afterPack` hook. That
  keeps fuse mutation before signing and artifact creation, so signed builds are
  not modified by a separate post-packaging step.
- Use `npm run verify:release:signed` when signing credentials are available
  and you want the full signed release path in one command: fast verification,
  docs build, audit, Playwright smoke, signed packaging, signature artifact
  verification, and packaged smoke.
- Windows signed builds require `WIN_CSC_LINK` or `CSC_LINK`, plus
  `CSC_KEY_PASSWORD`.
- macOS signed builds require `CSC_LINK`, `CSC_KEY_PASSWORD`,
  `CSC_INSTALLER_LINK`, and `CSC_INSTALLER_KEY_PASSWORD`.
- macOS notarization requires one credential set:
  `APPLE_ID`/`APPLE_APP_SPECIFIC_PASSWORD`/`APPLE_TEAM_ID`,
  `APPLE_API_KEY`/`APPLE_API_KEY_ID`/`APPLE_API_ISSUER`, or
  `APPLE_KEYCHAIN_PROFILE`.
- Linux builds do not require signing variables, even when the release matrix
  sets `REQUIRE_CODE_SIGNING=true`.
- Windows 7 compatibility is limited to a carried-forward legacy snapshot in
  `build-win7.yml`; the current app is not rebuilt against Electron 22.

After signed Windows or macOS packaging completes, use
`npm run release:verify-signing-artifacts` to verify the produced artifacts.
`npm run verify:release:signed` runs that verifier automatically after signed
packaging.
The release matrix runs this automatically after `build:ci-matrix`: Windows
artifacts are checked with `Get-AuthenticodeSignature`, and macOS `.app`
bundles are checked with `codesign --verify --deep --strict`. The verifier
writes `release-dist/signing-verification-report.json`, and the release
workflow uploads that report with the platform artifacts so the signed files,
status, platform, verifier command, sanitized verifier arguments, and per-file
verification outcome are visible after the job completes. In GitHub Actions,
the verifier also appends the same status, artifact list, and verifier command
results to the job summary through `GITHUB_STEP_SUMMARY`.

### Release Rehearsal

Before tagging a release, run the manual GitHub Actions workflow **Release
Rehearsal** from the target branch or tag. It runs the full release gate across
Linux, Windows, and macOS, checks signing availability without publishing,
builds unsigned artifacts, runs packaged startup smoke checks, and uploads the
`release-dist` outputs as workflow artifacts.

The rehearsal packaging step sets `FFV_FORCE_UNSIGNED_PACKAGE=true` and
`CSC_IDENTITY_AUTO_DISCOVERY=false`, so it strips signing variables before
electron-builder starts. Keep this separate from signed release packaging; use
the signing preflight to prove credentials are present, then build rehearsal
artifacts unsigned.

Use `require-code-signing=true` only when the required platform signing secrets
are configured; the preflight receives the same Windows and macOS secret names
as the release workflow, but the rehearsal package step still forces unsigned
artifacts. Leave `fail-fast=false` when you want every platform to complete and
report its own readiness result.

### Dependency Validation

The scheduled **Dependency Validation** workflow runs every Monday and can also
be started manually. It installs both the app and Docusaurus dependency graphs,
runs `npm run release:verify`, verifies that unsigned package artifacts were
created, and uploads install, release-gate, dependency-tree, `dist/`, and
`release-dist` diagnostics when the rehearsal fails.

Dependency pull requests that change dependency update configuration, root or
Docusaurus manifests, lockfiles, Dependabot config, or the dependency-validation
workflow itself should go through this workflow before merge. Treat a green
dependency-only unit or lint run as incomplete until the scheduled validation
path has exercised the full release gate and package smoke coverage.

### Windows 7 Compatibility Snapshot

- Current releases do not rebuild a Windows 7 binary. The previous `build:win7`
  Electron 22 path has been retired.
- `build-win7.yml` carries forward the newest prior
  `Fit-File-Viewer-win7-*` release assets onto the target release after the
  primary release workflow succeeds.
- Keep the carried-forward asset filenames unchanged. Renaming them to the
  current version would imply a newly built and tested Windows 7 binary.
- Treat the snapshot as a legacy convenience for existing Windows 7 users, not
  an actively supported release target.

### Build Configuration

Electron Builder settings live in the root `electron-builder.config.cjs`, and
packaged file inclusion is declared there as `files`. Keep new packaging targets
and artifact naming in the root config instead of adding a `build` block to
`package.json`.

```js
// electron-builder.config.cjs
const rootPackageFiles = ["dist/**", "package.json"];

module.exports = {
 appId: "io.github.nick2bad4u.fitfileviewer",
 asar: true,
 files: rootPackageFiles,
 linux: {
  target: ["AppImage", "deb", "rpm", "snap"],
 },
 mac: {
  target: ["dmg", "zip", "pkg"],
 },
 win: {
  target: ["nsis", "portable", "squirrel", "msi"],
 },
};
```

## Debugging & Troubleshooting

### Development Debugging

```bash
# Start with debugging enabled
npm start

# Access DevTools
# Main process: Open Developer Tools from menu
# Renderer process: F12 or Ctrl+Shift+I

# Remote debugging
# Chrome DevTools: chrome://inspect
# VS Code: Use Electron debugging configuration
```

### Debug Configuration

```json
// .vscode/launch.json
{
 "name": "Attach to Electron Main",
 "port": 9229,
 "request": "attach",
 "type": "node"
}
```

Run `npm start` from the repository root, then attach VS Code to the Electron
main process with the `Attach to Electron Main` configuration. Root tasks in
`.vscode/tasks.json` cover runtime builds, tests, app linting, and typechecks.

### Common Issues & Solutions

| Issue              | Cause                 | Solution                                 |
| ------------------ | --------------------- | ---------------------------------------- |
| Module not found   | Incorrect import path | Check relative paths and file extensions |
| IPC not working    | Security restrictions | Verify preload script and context bridge |
| Tests failing      | Mock configuration    | Check mock setup and cleanup             |
| Build errors       | Missing dependencies  | Run `npm install` and check package.json |
| Performance issues | Memory leaks          | Use DevTools profiler, check cleanup     |

### Logging & Monitoring

```javascript
// Enable debug logging
localStorage.setItem("debug", "fitfileviewer:*");

// Performance monitoring
console.time("operation-name");
performOperation();
console.timeEnd("operation-name");

// Memory usage monitoring
console.log("Memory usage:", process.memoryUsage());
```

## Contributing Guidelines

### Pull Request Process

1. **Fork & Branch**: Create feature branch from `main`
2. **Develop**: Follow coding standards and patterns
3. **Test**: Ensure all tests pass and add new tests
4. **Document**: Update documentation if needed
5. **Lint**: Run linting and formatting tools
6. **PR**: Create pull request with clear description

### Code Review Checklist

- [ ] Follows established patterns and conventions
- [ ] Includes appropriate tests
- [ ] Documentation is updated
- [ ] No breaking changes (or documented)
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Accessibility requirements met

### Commit Message Format

```text
type(scope): description

Examples:
feat(charts): add new chart type for power data
fix(maps): resolve memory leak in tile loading
docs(readme): update installation instructions
test(formatters): add edge case tests
```

## Performance Best Practices

### Code Optimization

```javascript
// Use efficient data structures
const cache = new Map(); // Instead of {}
const uniqueItems = new Set(); // Instead of array with includes()

// Avoid memory leaks
function setupEventListeners() {
 const cleanup = [];

 const listener = () => {
  /* handler */
 };
 element.addEventListener("click", listener);
 cleanup.push(() => element.removeEventListener("click", listener));

 return () => cleanup.forEach((fn) => fn());
}

// Use lazy loading
async function loadHeavyModule() {
 const { heavyFunction } = await import("./heavy-module.js");
 return heavyFunction;
}
```

### Memory Management

```javascript
// Clean up resources
class ResourceManager {
 constructor() {
  this.resources = new Map();
 }

 register(id, resource, cleanup) {
  this.resources.set(id, { resource, cleanup });
 }

 cleanup() {
  for (const [id, { cleanup }] of this.resources) {
   try {
    cleanup();
   } catch (error) {
    console.error(`Cleanup failed for ${id}:`, error);
   }
  }
  this.resources.clear();
 }
}
```

### Performance Monitoring

```javascript
// Monitor critical operations
const performanceMonitor = {
 start(operation) {
  console.time(`${operation}-duration`);
  console.log(`${operation} started at:`, new Date().toISOString());
 },

 end(operation) {
  console.timeEnd(`${operation}-duration`);
  console.log(`${operation} ended at:`, new Date().toISOString());

  // Log memory usage
  if (process.memoryUsage) {
   console.log("Memory usage:", process.memoryUsage());
  }
 },
};
```

This development guide provides a comprehensive foundation for contributing to and maintaining the FitFileViewer codebase while ensuring consistency and quality across all development efforts.
