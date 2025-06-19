# FIT Parser State Management Migration Guide

## Overview

The `fitParser.js` module has been successfully migrated to integrate with the FitFileViewer's new comprehensive state management system. This migration provides enhanced progress tracking, error handling, settings persistence, and performance monitoring.

## Key Changes

### 1. State Management Integration

The FIT parser now integrates with:

- **Settings State Manager**: For persistent decoder options with validation
- **FIT File State Manager**: For progress tracking and file state management
- **Performance Monitor**: For timing and performance metrics
- **Backwards Compatibility**: Maintains electron-conf fallback for existing installations

### 2. Enhanced Error Handling

```javascript
// New FitDecodeError with metadata for state management
class FitDecodeError extends Error {
 constructor(message, details, metadata = {}) {
  super(message);
  this.name = "FitDecodeError";
  this.details = details;
  this.metadata = {
   timestamp: new Date().toISOString(),
   category: "fit_parsing",
   ...metadata,
  };
 }
}
```

### 3. Schema-Based Decoder Options

```javascript
// New decoder options schema with validation
const DECODER_OPTIONS_SCHEMA = {
 applyScaleAndOffset: { type: "boolean", default: true, description: "Apply scale and offset transformations" },
 expandSubFields: { type: "boolean", default: true, description: "Expand sub-fields in messages" },
 expandComponents: { type: "boolean", default: true, description: "Expand component fields" },
 convertTypesToStrings: { type: "boolean", default: true, description: "Convert enum types to strings" },
 convertDateTimesToDates: { type: "boolean", default: true, description: "Convert timestamps to Date objects" },
 includeUnknownData: { type: "boolean", default: true, description: "Include unknown message types" },
 mergeHeartRates: { type: "boolean", default: true, description: "Merge heart rate data from multiple sources" },
};
```

### 4. Progress Tracking

The `decodeFitFile` function now provides detailed progress updates:

- 10%: Starting decode
- 30%: SDK loaded
- 50%: Integrity check passed
- 70%: Starting decode
- 90%: Applying labels
- 100%: Complete

## Migration Steps

### Step 1: Initialize State Management Integration

In your main process startup code:

```javascript
import { initializeFitParserIntegration } from "./utils/fitParserIntegration.js";

// After state managers are initialized
await initializeFitParserIntegration();
```

### Step 2: Set Up IPC Handlers (Main Process)

```javascript
import { setupFitParserIPC } from "./utils/fitParserIntegration.js";
import { ipcMain } from "electron";

// Set up IPC handlers for FIT parser operations
setupFitParserIPC(ipcMain);
```

### Step 3: Set Up Preload Script

```javascript
import { setupFitParserPreload } from "./utils/fitParserIntegration.js";
import { contextBridge, ipcRenderer } from "electron";

// Expose FIT parser functions to renderer
setupFitParserPreload(contextBridge, ipcRenderer);
```

### Step 4: Use in Renderer Process

```javascript
// Decode a FIT file with progress tracking
const result = await window.fitParser.decodeFitFile(fileBuffer);

// Update decoder options with validation
const updateResult = await window.fitParser.updateDecoderOptions({
 applyScaleAndOffset: false,
 includeUnknownData: true,
});

// Get current options
const options = await window.fitParser.getDecoderOptions();

// Reset to defaults
const resetResult = await window.fitParser.resetDecoderOptions();
```

## New API Functions

### Core Functions (Node.js/Main Process)

```javascript
const fitParser = require("./fitParser.js");

// Initialize with state managers
fitParser.initializeStateManagement({
 settingsStateManager,
 fitFileStateManager,
 performanceMonitor,
});

// Decode with state integration
const result = await fitParser.decodeFitFile(fileBuffer, options);

// Manage options with validation
const updateResult = fitParser.updateDecoderOptions(newOptions);
const currentOptions = fitParser.getCurrentDecoderOptions();
const resetResult = fitParser.resetDecoderOptions();

// Validation and schema
const validation = fitParser.validateDecoderOptions(options);
const defaults = fitParser.getDefaultDecoderOptions();
const schema = fitParser.DECODER_OPTIONS_SCHEMA;
```

### Integration Functions (ES6 Modules)

```javascript
import {
 initializeFitParserIntegration,
 decodeFitFileWithState,
 updateDecoderOptionsWithState,
 getCurrentDecoderOptionsWithState,
 setupFitParserIPC,
 setupFitParserPreload,
} from "./utils/fitParserIntegration.js";
```

## State Management Benefits

### 1. Progress Tracking

- Real-time progress updates during file decoding
- Integration with UI loading indicators
- Performance metrics collection

### 2. Error Handling

- Structured error objects with metadata
- State updates for error conditions
- User notification integration

### 3. Settings Persistence

- Schema-based validation for decoder options
- Automatic persistence to state management system
- Fallback to electron-conf for backwards compatibility

### 4. Performance Monitoring

- Timing of decode operations
- Memory usage tracking
- Slow operation detection and logging

## Backwards Compatibility

The migration maintains full backwards compatibility:

1. **Existing API**: All original functions still work as before
2. **Electron-conf Fallback**: Settings fallback to electron-conf if state management is unavailable
3. **Progressive Enhancement**: State management features are optional and gracefully degrade

## Error Handling Examples

```javascript
// Enhanced error with metadata
try {
 const result = await fitParser.decodeFitFile(buffer);
} catch (error) {
 if (error instanceof fitParser.FitDecodeError) {
  console.log("Decode error:", error.message);
  console.log("Details:", error.details);
  console.log("Metadata:", error.metadata);
  console.log("JSON:", error.toJSON());
 }
}

// Validation errors
const updateResult = fitParser.updateDecoderOptions({ invalidOption: "invalid" });
if (!updateResult.success) {
 console.log("Validation errors:", updateResult.errors);
}
```

## Performance Monitoring Integration

```javascript
// Performance monitoring is automatic when enabled
const result = await fitParser.decodeFitFile(buffer);

// Check performance metrics
if (performanceMonitor.isEnabled()) {
 const metrics = performanceMonitor.getMetrics();
 console.log("Decode time:", metrics.operationTimes["fitFile_decode_*"]);
}
```

## Migration Checklist

- [ ] Initialize state management integration in main process
- [ ] Set up IPC handlers for FIT parser operations
- [ ] Update preload script to expose new functions
- [ ] Update renderer code to use new async API
- [ ] Test decoder options validation
- [ ] Verify progress tracking integration
- [ ] Test error handling with state updates
- [ ] Validate performance monitoring integration
- [ ] Test backwards compatibility with existing code

## Troubleshooting

### State Management Not Available

If state management is not initialized, the FIT parser will:

1. Log a warning
2. Fall back to electron-conf for settings
3. Skip progress tracking and performance monitoring
4. Continue to function normally

### Validation Errors

If decoder options fail validation:

1. Check the `DECODER_OPTIONS_SCHEMA` for valid options
2. Use `validateDecoderOptions()` to check specific values
3. Use `getDefaultDecoderOptions()` for safe defaults

### IPC Communication Issues

If renderer functions are not available:

1. Verify `setupFitParserIPC()` was called in main process
2. Verify `setupFitParserPreload()` was called in preload script
3. Check that context isolation is properly configured

This migration provides a robust foundation for FIT file processing with comprehensive state management integration while maintaining backwards compatibility.
