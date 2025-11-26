---
id: data-flow
title: Data Flow
sidebar_label: 🔄 Data Flow
sidebar_position: 4
description: Understanding how data flows through FitFileViewer.
---

# Data Flow

Understanding how data moves through FitFileViewer from file input to visualization.

## Overview

```mermaid
flowchart LR
    A[FIT File] --> B[Parser]
    B --> C[Data Processing]
    C --> D[State Management]
    D --> E[UI Updates]
    E --> F[Visualization]
```

## File Loading Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Layer
    participant IPC as IPC Bridge
    participant Main as Main Process
    participant Parser as FIT Parser
    participant State as State Manager
    participant Viz as Visualization

    User->>UI: Open File
    UI->>IPC: Request file dialog
    IPC->>Main: show open dialog
    Main-->>IPC: File path
    IPC-->>UI: File path
    UI->>Main: Read file
    Main-->>UI: File buffer
    UI->>Parser: Parse FIT data
    Parser-->>UI: Parsed records
    UI->>State: Store data
    State-->>Viz: Notify update
    Viz-->>User: Display results
```

## Data Processing Stages

### 1. File Input

User provides FIT file via:
- Drag and drop
- File dialog
- Recent files

### 2. File Reading

```javascript
// Main process reads file
const buffer = await fs.promises.readFile(filePath);
```

### 3. FIT Parsing

```javascript
// Garmin FIT SDK parses binary data
const decoder = new FitDecoder();
decoder.read(buffer);
const records = decoder.getRecords();
```

### 4. Data Extraction

Parsed data organized into:
- Records (GPS points, metrics)
- Laps (segment summaries)
- Sessions (activity summary)

### 5. Data Processing

```javascript
// Process and normalize data
const processedData = {
    records: normalizeRecords(rawRecords),
    laps: extractLaps(rawLaps),
    summary: calculateSummary(rawSession),
    gpsPoints: extractGpsTrack(rawRecords)
};
```

### 6. State Storage

```javascript
// Store in state manager
stateManager.set('currentFile', processedData);
stateManager.set('metadata', fileMetadata);
```

### 7. View Updates

Each visualization component subscribes to state:

```javascript
// Maps component
stateManager.subscribe('currentFile', (data) => {
    renderMapRoute(data.gpsPoints);
});

// Charts component
stateManager.subscribe('currentFile', (data) => {
    renderCharts(data.records);
});
```

## Data Structures

### Record Structure

```javascript
{
    timestamp: Date,
    position_lat: number,  // Degrees
    position_long: number, // Degrees
    distance: number,      // Meters
    speed: number,         // m/s
    heart_rate: number,    // BPM
    altitude: number,      // Meters
    cadence: number,       // RPM
    power: number          // Watts
}
```

### Lap Structure

```javascript
{
    start_time: Date,
    total_elapsed_time: number,
    total_distance: number,
    avg_speed: number,
    max_speed: number,
    avg_heart_rate: number,
    max_heart_rate: number,
    total_calories: number
}
```

### Session Structure

```javascript
{
    sport: string,
    start_time: Date,
    total_elapsed_time: number,
    total_distance: number,
    avg_speed: number,
    max_speed: number,
    total_ascent: number,
    total_descent: number,
    total_calories: number
}
```

## State Management Flow

```mermaid
flowchart TD
    subgraph Input
        A[User Action]
        B[File Load]
    end

    subgraph State["State Manager"]
        C[Validate]
        D[Transform]
        E[Store]
        F[Notify]
    end

    subgraph Output
        G[Map Update]
        H[Chart Update]
        I[Table Update]
        J[Summary Update]
    end

    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    F --> I
    F --> J
```

## Error Handling

### At Each Stage

```javascript
try {
    const buffer = await readFile(path);
    const records = await parseFile(buffer);
    const processed = processData(records);
    updateState(processed);
} catch (error) {
    handleError(error, 'file-processing');
    showUserError('Failed to load file');
}
```

---

**Next:** [Security Model →](/docs/architecture/security)
