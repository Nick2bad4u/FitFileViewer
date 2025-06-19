/**
 * Main Process State Manager
 *
 * Provides state management for the main Electron process, integrating with the
 * renderer process state management system via IPC communication.
 *
 * @module mainProcessStateManager
 */

const { ipcMain, BrowserWindow } = require("electron");

/**
 * Utility functions for main process state manager
 */
function validateWindow(win) {
    if (!win || win.isDestroyed() || !win.webContents || win.webContents.isDestroyed()) {
        console.warn("[mainProcessStateManager] Window is not usable or destroyed");
        return false;
    }
    return true;
}

function logWithContext(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : "";
    console[level](`[${timestamp}] [mainProcessStateManager] ${message}`, contextStr);
}

/**
 * Main process application state
 */
class MainProcessState {
    constructor() {
        this.data = {
            // File state
            loadedFitFilePath: null,

            // Window state
            mainWindow: null,

            // Server state
            gyazoServer: null,
            gyazoServerPort: null,

            // OAuth state
            pendingOAuthResolvers: new Map(),

            // Event management
            eventHandlers: new Map(),

            // Progress tracking
            operations: new Map(),

            // Error tracking
            errors: [],

            // Performance metrics
            metrics: {
                startTime: Date.now(),
                operationTimes: new Map(),
            },
        };

        this.listeners = new Map();
        this.middleware = [];
        this.devMode = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

        this.setupIPCHandlers();
    }

    /**
     * Get state value by path
     * @param {string} path - Dot notation path (e.g., 'operations.fileLoad')
     * @returns {*} State value
     */
    get(path) {
        return this.getByPath(this.data, path);
    }

    /**
     * Set state value by path
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     * @param {Object} options - Options for the update
     */
    set(path, value, options = {}) {
        const oldValue = this.get(path);
        this.setByPath(this.data, path, value);

        const change = {
            path,
            oldValue,
            newValue: value,
            timestamp: Date.now(),
            source: "mainProcess",
            ...options,
        };

        this.notifyChange(change);

        if (this.devMode) {
            logWithContext("info", `State changed: ${path}`, {
                oldValue,
                newValue: value,
                source: "mainProcessState",
            });
        }
    }

    /**
     * Update state with partial object
     * @param {Object} updates - Object with updates
     * @param {Object} options - Update options
     */
    update(updates, options = {}) {
        const changes = [];

        Object.entries(updates).forEach(([path, value]) => {
            const oldValue = this.get(path);
            this.setByPath(this.data, path, value);

            changes.push({
                path,
                oldValue,
                newValue: value,
                timestamp: Date.now(),
                source: "mainProcess",
                ...options,
            });
        });

        changes.forEach((change) => this.notifyChange(change));

        if (this.devMode) {
            logWithContext("info", "Batch state update", {
                changes: changes.length,
                paths: changes.map((c) => c.path),
            });
        }
    }

    /**
     * Start tracking an operation
     * @param {string} operationId - Unique operation identifier
     * @param {Object} operationData - Operation metadata
     */
    startOperation(operationId, operationData = {}) {
        const operation = {
            id: operationId,
            startTime: Date.now(),
            status: "running",
            progress: 0,
            message: "",
            ...operationData,
        };

        this.set(`operations.${operationId}`, operation);
        this.notifyRenderers("operation-started", { operationId, operation });
    }

    /**
     * Update operation progress
     * @param {string} operationId - Operation identifier
     * @param {Object} updates - Progress updates
     */
    updateOperation(operationId, updates) {
        const currentOp = this.get(`operations.${operationId}`);
        if (!currentOp) return;

        const updatedOp = {
            ...currentOp,
            ...updates,
            lastUpdate: Date.now(),
        };

        this.set(`operations.${operationId}`, updatedOp);
        this.notifyRenderers("operation-updated", { operationId, operation: updatedOp });
    }

    /**
     * Complete an operation
     * @param {string} operationId - Operation identifier
     * @param {Object} result - Operation result
     */
    completeOperation(operationId, result = {}) {
        const operation = this.get(`operations.${operationId}`);
        if (!operation) return;

        const completedOp = {
            ...operation,
            status: "completed",
            progress: 100,
            endTime: Date.now(),
            duration: Date.now() - operation.startTime,
            result,
        };

        this.set(`operations.${operationId}`, completedOp);
        this.notifyRenderers("operation-completed", { operationId, operation: completedOp });

        // Clean up completed operation after 30 seconds
        setTimeout(() => {
            this.removeOperation(operationId);
        }, 30000);
    }

