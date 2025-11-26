---
id: state-management
title: State Management
sidebar_label: 📊 State Management
sidebar_position: 4
description: State management API reference.
---

# State Management

Reference for the application state management system.

## Overview

FitFileViewer uses a centralized state management system for:
- Current file data
- User preferences
- Theme settings
- UI state

## StateManager

### Basic Usage

```javascript
import { stateManager } from './utils/state/stateManager.js';

// Store a value
stateManager.set('key', value);

// Retrieve a value
const value = stateManager.get('key');

// Remove a value
stateManager.remove('key');
```

### Subscription Pattern

```javascript
// Subscribe to changes
const unsubscribe = stateManager.subscribe('currentFile', (newValue, oldValue) => {
    console.log('File changed:', { newValue, oldValue });
    updateVisualization(newValue);
});

// Later: unsubscribe
unsubscribe();
```

### State Keys

| Key | Type | Description |
|-----|------|-------------|
| `currentFile` | object | Currently loaded file data |
| `theme` | string | 'light' or 'dark' |
| `recentFiles` | array | Recent file paths |
| `preferences` | object | User preferences |

## ThemeManager

### Usage

```javascript
import { themeManager } from './utils/state/themeManager.js';

// Get current theme
const theme = themeManager.getTheme();

// Set theme
themeManager.setTheme('dark');

// Toggle theme
themeManager.toggleTheme();

// Subscribe to changes
themeManager.onChange((theme) => {
    document.body.dataset.theme = theme;
});
```

## FileStateManager

### Usage

```javascript
import { fileStateManager } from './utils/state/fileStateManager.js';

// Load file
await fileStateManager.loadFile(filePath);

// Get current file
const file = fileStateManager.getCurrentFile();

// Check if file is loaded
if (fileStateManager.hasFile()) {
    // File is loaded
}

// Clear current file
fileStateManager.clearFile();
```

### File State Structure

```javascript
{
    path: '/path/to/file.fit',
    name: 'file.fit',
    size: 1234567,
    loadedAt: Date,
    data: {
        records: [],
        laps: [],
        sessions: [],
        summary: {}
    }
}
```

## Persistence

### LocalStorage Persistence

State can be persisted to localStorage:

```javascript
// Configure persistence
stateManager.configurePersistence({
    keys: ['theme', 'preferences', 'recentFiles'],
    storage: localStorage
});

// State automatically saved on change
stateManager.set('theme', 'dark');
// → Saved to localStorage

// State loaded on init
stateManager.loadPersistedState();
```

### What Gets Persisted

| Key | Persisted | Reason |
|-----|-----------|--------|
| `theme` | ✅ | User preference |
| `preferences` | ✅ | User settings |
| `recentFiles` | ✅ | Quick access |
| `currentFile` | ❌ | Too large |

## Best Practices

### Do

```javascript
// ✅ Use typed keys
const KEYS = {
    THEME: 'theme',
    FILE: 'currentFile'
};
stateManager.set(KEYS.THEME, 'dark');

// ✅ Subscribe for specific keys
stateManager.subscribe('theme', handleThemeChange);

// ✅ Clean up subscriptions
useEffect(() => {
    const unsub = stateManager.subscribe('key', handler);
    return () => unsub();
}, []);
```

### Don't

```javascript
// ❌ Store large data unnecessarily
stateManager.set('rawBuffer', hugeArrayBuffer);

// ❌ Forget to unsubscribe
stateManager.subscribe('key', handler);
// Never unsubscribed = memory leak

// ❌ Use magic strings
stateManager.get('crrntFile'); // Typo!
```

---

**Related:** [Architecture Overview](/docs/architecture/overview)
