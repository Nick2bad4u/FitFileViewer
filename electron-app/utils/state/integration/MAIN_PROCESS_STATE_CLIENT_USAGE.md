# Main Process State Client - Usage Guide

This guide explains how to use the `mainProcessStateClient` to interact with the main process state from the renderer process.

## Overview

The Main Process State Client provides a clean, type-safe API for the renderer process to:

- Get and set main process state
- Listen for state changes
- Track operations and their progress
- Monitor errors and performance metrics

## Quick Start

### Import the Client

```javascript
import { mainProcessStateClient } from "./utils/state/integration/index.js";
// Or directly:
// import mainProcessStateClient from './utils/state/integration/mainProcessStateClient.js';
```

### Basic Operations

#### Get State

```javascript
// Get entire state
const allState = await mainProcessStateClient.get();

// Get specific property
const filePath = await mainProcessStateClient.get("loadedFitFilePath");

// Convenience method
const filePath = await mainProcessStateClient.getLoadedFilePath();
```

#### Set State

```javascript
// Set state (only allowed paths: 'loadedFitFilePath' and 'operations.*')
await mainProcessStateClient.set("loadedFitFilePath", "/path/to/file.fit", {
 source: "file-open-handler",
});

// Convenience method
await mainProcessStateClient.setLoadedFilePath("/path/to/file.fit");
```

#### Listen for Changes

```javascript
// Listen for changes to a specific path
const unsubscribe = await mainProcessStateClient.listen("loadedFitFilePath", (change) => {
 console.log("File path changed:", {
  path: change.path,
  newValue: change.value,
  oldValue: change.oldValue,
  metadata: change.metadata,
 });
});

// Later, when you want to stop listening:
unsubscribe();
```

## Advanced Usage

### Operations Tracking

Track long-running operations:

```javascript
// Get a specific operation
const operation = await mainProcessStateClient.getOperation("file-parse-123");
console.log("Operation status:", operation.status);
console.log("Progress:", operation.progress);

// Get all operations
const operations = await mainProcessStateClient.getOperations();
for (const [id, op] of Object.entries(operations)) {
 console.log(`${id}: ${op.status} - ${op.progress}%`);
}
```

### Error Monitoring

```javascript
// Get recent errors from main process
const errors = await mainProcessStateClient.getErrors(10); // Get last 10 errors
errors.forEach((error) => {
 console.error(`[${error.timestamp}] ${error.message}`, error.context);
});
```

### Performance Metrics

```javascript
// Get performance metrics
const metrics = await mainProcessStateClient.getMetrics();
console.log("App uptime:", Date.now() - metrics.startTime);
console.log("Operation times:", metrics.operationTimes);
```

### Diagnostics

```javascript
// Get comprehensive diagnostics
const diagnostics = await mainProcessStateClient.getDiagnostics();
console.log("Errors:", diagnostics.errors);
console.log("Active operations:", diagnostics.operations);
console.log("Performance:", diagnostics.metrics);
```

### Gyazo Server State

```javascript
// Check Gyazo server state
const { server, port } = await mainProcessStateClient.getGyazoServerState();
if (server && port) {
 console.log(`Gyazo server running on port ${port}`);
}
```

## Availability Check

The client gracefully handles cases where `electronAPI` is not available:

```javascript
if (mainProcessStateClient.isAvailable()) {
 // Safe to use client methods
 const state = await mainProcessStateClient.get();
} else {
 console.warn("Main process state client is not available");
}
```

## Error Handling

All async methods throw errors that should be caught:

```javascript
try {
 await mainProcessStateClient.set("restrictedPath", "value");
} catch (error) {
 console.error("Failed to set state:", error);
}
```

## Restricted Paths

For security reasons, only certain paths can be set from the renderer process:

- `loadedFitFilePath` - Path to the currently loaded FIT file
- `operations.*` - Any operation-related state

Attempting to set other paths will return `false` and log a warning.

## Integration Example

Here's a complete example of integrating the client into your renderer code:

```javascript
import { mainProcessStateClient } from "./utils/state/integration/index.js";

class AppStateSync {
 constructor() {
  this.unsubscribers = [];
 }

 async initialize() {
  if (!mainProcessStateClient.isAvailable()) {
   console.warn("Main process state sync unavailable");
   return;
  }

  // Listen for file path changes
  const unsubFile = await mainProcessStateClient.listen("loadedFitFilePath", (change) => this.onFilePathChange(change));
  this.unsubscribers.push(unsubFile);

  // Get initial state
  const filePath = await mainProcessStateClient.getLoadedFilePath();
  if (filePath) {
   console.log("Currently loaded file:", filePath);
  }
 }

 onFilePathChange(change) {
  console.log("File changed:", change.value);
  // Update UI, reload data, etc.
 }

 async updateFilePath(newPath) {
  try {
   const success = await mainProcessStateClient.setLoadedFilePath(newPath);
   if (success) {
    console.log("File path updated successfully");
   }
  } catch (error) {
   console.error("Failed to update file path:", error);
  }
 }

 cleanup() {
  // Clean up listeners
  this.unsubscribers.forEach((unsub) => unsub());
  this.unsubscribers = [];
 }
}

// Usage
const appStateSync = new AppStateSync();
await appStateSync.initialize();
```

## API Reference

### Methods

- `isAvailable(): boolean` - Check if client is properly initialized
- `get(path?: string): Promise<any>` - Get state value(s)
- `set(path: string, value: any, options?: object): Promise<boolean>` - Set state value
- `listen(path: string, callback: Function): Promise<Function>` - Listen for changes
- `getOperation(operationId: string): Promise<Operation|null>` - Get operation status
- `getOperations(): Promise<Record<string, Operation>>` - Get all operations
- `getErrors(limit?: number): Promise<ErrorEntry[]>` - Get recent errors
- `getMetrics(): Promise<Metrics>` - Get performance metrics
- `getLoadedFilePath(): Promise<string|null>` - Get current file path
- `setLoadedFilePath(filePath: string|null): Promise<boolean>` - Set file path
- `getGyazoServerState(): Promise<{server: any, port: number|null}>` - Get Gyazo server state
- `getMainWindow(): Promise<any>` - Get main window reference
- `getDiagnostics(): Promise<object>` - Get comprehensive diagnostics

## Behind the Scenes

The client uses the `electronAPI` methods exposed by `preload.js`:

- `electronAPI.getMainState(path)`
- `electronAPI.setMainState(path, value, options)`
- `electronAPI.listenToMainState(path, callback)`
- `electronAPI.getOperation(operationId)`
- `electronAPI.getOperations()`
- `electronAPI.getErrors(limit)`
- `electronAPI.getMetrics()`

These methods communicate with the main process via IPC channels:

- `main-state:get`
- `main-state:set`
- `main-state:listen`
- `main-state:operation`
- `main-state:operations`
- `main-state:errors`
- `main-state:metrics`

The main process handles these requests through the `mainProcessStateManager`.
