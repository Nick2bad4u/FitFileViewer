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
Node.js >= 16.0.0
npm >= 7.0.0
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
cd FitFileViewer/electron-app

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
npm run start-prod          # Run production build
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run lint:css           # Run Stylelint on CSS
npm run lint:css:fix       # Fix Stylelint issues
npm run lint:all           # Run all checks (CSS + ESLint + typecheck + prettier)
npm run lint:all:fix       # Fix all auto-fixable issues (CSS + ESLint + prettier)
npm run prettier          # Check code formatting
npm run prettier:fix      # Fix code formatting
npm run typecheck         # TypeScript type checking

# Build & Package
npm run build             # Build for current platform
npm run build-all         # Build for all platforms
npm run package           # Create package without installer
```

## Code Standards & Guidelines

### JavaScript/TypeScript Standards

```javascript
// Use ES6+ features consistently
const { formatDistance, formatTime } = await import(
 "./utils/formatting/index.js"
);

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
 * @example const km = convertDistanceUnits(1000, 'kilometers'); // 1
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
// Use unified state manager
import { unifiedStateManager } from "../state/core/unifiedStateManager.js";

// Standard state operations
export class FeatureManager {
 constructor() {
  this.state = unifiedStateManager;
 }

 // Get state
 getFeatureData() {
  return this.state.get("feature.data", []);
 }

 // Set state with validation
 setFeatureData(data) {
  if (!Array.isArray(data)) {
   throw new ValidationError("Feature data must be an array");
  }

  this.state.set("feature.data", data);
  this.state.set("feature.lastUpdated", Date.now());
 }

 // Subscribe to changes
 onFeatureChange(callback) {
  return this.state.subscribe("feature", callback);
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
npm run build-all

# Platform-specific builds
npm run build -- --win
npm run build -- --mac
npm run build -- --linux

# Windows 7 portable build (Electron 22, ia32 portable target)
npm run build:win7

# Publish release (automated via GitHub Actions)
# Triggered by creating a new release tag
```

### Windows 7 Compatibility Builds

- `npm run build:win7` calls `scripts/build-win7.mjs`, forcing an Electron 22, ia32 portable build whose output is stored under `electron-app/dist/win7`. Use this script when you need to verify behavior on legacy Windows 7 hardware.
- Because Electron 22’s Node runtime cannot load ESM packages from inside an `.asar`, the Win7 helper disables asar packaging entirely. Expect a slightly larger artifact, but all dependencies (notably `@garmin/fitsdk`) remain accessible at runtime.
- To generate the same artifact in CI, trigger the GitHub Actions workflow **“Build Windows 7 Compatibility Artifact.”** Choose the branch or tag you want to validate, run the workflow, and download the `win7-dist-*` artifact for installation/testing on a Windows 7 VM.
- These builds are intentionally isolated from the primary release train. Treat them as ad-hoc compatibility snapshots rather than officially supported releases.

### Build Configuration

```json
// package.json build configuration
{
 "build": {
  "appId": "com.example.fitfileviewer",
  "asar": true,
  "win": {
   "target": ["portable", "squirrel", "msi"],
   "icon": "icons/favicon-256x256.ico"
  },
  "mac": {
   "target": ["dmg", "zip", "pkg"],
   "icon": "icons/favicon-512x512.icns"
  },
  "linux": {
   "target": ["AppImage", "deb", "rpm", "snap"],
   "icon": "icons/favicon-256x256.png"
  }
 }
}
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
 "name": "Debug Electron Main",
 "program": "${workspaceFolder}/main.js",
 "request": "launch",
 "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
 "type": "node"
}
```

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

```
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
