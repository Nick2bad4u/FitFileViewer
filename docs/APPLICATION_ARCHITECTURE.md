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

```text
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

```text
┌─────────────────────────────────────────────────────────────┐
│                    FitFileViewer Application                 │
├─────────────────────────────────────────────────────────────┤
│                     Presentation Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│
│  │    Maps     │ │   Charts    │ │   Tables    │ │   UI     ││
│  │  (Leaflet)  │ │ (Chart.js)  │ │(DataTables) │ │Components││
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

| File          | Role             | Description                                            |
| ------------- | ---------------- | ------------------------------------------------------ |
| `main.ts`     | Main Process     | Application lifecycle, window management, IPC handlers |
| `renderer.ts` | Renderer Process | UI initialization, module loading, error boundaries    |
| `preload.ts`  | Security Bridge  | Secure IPC communication, context isolation            |
| `main-ui.ts`  | UI Manager       | Tab management, user interactions                      |

### 2. Utility Module System

```text
electron-app/utils/
├── app/          # Application initialization helpers
├── charts/       # Chart.js rendering and chart specification factories
├── config/       # Constants, feature flags, and configuration helpers
├── data/         # FIT data processing, tables, and summary normalization
├── errors/       # Error handling helpers
├── files/        # File import, recent-file, and validation flows
├── formatting/   # Unit converters and display formatters
├── maps/         # Leaflet controls, layers, markers, and route rendering
├── state/        # Core state manager plus domain state boundaries
├── theming/      # Theme setup and map-theme utilities
└── ui/           # Controls, dialogs, tabs, and renderer UI helpers
```

Representative TypeScript source modules:

| Source | Role |
| --- | --- |
| `electron-app/utils/charts/core/renderChartJS.ts` | Chart.js tab rendering orchestration |
| `electron-app/utils/charts/core/chartSpecFactory.ts` | Chart specification creation |
| `electron-app/utils/maps/core/renderMap.ts` | Leaflet map rendering orchestration |
| `electron-app/utils/maps/layers/mapDrawLaps.ts` | Lap and route overlay drawing |
| `electron-app/utils/state/core/stateManager.ts` | Observable application state |
| `electron-app/utils/files/import/handleOpenFile.ts` | File-open workflow |
| `electron-app/utils/rendering/components/createTables.ts` | DataTables creation |
| `electron-app/utils/ui/tabs/tabStateManager.ts` | Tab state and activation |

### 3. Data Processing Pipeline

```text
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
// main.ts architecture
const MainProcess = {
 lifecycle: {
  initialization: "App startup, window creation",
  eventHandling: "System events, app events",
  cleanup: "Graceful shutdown, resource cleanup",
 },
 windowManagement: {
  creation: "BrowserWindow configuration",
  state: "Position, size, visibility persistence",
  security: "Context isolation, sandboxing",
 },
 fileSystem: {
  dialogs: "File open/save dialogs",
  access: "Secure file system operations",
  monitoring: "File change detection",
 },
 ipc: {
  handlers: "IPC message routing",
  security: "Message validation",
  responses: "Async response handling",
 },
};
```

### Renderer Process Architecture

```javascript
// renderer.ts + modules architecture
const RendererProcess = {
 initialization: {
  moduleLoading: "Dynamic utility loading",
  errorBoundaries: "Global error handling",
  themeSetup: "UI theme initialization",
 },
 uiManagement: {
  tabSystem: "Multi-tab interface",
  interactions: "User event handling",
  updates: "Dynamic UI updates",
 },
 dataVisualization: {
  charts: "Chart.js rendering",
  maps: "Leaflet map management",
  tables: "DataTables integration",
 },
 stateBinding: {
  reactivity: "UI state synchronization",
  persistence: "Local state storage",
  validation: "Data consistency checks",
 },
};
```

## Module System

### Import Strategy

```javascript
// Barrel exports for clean imports
import {
 formatDistance,
 formatDuration,
 formatTime,
} from "./utils/formatting/index.js";

// Lazy loading for performance
const { renderMap } = await import("./utils/maps/core/renderMap.js");

// Centralized configuration
import { DISTANCE_UNITS, CONVERSION_FACTORS } from "./utils/config/index.js";
```

### Module Categories