    /**
     * Fail an operation
     * @param {string} operationId - Operation identifier
     * @param {Error|string} error - Error that occurred
     */
    failOperation(operationId, error) {
        const operation = this.get(`operations.${operationId}`);
        if (!operation) return;

        const errorObj =
            error instanceof Error
                ? {
                      message: error.message,
                      stack: error.stack,
                      name: error.name,
                  }
                : { message: String(error) };

        const failedOp = {
            ...operation,
            status: "failed",
            endTime: Date.now(),
            duration: Date.now() - operation.startTime,
            error: errorObj,
        };

        this.set(`operations.${operationId}`, failedOp);
        this.notifyRenderers("operation-failed", { operationId, operation: failedOp });

        // Track error
        this.addError(error, { context: "operation", operationId });
    }

    /**
     * Remove an operation from tracking
     * @param {string} operationId - Operation identifier
     */
    removeOperation(operationId) {
        const operations = this.get("operations") || {};
        if (operations[operationId]) {
            delete operations[operationId];
            this.set("operations", operations);
        }
    }

    /**
     * Add an error to the error log
     * @param {Error|string} error - Error to track
     * @param {Object} context - Additional context
     */
    addError(error, context = {}) {
        const errorObj = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : null,
            context,
            source: "mainProcess",
        };

        const errors = this.get("errors") || [];
        errors.unshift(errorObj); // Add to beginning

        // Keep only last 100 errors
        if (errors.length > 100) {
            errors.splice(100);
        }

