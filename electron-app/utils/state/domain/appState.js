const PERSISTENT_KEYS = [
    "ui.theme",
    "ui.activeTab",
    "charts.controlsVisible",
    "performance.enableMonitoring",
];
const VOLATILE_KEYS = [
    "data.globalData",
    "file.isOpening",
    "performance.metrics",
    "errors.current",
];
/**
 * State change event names emitted by the legacy app-state domain manager.
 */
export const STATE_EVENTS = {
    CHART_CONTROLS_TOGGLED: "chart-controls-toggled",
    CHART_RENDERED: "chart-rendered",
    DATA_CHANGED: "data-changed",
    DATA_CLEARED: "data-cleared",
    DATA_LOADED: "data-loaded",
    ERROR_OCCURRED: "error-occurred",
    FILE_CLOSED: "file-closed",
    FILE_OPENED: "file-opened",
    FILE_OPENING: "file-opening",
    RENDER_COMPLETED: "render-completed",
    RENDER_STARTED: "render-started",
    TAB_CHANGED: "tab-changed",
    THEME_CHANGED: "theme-changed",
    WARNING_OCCURRED: "warning-occurred",
};
const PERSISTENCE_CONFIG = {
    PERSISTENT_KEYS,
    STORAGE_PREFIX: "ffv_state_",
    VOLATILE_KEYS,
};
function createDefaultState() {
    return {
        charts: {
            controlsVisible: false,
            instances: new Map(),
            isRendered: false,
            lastRenderTime: null,
            visibleFields: new Set(),
        },
        data: {
            globalData: null,
            isLoaded: false,
            lastModified: null,
            recordCount: 0,
        },
        errors: {
            current: [],
            history: [],
            lastError: null,
        },
        file: {
            isOpening: false,
            lastOpened: null,
            name: null,
            path: null,
            size: 0,
        },
        performance: {
            enableMonitoring: true,
            metrics: new Map(),
            renderTimes: [],
            startTime: performance.now(),
        },
        ui: {
            activeTab: "summary",
            isInitialized: false,
            theme: "auto",
            windowSize: { height: 0, width: 0 },
        },
    };
}
function getStorage() {
    return typeof localStorage === "undefined" ? undefined : localStorage;
}
function getPathSegments(path) {
    return path.split(".").filter(Boolean);
}
function isVolatilePath(path) {
    return PERSISTENCE_CONFIG.VOLATILE_KEYS.some(
        (volatilePath) => volatilePath === path
    );
}
function isRecord(value) {
    return value !== null && typeof value === "object";
}
function readProperty(target, key) {
    if (!isRecord(target)) {
        return undefined;
    }
    return target[key];
}
function setProperty(target, key, value) {
    if (!isRecord(target)) {
        return;
    }
    target[key] = value;
}
function getRecordCount(data) {
    if (!isRecord(data)) {
        return 0;
    }
    const recordMesgs = data["recordMesgs"];
    return Array.isArray(recordMesgs) ? recordMesgs.length : 0;
}
function createErrorEntry(error, context) {
    const entry = {
        context,
        message: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
    };
    if (error instanceof Error && typeof error.stack === "string") {
        entry.stack = error.stack;
    }
    return entry;
}
/**
 * Central application state with reactive path events and persistence hooks.
 */
