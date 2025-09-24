# FitFileViewer - Application Architecture Guide

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture Patterns](#architecture-patterns)
- [Core Components](#core-components)
- [Process Architecture](#process-architecture)
- [Module System](#module-system)
- [Data Flow](#data-flow)
- [Security Model](#security-model)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)

## Overview

FitFileViewer is a cross-platform desktop Electron application for viewing and analyzing .fit files from fitness devices. It follows a modular, scalable architecture with clear separation of concerns and robust error handling.

### Key Architectural Principles

- **Modular Design**: 50+ utility modules organized by functionality
- **Security-First**: Context isolation, sandboxed renderer, secure IPC
- **Performance-Optimized**: Lazy loading, efficient data processing
- **Cross-Platform**: Windows, macOS, Linux support
- **Extensible**: Plugin-ready architecture with clear interfaces

## Architecture Patterns

### 1. Multi-Process Architecture (Electron)

```
┌─────────────────┐         IPC         ┌─────────────────┐
│   Main Process  │ ◄─────────────────► │ Renderer Process │
│                 │                     │                  │
│ • App lifecycle │                     │ • UI rendering   │
│ • File system   │                     │ • User interaction│
│ • Menu system   │                     │ • Chart/Map views│
│ • Auto-updater  │                     │ • Data display   │
└─────────────────┘                     └─────────────────┘
         │                                       │
         │                                       │
         ▼                                       ▼
┌─────────────────┐                     ┌─────────────────┐
│ Preload Script  │                     │  Utility System │
│                 │                     │                 │
│ • IPC bridge    │                     │ • 50+ modules   │
│ • Security      │                     │ • State mgmt    │
│ • Context isolation│                   │ • Error handling│
└─────────────────┘                     └─────────────────┘
```

### 2. Modular Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FitFileViewer Application                 │
├─────────────────────────────────────────────────────────────┤
│                     Presentation Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│
│  │    Maps     │ │   Charts    │ │   Tables    │ │   UI     ││
│  │  (Leaflet)  │ │(Chart.js/   │ │(DataTables) │ │Components││
│  │             │ │ Vega-Lite)  │ │             │ │          ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘│
├─────────────────────────────────────────────────────────────┤
│                     Business Logic Layer                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│
│  │ Data Proc.  │ │  Formatting │ │State Mgmt.  │ │ Rendering││
│  │             │ │             │ │             │ │          ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘│
├─────────────────────────────────────────────────────────────┤
│                      Service Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│
│  │File Handling│ │Error Handling│ │  Logging   │ │Performance││
│  │             │ │             │ │             │ │          ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘│
├─────────────────────────────────────────────────────────────┤
│                       Data Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│
│  │FIT Parser   │ │Local Storage│ │  Config     │ │Recent Files│
│  │(Garmin SDK) │ │             │ │             │ │          ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Entry Points

| File | Role | Description |
|------|------|-------------|
| `main.js` | Main Process | Application lifecycle, window management, IPC handlers |
| `renderer.js` | Renderer Process | UI initialization, module loading, error boundaries |
| `preload.js` | Security Bridge | Secure IPC communication, context isolation |
| `main-ui.js` | UI Manager | Tab management, user interactions |

### 2. Utility Module System (50+ modules)

```
utils/
├── app/                     # Application-level utilities
│   ├── aboutModal.js       # About dialog management
│   ├── appMenu.js          # Menu system creation
│   └── notifications.js    # User notification system
├── charts/                 # Data visualization
│   ├── chartSpec.js        # Chart configuration
│   ├── renderChartJS.js    # Chart.js integration
│   └── vegaLiteUtils.js    # Vega-Lite charts
├── config/                 # Configuration management
│   └── constants.js        # Centralized constants
├── data/                   # Data processing
│   ├── createTables.js     # Table generation
│   ├── formatUtils.js      # Data formatting
│   └── patchSummaryFields.js # Data normalization
├── errors/                 # Error handling system
│   └── errorHandling.js    # Unified error patterns
├── files/                  # File operations
│   ├── handleOpenFile.js   # File opening logic
│   ├── recentFiles.js      # Recent files management
│   └── fileValidation.js   # File format validation
├── formatting/             # Data formatting utilities
│   ├── converters/         # Unit conversion
│   └── formatters/         # Display formatting
├── maps/                   # Map visualization
│   ├── renderMap.js        # Leaflet map rendering
│   ├── mapBaseLayers.js    # Map tile providers
│   ├── mapDrawLaps.js      # Route visualization
│   └── mapTheme.js         # Theme switching
├── state/                  # State management
│   ├── core/              # Core state system
│   └── managers/          # State managers
├── theming/               # Theme management
│   ├── setupTheme.js      # Theme initialization
│   └── updateMapTheme.js  # Map theme updates
└── ui/                    # UI components
    ├── tabManager.js      # Tab system
    ├── fullscreen.js      # Fullscreen handling
    └── setupWindow.js     # Window initialization
```

### 3. Data Processing Pipeline

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ .fit File   │ ───► │FIT Parser   │ ───► │Data Proc.   │ ───► │Visualization│
│ Input       │      │(Garmin SDK) │      │& Formatting │      │Components   │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
       │                     │                     │                     │
       │                     ▼                     ▼                     ▼
       │              ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
       └─────────────▶│Error        │      │State        │      │UI           │
                      │Handling     │      │Management   │      │Updates      │
                      └─────────────┘      └─────────────┘      └─────────────┘
```

## Process Architecture

### Main Process Responsibilities

```javascript
// main.js architecture
const MainProcess = {
    lifecycle: {
        initialization: 'App startup, window creation',
        eventHandling: 'System events, app events',
        cleanup: 'Graceful shutdown, resource cleanup'
    },
    windowManagement: {
        creation: 'BrowserWindow configuration',
        state: 'Position, size, visibility persistence',
        security: 'Context isolation, sandboxing'
    },
    fileSystem: {
        dialogs: 'File open/save dialogs',
        access: 'Secure file system operations',
        monitoring: 'File change detection'
    },
    ipc: {
        handlers: 'IPC message routing',
        security: 'Message validation',
        responses: 'Async response handling'
    }
};
```

### Renderer Process Architecture

```javascript
// renderer.js + modules architecture
const RendererProcess = {
    initialization: {
        moduleLoading: 'Dynamic utility loading',
        errorBoundaries: 'Global error handling',
        themeSetup: 'UI theme initialization'
    },
    uiManagement: {
        tabSystem: 'Multi-tab interface',
        interactions: 'User event handling',
        updates: 'Dynamic UI updates'
    },
    dataVisualization: {
        charts: 'Chart.js + Vega-Lite rendering',
        maps: 'Leaflet map management',
        tables: 'DataTables integration'
    },
    stateBinding: {
        reactivity: 'UI state synchronization',
        persistence: 'Local state storage',
        validation: 'Data consistency checks'
    }
};
```

## Module System

### Import Strategy

```javascript
// Barrel exports for clean imports
import {
    formatDistance,
    formatDuration,
    formatTime
} from './utils/formatting/index.js';

// Lazy loading for performance
const { renderMap } = await import('./utils/maps/renderMap.js');

// Centralized configuration
import { DISTANCE_UNITS, CONVERSION_FACTORS } from './utils/config/constants.js';
```

### Module Categories

| Category | Purpose | Key Modules |
|----------|---------|-------------|
| **App** | Application-level functionality | aboutModal, appMenu, notifications |
| **Charts** | Data visualization | chartSpec, renderChartJS, vegaLite |
| **Config** | Configuration management | constants, settings |
| **Data** | Data processing | createTables, formatUtils, validation |
| **Errors** | Error handling | errorHandling, recovery, logging |
| **Files** | File operations | openFile, recentFiles, validation |
| **Formatting** | Data formatting | converters, formatters, units |
| **Maps** | Geographic visualization | renderMap, themes, interactions |
| **State** | State management | core state, managers, persistence |
| **Theming** | Visual themes | setup, switching, persistence |
| **UI** | User interface | tabs, fullscreen, windows |

## Data Flow

### FIT File Processing Flow

```
              User Action (Open File)
                        │
                        ▼
              ┌─────────────────┐
              │  File Dialog    │ ◄── Main Process
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ File Validation │ ◄── File Utils
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   FIT Parser    │ ◄── Garmin SDK
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │Data Processing  │ ◄── Data Utils
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │State Management │ ◄── State System
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   UI Updates    │ ◄── Renderer
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Visualization   │ ◄── Charts/Maps/Tables
              │  Components     │
              └─────────────────┘
```

### State Flow Pattern

```javascript
// Unified state management
const stateFlow = {
    input: 'User action or data change',
    validation: 'Input validation and sanitization',
    processing: 'Business logic and transformations',
    storage: 'State persistence and caching',
    notification: 'Component update notifications',
    rendering: 'UI component re-rendering'
};
```

## Security Model

### Multi-Layer Security

```javascript
// Security configuration
const securityModel = {
    processIsolation: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
    },
    ipcSecurity: {
        channelValidation: 'Whitelist-based IPC channels',
        messageValidation: 'Payload validation and sanitization',
        responseHandling: 'Secure response processing'
    },
    fileSystemSecurity: {
        pathValidation: 'Secure path handling',
        extensionFiltering: '.fit file format only',
        sandboxAccess: 'Controlled file system access'
    },
    urlRestrictions: {
        navigationBlocking: 'Prevent external navigation',
        protocolFiltering: 'Allowed protocols only',
        contentValidation: 'Safe content loading'
    }
};
```

### IPC Security Pattern

```javascript
// Secure IPC implementation
contextBridge.exposeInMainWorld('electronAPI', {
    // Validated, safe operations only
    openFile: () => ipcRenderer.invoke('dialog:open-fit-file'),
    saveData: (data) => ipcRenderer.invoke('file:save-data', sanitizeData(data)),

    // Event listeners with validation
    onFileOpened: (callback) => {
        ipcRenderer.on('file:opened', (event, data) => {
            if (validateFileData(data)) {
                callback(data);
            }
        });
    }
});
```

## State Management

### Unified State Architecture

```javascript
// Central state management system
const StateArchitecture = {
    core: {
        unifiedManager: 'Single interface for all state operations',
        validation: 'Input validation and consistency checks',
        persistence: 'localStorage integration',
        reactivity: 'Change notification system'
    },
    managers: {
        appState: 'Application-level state',
        fileState: 'Current file data and metadata',
        uiState: 'User interface preferences',
        themeState: 'Visual theme configuration'
    },
    patterns: {
        facade: 'Unified interface hiding complexity',
        observer: 'Component state synchronization',
        strategy: 'Multiple storage backends',
        command: 'State change operations'
    }
};
```

## Error Handling

### Multi-Level Error Strategy

```javascript
// Comprehensive error handling
const ErrorHandling = {
    levels: {
        application: 'Global error boundaries',
        module: 'Module-specific error handling',
        function: 'Function-level validation',
        ui: 'User-friendly error display'
    },
    patterns: {
        resilient: 'Graceful degradation',
        recovery: 'Automatic error recovery',
        logging: 'Comprehensive error logging',
        notification: 'User error communication'
    },
    types: {
        validation: 'Input validation errors',
        processing: 'Data processing errors',
        io: 'File system operation errors',
        network: 'External service errors'
    }
};
```

## Performance Considerations

### Optimization Strategies

```javascript
// Performance architecture
const PerformanceStrategy = {
    loading: {
        lazyModules: 'Dynamic module imports',
        codesplitting: 'Split large utilities',
        assetOptimization: 'Optimized static assets'
    },
    processing: {
        streaming: 'Large file streaming',
        webWorkers: 'Background data processing',
        caching: 'Processed data caching'
    },
    rendering: {
        virtualizeation: 'Virtual scrolling for large tables',
        debouncing: 'Debounced user interactions',
        requestAnimationFrame: 'Smooth animations'
    },
    memory: {
        cleanup: 'Automatic resource cleanup',
        pooling: 'Object pooling for frequently used objects',
        monitoring: 'Memory usage tracking'
    }
};
```

### Memory Management

```javascript
// Memory management patterns
class ResourceManager {
    constructor() {
        this.resources = new Map();
        this.cleanupTasks = new Set();
    }

    register(id, resource, cleanup) {
        this.resources.set(id, resource);
        this.cleanupTasks.add(cleanup);
    }

    cleanup() {
        this.cleanupTasks.forEach(task => task());
        this.resources.clear();
        this.cleanupTasks.clear();
    }
}
```

This architecture provides a solid foundation for a maintainable, secure, and performant desktop application while remaining extensible for future enhancements.
