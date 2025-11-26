---
id: overview
title: Architecture Overview
sidebar_label: 🏗️ Overview
sidebar_position: 1
description: Technical architecture overview of FitFileViewer.
---

# Architecture Overview

FitFileViewer is built as a cross-platform desktop application using Electron with a modular, scalable architecture.

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Electron["Electron Application"]
        subgraph Main["Main Process"]
            M1[App Lifecycle]
            M2[Window Management]
            M3[File System]
            M4[IPC Handlers]
        end

        subgraph Renderer["Renderer Process"]
            R1[UI Components]
            R2[Data Visualization]
            R3[State Management]
            R4[Utility Modules]
        end

        subgraph Preload["Preload Script"]
            P1[IPC Bridge]
            P2[Security Layer]
        end

        Main <-->|"IPC"| Preload
        Preload <-->|"Context Bridge"| Renderer
    end

    subgraph External["External Data"]
        E1[FIT Files]
        E2[Map Tiles]
        E3[User Preferences]
    end

    Main --> E1
    Main --> E3
    Renderer --> E2
```

## Key Principles

### 🔐 Security-First

- Context isolation enabled
- Node integration disabled in renderer
- Secure IPC communication
- Input validation

### 📦 Modularity

- 50+ utility modules
- Clear separation of concerns
- Reusable components
- Single responsibility

### ⚡ Performance

- Lazy loading
- Efficient data processing
- Memory management
- Caching strategies

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Electron | Cross-platform desktop |
| UI | HTML/CSS/JS | User interface |
| Charts | Chart.js, Vega-Lite | Data visualization |
| Maps | Leaflet | Geographic display |
| Tables | DataTables | Data grid |
| Parser | Garmin FIT SDK | FIT file parsing |

## Component Layers

```mermaid
flowchart TB
    subgraph Presentation["Presentation Layer"]
        UI[UI Components]
        Maps[Map Views]
        Charts[Charts]
        Tables[Data Tables]
    end

    subgraph Business["Business Logic"]
        DataProc[Data Processing]
        Format[Formatting]
        State[State Management]
        Render[Rendering]
    end

    subgraph Service["Service Layer"]
        FileOps[File Operations]
        ErrorH[Error Handling]
        Log[Logging]
        Perf[Performance]
    end

    subgraph Data["Data Layer"]
        Parser[FIT Parser]
        Storage[Local Storage]
        Config[Configuration]
        Recent[Recent Files]
    end

    Presentation --> Business
    Business --> Service
    Service --> Data
```

## Process Model

FitFileViewer uses Electron's multi-process architecture:

| Process | Responsibilities |
|---------|-----------------|
| **Main** | App lifecycle, window management, file system, IPC |
| **Renderer** | UI rendering, user interaction, visualization |
| **Preload** | Secure bridge between main and renderer |

## Module Organization

```
electron-app/
├── main.js           # Main process entry
├── renderer.js       # Renderer process entry
├── preload.js        # Security bridge
├── main-ui.js        # UI management
├── fitParser.js      # FIT file parsing
└── utils/            # Utility modules
    ├── formatting/   # Data formatters
    ├── maps/         # Map utilities
    ├── charts/       # Chart utilities
    ├── state/        # State management
    └── ...           # More modules
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Parser
    participant State
    participant Viz

    User->>UI: Open FIT File
    UI->>Parser: Parse File
    Parser->>State: Store Data
    State->>Viz: Update Views
    Viz->>UI: Render Display
    UI->>User: Show Results
```

## Security Model

### IPC Security

All communication between processes uses validated channels:

```javascript
// Preload - Exposed API
contextBridge.exposeInMainWorld('electronAPI', {
    openFile: () => ipcRenderer.invoke('dialog:open-fit-file'),
    // Only specific, validated operations
});
```

### Content Security

- No remote content loading
- Strict CSP headers
- Sandboxed renderer

---

**Next:** [Process Architecture →](/docs/architecture/process-model)
