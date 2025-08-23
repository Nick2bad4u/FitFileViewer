---
applyTo: "**"
---

Coding standards, domain knowledge, and preferences that AI should follow.

# Copilot Instructions for FitFileViewer Electron Application

## Project Overview

FitFileViewer is a desktop Electron application for viewing and analyzing FIT files from fitness devices. The app features data visualization, mapping, charting, and export capabilities with a modern tabbed interface.

## Project Scope & File Structure

### **Focus Areas (Primary)**

- **Root directory**: Main project configuration and documentation
- **electron-app/**: Core Electron application code
  - `main.js` - Main Electron process with IPC handlers and app lifecycle
  - `renderer.js` - Renderer process entry point and initialization
  - `preload.js` - Security bridge between main and renderer processes
  - `main-ui.js` - UI management and tab interactions
  - `utils/` - Modular utility functions (50+ modules)
  - `windowStateUtils.js` - Window state persistence
  - `fitParser.js` - FIT file parsing logic
  - `index.html` - Main application HTML template
  - `style.css` - Application styling and theme system

### **Ignore Completely**

- `fit-test-files/` - Test data files
- `vscode-extension/` - Separate VS Code extension project
- `vis/` - Visualization experiments
- `libs/` - Third-party libraries (read-only)
- Any test, demo, or experimental folders

## Architecture & Patterns

### **Core Architecture**

- **Main Process** (`main.js`): Application lifecycle, menus, file dialogs, auto-updater
- **Renderer Process** (`renderer.js`): UI initialization, module loading, error handling
- **Preload Script** (`preload.js`): Secure IPC communication bridge
- **Modular Utils**: 50+ specialized utility modules in `utils/` directory

### **Key Design Patterns**

- **Module System**: ES6 modules with explicit imports/exports
- **Event-Driven**: IPC communication between main and renderer processes
- **State Management**: Centralized AppState object with reactive updates
- **Theme System**: Dynamic light/dark theme switching with persistence
- **Performance Monitoring**: Built-in timing and metrics collection
- **Error Boundaries**: Comprehensive error handling at all levels

### **Security Model**

- Context isolation enabled (`contextIsolation: true`)
- Node integration disabled (`nodeIntegration: false`)
- Sandbox mode enabled (`sandbox: true`)
- Secure IPC channels with validation
- URL navigation restrictions for security

## Technology Stack & Libraries

### **Core Technologies**

- **Electron**: Desktop app framework (main/renderer/preload pattern)
- **JavaScript ES6+**: Modern JS with modules, async/await, destructuring
- **Node.js**: Backend APIs (file system, path manipulation, crypto)
- **HTML5/CSS3**: Modern web standards with CSS custom properties

### **Key Dependencies**

- **Data Visualization**: Chart.js, Vega/Vega-Lite for advanced charts
- **Mapping**: Leaflet with MapLibre GL, GPS track visualization
- **Data Processing**: DataTables, Arquero for data manipulation
- **UI Libraries**: jQuery (legacy support), Hammer.js for touch
- **File Formats**: FIT file parsing, GPX export, CSV generation
- **Theming**: CSS custom properties with dynamic theme switching

### **Build & Development**

- **ESLint**: Multi-language linting (JS, JSON, CSS, Markdown)
- **Electron Builder**: Multi-platform packaging and distribution
- **Auto-updater**: GitHub releases integration
- **Testing**: Vitest/Jest for unit testing