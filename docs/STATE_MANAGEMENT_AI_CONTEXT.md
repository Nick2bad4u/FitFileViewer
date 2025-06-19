# FitFileViewer State Management System - AI Context Guide

## Overview

FitFileViewer uses a modern, centralized state management system built around a reactive AppState object with comprehensive middleware support, performance monitoring, and error handling. The system is designed to replace legacy patterns like direct localStorage manipulation, global variables, and scattered state objects with a unified, predictable state architecture that supports reactive UI updates, persistence, and debugging.

## Core State Management API

The primary state management interface consists of four core functions imported from `./stateManager.js`: `getState(path)` for reading nested state values, `setState(path, value, options)` for setting state with optional metadata, `updateState(path, updates, options)` for atomic merging of nested objects, and `subscribe(path, callback)` for reactive listeners that automatically fire when state changes. All state paths use dot notation (e.g., "charts.controlsVisible", "ui.theme", "settings.charts.fieldVisibility") and support nested object manipulation. The options parameter accepts `{ source: "component-name", silent: true, merge: true }` for debugging, preventing notifications, and controlling merge behavior respectively.

## Integration Patterns and Best Practices

When integrating state management into existing modules, always import the core functions first: `import { getState, setState, updateState, subscribe } from "./stateManager.js"`. Replace legacy patterns systematically - convert direct DOM manipulation to state-driven updates, replace localStorage calls with setState for persistence, eliminate global variables in favor of centralized state paths, and replace manual event handling with subscribe callbacks. For chart controls specifically, use `setState("charts.controlsVisible", boolean)` instead of direct DOM style manipulation, `updateState("charts", { selectedChart: "type", isRendering: true })` for atomic updates, and `subscribe("ui.theme", callback)` for reactive theme changes. Always include a meaningful source in options for debugging: `setState("charts.isRendering", true, { source: "chartActions.startRendering" })`.

## State Organization and Namespacing

The state tree follows a hierarchical structure with top-level namespaces: `ui` for user interface state (theme, loading, currentFile, tabs), `charts` for visualization state (controlsVisible, selectedChart, isRendering, chartData), `settings` for user preferences (charts.fieldVisibility, charts.display, performance), `globalData` for FIT file data, `performance` for metrics and monitoring, and `map` for geographical visualization state. Within each namespace, use descriptive nested paths like `settings.charts.fieldVisibility.power` or `ui.loading.charts` to maintain clear data organization. When creating new state paths, follow the established patterns and avoid deeply nested structures beyond 3-4 levels.

## Reactive UI Updates and Event Handling

The subscription system enables automatic UI updates when state changes. Use `subscribe("path", callback)` to set up reactive listeners that automatically update DOM elements, refresh charts, or trigger side effects when state changes. For example, `subscribe("ui.theme", (newTheme) => { updateChartThemes(newTheme); })` automatically re-themes all charts when the user switches themes. Multiple components can subscribe to the same state path, and all will be notified of changes. Subscriptions are automatically managed - no need to manually clean up listeners. For UI components that need to reflect state immediately on initialization, always call `getState("path")` to set the initial state, then set up subscriptions for ongoing updates.

## Performance and Debugging

The state system includes built-in performance monitoring and debugging capabilities. Use the options parameter with meaningful source values for all state changes to enable proper debugging: `setState("key", value, { source: "ComponentName.methodName" })`. The system automatically tracks state change history, performance metrics, and error boundaries. Access debugging tools via `window.__stateManager_dev` in development mode to inspect current state, view change history, and monitor performance. For expensive operations, use `updateState` with `{ merge: true }` to perform atomic updates of multiple properties without triggering intermediate notifications. The system includes middleware support for validation, logging, and custom behaviors - register middleware via the stateMiddleware system for advanced use cases.

## Migration from Legacy Patterns

When updating existing code to use the state management system, identify and replace these legacy patterns: direct DOM property access (`.style.display`, `.checked`) should be replaced with state-driven UI updates, localStorage direct access should use setState with automatic persistence, global variables should be moved to appropriate state namespaces, manual event listeners should be replaced with subscribe callbacks, and callback-heavy component communication should use state as the single source of truth. For chart-specific migrations, replace `chartControlsState` objects with `setState("charts.controlsVisible", boolean)`, convert manual DOM queries to state-driven UI updates, and use `subscribe("charts.selectedChart", callback)` for chart type changes. Always test state changes in isolation and verify that UI updates occur automatically through subscriptions rather than manual DOM manipulation.