class AppStateManager {
    listeners = new Map();
    state = createDefaultState();
    validators = new Map();
    constructor() {
        this.setupReactiveProperties();
        this.loadPersistedState();
        this.setupAutoPersistence();
        console.log("[AppState] State manager initialized");
    }
    /** Adds a validator for a state path. */
    addValidator(path, validator) {
        this.validators.set(path, validator);
    }
    /** Emits an event to all listeners registered for the event name. */
    emit(event, data) {
        const eventListeners = this.listeners.get(event);
        if (!eventListeners) {
            return;
        }
        for (const callback of eventListeners) {
            try {
                callback(data);
            } catch (error) {
                console.error(
                    `[AppState] Error in event listener for ${event}:`,
                    error
                );
            }
        }
    }
    /** Emits category-specific events for known state paths. */
    emitSpecificEvents(path, newValue, oldValue) {
        switch (path) {
            case "charts.controlsVisible": {
                this.emit(STATE_EVENTS.CHART_CONTROLS_TOGGLED, {
                    visible: newValue,
                });
                break;
            }
            case "charts.isRendered": {
                if (newValue && !oldValue) {
                    this.emit(STATE_EVENTS.CHART_RENDERED, {
                        renderTime: Date.now(),
                    });
                }
                break;
            }
            case "data.globalData": {
                if (newValue && !oldValue) {
                    this.emit(STATE_EVENTS.DATA_LOADED, { data: newValue });
                } else if (!newValue && oldValue) {
                    this.emit(STATE_EVENTS.DATA_CLEARED, {
                        previousData: oldValue,
                    });
                } else if (newValue !== oldValue) {
                    this.emit(STATE_EVENTS.DATA_CHANGED, {
                        data: newValue,
                        previousData: oldValue,
                    });
                }
                break;
            }
            case "file.isOpening": {
                if (newValue) {
                    this.emit(STATE_EVENTS.FILE_OPENING, {});
                }
                break;
            }
            case "ui.activeTab": {
                this.emit(STATE_EVENTS.TAB_CHANGED, {
                    previousTab: oldValue,
                    tab: newValue,
                });
                break;
            }
            case "ui.theme": {
                this.emit(STATE_EVENTS.THEME_CHANGED, {
                    previousTheme: oldValue,
                    theme: newValue,
                });
                break;
            }
        }
    }
    /** Gets a state value by dot-notation path. */
    get(path) {
        if (!path) {
            return this.state;
        }
        let current = this.state;
        for (const key of getPathSegments(path)) {
            current = readProperty(current, key);
            if (current === undefined) {
                return undefined;
            }
        }
        return current;
    }
    /** Gets debug information about the current state manager. */
    getDebugInfo() {
        return {
            listeners: [...this.listeners.keys()],
            persistentKeys: PERSISTENCE_CONFIG.PERSISTENT_KEYS,
            state: this.getSnapshot(),
            validators: [...this.validators.keys()],
            volatileKeys: PERSISTENCE_CONFIG.VOLATILE_KEYS,
        };
    }
    /** Gets a JSON-compatible snapshot of the current state. */
    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }
    /** Loads persisted state paths from localStorage when available. */
    loadPersistedState() {
        const storage = getStorage();
        if (!storage) {
            return;
        }
        try {
            for (const path of PERSISTENCE_CONFIG.PERSISTENT_KEYS) {
                const key = PERSISTENCE_CONFIG.STORAGE_PREFIX + path;
                const stored = storage.getItem(key);
                if (stored !== null) {
                    try {
                        const value = JSON.parse(stored);
                        this.set(path, value);
                        console.log(
                            `[AppState] Loaded persisted state for ${path}:`,
                            value
                        );
                    } catch (parseError) {
                        console.warn(
                            `[AppState] Failed to parse persisted state for ${path}:`,
                            parseError
                        );
                    }
                }
            }
        } catch (error) {
            console.error("[AppState] Error loading persisted state:", error);
        }
    }
    /** Removes an event listener. */
    off(event, callback) {
        const eventListeners = this.listeners.get(event);
        if (!eventListeners) {
            return;
        }
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
            this.listeners.delete(event);
        }
    }
    /** Adds an event listener and returns a cleanup function. */
    on(event, callback) {
        const eventListeners = this.listeners.get(event) ?? new Set();
        eventListeners.add(callback);
        this.listeners.set(event, eventListeners);
        return () => {
            this.off(event, callback);
        };
    }
    /** Persists a state path to localStorage when it is not volatile. */
    persistState(path) {
        if (isVolatilePath(path)) {
            return;
        }
        const storage = getStorage();
        if (!storage) {
            return;
        }
        try {
            const key = PERSISTENCE_CONFIG.STORAGE_PREFIX + path;
            const value = this.get(path);
            if (value !== undefined) {
                storage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.error(
                `[AppState] Error persisting state for ${path}:`,
                error
            );
        }
    }
    /** Clears persisted state and resets runtime state to defaults. */
    reset() {
        const storage = getStorage();
        if (storage) {
            for (const path of PERSISTENCE_CONFIG.PERSISTENT_KEYS) {
                const key = PERSISTENCE_CONFIG.STORAGE_PREFIX + path;
                storage.removeItem(key);
            }
        }
        this.state = createDefaultState();
        this.setupReactiveProperties();
        this.emit("state-reset", {});
        console.log("[AppState] State reset to defaults");
    }
    /** Sets a state value by dot-notation path. */
    set(path, value) {
        try {
            const keys = getPathSegments(path);
            let current = this.state;
            for (const key of keys.slice(0, -1)) {
                if (!isRecord(current)) {
                    return false;
                }
                if (!isRecord(current[key])) {
                    current[key] = {};
                }
                current = current[key];
            }
            const finalKey = keys.at(-1);
            if (finalKey) {
                setProperty(current, finalKey, value);
            }
            return true;
        } catch (error) {
            console.error(`[AppState] Error setting ${path}:`, error);
            return false;
        }
    }
    /** Sets up automatic persistence for persistent paths. */
    setupAutoPersistence() {
        for (const path of PERSISTENCE_CONFIG.PERSISTENT_KEYS) {
            this.on(`${path}-changed`, () => {
                this.persistState(path);
            });
        }
    }
    /** Defines reactive properties for selected state paths. */
    setupReactiveProperties() {
        const reactivePaths = [
            "data.globalData",
            "data.isLoaded",
            "file.isOpening",
            "ui.activeTab",
            "ui.theme",
            "charts.controlsVisible",
            "charts.isRendered",
        ];
        for (const path of reactivePaths) {
            this.createReactiveProperty(this.state, path, this.get(path));
        }
    }
    /** Updates multiple state paths and emits a batch event. */
    update(updates) {
        const oldState = this.getSnapshot();
        try {
            for (const [path, value] of Object.entries(updates)) {
                this.set(path, value);
            }
            this.emit("state-batch-updated", {
                newState: this.getSnapshot(),
                oldState,
                updates,
            });
        } catch (error) {
            console.error("[AppState] Error in batch update:", error);
        }
    }
    createReactiveProperty(obj, path, initialValue) {
        const keys = getPathSegments(path);
        let current = obj;
        for (const key of keys.slice(0, -1)) {
            if (!isRecord(current)) {
                return;
            }
            if (!isRecord(current[key])) {
                current[key] = {};
            }
            current = current[key];
        }
        const finalKey = keys.at(-1);
        if (!finalKey || !isRecord(current)) {
            return;
        }
        const descriptor = Object.getOwnPropertyDescriptor(current, finalKey);
        if (descriptor?.get && descriptor.set) {
            return;
        }
        let value = initialValue;
        Object.defineProperty(current, finalKey, {
            configurable: true,
            enumerable: true,
            get() {
                return value;
            },
            set: (newValue) => {
                const oldValue = value;
                const validator = this.validators.get(path);
                if (validator && !validator(newValue, oldValue)) {
                    console.warn(
                        `[AppState] Validation failed for ${path}:`,
                        newValue
                    );
                    return;
                }
                value = newValue;
                this.emit(`${path}-changed`, {
                    newValue,
                    oldValue,
                    path,
                    timestamp: Date.now(),
                });
                this.emitSpecificEvents(path, newValue, oldValue);
            },
        });
    }
}
const appState = new AppStateManager();
const stateGlobal = globalThis;
if (stateGlobal.window !== undefined) {
    try {
        const desc = Object.getOwnPropertyDescriptor(globalThis, "globalData");
        if (!desc || desc.configurable) {
            Object.defineProperty(globalThis, "globalData", {
                configurable: true,
                enumerable: true,
                get() {
                    return appState.get("data.globalData");
                },
                set(value) {
                    appState.set("data.globalData", value);
                },
            });
        }
    } catch {
        // Ignore global compatibility wiring failures.
    }
    stateGlobal.__appState = appState;
    console.log("[AppState] Global window properties configured");
}
/** Adds an error entry to app state and error history. */
export function addError(error, context = "") {
    const currentErrors = appState.get("errors.current");
    const errorHistory = appState.get("errors.history");
    const errorObj = createErrorEntry(error, context);
    appState.update({
        "errors.current": [
            ...(Array.isArray(currentErrors) ? currentErrors : []),
            errorObj,
        ],
        "errors.history": [
            ...(Array.isArray(errorHistory) ? errorHistory : []),
            errorObj,
        ].slice(-100),
        "errors.lastError": errorObj,
    });
    appState.emit(STATE_EVENTS.ERROR_OCCURRED, errorObj);
}
/** Clears current error entries. */
export function clearErrors() {
    appState.set("errors.current", []);
}
/** Clears loaded FIT data from app state. */
export function clearGlobalData() {
    appState.update({
        "data.globalData": null,
        "data.isLoaded": false,
        "data.lastModified": null,
        "data.recordCount": 0,
    });
}
/** Gets a state value by dot-notation path. */
export function getState(path) {
    return appState.get(path);
}
/** Sets the active tab identifier. */
export function setActiveTab(tabId) {
    appState.set("ui.activeTab", tabId);
}
/** Sets chart controls visibility. */
export function setChartControlsVisible(visible) {
    appState.set("charts.controlsVisible", visible);
}
/** Sets file-opening state and current file path. */
export function setFileOpeningState(isOpening, filePath = null) {
    appState.update({
        "file.isOpening": isOpening,
        "file.lastOpened": isOpening ? null : Date.now(),
        "file.path": filePath,
    });
}
/** Sets loaded FIT data and derived file metrics. */
export function setGlobalData(data) {
    appState.update({
        "data.globalData": data,
        "data.isLoaded": Boolean(data),
        "data.lastModified": Date.now(),
        "data.recordCount": getRecordCount(data),
    });
}
/** Sets a state value by dot-notation path. */
export function setState(path, value) {
    return appState.set(path, value);
}
/** Sets the app theme. */
export function setTheme(theme) {
    appState.set("ui.theme", theme);
}
/** Subscribes to an event or path change event. */
export function subscribe(event, callback) {
    return appState.on(event, callback);
}
export { appState };
export default appState;
