---
id: module-development
title: Module Development
sidebar_label: 📦 Module Development
sidebar_position: 3
description: How to create new modules for FitFileViewer.
---

# Module Development

Guide to creating new utility modules.

## Creating a New Module

### 1. Choose Location

Place your module in the appropriate `utils/` subdirectory:

```
utils/
├── formatting/   # Data formatters
├── maps/         # Map functionality
├── charts/       # Chart functionality
├── state/        # State management
├── files/        # File operations
├── ui/           # UI components
└── your-category/
```

### 2. Create Module File

```javascript
// utils/formatting/formatPower.js

/**
 * Power formatting utilities.
 * @module formatPower
 */

/**
 * Formats power value for display.
 *
 * @param {number} watts - Power in watts
 * @param {Object} [options] - Formatting options
 * @param {number} [options.decimals=0] - Decimal places
 * @returns {string} Formatted power string
 *
 * @example
 * formatPower(250); // "250 W"
 * formatPower(1500); // "1.5 kW"
 */
export function formatPower(watts, options = {}) {
    const { decimals = 0 } = options;

    if (watts >= 1000) {
        return `${(watts / 1000).toFixed(1)} kW`;
    }

    return `${watts.toFixed(decimals)} W`;
}

/**
 * Converts power to watts per kilogram.
 *
 * @param {number} watts - Power in watts
 * @param {number} weightKg - Weight in kilograms
 * @returns {number} Watts per kilogram
 */
export function powerToWkg(watts, weightKg) {
    if (weightKg <= 0) {
        throw new Error('Weight must be positive');
    }
    return watts / weightKg;
}
```

### 3. Add Tests

```javascript
// tests/unit/formatPower.test.js

import { describe, it, expect } from 'vitest';
import { formatPower, powerToWkg } from '../../utils/formatting/formatPower.js';

describe('formatPower', () => {
    it('should format watts', () => {
        expect(formatPower(250)).toBe('250 W');
    });

    it('should format kilowatts for large values', () => {
        expect(formatPower(1500)).toBe('1.5 kW');
    });

    it('should handle zero', () => {
        expect(formatPower(0)).toBe('0 W');
    });
});

describe('powerToWkg', () => {
    it('should calculate watts per kg', () => {
        expect(powerToWkg(300, 75)).toBe(4);
    });

    it('should throw for zero weight', () => {
        expect(() => powerToWkg(300, 0)).toThrow();
    });
});
```

### 4. Export from Index

If your category has an index file:

```javascript
// utils/formatting/index.js
export { formatDistance } from './formatDistance.js';
export { formatDuration } from './formatDuration.js';
export { formatPower, powerToWkg } from './formatPower.js';  // Add
```

### 5. Import and Use

```javascript
// In other modules
import { formatPower } from '../utils/formatting/formatPower.js';

// Or from index
import { formatPower } from '../utils/formatting/index.js';
```

## Module Template

```javascript
/**
 * [Module Description]
 * @module [moduleName]
 */

// Constants
const DEFAULT_OPTIONS = {
    // Default values
};

/**
 * [Function description]
 *
 * @param {type} paramName - Parameter description
 * @param {Object} [options] - Options object
 * @returns {type} Return description
 *
 * @example
 * // Usage example
 */
export function functionName(param, options = {}) {
    // Merge options with defaults
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Validate inputs
    if (!isValid(param)) {
        throw new Error('Invalid parameter');
    }

    // Implementation
    return result;
}
```

## Best Practices

### Do

- ✅ Single responsibility
- ✅ Clear function names
- ✅ Comprehensive JSDoc
- ✅ Input validation
- ✅ Error handling
- ✅ Unit tests

### Don't

- ❌ Side effects
- ❌ Global state
- ❌ Circular dependencies
- ❌ DOM manipulation (in utility modules)
- ❌ Console.log in production

## Module Categories

### Formatting Modules

Transform data for display:

```javascript
export function formatValue(value) {
    // Transform to display string
    return displayString;
}
```

### Utility Modules

General-purpose helpers:

```javascript
export function calculateMetric(data) {
    // Compute and return result
    return result;
}
```

### UI Modules

Handle user interface:

```javascript
export function setupComponent(element) {
    // Attach event listeners
    // Update DOM
}
```

---

**Next:** [Testing →](/docs/development/testing)
