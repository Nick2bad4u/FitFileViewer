/**
 * Main Process State Manager
 *
 * Provides state management for the main Electron process, integrating with the
 * renderer process state management system via IPC communication.
 *
 * @module mainProcessStateManager
 */

/**
 * Main process application state
 */
/**
 * Main process state manager providing a minimal reactive store & IPC bridge.
 */
class MainProcessState {
    constructor() {
        /** @type {MainProcessStateData} */
        this.data = {
            // Error tracking
            errors: [],

            // Event management
            eventHandlers: new Map(),

            // Server state
            gyazoServer: null,
            gyazoServerPort: null,

            // File state
            loadedFitFilePath: null,

            // Window state
            mainWindow: null,

            // Performance metrics
            metrics: {
                operationTimes: new Map(),
                startTime: Date.now(),
            },

            // Progress tracking
            operations: new Map(),

            // OAuth state
            pendingOAuthResolvers: new Map(),
        };

        /** @type {Map<string,Set<Function>>} */
        this.listeners = new Map();
        /** @type {Array<Function>} */
        this.middleware = [];
        this.devMode =
            (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development") ||
            (typeof process !== "undefined" && Array.isArray(process.argv) && process.argv.includes("--dev"));

        /** @type {boolean} */
        this._ipcHandlersRegistered = false;

        this.setupIPCHandlers();
    }

    /**
     * Add an error to the error log
     * @param {Error|string} error - Error to track
     * @param {Object} context - Additional context
     */
    /**
     * @param {Error|string} error
     * @param {Object} [context]
     */
    addError(error, context = {}) {
        const errorObj = {
            context,
            id: Date.now().toString(),
            message: error instanceof Error ? error.message : String(error),
            source: "mainProcess",
            stack: error instanceof Error ? error.stack : null,
            timestamp: Date.now(),
        },
            errors = this.get("errors") || [];
        errors.unshift(errorObj); // Add to beginning

        // Keep only last 100 errors
        if (errors.length > 100) {
            errors.splice(100);
        }

        this.set("errors", errors);
        this.notifyRenderers("error-logged", errorObj);
    }

    /**
     * Clean up all event handlers
     */
    cleanupEventHandlers() {
        const eventHandlers = this.get("eventHandlers") || new Map();

        /**
         * Iterate through registered handler IDs and unregister each.
         * @param {Map<string, HandlerInfo>} eventHandlers
         */
        for (const [id, _handlerInfo] of eventHandlers.entries()) {
            // _handlerInfo intentionally unused; only id is required
            this.unregisterEventHandler(id);
        }

        logWithContext("info", "All event handlers cleaned up");
    }

    /**
     * Complete an operation
     * @param {string} operationId - Operation identifier
     * @param {Object} result - Operation result
     */
    /**
     * @param {string} operationId
     * @param {Object} [result]
     */
    completeOperation(operationId, result = {}) {
        const operation = this.get(`operations.${operationId}`);
        if (!operation) {
            return;
        }

        const completedOp = {
            ...operation,
            duration: Date.now() - operation.startTime,
            endTime: Date.now(),
            progress: 100,
            result,
            status: "completed",
        };

        this.set(`operations.${operationId}`, completedOp);
        this.notifyRenderers("operation-completed", { operation: completedOp, operationId });

        // Clean up completed operation after 30 seconds
        setTimeout(() => {
            this.removeOperation(operationId);
        }, 30_000);
    }

    /**
     * Fail an operation
     * @param {string} operationId - Operation identifier
     * @param {Error|string} error - Error that occurred
     */
    /**
     * @param {string} operationId
     * @param {Error|string} error
     */
    failOperation(operationId, error) {
        const operation = this.get(`operations.${operationId}`);
        if (!operation) {
            return;
        }

        const errorObj =
            error instanceof Error
                ? {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                }
                : { message: String(error) },
            failedOp = {
                ...operation,
                duration: Date.now() - operation.startTime,
                endTime: Date.now(),
                error: errorObj,
                status: "failed",
            };

        this.set(`operations.${operationId}`, failedOp);
        this.notifyRenderers("operation-failed", { operation: failedOp, operationId });

        // Track error
        this.addError(error, { context: "operation", operationId });
    }

    /**
     * Get state value by path
     * @param {string} path - Dot notation path (e.g., 'operations.fileLoad')
     * @returns {*} State value
     */
    /**
     * @param {string} path
     * @returns {*}
     */
    get(path) {
        return this.getByPath(this.data, path);
    }

    // Helper methods for path manipulation
    /**
     * @param {Object} obj
     * @param {string} path
     * @returns {*}
     */
    getByPath(obj, path) {
        if (!path) {
            return obj;
        }
        return path.split(".").reduce((current, key) => {
            if (current && typeof current === "object" && Object.hasOwn(current, key)) {
                // @ts-ignore index signature loosened at runtime
                return current[key];
            }
            return null;
        }, /** @type {any} */(obj));
    }

    /**
     * Get development information
     */
    /**
     * @returns {{state:MainProcessStateData,listeners:string[],eventHandlers:number,operations:string[],errors:number,uptime:number}}
     */
    getDevInfo() {
        return {
            errors: (this.get("errors") || []).length,
            eventHandlers: this.get("eventHandlers")?.size || 0,
            listeners: Array.from(this.listeners.keys()),
            operations: Object.keys(this.get("operations") || {}),
            state: this.data,
            uptime: Date.now() - (this.get("metrics")?.startTime || Date.now()),
        };
    }

    /**
     * Listen for state changes
     * @param {string} path - Path to listen to (or '*' for all)
     * @param {Function} callback - Change callback
     */
    /**
     * @param {string} path
     * @param {(change:Object)=>void} callback
     * @returns {Function} unsubscribe
     */
    listen(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        const set = this.listeners.get(path);
        if (set) {
            set.add(callback);
        }

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
     * Make an object serializable for IPC by removing non-serializable properties
     * @param {*} data - Data to make serializable
     * @returns {*} Serializable data
     */
    /**
     * @param {*} data
     * @returns {*}
     */
    makeSerializable(data) {
        if (data === null || data === undefined) {
            return data;
        }

        // Handle primitive types
        if (typeof data !== "object") {
            return data;
        }

        // Handle arrays
        if (Array.isArray(data)) {
            return data.map((item) => this.makeSerializable(item));
        }

        // Handle objects
        /** @type {Record<string, any>} */
        const serializable = {};
        const { BrowserWindow } = safeElectron();
        for (const [key, value] of Object.entries(data)) {
            // Skip non-serializable types
            const isBrowserWindow = typeof BrowserWindow === "function" && value instanceof BrowserWindow;
            if (
                typeof value === "function" ||
                isBrowserWindow ||
                value instanceof Map ||
                value instanceof Set ||
                (value && typeof value === "object" && value.constructor && value.constructor.name === "Server")
            ) {
                // Skip these non-serializable values
                continue;
            }

            // Recursively process nested objects
            serializable[key] = value && typeof value === "object" ? this.makeSerializable(value) : value;
        }

        return serializable;
    }

    /**
     * Notify listeners of state changes
     * @param {Object} change - Change object
     */
    /**
     * @param {{path:string}} change
     */
    notifyChange(change) {
        // Notify specific path listeners
        const pathListeners = this.listeners.get(change.path);
        if (pathListeners) {
            for (const callback of pathListeners) {
                try {
                    callback(change);
                } catch (error) {
                    const err = /** @type {any} */ (error);
                    logWithContext("error", "Error in state change listener", { error: err?.message });
                }
            }
        }

        // Notify wildcard listeners
        const wildcardListeners = this.listeners.get("*");
        if (wildcardListeners) {
            for (const callback of wildcardListeners) {
                try {
                    callback(change);
                } catch (error) {
                    const err = /** @type {any} */ (error);
                    logWithContext("error", "Error in wildcard state change listener", { error: err?.message });
                }
            }
        }

        // Notify renderer processes
        this.notifyRenderers("main-state-changed", change);
    }

    /**
     * Notify all renderer processes of an event
     * @param {string} channel - IPC channel
     * @param {*} data - Data to send
     */
    /**
     * @param {string} channel
     * @param {*} data
     */
    notifyRenderers(channel, data) {
        // Filter out non-serializable data for IPC
        const serializableData = this.makeSerializable(data);

        try {
            const { BrowserWindow } = safeElectron();
            const allWins =
                BrowserWindow && typeof BrowserWindow.getAllWindows === "function"
                    ? BrowserWindow.getAllWindows() || []
                    : [];
            for (const win of allWins) {
                if (validateWindow(win)) {
                    try {
                        win.webContents.send(channel, serializableData);
                    } catch (error) {
                        const err = /** @type {any} */ (error);
                        logWithContext("warn", "Failed to send IPC message to renderer", {
                            channel,
                            error: err?.message,
                        });
                    }
                }
            }
        } catch (error) {
            // Handle cases where BrowserWindow API is unavailable or throws
            const err = /** @type {any} */ (error);
            logWithContext("warn", "BrowserWindow not available during notifyRenderers", { error: err?.message });
        }
    }

    /**
     * Record performance metric
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @param {Object} metadata - Additional metadata
     */
    /**
     * @param {string} metric
     * @param {number} value
     * @param {Object} [metadata]
     */
    recordMetric(metric, value, metadata = {}) {
        const metrics = this.get("metrics") || {},
            operationTimes = metrics.operationTimes || new Map();

        operationTimes.set(metric, {
            metadata,
            timestamp: Date.now(),
            value,
        });

        this.set("metrics", {
            ...metrics,
            operationTimes,
        });
    }

    /**
     * Register event handler and track it
     * @param {Object} emitter - Event emitter
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {string} [handlerId] - Optional handler ID
     */
    /**
     * @param {{on:Function,removeListener:Function}} emitter
     * @param {string} event
     * @param {Function} handler
     * @param {string} [handlerId]
     * @returns {string}
     */
    registerEventHandler(emitter, event, handler, handlerId) {
        const id = handlerId || `${emitter.constructor.name}:${event}:${Date.now()}`;

        emitter.on(event, handler);

        const eventHandlers = this.get("eventHandlers") || new Map();
        eventHandlers.set(id, { emitter, event, handler });
        this.set("eventHandlers", eventHandlers);

        if (this.devMode) {
            logWithContext("info", "Event handler registered", { event, id });
        }

        return id;
    }

    /**
     * Remove an operation from tracking
     * @param {string} operationId - Operation identifier
     */
    /**
     * @param {string} operationId
     */
    removeOperation(operationId) {
        const operations = this.get("operations") || {};
        if (operations[operationId]) {
            delete operations[operationId];
            this.set("operations", operations);
        }
    }

    /**
     * Set state value by path
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     * @param {Object} options - Options for the update
     */
    /**
     * @param {string} path
     * @param {*} value
     * @param {Object} [options]
     */
    set(path, value, options = {}) {
        const oldValue = this.get(path);
        this.setByPath(this.data, path, value);

        const change = {
            newValue: value,
            oldValue,
            path,
            source: "mainProcess",
            timestamp: Date.now(),
            ...options,
        };

        this.notifyChange(change);

        if (this.devMode) {
            logWithContext("info", `State changed: ${path}`, {
                newValue: value,
                oldValue,
                source: "mainProcessState",
            });
        }
    }
    /**
     * @param {Object} obj
     * @param {string} path
     * @param {*} value
     */
    setByPath(obj, path, value) {
        if (!path) {
            return;
        }
        const keys = path.split("."),
            lastKey = keys.pop(),
            target = keys.reduce((current, key) => {
                if (current && typeof current === "object") {
                    // @ts-ignore dynamic expansion
                    if (current[key] === undefined) {
                        // @ts-ignore dynamic expansion
                        current[key] = {};
                    }
                    // @ts-ignore dynamic expansion
                    return current[key];
                }
                return {};
            }, /** @type {any} */(obj));
        if (lastKey) {
            // @ts-ignore dynamic expansion
            target[lastKey] = value;
        }
    }

    /**
     * Set up IPC handlers for renderer communication
     */
    setupIPCHandlers() {
        // Prevent duplicate registration which would throw in Electron
        if (this._ipcHandlersRegistered) {
            return;
        }
        const { ipcMain } = safeElectron();
        // If not running under Electron (e.g., unit tests without mocks), no-op safely
        if (!ipcMain || typeof ipcMain.handle !== "function") {
            // Handlers will be set once Electron's app is ready (see deferral at module end)
            logWithContext("debug", "ipcMain not yet available; deferring IPC handler setup");
            return;
        }

        // Get main process state
        ipcMain.handle("main-state:get", (/** @type {any} */ _event, /** @type {string} */ path) => {
            const data = path ? this.get(path) : this.data;
            return this.makeSerializable(data);
        });

        // Set main process state (restricted)
        ipcMain.handle(
            "main-state:set",
            (
                /** @type {any} */ _event,
                /** @type {string} */ path,
                /** @type {any} */ value,
                /** @type {any} */ options
            ) => {
                // Only allow certain paths to be set from renderer
                const allowedPaths = ["loadedFitFilePath", "operations"],
                    rootPath = path.split(".")[0] || "";
                if (allowedPaths.includes(rootPath)) {
                    this.set(path, value, { ...options, source: "renderer" });
                    return true;
                }

                logWithContext("warn", "Renderer attempted to set restricted path", { path });
                return false;
            }
        );

        // Listen to main process state changes
        ipcMain.handle("main-state:listen", (/** @type {any} */ event, /** @type {string} */ path) => {
            const { sender } = event;
            this.listen(path, (change) => {
                try {
                    sender.send("main-state-change", change);
                } catch (error) {
                    const err = /** @type {any} */ (error);
                    logWithContext("warn", "Failed to emit state change to renderer", { error: err?.message });
                }
            });
            // Attempt to cleanup on GC/destroy – Electron does not expose 'destroyed' as an IPC sender event; guard
            // via weak ref NOTE: We intentionally avoid attaching to a non-existent 'destroyed' event on the sender to
            // satisfy type checker.

            return true;
        });

        // Get operation status
        ipcMain.handle("main-state:operation", (/** @type {any} */ _event, /** @type {string} */ operationId) => {
            const val = this.get(`operations.${operationId}`);
            return val === null ? undefined : val;
        });

        // Get all operations
        ipcMain.handle("main-state:operations", () => {
            const ops = this.get("operations");
            if (!ops) return {};
            // Convert Map to plain object if needed
            if (ops instanceof Map) {
                return Object.fromEntries(ops.entries());
            }
            return this.makeSerializable(ops) || {};
        });

        // Get errors
        ipcMain.handle("main-state:errors", (/** @type {any} */ _event, /** @type {number} */ limit = 50) => {
            const errors = this.get("errors") || [];
            return errors.slice(0, limit);
        });

        // Get metrics
        ipcMain.handle("main-state:metrics", () => this.get("metrics") || {});

        this._ipcHandlersRegistered = true;
    }
    /**
     * Start tracking an operation
     * @param {string} operationId - Unique operation identifier
     * @param {Object} operationData - Operation metadata
     */
    /**
     * @param {string} operationId
     * @param {Partial<Operation>} [operationData]
     */
    startOperation(operationId, operationData = {}) {
        const operation = {
            id: operationId,
            message: "",
            progress: 0,
            startTime: Date.now(),
            status: "running",
            ...operationData,
        };

        this.set(`operations.${operationId}`, operation);
        this.notifyRenderers("operation-started", { operation, operationId });
    }

    /**
     * Unregister event handler
     * @param {string} handlerId - Handler ID
     */
    /**
     * @param {string} handlerId
     */
    unregisterEventHandler(handlerId) {
        const eventHandlers = this.get("eventHandlers") || new Map(),
            handlerInfo = eventHandlers.get(handlerId);

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
     * Update state with partial object
     * @param {Object} updates - Object with updates
     * @param {Object} options - Update options
     */
    /**
     * @param {Record<string,*>} updates
     * @param {Object} [options]
     */
    update(updates, options = {}) {
        /** @type {Array<{path:string,oldValue:any,newValue:any,timestamp:number,source:string}>} */
        const changes = [];

        for (const [path, value] of Object.entries(updates)) {
            const oldValue = this.get(path);
            this.setByPath(this.data, path, value);

            changes.push({
                newValue: value,
                oldValue,
                path,
                source: "mainProcess",
                timestamp: Date.now(),
                ...options,
            });
        }

        for (const change of changes) this.notifyChange(change);

        if (this.devMode) {
            logWithContext("info", "Batch state update", {
                changes: changes.length,
                paths: changes.map((c) => c.path),
            });
        }
    }

    /**
     * Update operation progress
     * @param {string} operationId - Operation identifier
     * @param {Object} updates - Progress updates
     */
    /**
     * @param {string} operationId
     * @param {OperationUpdate} updates
     */
    updateOperation(operationId, updates) {
        const currentOp = this.get(`operations.${operationId}`);
        if (!currentOp) {
            return;
        }

        const updatedOp = {
            ...currentOp,
            ...updates,
            lastUpdate: Date.now(),
        };

        this.set(`operations.${operationId}`, updatedOp);
        this.notifyRenderers("operation-updated", { operation: updatedOp, operationId });
    }
}

/**
 * @typedef {'log'|'info'|'warn'|'error'|'debug'} ConsoleLevel
 */

/**
 * @typedef {Object} Operation
 * @property {string} id
 * @property {number} startTime
 * @property {number} [endTime]
 * @property {number} [duration]
 * @property {'running'|'completed'|'failed'} status
 * @property {number} progress
 * @property {string} message
 * @property {Object} [result]
 * @property {{message:string,stack?:string,name?:string}|undefined} [error]
 * @property {number} [lastUpdate]
 */

/**
 * @typedef {Object} OperationUpdate
 * @property {number} [progress]
 * @property {string} [message]
 * @property {Object} [result]
 * @property {{message:string,stack?:string,name?:string}|undefined} [error]
 */

/**
 * @typedef {Object} ErrorEntry
 * @property {string} id
 * @property {number} timestamp
 * @property {string} message
 * @property {string|null} stack
 * @property {Object} context
 * @property {string} source
 */

/**
 * @typedef {Object} Metrics
 * @property {number} startTime
 * @property {Map<string,{value:number,timestamp:number,metadata:Object}>} operationTimes
 */

/**
 * @typedef {Object} HandlerInfo
 * @property {{on:Function,removeListener:Function}} emitter
 * @property {string} event
 * @property {Function} handler
 */

/**
 * @typedef {Object} MainProcessStateData
 * @property {string|null} loadedFitFilePath
 * @property {import('electron').BrowserWindow|null} mainWindow
 * @property {Object|null} gyazoServer
 * @property {number|null} gyazoServerPort
 * @property {Map<string,Function>} pendingOAuthResolvers
 * @property {Map<string,HandlerInfo>} eventHandlers
 * @property {Map<string,Operation>} operations
 * @property {ErrorEntry[]} errors
 * @property {Metrics} metrics
 */

/**
 * Log with consistent prefix & optional JSON context
 * @param {ConsoleLevel} level
 * @param {string} message
 * @param {Object} [context]
 */
function logWithContext(level, message, context = {}) {
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : "",
        timestamp = new Date().toISOString();
    // Narrowed level union keeps TS happy accessing console methods
    console[level](`[${timestamp}] [mainProcessStateManager] ${message}`, contextStr);
}

// Lazy access to Electron to avoid import-time side effects in tests/non-Electron envs
function safeElectron() {
    /** @type {any} */ let mod;
    const unwrap = (m) => {
        if (!m) return /** @type {any} */ ({});
        // Prefer the variant that actually exposes Electron APIs (handles ESM default wrappers)
        const hasApis = (x) => x && (x.app || x.ipcMain || x.BrowserWindow || x.Menu || x.shell || x.dialog);
        if (hasApis(m)) return m;
        const def = /** @type {any} */ (m).default;
        if (hasApis(def)) return def;
        return m;
    };

    try {
        // Only clear cache in tests to pick up per-test mocks
        if (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "test") {
            try {
                // @ts-ignore
                const key = typeof require.resolve === "function" ? require.resolve("electron") : undefined;
                if (key && require.cache && require.cache[key]) {
                    delete require.cache[key];
                }
            } catch {
                /* ignore */
            }
        }
        mod = require("electron");
    } catch {
        mod = undefined;
    }

    let resolved = unwrap(mod);

    // If module-scoped require didn't yield a usable ipcMain, try global shim
    if (!resolved || !resolved.ipcMain || typeof resolved.ipcMain.handle !== "function") {
        try {
            // @ts-ignore
            const hasGlobal = typeof globalThis === "object" && globalThis !== null;
            // @ts-ignore
            const gReq = hasGlobal && typeof globalThis.require === "function" ? globalThis.require : undefined;
            if (typeof gReq === "function") {
                resolved = unwrap(gReq("electron"));
            }
        } catch {
            /* ignore */
        }
    }

    return /** @type {any} */ (resolved || {});
}

/**
 * Utility functions for main process state manager
 */
/**
 * Validate an Electron BrowserWindow instance before IPC use.
 * @param {import('electron').BrowserWindow|undefined|null} win
 * @returns {boolean}
 */
function validateWindow(win) {
    if (!win || win.isDestroyed() || !win.webContents || win.webContents.isDestroyed()) {
        console.warn("[mainProcessStateManager] Window is not usable or destroyed");
        return false;
    }
    return true;
}

// Create and export singleton instance
const mainProcessState = new MainProcessState();

// Defer IPC setup until Electron is ready if needed. This avoids startup races where
// 'ipcMain' may appear unavailable extremely early in process bootstrap.
(function ensureIpcHandlersReadyOnce() {
    /** @type {{done?:boolean,logged?:boolean}} */
    const state = /** @type {any} */ (ensureIpcHandlersReadyOnce);
    if (state.done) return;

    const isRendererProcess = typeof process !== "undefined" && process.type === "renderer";
    if (isRendererProcess) {
        state.done = true;
        return;
    }

    const trySetup = () => {
        const { ipcMain } = safeElectron();
        if (ipcMain && typeof ipcMain.handle === "function") {
            // Re-run setup now that ipcMain is available
            try {
                mainProcessState.setupIPCHandlers();
            } catch {
                // no-op
            }
            state.done = true;
            return true;
        }
        return false;
    };

    if (trySetup()) return;

    try {
        const { app } = safeElectron();
        if (app && typeof app.whenReady === "function") {
            app.whenReady()
                .then(() => {
                    if (!state.done) trySetup();
                })
                .catch(() => {
                    // Fallback to small retry loop if whenReady rejects for any reason
                    let attempts = 0;
                    const tick = () => {
                        if (!state.done && !trySetup() && attempts++ < 50) setTimeout(tick, 50);
                    };
                    setTimeout(tick, 10);
                });
            return;
        }
    } catch {
        /* ignore */
    }

    // Final fallback: small bounded retry loop
    let attempts = 0;
    const tick = () => {
        if (!state.done && !trySetup() && attempts++ < 50) setTimeout(tick, 50);
    };
    if (!state.logged) {
        state.logged = true;
        try {
            console.warn("[mainProcessStateManager] Deferring IPC handler setup until Electron is ready");
        } catch {
            /* ignore */
        }
    }
    setTimeout(tick, 10);
})();

const __mpExports = { mainProcessState, MainProcessState };

// Expose for CommonJS (Electron main/tests)
if (typeof module !== "undefined" && module && module.exports) {
    module.exports = __mpExports;
}

// Also attach to a global shim so ESM barrels in renderer can recover without touching module
try {
    if (typeof globalThis !== "undefined") {
        Object.defineProperty(globalThis, "__FFV_mainProcessStateManagerExports", {
            configurable: true,
            enumerable: false,
            value: __mpExports,
            writable: true,
        });
    }
} catch {
    /* ignore */
}