        this.set("errors", errors);
        this.notifyRenderers("error-logged", errorObj);
    }

    /**
     * Register event handler and track it
     * @param {Object} emitter - Event emitter
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {string} [handlerId] - Optional handler ID
     */
    registerEventHandler(emitter, event, handler, handlerId) {
        const id = handlerId || `${emitter.constructor.name}:${event}:${Date.now()}`;

        emitter.on(event, handler);

        const eventHandlers = this.get("eventHandlers") || new Map();
        eventHandlers.set(id, { emitter, event, handler });
        this.set("eventHandlers", eventHandlers);

        if (this.devMode) {
            logWithContext("info", "Event handler registered", { id, event });
        }

        return id;
    }

    /**
     * Unregister event handler
     * @param {string} handlerId - Handler ID
     */
    unregisterEventHandler(handlerId) {
        const eventHandlers = this.get("eventHandlers") || new Map();
        const handlerInfo = eventHandlers.get(handlerId);

        if (handlerInfo) {
            const { emitter, event, handler } = handlerInfo;
            emitter.removeListener(event, handler);
            eventHandlers.delete(handlerId);
            this.set("eventHandlers", eventHandlers);

            if (this.devMode) {
                logWithContext("info", "Event handler unregistered", { handlerId });
            }
        }
    }

    /**
     * Clean up all event handlers
     */
    cleanupEventHandlers() {
        const eventHandlers = this.get("eventHandlers") || new Map();

        eventHandlers.forEach((handlerInfo, id) => {
            this.unregisterEventHandler(id);
        });

        logWithContext("info", "All event handlers cleaned up");
    }

    /**
     * Record performance metric
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @param {Object} metadata - Additional metadata
     */
    recordMetric(metric, value, metadata = {}) {
        const metrics = this.get("metrics") || {};
        const operationTimes = metrics.operationTimes || new Map();

        operationTimes.set(metric, {
            value,
            timestamp: Date.now(),
            metadata,
        });

        this.set("metrics", {
            ...metrics,
            operationTimes,
        });
    }

    /**
     * Listen for state changes
     * @param {string} path - Path to listen to (or '*' for all)
     * @param {Function} callback - Change callback
     */
    listen(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(callback);

        return () => {
            const pathListeners = this.listeners.get(path);
            if (pathListeners) {
                pathListeners.delete(callback);
                if (pathListeners.size === 0) {
                    this.listeners.delete(path);
                }
            }
        };
    }

    /**
     * Notify listeners of state changes
     * @param {Object} change - Change object
     */
    notifyChange(change) {
        // Notify specific path listeners
        const pathListeners = this.listeners.get(change.path);
        if (pathListeners) {
            pathListeners.forEach((callback) => {
                try {
                    callback(change);
                } catch (error) {
                    logWithContext("error", "Error in state change listener", { error: error.message });
                }
            });
        }

        // Notify wildcard listeners
        const wildcardListeners = this.listeners.get("*");
        if (wildcardListeners) {
            wildcardListeners.forEach((callback) => {
                try {
                    callback(change);
                } catch (error) {
                    logWithContext("error", "Error in wildcard state change listener", { error: error.message });
                }
            });
        }

        // Notify renderer processes
        this.notifyRenderers("main-state-changed", change);
    }
    /**
     * Notify all renderer processes of an event
     * @param {string} channel - IPC channel
     * @param {*} data - Data to send
     */
    notifyRenderers(channel, data) {
        // Filter out non-serializable data for IPC
        const serializableData = this.makeSerializable(data);

        BrowserWindow.getAllWindows().forEach((win) => {
            if (validateWindow(win)) {
                try {
                    win.webContents.send(channel, serializableData);
                } catch (error) {
                    logWithContext("warn", "Failed to send IPC message to renderer", {
                        channel,
                        error: error.message,
                    });
                }
            }
        });
    }

    /**
     * Make an object serializable for IPC by removing non-serializable properties
     * @param {*} data - Data to make serializable
     * @returns {*} Serializable data
     */
    makeSerializable(data) {
        if (data === null || data === undefined) return data;

        // Handle primitive types
        if (typeof data !== "object") return data;

        // Handle arrays
        if (Array.isArray(data)) {
            return data.map((item) => this.makeSerializable(item));
        }

        // Handle objects
        const serializable = {};
        for (const [key, value] of Object.entries(data)) {
            // Skip non-serializable types
            if (
                typeof value === "function" ||
                value instanceof BrowserWindow ||
                value instanceof Map ||
                value instanceof Set ||
                (value && typeof value === "object" && value.constructor && value.constructor.name === "Server")
            ) {
                // Skip these non-serializable values
                continue;
            }

            // Recursively process nested objects
            if (value && typeof value === "object") {
                serializable[key] = this.makeSerializable(value);
            } else {
                serializable[key] = value;
            }
        }

        return serializable;
    }
    /**
     * Set up IPC handlers for renderer communication
     */
    setupIPCHandlers() {
        // Get main process state
        ipcMain.handle("main-state:get", (event, path) => {
            const data = path ? this.get(path) : this.data;
            return this.makeSerializable(data);
        });

        // Set main process state (restricted)
        ipcMain.handle("main-state:set", (event, path, value, options) => {
            // Only allow certain paths to be set from renderer
            const allowedPaths = ["loadedFitFilePath", "operations"];

            const rootPath = path.split(".")[0];
            if (allowedPaths.includes(rootPath)) {
                this.set(path, value, { ...options, source: "renderer" });
                return true;
            }

            logWithContext("warn", "Renderer attempted to set restricted path", { path });
            return false;
        });

        // Listen to main process state changes
        ipcMain.handle("main-state:listen", (event, path) => {
            const unsubscribe = this.listen(path, (change) => {
                event.sender.send("main-state-change", change);
            });

            // Clean up when window closes
            event.sender.on("destroyed", unsubscribe);

            return true;
        });

        // Get operation status
        ipcMain.handle("main-state:operation", (event, operationId) => {
            return this.get(`operations.${operationId}`);
        });

        // Get all operations
        ipcMain.handle("main-state:operations", () => {
            return this.get("operations") || {};
        });

        // Get errors
        ipcMain.handle("main-state:errors", (event, limit = 50) => {
            const errors = this.get("errors") || [];
            return errors.slice(0, limit);
        });

        // Get metrics
        ipcMain.handle("main-state:metrics", () => {
            return this.get("metrics") || {};
        });
    }

    /**
     * Get development information
     */
    getDevInfo() {
        return {
            state: this.data,
            listeners: Array.from(this.listeners.keys()),
            eventHandlers: this.get("eventHandlers")?.size || 0,
            operations: Object.keys(this.get("operations") || {}),
            errors: (this.get("errors") || []).length,
            uptime: Date.now() - this.get("metrics.startTime"),
        };
    }

    // Helper methods for path manipulation
    getByPath(obj, path) {
        if (!path) return obj;
        return path.split(".").reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    setByPath(obj, path, value) {
        if (!path) return;
        const keys = path.split(".");
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (current[key] === undefined) {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
}

// Create and export singleton instance
const mainProcessState = new MainProcessState();

module.exports = {
    mainProcessState,
    MainProcessState,
};
