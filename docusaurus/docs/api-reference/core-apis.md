---
id: core-apis
title: Core APIs
sidebar_label: 🔧 Core APIs
sidebar_position: 1
description: Core API reference for FitFileViewer.
---

# Core APIs

Reference for the main application APIs.

## Electron API (via Preload)

The `window.electronAPI` object provides access to main process functionality.

### File Operations

```javascript
// Open file dialog
const result = await window.electronAPI.openFile();
// Returns: { canceled: boolean, filePaths: string[] }

// Get app version
const version = await window.electronAPI.getVersion();
// Returns: string
```

### Event Listeners

```javascript
// Listen for file opened
window.electronAPI.onFileOpened((event, fileData) => {
    // fileData: { path: string, buffer: ArrayBuffer }
});
```

## FIT Parser API

### Basic Usage

```javascript
import { parseFitFile } from './fitParser.js';

const fitData = await parseFitFile(arrayBuffer);
// Returns: FitData object
```

### FitData Structure

```typescript
interface FitData {
    records: Record[];
    laps: Lap[];
    sessions: Session[];
    events: Event[];
    deviceInfo: DeviceInfo;
}

interface Record {
    timestamp: Date;
    position_lat?: number;
    position_long?: number;
    distance?: number;
    speed?: number;
    heart_rate?: number;
    altitude?: number;
    cadence?: number;
    power?: number;
}

interface Lap {
    start_time: Date;
    total_elapsed_time: number;
    total_distance: number;
    avg_speed: number;
    max_speed: number;
    avg_heart_rate?: number;
    max_heart_rate?: number;
}

interface Session {
    sport: string;
    start_time: Date;
    total_elapsed_time: number;
    total_distance: number;
    avg_speed: number;
    max_speed: number;
    total_ascent?: number;
    total_descent?: number;
}
```

## Renderer Initialization

### Entry Point

```javascript
// renderer.js
import { initializeApp } from './main-ui.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});
```

### initializeApp()

Initializes the application:
- Sets up tab navigation
- Loads user preferences
- Registers event listeners

---

**Next:** [Utility APIs →](/docs/api-reference/utility-apis)
