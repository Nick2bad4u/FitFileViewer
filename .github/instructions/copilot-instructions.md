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

## Coding Standards & Best Practices

### **JavaScript/ES6+ Standards**

```javascript
// Use modern ES6+ features
import { functionName } from "./utils/moduleName.js";
const { prop1, prop2 } = objectDestructuring;
const result = await asyncFunction();

// Error handling with try-catch
try {
 const data = await processFile(filePath);
 return { success: true, data };
} catch (error) {
 console.error("[Component] Operation failed:", error);
 return { success: false, error: error.message };
}

// Use JSDoc for documentation
/**
 * Processes FIT file data and extracts metrics
 * @param {ArrayBuffer} fileBuffer - Raw FIT file data
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processed data with metrics
 */
async function processFitFile(fileBuffer, options = {}) {
 // Implementation
}
```

### **Module Organization**

- **Single Responsibility**: Each utility module has one clear purpose
- **Explicit Exports**: Use named exports with descriptive names
- **Import Paths**: Always include `.js` extension for relative imports
- **Error Handling**: Each module should handle its own errors gracefully

### **State Management**

```javascript
// Centralized state pattern
const AppState = {
 globalData: {},
 isChartRendered: false,
 eventListeners: new Map(),
};

// Reactive updates with property descriptors
Object.defineProperty(window, "globalData", {
 get() {
  return AppState.globalData;
 },
 set(value) {
  AppState.globalData = value;
 },
});
```

### **Performance Guidelines**

- **Lazy Loading**: Load expensive components only when needed
- **Event Cleanup**: Always clean up event listeners to prevent memory leaks
- **Performance Monitoring**: Use PerformanceMonitor for timing critical operations
- **Background Processing**: Use Web Workers for CPU-intensive tasks

## Component-Specific Guidelines

### **Main Process (main.js)**

- Use `createErrorHandler()` wrapper for all async operations
- Implement proper window validation before IPC communication
- Follow theme synchronization pattern between main and renderer
- Use structured logging with `logWithContext()`

### **Renderer Process (renderer.js)**

- Initialize components in proper dependency order
- Use performance monitoring for startup metrics
- Implement graceful degradation for missing dependencies
- Follow the established error handling patterns

### **Utilities (utils/)**

- Each utility should be self-contained and testable
- Use consistent error handling and validation
- Export functions with clear, descriptive names
- Include JSDoc documentation for public APIs

### **UI Components**

- Follow the tabbed interface pattern established in the app
- Use the centralized theme system for styling
- Implement proper loading states and error feedback
- Support both keyboard and mouse interactions

## Data Processing Guidelines

### **FIT File Handling**

- Use the established `fitParser.js` for FIT file parsing
- Implement proper error handling for corrupted files
- Support both encrypted and unencrypted FIT files
- Cache parsed data to avoid repeated processing

### **Visualization**

- Follow the established chart rendering patterns
- Support dynamic theme switching for all visualizations
- Implement proper data validation before rendering
- Use consistent color schemes and styling

### **Export Features**

- Support multiple export formats (CSV, GPX, JSON)
- Implement progress indicators for large exports
- Validate export data before file generation
- Provide user feedback for export success/failure

## Theme System

### **Implementation**

- Use CSS custom properties for theme variables
- Support system theme detection and manual override
- Persist theme preference in localStorage
- Propagate theme changes to all components including maps and charts

### **Color Schemes**

```css
/* Dark theme example */
:root[data-theme="dark"] {
 --bg-primary: #1a1a1a;
 --text-primary: #ffffff;
 --accent-color: #3b82f6;
}

/* Light theme example */
:root[data-theme="light"] {
 --bg-primary: #ffffff;
 --text-primary: #000000;
 --accent-color: #2563eb;
}
```

## Development & Debugging

### **Development Mode Features**

- Expose debug utilities on `window.__renderer_dev`
- Enable verbose logging and performance metrics
- Provide development helper functions for testing
- Support hot reload and quick iteration

### **Error Handling**

- Use structured error objects with context
- Implement global error boundaries
- Log errors with sufficient context for debugging
- Provide user-friendly error messages

