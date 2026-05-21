/*
 * Main Process State Manager
 *
 * Provides state management for the main Electron process, integrating with the
 * renderer process state management system via IPC communication.
 *
 * @module mainProcessStateManager
 */

/*
 * Main process application state
 */
/*
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

/* @type {ReadonlySet<string>} */
const FORBIDDEN_DOT_PATH_SEGMENTS = new Set([
    "__proto__",
    "constructor",
    "prototype",
]);

// Defensive limits to avoid renderer-driven memory/perf abuse.
// Paths are dot-separated and should be short.
const MAX_DOT_PATH_LENGTH = 512;
const MAX_DOT_PATH_SEGMENT_LENGTH = 128;
// Keep segments conservative: allow identifier-ish keys plus ':' (used by fitFile:decode).
const DOT_PATH_SEGMENT_PATTERN = /^[0-9A-Za-z_:-]+$/u;

type ConsoleLevel = "debug" | "error" | "info" | "log" | "warn";

type LooseRecord = Record<string, any>;

type StateChange = {
    metadata?: LooseRecord;
    newValue?: unknown;
    oldValue?: unknown;
    path: string;
    source?: string;
    timestamp?: number;
    value?: unknown;
};

type StateListener = (change: StateChange) => void;

type HandlerInfo = {
    emitter: {
        off?: (event: string, handler: (...args: any[]) => void) => void;
        on?: (event: string, handler: (...args: any[]) => void) => void;
        removeListener?: (
            event: string,
            handler: (...args: any[]) => void
        ) => void;
    };
    event: string;
    handler: (...args: any[]) => void;
};

type MainProcessStateData = {
    errors: LooseRecord[];
    eventHandlers: Map<string, HandlerInfo>;
    gyazoServer: unknown;
    gyazoServerPort: number | null;
    loadedFitFilePath: string | null;
    mainWindow: MainBrowserWindowLike | null;
    metrics: {
        operationTimes: Map<string, unknown>;
        startTime: number;
        startTimePerf: number;
        [key: string]: any;
    };
    operations: Record<string, LooseRecord>;
    pendingOAuthResolvers: Map<string, unknown>;
    [key: string]: any;
};

type MainBrowserWindowLike = {
    isDestroyed: () => boolean;
    webContents: MainWebContentsLike;
};

type MainWebContentsLike = {
    id?: number;
    isDestroyed: () => boolean;
    once?: (event: string, listener: () => void) => void;
    send: (channel: string, ...args: any[]) => void;
};

type MainIpcEventLike = {
    sender?: MainWebContentsLike;
};

type MainIpcMainLike = {
    handle?: (
        channel: string,
        listener: (event: MainIpcEventLike, ...args: any[]) => unknown
    ) => void;
    removeHandler?: (channel: string) => void;
};

type MainElectronLike = {
    app?: { whenReady?: () => Promise<void> };
    BrowserWindow?: {
        getAllWindows?: () => unknown[];
    };
    dialog?: unknown;
    ipcMain?: MainIpcMainLike;
    Menu?: unknown;
    shell?: unknown;
};

class MainProcessState {
    data: MainProcessStateData;

    listeners: Map<string, Set<StateListener>>;

    middleware: Array<(change: StateChange) => StateChange | void>;

    devMode: boolean;

    _ipcHandlersRegistered: boolean;

    ipcSubscriptions: Map<string, () => void>;

    operationCleanupTimers: Map<string, ReturnType<typeof setTimeout>>;

    senderCleanupRegistered: Set<number>;

    _senderFallbackIds: WeakMap<object, number>;

    _nextSenderFallbackId: number;

