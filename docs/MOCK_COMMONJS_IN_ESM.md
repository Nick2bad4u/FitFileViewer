# Module System Mocking Guide: ES Module Tests with CommonJS Source Code

This guide explains how to effectively mock CommonJS modules when writing tests using ES Module syntax in Vitest/Jest.

## The Problem: Module Systems Impedance Mismatch

When testing code in FitFileViewer, we face a fundamental challenge:

- **Source code** uses **CommonJS** (using `require()` and `module.exports`)
- **Tests** use **ES Modules** (using `import` and `export`)

This mismatch creates problems when trying to mock dependencies:

1. **Regular Mocking Doesn't Work**: When using `vi.mock()` in an ES Module test, it doesn't intercept `require()` calls from CommonJS modules.

2. **Module Caching**: Node.js caches modules, so even if you mock a module after it's been loaded, other modules may still use the cached (unmocked) version.

3. **Path Resolution Differences**: Different module systems resolve paths differently, leading to inconsistent module identification.

## The Solution: Enhanced Module Interop Mocking

We created the `cjsMockInterop.js` utility to solve these problems using a multi-pronged approach:

### Key Strategy Components

1. **Global `require()` Override**: We replace the global `require` function to intercept calls to target modules and return our mocks.

2. **Cache Management**: We clear the require cache for target modules to ensure they're freshly loaded.

3. **Path Normalization**: We handle different path formats to ensure consistent module identification.

4. **Cleanup Utilities**: We provide cleanup functions to restore the original state after tests.

## How to Use the Utility

### Basic Usage

```javascript
import { mockStateManager } from "./cjsMockInterop";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Your Test Suite", () => {
 let stateManager;
 let cleanup;

 beforeEach(() => {
  // Setup mocking
  const mockResult = mockStateManager({ verbose: true });
  stateManager = mockResult;
  cleanup = mockResult.cleanup;
 });

 afterEach(() => {
  // Cleanup after test
  if (cleanup) cleanup();
  vi.resetModules();
 });

 it("should test something", () => {
  // Import the module after setting up mocks
  const { yourFunction } = require("../../path/to/your/module.js");

  // Run test
  yourFunction();

  // Verify mock was called
  expect(stateManager.setState).toHaveBeenCalled();
 });
});
```

### Important Guidelines

1. **Import Order Matters**: Always set up mocks _before_ importing the module under test.

2. **Use `require()` Not `import`**: After setting up mocks, use `require()` to import the module under test.

3. **Always Clean Up**: Call the cleanup function in `afterEach` to restore the original require function.

4. **Use Absolute Paths**: When possible, use absolute paths to avoid path resolution issues.

5. **Reset Modules**: Use `vi.resetModules()` after tests to ensure fresh module loading.

## Advanced Techniques

### Custom Module Mocking

For modules other than stateManager, you can use the `createCommonJSMock` function:

```javascript
import { createCommonJSMock } from "./cjsMockInterop";

const mockImplementation = {
 myFunction: vi.fn(),
};

const { mock, cleanup } = createCommonJSMock({
 modulePath: "../../path/to/module.js",
 mockImplementation,
 verbose: true,
});

// Use mock.myFunction in your tests
// Call cleanup() when done
```

### Debugging Module Resolution Issues

Enable verbose logging to see what's happening with module resolution:

```javascript
mockStateManager({ verbose: true });
```

## Common Pitfalls

1. **Mock Setup Timing**: Make sure mocks are set up before the module is imported.

2. **Path Mismatches**: Ensure you're using the correct paths that match how modules are required.

3. **Cache Issues**: If you see unexpected behavior, try clearing the require cache manually.

4. **Multiple Mock Setups**: When setting up multiple mocks, make sure they don't interfere with each other.

## When to Use This Approach

Use this approach when:

1. You need to mock a CommonJS module from an ES Module test
2. Regular `vi.mock()` isn't intercepting `require()` calls
3. You're testing code that depends on modules that use `require()`

## Performance Considerations

This mocking approach involves runtime manipulation of Node.js module loading mechanisms, which can have performance implications. In general:

- Use specific path matching instead of broad patterns
- Clean up mocks properly after tests
- Consider grouping related tests to minimize setup/teardown overhead

By following these guidelines, you can effectively test your CommonJS code with ES Module tests without running into module system mismatches.
