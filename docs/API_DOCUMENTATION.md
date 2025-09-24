# FitFileViewer - API Documentation

## 📋 Table of Contents

- [Core APIs](#core-apis)
- [Utility Modules API](#utility-modules-api)
- [State Management API](#state-management-api)
- [Error Handling API](#error-handling-api)
- [Configuration API](#configuration-api)
- [IPC Communication API](#ipc-communication-api)
- [Plugin Development API](#plugin-development-api)
- [Testing API](#testing-api)

## Core APIs

### Main Process API

The main Electron process provides core application functionality including file handling, window management, and system integration.

#### Application Lifecycle

```javascript
// App initialization
app.whenReady().then(() => {
    createWindow();
    setupMenus();
    setupAutoUpdater();
});

// Window management
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
}
```

#### IPC Handlers

```javascript
// File operations
ipcMain.handle('dialog:open-fit-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'FIT Files', extensions: ['fit'] }]
    });
    return result;
});

// Application info
ipcMain.handle('app:get-version', () => app.getVersion());

// Window state
ipcMain.handle('window:get-bounds', () => mainWindow.getBounds());
```

### Renderer Process API

The renderer process handles UI interactions and data visualization.

#### Core Renderer Functions

```javascript
// Application initialization
async function initializeApp() {
    await setupTheme();
    await setupEventListeners();
    await loadUtilities();
}

// File processing
async function processFile(filePath) {
    try {
        const data = await parseFile(filePath);
        await updateUI(data);
        return data;
    } catch (error) {
        handleError(error);
    }
}
```

### Preload API

Secure communication bridge between main and renderer processes.

```javascript
// Context bridge API
contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    openFile: () => ipcRenderer.invoke('dialog:open-fit-file'),

    // Application info
    getVersion: () => ipcRenderer.invoke('app:get-version'),

    // Event listeners
    onFileOpened: (callback) => {
        ipcRenderer.on('file:opened', callback);
    }
});
```

## Utility Modules API

### Formatting API

Comprehensive data formatting utilities with consistent error handling.

#### Distance Formatting

```javascript
import { formatDistance } from './utils/formatting/formatters/formatDistance.js';

/**
 * Format distance with appropriate units
 * @param {number} distance - Distance in meters
 * @param {string} [targetUnit] - Target unit (auto-detected if not provided)
 * @param {number} [precision=2] - Decimal precision
 * @returns {string} Formatted distance string
 *
 * @example
 * formatDistance(1000) // "1.00 km"
 * formatDistance(500, 'meters') // "500 m"
 * formatDistance(1609.344, 'miles') // "1.00 mi"
 */
```

#### Time Formatting

```javascript
import { formatTime } from './utils/formatting/formatters/formatTime.js';

/**
 * Format time duration
 * @param {number} seconds - Time in seconds
 * @param {boolean} [useUserUnits=false] - Use user's preferred time units
 * @returns {string} Formatted time string
 *
 * @example
 * formatTime(3661) // "1:01:01"
 * formatTime(90) // "1:30"
 * formatTime(3600, true) // "1.0h" (if user prefers hours)
 */
```

#### Unit Conversion API

```javascript
import { convertDistanceUnits } from './utils/formatting/converters/convertDistanceUnits.js';

/**
 * Convert distance between units
 * @param {number} meters - Distance in meters
 * @param {string} targetUnit - Target unit
 * @returns {number} Converted distance
 * @throws {TypeError} If input is invalid
 *
 * @example
 * convertDistanceUnits(1000, 'kilometers') // 1
 * convertDistanceUnits(1609.344, 'miles') // 1
 */
```

### Chart API

Data visualization using Chart.js and Vega-Lite.

#### Chart.js Integration

```javascript
import { renderChartJS } from './utils/charts/renderChartJS.js';

/**
 * Render Chart.js chart
 * @param {string} containerId - Container element ID
 * @param {Object} chartData - Chart data configuration
 * @param {Object} [options={}] - Chart options
 * @returns {Promise<Chart>} Chart instance
 */
async function createChart(containerId, chartData, options = {}) {
    const chartConfig = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Activity Data' }
            },
            ...options
        }
    };

    return await renderChartJS(containerId, chartConfig);
}
```

#### Vega-Lite Integration

```javascript
import { renderVegaChart } from './utils/charts/vegaLiteCharts.js';

/**
 * Render Vega-Lite visualization
 * @param {string} containerId - Container element ID
 * @param {Object} spec - Vega-Lite specification
 * @returns {Promise<vegaEmbed.Result>} Vega visualization
 */
const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    mark: "line",
    encoding: {
        x: { field: "time", type: "temporal" },
        y: { field: "value", type: "quantitative" }
    },
    data: { values: chartData }
};

await renderVegaChart('#chart-container', spec);
```

### Map API

Interactive mapping using Leaflet.js.

#### Map Rendering

```javascript
import { renderMap } from './utils/maps/renderMap.js';

/**
 * Render interactive map
 * @param {string} containerId - Map container element ID
 * @param {Object} trackData - GPS track data
 * @param {Object} [options={}] - Map configuration options
 * @returns {Promise<L.Map>} Leaflet map instance
 */
const mapOptions = {
    center: [lat, lng],
    zoom: 13,
    theme: 'light' // 'light' | 'dark'
};

const map = await renderMap('#map-container', trackData, mapOptions);
```

#### Map Controls

```javascript
import { addMapControls } from './utils/maps/mapControls.js';

/**
 * Add interactive controls to map
 * @param {L.Map} map - Leaflet map instance
 * @param {Object} controls - Control configuration
 */
addMapControls(map, {
    fullscreen: true,
    layers: true,
    measure: true,
    lapSelector: true
});
```

### Table API

Data table creation and management.

```javascript
import { createTables } from './utils/data/createTables.js';

/**
 * Create data tables from FIT file records
 * @param {Object} fitData - Parsed FIT file data
 * @param {string} containerId - Table container element ID
 * @returns {Promise<void>}
 */
await createTables(fitData, '#table-container');

// Table export functionality
import { copyTableAsCSV } from './utils/ui/copyTableAsCSV.js';
copyTableAsCSV('table-id'); // Copy table data to clipboard as CSV
```

## State Management API

### Unified State Manager

Central state management with persistence and reactivity.

```javascript
import { unifiedStateManager } from './utils/state/core/unifiedStateManager.js';

// State operations
const state = unifiedStateManager;

// Get state value
const currentTheme = state.get('theme.current', 'light');

// Set state value
state.set('theme.current', 'dark');

// Subscribe to changes
const unsubscribe = state.subscribe('theme', (newValue, oldValue) => {
    console.log('Theme changed:', oldValue, '->', newValue);
});

// Batch operations
state.batchUpdate(() => {
    state.set('user.preferences.theme', 'dark');
    state.set('user.preferences.units', 'metric');
    state.set('user.lastActive', Date.now());
});
```

### State Persistence

```javascript
// Auto-save state changes
state.setSyncEnabled(true);

// Manual persistence
state.saveToStorage();
state.loadFromStorage();

// State validation
const isValid = state.validateConsistency();

// State snapshot
const snapshot = state.getSnapshot();
```

## Error Handling API

### Unified Error Handling

Consistent error handling across the application.

#### Error Wrapper Functions

```javascript
import { withErrorHandling } from './utils/errors/errorHandling.js';

/**
 * Wrap function with error handling
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function with error handling
 */
const safeFunction = withErrorHandling(
    function riskyOperation(data) {
        // Potentially failing operation
        return processData(data);
    },
    {
        failSafe: true,    // Return fallback on error
        logError: true,    // Log errors to console
        notify: true,      // Show user notification
        fallback: null     // Fallback value
    }
);
```

#### Input Validation

```javascript
import { validateInput, validators } from './utils/errors/errorHandling.js';

/**
 * Validate function inputs
 * @param {any} value - Value to validate
 * @param {Function[]} validatorList - Array of validator functions
 * @param {string} fieldName - Field name for error messages
 * @returns {Object} Validation result
 */
const validation = validateInput(inputData, [
    validators.isRequired,
    validators.isObject,
    validators.hasProperty('data')
], 'inputData');

if (!validation.isValid) {
    throw new ValidationError(validation.message);
}
```

#### Custom Error Types

```javascript
import { AppError, ValidationError } from './utils/errors/errorHandling.js';

// Application-specific error
throw new AppError('Operation failed', {
    operation: 'fileProcessing',
    file: fileName,
    timestamp: Date.now()
});

// Validation error
throw new ValidationError('Invalid input format', {
    expected: 'object',
    received: typeof input
});
```

### Resilient Functions

```javascript
import { makeResilient } from './utils/errors/errorHandling.js';

/**
 * Make function resilient to errors
 * @param {Function} fn - Function to make resilient
 * @param {any} fallback - Fallback value on error
 * @returns {Function} Resilient function
 */
const resilientParser = makeResilient(parseComplexData, []);

// Usage
const data = resilientParser(input); // Returns [] on error
```

## Configuration API

### Constants and Configuration

Centralized configuration management.

```javascript
import {
    DISTANCE_UNITS,
    CONVERSION_FACTORS,
    UI_CONSTANTS
} from './utils/config/constants.js';

// Distance units
const units = DISTANCE_UNITS; // { METERS, KILOMETERS, FEET, MILES }

// Conversion factors
const factors = CONVERSION_FACTORS; // { METERS_PER_KILOMETER, etc. }

// UI configuration
const ui = UI_CONSTANTS; // { DEFAULT_THEME, ANIMATION_DURATION, etc. }
```

### Dynamic Configuration

```javascript
import { getConfig, setConfig } from './utils/config/appConfig.js';

// Get configuration value
const theme = getConfig('theme.default', 'light');

// Set configuration value
setConfig('theme.default', 'dark');

// Get nested configuration
const chartConfig = getConfig('charts.defaultOptions', {});
```

## IPC Communication API

### Main Process IPC

IPC handlers for main process operations.

```javascript
// Register IPC handler
ipcMain.handle('operation:name', async (event, ...args) => {
    try {
        const result = await performOperation(...args);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Send to renderer
mainWindow.webContents.send('event:name', data);
```

### Renderer Process IPC

IPC communication from renderer process.

```javascript
// Invoke main process handler
const result = await window.electronAPI.performOperation(data);

// Listen for events
window.electronAPI.onEvent((event, data) => {
    handleEvent(data);
});

// Send to main process
window.electronAPI.sendToMain('event:name', data);
```

### Secure IPC Patterns

```javascript
// Preload script - secure bridge
contextBridge.exposeInMainWorld('electronAPI', {
    // Safe operation
    openFile: () => ipcRenderer.invoke('dialog:open-file'),

    // Validated operation
    saveData: (data) => {
        if (!validateData(data)) {
            throw new Error('Invalid data format');
        }
        return ipcRenderer.invoke('file:save', data);
    },

    // Event listener with validation
    onFileChanged: (callback) => {
        ipcRenderer.on('file:changed', (event, data) => {
            if (validateFileData(data)) {
                callback(data);
            }
        });
    }
});
```

## Plugin Development API

### Plugin Architecture

Extensible plugin system for adding functionality.

```javascript
// Plugin interface
class PluginBase {
    constructor(app) {
        this.app = app;
        this.name = 'PluginName';
        this.version = '1.0.0';
    }

    // Initialize plugin
    async initialize() {
        // Setup plugin
    }

    // Register plugin features
    register() {
        // Register menu items, handlers, etc.
    }

    // Cleanup on plugin unload
    destroy() {
        // Cleanup resources
    }
}

// Plugin registration
function registerPlugin(plugin) {
    if (plugin instanceof PluginBase) {
        plugins.set(plugin.name, plugin);
        plugin.initialize();
    }
}
```

### Plugin Events

```javascript
// Plugin event system
class PluginEventManager {
    constructor() {
        this.events = new Map();
    }

    // Subscribe to plugin event
    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }
        this.events.get(eventName).add(callback);
    }

    // Emit plugin event
    emit(eventName, data) {
        const callbacks = this.events.get(eventName);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }
}
```

## Testing API

### Test Utilities

Utilities for testing application components.

```javascript
import { createTestEnvironment } from './tests/utils/testEnvironment.js';

// Create test environment
const testEnv = await createTestEnvironment();

// Mock Electron APIs
testEnv.mockElectron({
    app: { getVersion: () => '1.0.0' },
    dialog: { showOpenDialog: vi.fn() }
});

// Create test data
const testData = testEnv.createFitFileData({
    records: 1000,
    duration: 3600
});
```

### Component Testing

```javascript
import { renderComponent } from './tests/utils/componentHelpers.js';

// Render component for testing
const component = await renderComponent('MapComponent', {
    props: { trackData: testTrackData },
    container: document.getElementById('test-container')
});

// Test component behavior
expect(component.getZoom()).toBe(13);
component.setZoom(15);
expect(component.getZoom()).toBe(15);
```

### Integration Testing

```javascript
import { createIntegrationTest } from './tests/utils/integrationHelpers.js';

// Create integration test
const integrationTest = createIntegrationTest({
    modules: ['fitParser', 'mapRenderer', 'stateManager'],
    mockLevel: 'partial' // 'none', 'partial', 'full'
});

// Run integration test
await integrationTest.run(async ({ fitParser, mapRenderer, stateManager }) => {
    const data = await fitParser.parse(testFitFile);
    stateManager.set('currentTrack', data);
    const map = await mapRenderer.render('#map', data);

    expect(map.hasLayer('track')).toBe(true);
});
```

This API documentation provides comprehensive coverage of all public APIs and interfaces available in the FitFileViewer application, enabling developers to effectively use and extend the application's functionality.