    constructor() {
        /* @type {MainProcessStateData} */
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

        /* @type {Map<string, Set<Function>>} */
        this.listeners = new Map();
        /* @type {Function[]} */
        this.middleware = [];
        this.devMode =
            (typeof process !== "undefined" &&
                process.env &&
                process.env["NODE_ENV"] === "development") ||
            (typeof process !== "undefined" &&
                Array.isArray(process.argv) &&
                process.argv.includes("--dev"));

        /* @type {boolean} */
        this._ipcHandlersRegistered = false;

        /*
         * IPC listener bookkeeping: "<webContentsId>:<path>" -> unsubscribe
         *
         * @type {Map<string, () => void>}
         */
        this.ipcSubscriptions = new Map();

        this.operationCleanupTimers = new Map();

        /* @type {Set<number>} */
        this.senderCleanupRegistered = new Set();

        /*
         * Fallback sender id assignment for test/mocked senders lacking numeric
         * id.
         *
         * @type {WeakMap<object, number>}
         */
        this._senderFallbackIds = new WeakMap();
        /* @type {number} */
        this._nextSenderFallbackId = 1;

        this.setupIPCHandlers();
    }

    /*
     * Add an error to the error log
     *
     * @param {Error | string} error - Error to track
     * @param {Object} context - Additional context
     */
    /*
     * @param {Error | string} error
     * @param {Object} [context]
     */
    addError(error: Error | string, context: LooseRecord = {}): void {
        const errorObj = {
            context,
            id: Date.now().toString(),
            message: error instanceof Error ? error.message : String(error),
            source: "mainProcess",
            stack: error instanceof Error ? error.stack : null,
            timestamp: Date.now(),
        };

        const currentErrors = this.get("errors");
        const normalizedCurrent = Array.isArray(currentErrors)
            ? currentErrors
            : [];
        const nextErrors = [errorObj, ...normalizedCurrent].slice(0, 100);

        this.set("errors", nextErrors);
        this.notifyRenderers("error-logged", errorObj);
    }

    /*
     * Clean up all event handlers
     */
    cleanupEventHandlers() {
        const eventHandlers = this.get("eventHandlers") || new Map();

        /*
         * Iterate through registered handler IDs and unregister each.
         *
         * @param {Map<string, HandlerInfo>} eventHandlers
         */
        for (const [id, _handlerInfo] of eventHandlers.entries()) {
            // _handlerInfo intentionally unused; only id is required
            this.unregisterEventHandler(id);
        }

        logWithContext("info", "All event handlers cleaned up");
    }

    /*
     * Complete an operation
     *
     * @param {string} operationId - Operation identifier
     * @param {Object} result - Operation result
     */
    /*
     * @param {string} operationId
     * @param {Object} [result]
     */
    completeOperation(operationId: string, result: LooseRecord = {}): void {
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
        this.notifyRenderers("operation-completed", {
            operation: completedOp,
            operationId,
        });

        const previousCleanup = this.operationCleanupTimers.get(operationId);
        if (previousCleanup) {
            clearTimeout(previousCleanup);
        }

        // Clean up completed operation after 30 seconds
        const cleanupTimer = setTimeout(() => {
            this.removeOperation(operationId);
        }, 30_000);
        this.operationCleanupTimers.set(operationId, cleanupTimer);
    }

    /*
     * Fail an operation
     *
     * @param {string} operationId - Operation identifier
     * @param {Error | string} error - Error that occurred
     */
    /*
     * @param {string} operationId
     * @param {Error | string} error
     */
    failOperation(operationId: string, error: Error | string): void {
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
        this.notifyRenderers("operation-failed", {
            operation: failedOp,
            operationId,
        });

        // Track error
        this.addError(error, { context: "operation", operationId });
    }

    /*
     * Get state value by path
     *
     * @param {string} path - Dot notation path (e.g., 'operations.fileLoad')
     *
     * @returns {any} State value
     */
    /*
     * @param {string} path
     *
     * @returns {any}
     */
    get(path: string): any {
        return this.getByPath(this.data, path);
    }