| Category       | Purpose                         | Key Modules                           |
| -------------- | ------------------------------- | ------------------------------------- |
| **App**        | Application-level functionality | aboutModal, appMenu, notifications    |
| **Charts**     | Data visualization              | chartSpecFactory, renderChartJS       |
| **Config**     | Configuration management        | constants, settings                   |
| **Data**       | Data processing                 | createTables, formatUtils, validation |
| **Errors**     | Error handling                  | errorHandling, recovery, logging      |
| **Files**      | File operations                 | openFile, recentFiles, validation     |
| **Formatting** | Data formatting                 | converters, formatters, units         |
| **Maps**       | Geographic visualization        | renderMap, themes, interactions       |
| **State**      | State management                | core state, managers, persistence     |
| **Theming**    | Visual themes                   | setup, switching, persistence         |
| **UI**         | User interface                  | tabs, fullscreen, windows             |

## Data Flow

### FIT File Processing Flow

```text
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
 input: "User action or data change",
 validation: "Input validation and sanitization",
 processing: "Business logic and transformations",
 storage: "State persistence and caching",
 notification: "Component update notifications",
 rendering: "UI component re-rendering",
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
  sandbox: true,
 },
 ipcSecurity: {
  channelValidation: "Whitelist-based IPC channels",
  messageValidation: "Payload validation and sanitization",
  responseHandling: "Secure response processing",
 },
 fileSystemSecurity: {
  pathValidation: "Secure path handling",
  extensionFiltering: ".fit file format only",
  sandboxAccess: "Controlled file system access",
 },
 urlRestrictions: {
  navigationBlocking: "Prevent external navigation",
  protocolFiltering: "Allowed protocols only",
  contentValidation: "Safe content loading",
 },
};
```

### IPC Security Pattern

```typescript
// Secure IPC implementation
const electronApi = createElectronApi({
 apiDiagnostics,
 appInfoApi,
 clipboardBridge,
 devtoolsMenuApi,
 fileApi,
 fitBrowserApi,
 gyazoExternalApi,
 mainStateApi,
 menuEventApi,
 openFolderDialog,
 preloadEventApi,
 shellExternalApi,
 themeApi,
});

exposeElectronApi(contextBridge, electronApi);
```

## State Management

### Unified State Architecture

```javascript
// Central state management system
const StateArchitecture = {
 core: {
  unifiedManager: "Single interface for all state operations",
  validation: "Input validation and consistency checks",
  persistence: "localStorage integration",
  reactivity: "Change notification system",
 },
 managers: {
  appState: "Application-level state",
  fileState: "Current file data and metadata",
  uiState: "User interface preferences",
  themeState: "Visual theme configuration",
 },
 patterns: {
  facade: "Unified interface hiding complexity",
  observer: "Component state synchronization",
  strategy: "Multiple storage backends",
  command: "State change operations",
 },
};
```

## Error Handling

### Multi-Level Error Strategy

```javascript
// Comprehensive error handling
const ErrorHandling = {
 levels: {
  application: "Global error boundaries",
  module: "Module-specific error handling",
  function: "Function-level validation",
  ui: "User-friendly error display",
 },
 patterns: {
  resilient: "Graceful degradation",
  recovery: "Automatic error recovery",
  logging: "Comprehensive error logging",
  notification: "User error communication",
 },
 types: {
  validation: "Input validation errors",
  processing: "Data processing errors",
  io: "File system operation errors",
  network: "External service errors",
 },
};
```

## Performance Considerations

### Optimization Strategies

```javascript
// Performance architecture
const PerformanceStrategy = {
 loading: {
  lazyModules: "Dynamic module imports",
  codesplitting: "Split large utilities",
  assetOptimization: "Optimized static assets",
 },
 processing: {
  streaming: "Large file streaming",
  webWorkers: "Background data processing",
  caching: "Processed data caching",
 },
 rendering: {
  virtualization: "Virtual scrolling for large tables",
  debouncing: "Debounced user interactions",
  requestAnimationFrame: "Smooth animations",
 },
 memory: {
  cleanup: "Automatic resource cleanup",
  pooling: "Object pooling for frequently used objects",
  monitoring: "Memory usage tracking",
 },
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
  this.cleanupTasks.forEach((task) => task());
  this.resources.clear();
  this.cleanupTasks.clear();
 }
}
```

This architecture provides a solid foundation for a maintainable, secure, and performant desktop application while remaining extensible for future enhancements.