### **Testing Guidelines**

- Write unit tests for utility functions
- Test error conditions and edge cases
- Mock external dependencies appropriately
- Test cross-platform compatibility

## Security Considerations

### **IPC Security**

- Validate all IPC messages and parameters
- Use whitelisted channels for communication
- Sanitize file paths and user inputs
- Implement proper error boundaries

### **File Handling**

- Validate file types and extensions
- Implement size limits for uploaded files
- Use secure temporary file handling
- Clean up temporary files after processing

## Accessibility & UX

### **Accessibility**

- Support keyboard navigation for all features
- Provide proper ARIA labels and roles
- Ensure sufficient color contrast for themes
- Support screen readers where applicable

### **User Experience**

- Provide loading indicators for long operations
- Show progress for file processing
- Implement proper error recovery
- Use consistent UI patterns throughout the app

## Integration Guidelines

When suggesting code changes or new features:

1. **Follow established patterns** in the existing codebase
2. **Use the modular architecture** - create new utilities in `utils/` when appropriate
3. **Implement proper error handling** with try-catch and user feedback
4. **Support the theme system** for any UI changes
5. **Consider performance implications** and use monitoring where needed
6. **Test cross-platform compatibility** (Windows, macOS, Linux)
7. **Document public APIs** with JSDoc comments
8. **Follow the established import/export patterns**

## Common Utilities to Reference

- `utils/theme.js` - Theme management and switching
- `utils/showNotification.js` - User notifications
- `utils/formatDistance.js` / `utils/formatDuration.js` - Data formatting
- `utils/renderChartJS.js` / `utils/renderMap.js` - Visualization
- `utils/handleOpenFile.js` - File operations
- `utils/rendererUtils.js` - Common renderer utilities
- `preload.js` - IPC communication patterns

Always prioritize code quality, security, and user experience when making suggestions. Focus on maintainable, testable code that follows the established architectural patterns.

Utils list:

```filelist
electron-app\utils\aboutModal.js
electron-app\utils\addExitFullscreenOverlay.js
electron-app\utils\addFullScreenButton.js
electron-app\utils\convertArrayBufferToBase64.js
electron-app\utils\createAppMenu.js
electron-app\utils\CHANGELOG.md
electron-app\utils\chartSpec.js
electron-app\utils\copyTableAsCSV.js
electron-app\utils\createTables.js
electron-app\utils\drawMapForLap.js
electron-app\utils\enableTabButtons.js
electron-app\utils\formatDistance.js
electron-app\utils\formatDuration.js
electron-app\utils\formatTooltipData.js
electron-app\utils\formatUtils.js
electron-app\utils\generate-prettier-sarif.js
electron-app\utils\getActiveTabContent.js
electron-app\utils\getLapNumForIdx.js
electron-app\utils\handleOpenFile.js
electron-app\utils\keyboardShortcutsModal.js
electron-app\utils\listeners.js
electron-app\utils\mapActionButtons.js
electron-app\utils\mapBaseLayers.js
electron-app\utils\mapColors.js
electron-app\utils\mapFullscreenControl.js
electron-app\utils\mapIcons.js
electron-app\utils\mapLapSelector.js
electron-app\utils\mapMeasureTool.js
electron-app\utils\patchSummaryFields.js
electron-app\utils\recentFiles.js
electron-app\utils\removeExitFullscreenOverlay.js
electron-app\utils\renderChartJS.js
electron-app\utils\renderChartJS.js
electron-app\utils\rendererUtils.js
electron-app\utils\renderMap.js
electron-app\utils\renderSummary.js
electron-app\utils\renderSummaryHelpers.js
electron-app\utils\renderTable.js
electron-app\utils\updateActiveTab.js
electron-app\utils\setupTabButton.js
electron-app\utils\setupTheme.js
electron-app\utils\setupWindow.js
electron-app\utils\showFitData.js
electron-app\utils\showNotification.js
electron-app\utils\showUpdateNotification.js
electron-app\utils\theme.js
electron-app\utils\updateTabVisibility.js
electron-app\utils\updateMapTheme.js
```