    // Helper methods for path manipulation
    /*
     * @param {Object} obj
     * @param {string} path
     *
     * @returns {any}
     */
    getByPath(obj: unknown, path: string): any {
        if (!path) {
            return obj;
        }

        // Security: do not traverse unsafe dot paths.
        // This prevents prototype leakage and makes set/get semantics deterministic.
        if (!isSafeDotPath(path)) {
            return null;
        }

        return path.split(".").reduce((current: any, key: string) => {
            if (
                current &&
                typeof current === "object" &&
                Object.hasOwn(current, key)
            ) {
                return current[key];
            }
            return null;
        }, obj as any);
    }

    /*
     * Get development information
     */
    /*
     * @returns {{
     *     state: MainProcessStateData;
     *     listeners: string[];
     *     eventHandlers: number;
     *     operations: string[];
     *     errors: number;
     *     uptime: number;
     * }}
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

    /*
     * @param {any} sender
     *
     * @returns {number}
     */
    getSenderId(sender: unknown): number {
        const id =
            sender &&
            typeof sender === "object" &&
            "id" in sender &&
            typeof sender.id === "number"
                ? sender.id
                : 0;
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

    /*
     * Convert metrics to a safe, IPC-serializable shape.
     *
     * @returns {Record<string, any>}
     */
    getSerializableMetrics(): Record<string, any> {
        const metrics = this.get("metrics") || {};
        const operationTimes =
            metrics && typeof metrics === "object"
                ? metrics["operationTimes"]
                : null;
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

    /*
     * Listen for state changes
     *
     * @param {string} path - Path to listen to (or '*' for all)
     * @param {Function} callback - Change callback
     */
    /*
     * @param {string} path
     * @param {(change: Object) => void} callback
     *
     * @returns {Function} Unsubscribe
     */
    listen(path: string, callback: StateListener): () => void {
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

    /*
     * Make an object serializable for IPC by removing non-serializable
     * properties
     *
     * @param {any} data - Data to make serializable
     *
     * @returns {any} Serializable data
     */
    /*
     * @param {any} data
     *
     * @returns {any}
     */
    makeSerializable(data: unknown): any {
        if (data === null || data === undefined) {
            return data;
        }

        // Handle primitive types
        if (typeof data !== "object") {
            return data;
        }

        // Handle arrays
        if (Array.isArray(data)) {
            return data.map((item: unknown) => this.makeSerializable(item));
        }

        // Handle objects
        const serializable: LooseRecord = {};
        const { BrowserWindow } = safeElectron();
        for (const [key, value] of Object.entries(data)) {
            // Skip non-serializable types
            const isBrowserWindow =
                typeof BrowserWindow === "function" &&
                value instanceof BrowserWindow;
            if (
                typeof value === "function" ||
                isBrowserWindow ||
                value instanceof Map ||
                value instanceof Set ||
                (value &&
                    typeof value === "object" &&
                    value.constructor &&
                    value.constructor.name === "Server")
            ) {
                // Skip these non-serializable values
                continue;
            }

            // Recursively process nested objects
            serializable[key] =
                value && typeof value === "object"
                    ? this.makeSerializable(value)
                    : value;
        }

        return serializable;
    }

    /*
     * @param {any} sender
     * @param {string} path
     *
     * @returns {string}
     */
    makeSubscriptionKey(sender: unknown, path: string): string {
        return `${this.getSenderId(sender)}:${path}`;
    }

    /*
     * Notify listeners of state changes
     *
     * @param {Object} change - Change object
     */
    /*
     * @param {{ path: string }} change
     */
    notifyChange(change: StateChange): void {
        // Notify specific path listeners
        const pathListeners = this.listeners.get(change.path);
        if (pathListeners) {
            for (const callback of pathListeners) {
                try {
                    callback(change);
                } catch (error) {
                    logWithContext("error", "Error in state change listener", {
                        error: getErrorMessage(error),
                    });
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
                    logWithContext(
                        "error",
                        "Error in wildcard state change listener",
                        { error: getErrorMessage(error) }
                    );
                }
            }
        }

        // Notify renderer processes
        this.notifyRenderers("main-state-changed", change);
    }

    /*
     * Notify all renderer processes of an event
     *
     * @param {string} channel - IPC channel
     * @param {any} data - Data to send
     */
    /*
     * @param {string} channel
     * @param {any} data
     */
    notifyRenderers(channel: string, data: unknown): void {
        // Filter out non-serializable data for IPC
        const serializableData = this.makeSerializable(data);

        try {
            const { BrowserWindow } = safeElectron();
            const allWins =
                BrowserWindow &&
                typeof BrowserWindow.getAllWindows === "function"
                    ? BrowserWindow.getAllWindows() || []
                    : [];
            for (const win of allWins) {
                if (validateWindow(win)) {
                    try {
                        win.webContents.send(channel, serializableData);
                    } catch (error) {
                        logWithContext(
                            "warn",
                            "Failed to send IPC message to renderer",
                            {
                                channel,
                                error: getErrorMessage(error),
                            }
                        );
                    }
                }
            }
        } catch (error) {
            // Handle cases where BrowserWindow API is unavailable or throws
            logWithContext(
                "warn",
                "BrowserWindow not available during notifyRenderers",
                { error: getErrorMessage(error) }
            );
        }
    }

    /*
     * Record performance metric
     *
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @param {Object} metadata - Additional metadata
     */
    /*
     * @param {string} metric
     * @param {number} value
     * @param {Object} [metadata]
     */
    recordMetric(
        metric: string,
        value: unknown,
        metadata: LooseRecord = {}
    ): void {
        const metrics = this.get("metrics") || {},
            operationTimes = metrics["operationTimes"] || new Map();

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

    /*
     * Register event handler and track it
     *
     * @param {Object} emitter - Event emitter
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {string} [handlerId] - Optional handler ID
     */
    /*
     * @param {{ on: Function; removeListener: Function }} emitter
     * @param {string} event
     * @param {Function} handler
     * @param {string} [handlerId]
     *
     * @returns {string}
     */
    registerEventHandler(
        emitter: HandlerInfo["emitter"],
        event: string,
        handler: (...args: any[]) => void,
        handlerId?: string
    ): string {
        const id =
            handlerId || `${emitter.constructor.name}:${event}:${Date.now()}`;

        emitter.on?.(event, handler);

        const eventHandlers = this.get("eventHandlers") || new Map();
        eventHandlers.set(id, { emitter, event, handler });
        this.set("eventHandlers", eventHandlers);

        if (this.devMode) {
            logWithContext("info", "Event handler registered", { event, id });
        }

        return id;
    }

    /*
     * Ensure we clean up any subscriptions when a renderer/webContents is
     * destroyed.
     *
     * @param {any} sender
     *
     * @returns {void}
     */
    registerSenderCleanup(sender: unknown): void {
        const senderId = this.getSenderId(sender);
        if (this.senderCleanupRegistered.has(senderId)) return;
        this.senderCleanupRegistered.add(senderId);

        // Electron WebContents emits 'destroyed'. In tests/mocks this may not exist.
        if (
            sender &&
            typeof sender === "object" &&
            "once" in sender &&
            typeof sender.once === "function"
        ) {
            sender.once("destroyed", () => {
                for (const [
                    key,
                    unsubscribe,
                ] of this.ipcSubscriptions.entries()) {
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

    /*
     * Remove an operation from tracking
     *
     * @param {string} operationId - Operation identifier
     */
    /*
     * @param {string} operationId
     */
    removeOperation(operationId: string): void {
        const cleanupTimer = this.operationCleanupTimers.get(operationId);
        if (cleanupTimer) {
            clearTimeout(cleanupTimer);
            this.operationCleanupTimers.delete(operationId);
        }

        const operations = this.get("operations") || {};
        if (
            operations &&
            typeof operations === "object" &&
            operations[operationId]
        ) {
            const next = { ...operations };
            delete next[operationId];
            this.set("operations", next);
        }
    }

    /*
     * Set state value by path
     *
     * @param {string} path - Dot notation path
     * @param {any} value - Value to set
     * @param {Object} options - Options for the update
     */
    /*
     * @param {string} path
     * @param {any} value
     * @param {Object} [options]
     */
    set(path: string, value: unknown, options: LooseRecord = {}): void {
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
    /*
     * @param {Object} obj
     * @param {string} path
     * @param {any} value
     */
    setByPath(obj: LooseRecord, path: string, value: unknown): void {
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
            target = keys.reduce((current: LooseRecord, key: string) => {
                if (current && typeof current === "object") {
                    if (current[key] === undefined) {
                        current[key] = {};
                    }
                    return current[key];
                }
                return {};
            }, obj);
        if (lastKey) {
            target[lastKey] = value;
        }
    }

    /*
     * Set up IPC handlers for renderer communication
     */
    setupIPCHandlers(): void {
        // Prevent duplicate registration which would throw in Electron
        if (this._ipcHandlersRegistered) {
            return;
        }
        const { ipcMain } = safeElectron();
        // If not running under Electron (e.g., unit tests without mocks), no-op safely
        if (!ipcMain || typeof ipcMain.handle !== "function") {
            // Handlers will be set once Electron's app is ready (see deferral at module end)
            logWithContext(
                "debug",
                "ipcMain not yet available; deferring IPC handler setup"
            );
            return;
        }

        // Get main process state
        ipcMain.handle(
            "main-state:get",
            (event: MainIpcEventLike, path: string) => {
                if (!validate(event)) {
                    return undefined;
                }

                const safePath = typeof path === "string" ? path.trim() : "";

                // Special-case metrics so operationTimes (Map) can be accessed safely.
                if (safePath === "metrics" || safePath.startsWith("metrics.")) {
                    const metrics = this.getSerializableMetrics();
                    if (safePath === "metrics") {
                        return this.makeSerializable(metrics);
                    }
                    if (safePath === "metrics.operationTimes") {
                        return this.makeSerializable(metrics["operationTimes"]);
                    }
                    // Anything else under metrics is not currently addressable by dot path without
                    // exposing Map internals. Fall back to the full metrics object.
                    return this.makeSerializable(metrics);
                }

                const data = safePath ? this.get(safePath) : this.data;
                return this.makeSerializable(data);
            }
        );

        // Set main process state (restricted)
        ipcMain.handle(
            "main-state:set",
            (
                event: MainIpcEventLike,
                path: string,
                value: unknown,
                options: LooseRecord = {}
            ) => {
                if (!validate(event)) {
                    return false;
                }

                const safePath = typeof path === "string" ? path.trim() : "";
                if (!safePath) {
                    return false;
                }

                // Security: deny unsafe dot paths (prototype pollution hardening)
                if (!isSafeDotPath(safePath)) {
                    logWithContext(
                        "warn",
                        "Renderer attempted to set unsafe path",
                        { path: safePath }
                    );
                    return false;
                }

                // Only allow certain paths to be set from renderer
                const allowedRoots = ["loadedFitFilePath", "operations"],
                    rootPath = safePath.split(".")[0] || "";
                if (allowedRoots.includes(rootPath)) {
                    this.set(safePath, value, {
                        ...options,
                        source: "renderer",
                    });
                    return true;
                }

                logWithContext(
                    "warn",
                    "Renderer attempted to set restricted path",
                    { path: safePath }
                );
                return false;
            }
        );

        // Listen to main process state changes
        ipcMain.handle(
            "main-state:listen",
            (event: MainIpcEventLike, path: string) => {
                if (!validate(event)) {
                    return false;
                }

                const sender = event?.sender;
                if (!sender) return false;
                const safePath = typeof path === "string" ? path.trim() : "";
                const normalizedPath = safePath.length === 0 ? "*" : safePath;

                // Security: refuse subscriptions to unsafe dot paths.
                if (normalizedPath !== "*" && !isSafeDotPath(normalizedPath)) {
                    logWithContext(
                        "warn",
                        "Blocked main-state:listen for unsafe path",
                        { path: normalizedPath }
                    );
                    return false;
                }

                const subscriptionKey = this.makeSubscriptionKey(
                    sender,
                    normalizedPath
                );
                if (!this.ipcSubscriptions.has(subscriptionKey)) {
                    this.registerSenderCleanup(sender);

                    const unsubscribe = this.listen(
                        normalizedPath,
                        (change: StateChange) => {
                            try {
                                if (
                                    typeof sender.isDestroyed === "function" &&
                                    sender.isDestroyed()
                                ) {
                                    return;
                                }
                                sender.send(
                                    "main-state-change",
                                    this.makeSerializable(change)
                                );
                            } catch (error) {
                                logWithContext(
                                    "warn",
                                    "Failed to emit state change to renderer",
                                    { error: getErrorMessage(error) }
                                );
                            }
                        }
                    );

                    if (typeof unsubscribe === "function") {
                        this.ipcSubscriptions.set(subscriptionKey, unsubscribe);
                    }
                }

                return true;
            }
        );

        ipcMain.handle(
            "main-state:unlisten",
            (event: MainIpcEventLike, path: string) => {
                if (!validate(event)) {
                    return false;
                }

                const sender = event?.sender;
                if (!sender) return false;
                const safePath = typeof path === "string" ? path.trim() : "";

                const normalizedPath = safePath.length === 0 ? "*" : safePath;

                if (normalizedPath !== "*" && !isSafeDotPath(normalizedPath)) {
                    return false;
                }
                const subscriptionKey = this.makeSubscriptionKey(
                    sender,
                    normalizedPath
                );
                const unsubscribe = this.ipcSubscriptions.get(subscriptionKey);
                if (!unsubscribe) return false;

                try {
                    unsubscribe();
                } catch {
                    /* ignore */
                }
                this.ipcSubscriptions.delete(subscriptionKey);
                return true;
            }
        );

        // Get operation status
        ipcMain.handle(
            "main-state:operation",
            (event: MainIpcEventLike, operationId: string) => {
                if (!validate(event)) {
                    return undefined;
                }

                const safeOperationId =
                    typeof operationId === "string" ? operationId.trim() : "";
                if (
                    !safeOperationId ||
                    safeOperationId.length > MAX_DOT_PATH_SEGMENT_LENGTH
                ) {
                    return;
                }
                if (
                    !DOT_PATH_SEGMENT_PATTERN.test(safeOperationId) ||
                    FORBIDDEN_DOT_PATH_SEGMENTS.has(safeOperationId)
                ) {
                    return;
                }

                const val = this.get(`operations.${safeOperationId}`);
                return val === null ? undefined : val;
            }
        );

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
        ipcMain.handle(
            "main-state:errors",
            (event: MainIpcEventLike, limit = 50) => {
                if (!validate(event)) {
                    return [];
                }

                const errors = this.get("errors") || [];
                const max = 100;
                const n =
                    typeof limit === "number" && Number.isFinite(limit)
                        ? Math.floor(limit)
                        : 50;
                const clamped = Math.max(0, Math.min(max, n));
                return errors.slice(0, clamped);
            }
        );

        // Get metrics
        ipcMain.handle("main-state:metrics", () =>
            this.makeSerializable(this.getSerializableMetrics())
        );

        this._ipcHandlersRegistered = true;
    }
    /*
     * Start tracking an operation
     *
     * @param {string} operationId - Unique operation identifier
     * @param {Object} operationData - Operation metadata
     */
    /*
     * @param {string} operationId
     * @param {Partial<Operation>} [operationData]
     */
    startOperation(operationId: string, operationData: LooseRecord = {}): void {
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

    /*
     * Unregister event handler
     *
     * @param {string} handlerId - Handler ID
     */
    /*
     * @param {string} handlerId
     */
    unregisterEventHandler(handlerId: string): void {
        const eventHandlers = this.get("eventHandlers") || new Map(),
            handlerInfo = eventHandlers.get(handlerId);

        if (handlerInfo) {
            const { emitter, event, handler } = handlerInfo;
            emitter.removeListener(event, handler);
            eventHandlers.delete(handlerId);
            this.set("eventHandlers", eventHandlers);

            if (this.devMode) {
                logWithContext("info", "Event handler unregistered", {
                    handlerId,
                });
            }
        }
    }

    /*
     * Update state with partial object
     *
     * @param {Object} updates - Object with updates
     * @param {Object} options - Update options
     */
    /*
     * @param {Record<string, any>} updates
     * @param {Object} [options]
     */
    update(updates: Record<string, unknown>, options: LooseRecord = {}): void {
        const changes: StateChange[] = [];

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

    /*
     * Update operation progress
     *
     * @param {string} operationId - Operation identifier
     * @param {Object} updates - Progress updates
     */
    /*
     * @param {string} operationId
     * @param {OperationUpdate} updates
     */
    updateOperation(operationId: string, updates: LooseRecord): void {
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
        this.notifyRenderers("operation-updated", {
            operation: updatedOp,
            operationId,
        });
    }
}

/*
 * Validate a dot-separated path for safe traversal.
 *
 * Rules:
 *
 * - Must be a non-empty string after trimming
 * - Must not contain empty segments ("a..b")
 * - Must not contain prototype-pollution segments
 *
 * @param {unknown} path
 *
 * @returns {path is string}
 */
function isSafeDotPath(path: unknown): path is string {
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

/*
 * Log with consistent prefix & optional JSON context
 */
function logWithContext(
    level: ConsoleLevel,
    message: string,
    context: LooseRecord = {}
): void {
    const contextStr =
            Object.keys(context).length > 0 ? JSON.stringify(context) : "",
        timestamp = new Date().toISOString();
    // Narrowed level union keeps TS happy accessing console methods
    console[level](
        `[${timestamp}] [mainProcessStateManager] ${message}`,
        contextStr
    );
}

/*
 * Monotonic time source for measuring durations. Uses performance.now when
 * available to avoid issues with system clock changes.
 *
 * @returns {number}
 */
function monotonicNowMs(): number {
    if (
        globalThis.performance &&
        typeof globalThis.performance.now === "function"
    ) {
        return globalThis.performance.now();
    }
    return Date.now();
}

// Lazy access to Electron to avoid import-time side effects in tests/non-Electron envs
function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function safeElectron(): MainElectronLike {
    let mod: unknown;
    const unwrap = (m: any): MainElectronLike => {
        if (!m) return {};
        // Prefer the variant that actually exposes Electron APIs (handles ESM default wrappers)
        const hasApis = (x: any): boolean =>
            x &&
            (x.app ||
                x.ipcMain ||
                x.BrowserWindow ||
                x.Menu ||
                x.shell ||
                x.dialog);
        if (hasApis(m)) return m;
        const def = m.default;
        if (hasApis(def)) return def;
        return m;
    };

    try {
        // Only clear cache in tests to pick up per-test mocks
        if (
            typeof process !== "undefined" &&
            process.env &&
            process.env["NODE_ENV"] === "test"
        ) {
            try {
                const key =
                    typeof require.resolve === "function"
                        ? require.resolve("electron")
                        : undefined;
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
    if (
        !resolved ||
        !resolved.ipcMain ||
        typeof resolved.ipcMain.handle !== "function"
    ) {
        try {
            const hasGlobal =
                typeof globalThis === "object" && globalThis !== null;
            const gReq =
                hasGlobal &&
                "require" in globalThis &&
                typeof globalThis.require === "function"
                    ? globalThis.require
                    : undefined;
            if (typeof gReq === "function") {
                resolved = unwrap(gReq("electron"));
            }
        } catch {
            /* ignore */
        }
    }

    return resolved || {};
}

/*
 * Utility functions for main process state manager
 */
function validate(
    event: MainIpcEventLike
): event is MainIpcEventLike & { sender: MainWebContentsLike } {
    const sender = event?.sender;
    if (!sender || typeof sender !== "object") {
        logWithContext("warn", "Blocked IPC request without sender");
        return false;
    }

    if (
        typeof sender.isDestroyed === "function" &&
        sender.isDestroyed()
    ) {
        logWithContext("warn", "Blocked IPC request from destroyed sender");
        return false;
    }

    if (typeof sender.send !== "function") {
        logWithContext("warn", "Blocked IPC request from invalid sender");
        return false;
    }

    return true;
}

/*
 * Validate an Electron BrowserWindow instance before IPC use.
 *
 * @param {import("electron").BrowserWindow | undefined | null} win
 *
 * @returns {boolean}
 */
function validateWindow(win: unknown): win is MainBrowserWindowLike {
    if (!win || typeof win !== "object") {
        console.warn(
            "[mainProcessStateManager] Window is not usable or destroyed"
        );
        return false;
    }

    const candidate = win as Partial<MainBrowserWindowLike>;
    const webContents = candidate.webContents;
    if (
        typeof candidate.isDestroyed !== "function" ||
        candidate.isDestroyed() ||
        !webContents ||
        typeof webContents.isDestroyed !== "function" ||
        webContents.isDestroyed()
    ) {
        console.warn(
            "[mainProcessStateManager] Window is not usable or destroyed"
        );
        return false;
    }
    return true;
}

// Create and export singleton instance
const mainProcessState = new MainProcessState();

// Defer IPC setup until Electron is ready if needed. This avoids startup races where
// 'ipcMain' may appear unavailable extremely early in process bootstrap.
(function ensureIpcHandlersReadyOnce() {
    const state = ensureIpcHandlersReadyOnce as (() => void) & {
        done?: boolean;
        logged?: boolean;
        retryTimer?: ReturnType<typeof setTimeout>;
    };
    if (state.done) return;

    // In the renderer, this file can be loaded as a browser module/script where CommonJS globals
    // (module/require) do not exist. In that environment, IPC handler registration is impossible
    // and should not spam the console with retry warnings.
    if (typeof module === "undefined") {
        state.done = true;
        return;
    }

    const isRendererProcess =
        typeof process !== "undefined" && process.type === "renderer";
    if (isRendererProcess) {
        state.done = true;
        return;
    }

    const trySetup = () => {
        const { ipcMain } = safeElectron();
        if (ipcMain && typeof ipcMain.handle === "function") {
            if (state.retryTimer) {
                clearTimeout(state.retryTimer);
                delete state.retryTimer;
            }

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
                        if (!state.done && !trySetup() && attempts++ < 50) {
                            state.retryTimer = setTimeout(tick, 50);
                        }
                    };
                    state.retryTimer = setTimeout(tick, 10);
                });
            return;
        }
    } catch {
        /* ignore */
    }

    // Final fallback: small bounded retry loop
    let attempts = 0;
    const tick = () => {
        if (!state.done && !trySetup() && attempts++ < 50) {
            state.retryTimer = setTimeout(tick, 50);
        }
    };
    if (!state.logged) {
        state.logged = true;
        try {
            console.warn(
                "[mainProcessStateManager] Deferring IPC handler setup until Electron is ready"
            );
        } catch {
            /* ignore */
        }
    }
    state.retryTimer = setTimeout(tick, 10);
})();

const __mpExports = { mainProcessState, MainProcessState };

// Expose for CommonJS (Electron main/tests)
if (typeof module !== "undefined" && module && module.exports) {
    module.exports = __mpExports;
}

// Also attach to a global shim so ESM barrels in renderer can recover without touching module
try {
    if (typeof globalThis !== "undefined") {
        Object.defineProperty(
            globalThis,
            "__FFV_mainProcessStateManagerExports",
            {
                configurable: true,
                enumerable: false,
                value: __mpExports,
                writable: true,
            }
        );
    }
} catch {
    /* ignore */
}
