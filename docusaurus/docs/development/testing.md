---
id: testing
title: Testing
sidebar_label: 🧪 Testing
sidebar_position: 4
description: Testing strategies and practices for FitFileViewer.
---

# Testing

FitFileViewer uses root-owned Vitest and Playwright tooling for test coverage.

## Test Structure

```text
tests/
├── unit/              # Root-owned unit tests for tooling, runtime, rendering, maps, charts, and shared UI behavior
│   └── strictTests/   # Browser-oriented strict regression tests
├── integration/       # Root-owned Vitest integration tests
├── fixtures/          # Reusable Vitest fixtures
├── playwright/        # Electron Playwright smoke tests
└── vitest/            # Shared Vitest setup, shims, and stubs
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific file
npm test -- tests/unit/rendering/helpers/renderSummaryHelpers.test.ts

# Run with pattern
npm test -- --grep "formatDistance"
```

## Writing Tests

### Basic Test Structure

```javascript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { formatDistance } from "../../../../electron-app/utils/formatting/formatDistance.js";

describe("formatDistance", () => {
 describe("basic formatting", () => {
  it("should format meters to kilometers", () => {
   expect(formatDistance(5000)).toBe("5.00 km");
  });

  it("should handle decimal values", () => {
   expect(formatDistance(5500)).toBe("5.50 km");
  });
 });

 describe("edge cases", () => {
  it("should handle zero", () => {
   expect(formatDistance(0)).toBe("0.00 km");
  });

  it("should handle negative values", () => {
   expect(formatDistance(-1000)).toBe("-1.00 km");
  });
 });
});
```

### Testing with Setup/Teardown

```javascript
describe("StateManager", () => {
 let stateManager;

 beforeEach(() => {
  stateManager = new StateManager();
 });

 afterEach(() => {
  stateManager.reset();
 });

 it("should store values", () => {
  stateManager.set("key", "value");
  expect(stateManager.get("key")).toBe("value");
 });
});
```

### Testing Async Functions

```javascript
describe("loadFile", () => {
 it("should load file successfully", async () => {
  const result = await loadFile("test.fit");
  expect(result).toBeDefined();
  expect(result.records).toBeInstanceOf(Array);
 });

 it("should reject invalid files", async () => {
  await expect(loadFile("invalid.txt")).rejects.toThrow("Invalid file type");
 });
});
```

### Mocking

```javascript
import { vi } from "vitest";

describe("with mocks", () => {
 it("should call callback", () => {
  const callback = vi.fn();

  processData(data, callback);

  expect(callback).toHaveBeenCalled();
  expect(callback).toHaveBeenCalledWith(expectedData);
 });
});
```

## Test Categories

### Unit Tests

Test individual functions in isolation:

```javascript
// Test pure functions
describe("calculateAverage", () => {
 it("should calculate average", () => {
  expect(calculateAverage([1, 2, 3])).toBe(2);
 });
});
```

### Integration Tests

Test module interactions:

```javascript
// Test components working together
describe("FileProcessor", () => {
 it("should parse and format file data", async () => {
  const fileData = await loadFile("test.fit");
  const formatted = formatFileData(fileData);

  expect(formatted.summary).toBeDefined();
  expect(formatted.records.length).toBeGreaterThan(0);
 });
});
```

### E2E Tests

Test full user workflows:

```javascript
// Test complete user scenarios
describe("User opens FIT file", () => {
 it("should display data in all tabs", async () => {
  await openFile("activity.fit");

  await clickTab("Map");
  expect(await isMapVisible()).toBe(true);

  await clickTab("Charts");
  expect(await areChartsVisible()).toBe(true);
 });
});
```

## Coverage

### View Coverage Report

```bash
npm run test:coverage
```

### Coverage Targets

| Type       | Target |
| ---------- | ------ |
| Statements | 80%+   |
| Branches   | 75%+   |
| Functions  | 80%+   |
| Lines      | 80%+   |

### Coverage Configuration

```javascript
// vitest.config.ts (root-owned)
export default {
 test: {
  coverage: {
   provider: "v8",
   reporter: ["text", "html", "lcov"],
   exclude: ["tests/", "node_modules/"],
  },
 },
};
```

## Best Practices

### Do

- ✅ Test one thing per test
- ✅ Use descriptive test names
- ✅ Test edge cases
- ✅ Test error conditions
- ✅ Keep tests independent

### Don't

- ❌ Test implementation details
- ❌ Use magic numbers
- ❌ Leave console.log in tests
- ❌ Depend on test order

### Test Naming

```javascript
// Good: Describes behavior
it("should return formatted string when given valid input", () => {});
it("should throw error when input is null", () => {});

// Bad: Vague
it("works", () => {});
it("test1", () => {});
```

---

**Next:** [Build & Release →](/docs/development/build-release)
