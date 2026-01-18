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

// ---- Security: dot-path hardening -----------------------------------------
//
// This module accepts dot-separated paths from the renderer via IPC.
// Without explicit guards, paths like "operations.__proto__.polluted" can lead
// to prototype pollution because our setByPath/getByPath helpers use bracket
// access while walking objects.
//
// We treat the renderer as untrusted: validate any path before traversing.

/** @type {ReadonlySet<string>} */
const FORBIDDEN_DOT_PATH_SEGMENTS = new Set(["__proto__", "constructor", "prototype"]);

// Defensive limits to avoid renderer-driven memory/perf abuse.
// Paths are dot-separated and should be short.
const MAX_DOT_PATH_LENGTH = 512;
const MAX_DOT_PATH_SEGMENT_LENGTH = 128;
// Keep segments conservative: allow identifier-ish keys plus ':' (used by fitFile:decode).
const DOT_PATH_SEGMENT_PATTERN = /^[0-9A-Za-z_:-]+$/u;

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
                startTimePerf: monotonicNowMs(),
            },

            // Progress tracking
            // NOTE: operations are stored as a plain object keyed by operationId.
            // This matches getByPath/setByPath logic (Object.hasOwn / bracket access)
            // and serializes cleanly over IPC.
            operations: {},

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

        /**
         * IPC listener bookkeeping: "<webContentsId>:<path>" -> unsubscribe
         * @type {Map<string, () => void>}
         */
        this.ipcSubscriptions = new Map();

        /** @type {Set<number>} */
        this.senderCleanupRegistered = new Set();

        /**
         * Fallback sender id assignment for test/mocked senders lacking numeric id.
         * @type {WeakMap<object, number>}
         */
        this._senderFallbackIds = new WeakMap();
        /** @type {number} */
        this._nextSenderFallbackId = 1;

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
        };

        const currentErrors = this.get("errors");
        const normalizedCurrent = Array.isArray(currentErrors) ? currentErrors : [];
        const nextErrors = [errorObj, ...normalizedCurrent].slice(0, 100);

        this.set("errors", nextErrors);
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

        const endTime = Date.now();
        const endTimePerf = monotonicNowMs();
        const duration =
            typeof operation.startTimePerf === "number"
                ? Math.max(0, endTimePerf - operation.startTimePerf)
                : Math.max(0, endTime - operation.startTime);

        const completedOp = {
            ...operation,
            duration,
            endTime,
            endTimePerf,
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

        const endTime = Date.now();
        const endTimePerf = monotonicNowMs();
        const duration =
            typeof operation.startTimePerf === "number"
                ? Math.max(0, endTimePerf - operation.startTimePerf)
                : Math.max(0, endTime - operation.startTime);

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
                duration,
                endTime,
                endTimePerf,
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

        // Security: do not traverse unsafe dot paths.
        // This prevents prototype leakage and makes set/get semantics deterministic.
        if (!isSafeDotPath(path)) {
            return null;
        }

        return path.split(".").reduce((current, key) => {
            if (current && typeof current === "object" && Object.hasOwn(current, key)) {
                // @ts-ignore index signature loosened at runtime
                return current[key];
            }
            return null;
        }, /** @type {any} */ (obj));
    }

    /**
     * Get development information
     */
    /**
     * @returns {{state:MainProcessStateData,listeners:string[],eventHandlers:number,operations:string[],errors:number,uptime:number}}
     */
    getDevInfo() {
        const metrics = this.get("metrics") || {};
        const uptime =
            typeof metrics.startTimePerf === "number"
                ? Math.max(0, monotonicNowMs() - metrics.startTimePerf)
                : Math.max(0, Date.now() - (metrics.startTime || Date.now()));
        return {
            errors: (this.get("errors") || []).length,
            eventHandlers: this.get("eventHandlers")?.size || 0,
            listeners: [...this.listeners.keys()],
            operations: Object.keys(this.get("operations") || {}),
            state: this.data,
            uptime,
        };
    }

    /**
     * @param {any} sender
     * @returns {number}
     */
    getSenderId(sender) {
        const id = sender && typeof sender.id === "number" ? sender.id : 0;
        if (Number.isFinite(id) && id > 0) {
            return id;
        }

        // Fallback for tests/mocks that omit sender.id
        if (sender && typeof sender === "object") {
            const existing = this._senderFallbackIds.get(sender);
            if (existing) return existing;
            const next = this._nextSenderFallbackId++;
            this._senderFallbackIds.set(sender, next);
            return next;
        }

        return 0;
    }

    /**
     * Convert metrics to a safe, IPC-serializable shape.
     *
     * @returns {Record<string, any>}
     */
    getSerializableMetrics() {
        const metrics = this.get("metrics") || {};
        const operationTimes = metrics && typeof metrics === "object" ? metrics.operationTimes : null;
        const operationTimesObj =
            operationTimes instanceof Map
                ? Object.fromEntries(
                      [...operationTimes.entries()].filter(
                          (entry) =>
                              Array.isArray(entry) &&
                              typeof entry[0] === "string" &&
                              entry[0].length > 0 &&
                              entry[0].length <= 128
                      )
                  )
                : {};

        return {
            ...(metrics && typeof metrics === "object" ? metrics : {}),
            operationTimes: operationTimesObj,
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
     * @param {any} sender
     * @param {string} path
     * @returns {string}
     */
    makeSubscriptionKey(sender, path) {
        return `${this.getSenderId(sender)}:${path}`;
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

        // Avoid in-place mutation so oldValue/newValue snapshots are meaningful.
        const nextOperationTimes = new Map(operationTimes);
        nextOperationTimes.set(metric, {
            metadata,
            timestamp: Date.now(),
            value,
        });

        this.set("metrics", {
            ...metrics,
            operationTimes: nextOperationTimes,
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
     * Ensure we clean up any subscriptions when a renderer/webContents is destroyed.
     * @param {any} sender
     * @returns {void}
     */
    registerSenderCleanup(sender) {
        const senderId = this.getSenderId(sender);
        if (this.senderCleanupRegistered.has(senderId)) return;
        this.senderCleanupRegistered.add(senderId);

        // Electron WebContents emits 'destroyed'. In tests/mocks this may not exist.
        if (sender && typeof sender.once === "function") {
            sender.once("destroyed", () => {
                for (const [key, unsubscribe] of this.ipcSubscriptions.entries()) {
                    if (key.startsWith(`${senderId}:`)) {
                        try {
                            unsubscribe();
                        } catch {
                            /* ignore */
                        }
                        this.ipcSubscriptions.delete(key);
                    }
                }
                this.senderCleanupRegistered.delete(senderId);
            });
        }
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
        if (operations && typeof operations === "object" && operations[operationId]) {
            const next = { ...operations };
            delete next[operationId];
            this.set("operations", next);
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

        // Security: refuse to set unsafe dot paths.
        if (!isSafeDotPath(path)) {
            try {
                logWithContext("warn", "Blocked unsafe state path", { path });
            } catch {
                /* ignore */
            }
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
            }, /** @type {any} */ (obj));
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
            const safePath = typeof path === "string" ? path.trim() : "";

            // Special-case metrics so operationTimes (Map) can be accessed safely.
            if (safePath === "metrics" || safePath.startsWith("metrics.")) {
                const metrics = this.getSerializableMetrics();
                if (safePath === "metrics") {
                    return this.makeSerializable(metrics);
                }
                if (safePath === "metrics.operationTimes") {
                    return this.makeSerializable(metrics.operationTimes);
                }
                // Anything else under metrics is not currently addressable by dot path without
                // exposing Map internals. Fall back to the full metrics object.
                return this.makeSerializable(metrics);
            }

            const data = safePath ? this.get(safePath) : this.data;
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
                const safePath = typeof path === "string" ? path.trim() : "";
                if (!safePath) {
                    return false;
                }

                // Security: deny unsafe dot paths (prototype pollution hardening)
                if (!isSafeDotPath(safePath)) {
                    logWithContext("warn", "Renderer attempted to set unsafe path", { path: safePath });
                    return false;
                }

                // Only allow certain paths to be set from renderer
                const allowedRoots = ["loadedFitFilePath", "operations"],
                    rootPath = safePath.split(".")[0] || "";
                if (allowedRoots.includes(rootPath)) {
                    this.set(safePath, value, { ...options, source: "renderer" });
                    return true;
                }

                logWithContext("warn", "Renderer attempted to set restricted path", { path: safePath });
                return false;
            }
        );

        // Listen to main process state changes
        ipcMain.handle("main-state:listen", (/** @type {any} */ event, /** @type {string} */ path) => {
            const sender = event?.sender;
            if (!sender) return false;
            const safePath = typeof path === "string" ? path.trim() : "";
            const normalizedPath = safePath.length === 0 ? "*" : safePath;

            // Security: refuse subscriptions to unsafe dot paths.
            if (normalizedPath !== "*" && !isSafeDotPath(normalizedPath)) {
                logWithContext("warn", "Blocked main-state:listen for unsafe path", { path: normalizedPath });
                return false;
            }

            const subscriptionKey = this.makeSubscriptionKey(sender, normalizedPath);
            if (!this.ipcSubscriptions.has(subscriptionKey)) {
                this.registerSenderCleanup(sender);

                const unsubscribe = this.listen(normalizedPath, (change) => {
                    try {
                        if (typeof sender.isDestroyed === "function" && sender.isDestroyed()) {
                            return;
                        }
                        sender.send("main-state-change", this.makeSerializable(change));
                    } catch (error) {
                        const err = /** @type {any} */ (error);
                        logWithContext("warn", "Failed to emit state change to renderer", { error: err?.message });
                    }
                });

                if (typeof unsubscribe === "function") {
                    this.ipcSubscriptions.set(subscriptionKey, unsubscribe);
                }
            }

            return true;
        });

        ipcMain.handle("main-state:unlisten", (/** @type {any} */ event, /** @type {string} */ path) => {
            const sender = event?.sender;
            if (!sender) return false;
            const safePath = typeof path === "string" ? path.trim() : "";

            const normalizedPath = safePath.length === 0 ? "*" : safePath;

            if (normalizedPath !== "*" && !isSafeDotPath(normalizedPath)) {
                return false;
            }
            const subscriptionKey = this.makeSubscriptionKey(sender, normalizedPath);
            const unsubscribe = this.ipcSubscriptions.get(subscriptionKey);
            if (!unsubscribe) return false;

            try {
                unsubscribe();
            } catch {
                /* ignore */
            }
            this.ipcSubscriptions.delete(subscriptionKey);
            return true;
        });

        // Get operation status
        ipcMain.handle("main-state:operation", (/** @type {any} */ _event, /** @type {string} */ operationId) => {
            const safeOperationId = typeof operationId === "string" ? operationId.trim() : "";
            if (!safeOperationId || safeOperationId.length > MAX_DOT_PATH_SEGMENT_LENGTH) {
                return;
            }
            if (!DOT_PATH_SEGMENT_PATTERN.test(safeOperationId) || FORBIDDEN_DOT_PATH_SEGMENTS.has(safeOperationId)) {
                return;
            }

            const val = this.get(`operations.${safeOperationId}`);
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
            const max = 100;
            const n = typeof limit === "number" && Number.isFinite(limit) ? Math.floor(limit) : 50;
            const clamped = Math.max(0, Math.min(max, n));
            return errors.slice(0, clamped);
        });

        // Get metrics
        ipcMain.handle("main-state:metrics", () => this.makeSerializable(this.getSerializableMetrics()));

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
            startTimePerf: monotonicNowMs(),
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
 * Validate a dot-separated path for safe traversal.
 *
 * Rules:
 * - must be a non-empty string after trimming
 * - must not contain empty segments ("a..b")
 * - must not contain prototype-pollution segments
 *
 * @param {unknown} path
 * @returns {path is string}
 */
function isSafeDotPath(path) {
    if (typeof path !== "string") return false;
    const trimmed = path.trim();
    if (!trimmed) return false;

    if (trimmed.length > MAX_DOT_PATH_LENGTH) return false;
    const parts = trimmed.split(".");
    for (const part of parts) {
        if (!part) return false;
        if (part.length > MAX_DOT_PATH_SEGMENT_LENGTH) return false;
        if (FORBIDDEN_DOT_PATH_SEGMENTS.has(part)) return false;
        if (!DOT_PATH_SEGMENT_PATTERN.test(part)) return false;
    }
    return true;
}

/**
 * @typedef {'log'|'info'|'warn'|'error'|'debug'} ConsoleLevel
 */

/**
 * @typedef {Object} Operation
 * @property {string} id
 * @property {number} startTime
 * @property {number} [startTimePerf] - Monotonic start timestamp for duration calculation (ms)
 * @property {number} [endTime]
 * @property {number} [endTimePerf] - Monotonic end timestamp for duration calculation (ms)
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
 * @property {number} [startTimePerf] - Monotonic start timestamp for uptime calculation (ms)
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
 * @property {Record<string,Operation>} operations
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

/**
 * Monotonic time source for measuring durations.
 * Uses performance.now when available to avoid issues with system clock changes.
 * @returns {number}
 */
function monotonicNowMs() {
    if (globalThis.performance && typeof globalThis.performance.now === "function") {
        return globalThis.performance.now();
    }
    return Date.now();
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
