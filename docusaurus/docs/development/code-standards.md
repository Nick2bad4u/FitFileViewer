---
id: code-standards
title: Code Standards
sidebar_label: 📝 Code Standards
sidebar_position: 2
description: Code style and standards for FitFileViewer development.
---

# Code Standards

Guidelines for writing clean, maintainable code.

## JavaScript Standards

### General Rules

- Use ES6+ features
- Prefer `const` over `let`
- Never use `var`
- Use arrow functions for callbacks
- Use template literals

### Naming Conventions

```javascript
// Variables and functions: camelCase
const userName = 'John';
function formatDistance() { }

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Classes: PascalCase
class StateManager { }

// Files: camelCase or kebab-case
formatDistance.js
map-utils.js
```

### Function Style

```javascript
// Prefer arrow functions for simple functions
const add = (a, b) => a + b;

// Use regular functions for methods and complex logic
function processFileData(data) {
    // Complex logic
}

// Always document functions
/**
 * Formats a distance value.
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance
 */
function formatDistance(meters) {
    return `${(meters / 1000).toFixed(2)} km`;
}
```

### Error Handling

```javascript
// Always handle errors
try {
    const data = await loadFile(path);
    processData(data);
} catch (error) {
    console.error('Failed to load file:', error);
    showErrorToUser('Unable to load file');
}

// Throw meaningful errors
if (!isValid(input)) {
    throw new Error(`Invalid input: expected number, got ${typeof input}`);
}
```

## Module Standards

### Single Responsibility

Each module should do one thing:

```javascript
// ✅ Good: Single responsibility
// formatDistance.js
export function formatDistance(meters) { }
export function convertToMiles(meters) { }

// ❌ Bad: Multiple responsibilities
// utils.js
export function formatDistance() { }
export function renderMap() { }  // Unrelated
```

### Clear Exports

```javascript
// Named exports for multiple functions
export function formatDistance(meters) { }
export function formatDuration(seconds) { }

// Default export for main functionality
export default function formatDistance(meters) { }
```

### Documentation

```javascript
/**
 * Module description.
 * @module formatDistance
 */

/**
 * Formats a distance for display.
 *
 * @param {number} meters - The distance in meters
 * @param {Object} options - Formatting options
 * @param {string} options.unit - Target unit ('km' or 'mi')
 * @param {number} options.decimals - Decimal places
 * @returns {string} Formatted distance string
 *
 * @example
 * formatDistance(5000); // "5.00 km"
 * formatDistance(5000, { unit: 'mi' }); // "3.11 mi"
 */
export function formatDistance(meters, options = {}) {
    const { unit = 'km', decimals = 2 } = options;
    // Implementation
}
```

## CSS Standards

### Class Naming

Use BEM or descriptive names:

```css
/* BEM style */
.chart-container { }
.chart-container__header { }
.chart-container--fullscreen { }

/* Descriptive */
.main-map-view { }
.data-table-wrapper { }
```

### Organization

```css
/* Group by component */

/* Map styles */
.map-container { }
.map-controls { }
.map-fullscreen { }

/* Chart styles */
.chart-container { }
.chart-legend { }
```

## Testing Standards

### Test Structure

```javascript
describe('formatDistance', () => {
    describe('basic formatting', () => {
        it('should format meters to kilometers', () => {
            expect(formatDistance(5000)).toBe('5.00 km');
        });

        it('should handle zero', () => {
            expect(formatDistance(0)).toBe('0.00 km');
        });
    });

    describe('unit conversion', () => {
        it('should convert to miles', () => {
            expect(formatDistance(5000, { unit: 'mi' })).toBe('3.11 mi');
        });
    });
});
```

### Test Coverage

- Aim for high coverage
- Test edge cases
- Test error conditions

## Commit Standards

### Commit Messages

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(maps): add measurement tool
fix(charts): correct elevation calculation
docs: update installation guide
```

## Review Checklist

Before submitting code:

- [ ] Code follows style guide
- [ ] Functions are documented
- [ ] Tests are added/updated
- [ ] No linting errors
- [ ] No console.log statements
- [ ] Error handling in place

---

**Next:** [Module Development →](/docs/development/module-development)
