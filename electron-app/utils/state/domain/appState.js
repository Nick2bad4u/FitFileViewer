/**
 * @fileoverview Centralized Application State Management System
 * @description Provides unified state management with reactive updates, validation, and persistence
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} StateUpdateEvent
 * @property {string} path - The state path that changed
 * @property {*} newValue - The new value
 * @property {*} oldValue - The previous value
 * @property {number} timestamp - When the change occurred
 */

/**
 * @typedef {Object} StateValue
 * @property {*} [data] - Global data state
 * @property {*} [file] - File state information
 * @property {*} [ui] - UI state information
 * @property {*} [charts] - Chart state information
 * @property {*} [performance] - Performance metrics
 * @property {*} [errors] - Error state information
 */

/**
 * State validator function signature.
 *
 * @typedef {(value: object, context: object) => boolean} StateValidator
 */

/**
 * State change event types for different categories of state
 */
export const STATE_EVENTS = {
    CHART_CONTROLS_TOGGLED: "chart-controls-toggled",
    CHART_RENDERED: "chart-rendered",
    DATA_CHANGED: "data-changed",

    DATA_CLEARED: "data-cleared",
    // Data events
    DATA_LOADED: "data-loaded",
    // Error events
    ERROR_OCCURRED: "error-occurred",
    FILE_CLOSED: "file-closed",

    FILE_OPENED: "file-opened",
    // File events
    FILE_OPENING: "file-opening",
    RENDER_COMPLETED: "render-completed",

    // Performance events
    RENDER_STARTED: "render-started",
    // UI events
    TAB_CHANGED: "tab-changed",

    THEME_CHANGED: "theme-changed",
    WARNING_OCCURRED: "warning-occurred",
};

/**
 * State persistence configuration
 */
const PERSISTENCE_CONFIG = {
    // Keys that should persist across sessions
    PERSISTENT_KEYS: ["ui.theme", "ui.activeTab", "charts.controlsVisible", "performance.enableMonitoring"],
    STORAGE_PREFIX: "ffv_state_",
    // Keys that should never persist
    VOLATILE_KEYS: ["data.globalData", "file.isOpening", "performance.metrics", "errors.current"],
};

/**
 * Central application state with reactive properties
 */
class AppStateManager {
    constructor() {
        this.state = {
            // Chart state
            charts: {
                controlsVisible: false,
                instances: new Map(),
                isRendered: false,
                lastRenderTime: null,
                visibleFields: new Set(),
            },

            // Data state
            data: {
                globalData: null,
                isLoaded: false,
                lastModified: null,
                recordCount: 0,
            },

            // Error state
            errors: {
                current: [],
                history: [],
                lastError: null,
            },

            // File state
            file: {
                isOpening: false,
                lastOpened: null,
                name: null,
                path: null,
                size: 0,
            },

            // Performance state
            performance: {
                enableMonitoring: true,
                metrics: new Map(),
                renderTimes: [],
                startTime: performance.now(),
            },

            // UI state
            ui: {
                activeTab: "summary",
                isInitialized: false,
                theme: "auto",
                windowSize: { height: 0, width: 0 },
            },
        };

        // Event listeners for state changes
        this.listeners = new Map();

        // State validation rules
        this.validators = new Map();

        // Initialize reactive properties
        this.setupReactiveProperties();

        // Load persisted state
        this.loadPersistedState();

        // Setup automatic persistence
        this.setupAutoPersistence();

        console.log("[AppState] State manager initialized");
    }

    /**
     * Add state validator
     * @param {string} path - State path to validate
     * @param {Function} validator - Validation function
     */
    addValidator(path, validator) {
        this.validators.set(path, validator);
    }

    /**
     * Emit event to all listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            for (const callback of eventListeners) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[AppState] Error in event listener for ${event}:`, error);
                }
            }
        }
    }

    /**
     * Emits specific events based on state path changes
     * @param {string} path - State path that changed
     * @param {*} newValue - New value
     * @param {*} oldValue - Previous value
     */
    emitSpecificEvents(path, newValue, oldValue) {
        switch (path) {
            case "charts.controlsVisible": {
                this.emit(STATE_EVENTS.CHART_CONTROLS_TOGGLED, { visible: newValue });
                break;
            }

            case "charts.isRendered": {
                if (newValue && !oldValue) {
                    this.emit(STATE_EVENTS.CHART_RENDERED, { renderTime: Date.now() });
                }
                break;
            }

            case "data.globalData": {
                if (newValue && !oldValue) {
                    this.emit(STATE_EVENTS.DATA_LOADED, { data: newValue });
                } else if (!newValue && oldValue) {
                    this.emit(STATE_EVENTS.DATA_CLEARED, { previousData: oldValue });
                } else if (newValue !== oldValue) {
                    this.emit(STATE_EVENTS.DATA_CHANGED, { data: newValue, previousData: oldValue });
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
                this.emit(STATE_EVENTS.TAB_CHANGED, { previousTab: oldValue, tab: newValue });
                break;
            }

            case "ui.theme": {
                this.emit(STATE_EVENTS.THEME_CHANGED, { previousTheme: oldValue, theme: newValue });
                break;
            }
        }
    }

    /**
     * Get state value by path
     * @param {string} path - Dot notation path (e.g., "data.globalData")
     * @returns {*} State value
     */
    get(path) {
        const keys = path.split(".");
        /** @type {any} */
        let current = this.state;

        for (const key of keys) {
            if (current === null || current === undefined) {
                return;
            }
            current = current[key];
        }

        return current;
    }

    /**
     * Get debug information about current state
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            listeners: [...this.listeners.keys()],
            persistentKeys: PERSISTENCE_CONFIG.PERSISTENT_KEYS,
            state: this.getSnapshot(),
            validators: [...this.validators.keys()],
            volatileKeys: PERSISTENCE_CONFIG.VOLATILE_KEYS,
        };
    }

    /**
     * Get current state snapshot
     * @returns {Object} Deep copy of current state
     */
    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Load persisted state from localStorage
     */
    loadPersistedState() {
        try {
            for (const path of PERSISTENCE_CONFIG.PERSISTENT_KEYS) {
                const key = PERSISTENCE_CONFIG.STORAGE_PREFIX + path,
                    stored = localStorage.getItem(key);

                if (stored !== null) {
                    try {
                        const value = JSON.parse(stored);
                        this.set(path, value);
                        console.log(`[AppState] Loaded persisted state for ${path}:`, value);
                    } catch (parseError) {
                        console.warn(`[AppState] Failed to parse persisted state for ${path}:`, parseError);
                    }
                }
            }
        } catch (error) {
            console.error("[AppState] Error loading persisted state:", error);
        }
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event handler to remove
     */
    off(event, callback) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(callback);
            if (eventListeners.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @returns {Function} Cleanup function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event).add(callback);

        // Return cleanup function
        return () => {
            const eventListeners = this.listeners.get(event);
            if (eventListeners) {
                eventListeners.delete(callback);
                if (eventListeners.size === 0) {
                    this.listeners.delete(event);
                }
            }
        };
    }

    /**
     * Save specific state path to localStorage
     * @param {string} path - State path to persist
     */
    persistState(path) {
        if (PERSISTENCE_CONFIG.VOLATILE_KEYS.includes(path)) {
            return; // Don't persist volatile keys
        }

        try {
            const key = PERSISTENCE_CONFIG.STORAGE_PREFIX + path,
                value = this.get(path);

            if (value !== undefined) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.error(`[AppState] Error persisting state for ${path}:`, error);
        }
    }

    /**
     * Clear all state and reset to defaults
     */
    reset() {
        // Clear localStorage
        for (const path of PERSISTENCE_CONFIG.PERSISTENT_KEYS) {
            const key = PERSISTENCE_CONFIG.STORAGE_PREFIX + path;
            localStorage.removeItem(key);
        }

        // Reset state
        this.state = {
            charts: {
                controlsVisible: false,
                instances: new Map(),
                isRendered: false,
                lastRenderTime: null,
                visibleFields: new Set(),
            },
            data: { globalData: null, isLoaded: false, lastModified: null, recordCount: 0 },
            errors: { current: [], history: [], lastError: null },
            file: { isOpening: false, lastOpened: null, name: null, path: null, size: 0 },
            performance: { enableMonitoring: true, metrics: new Map(), renderTimes: [], startTime: performance.now() },
            ui: { activeTab: "summary", isInitialized: false, theme: "auto", windowSize: { height: 0, width: 0 } },
        };

        this.emit("state-reset", {});
        console.log("[AppState] State reset to defaults");
    }

    /**
     * Set state value by path
     * @param {string} path - Dot notation path
     * @param {*} value - New value
     * @returns {boolean} Success status
     */
    set(path, value) {
        try {
            const keys = path.split(".");
            /** @type {any} */
            let current = this.state;

            // Navigate to parent
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (key && !current[key]) {
                    current[key] = {};
                }
                if (key) {
                    current = current[key];
                }
            }

            // Set value (will trigger reactive setter if property is reactive)
            const finalKey = keys.at(-1);
            if (finalKey) {
                current[finalKey] = value;
            }

            return true;
        } catch (error) {
            console.error(`[AppState] Error setting ${path}:`, error);
            return false;
        }
    }

    /**
     * Setup automatic persistence for persistent keys
     */
    setupAutoPersistence() {
        for (const path of PERSISTENCE_CONFIG.PERSISTENT_KEYS) {
            this.on(`${path}-changed`, () => {
                this.persistState(path);
            });
        }
    }

    /**
     * Sets up reactive properties with getters/setters that trigger events
     */
    setupReactiveProperties() {
        /**
         * @param {StateValue} obj - Object to add reactive property to
         * @param {string} path - Dot notation path
         * @param {*} initialValue - Initial value for the property
         */
        const createReactiveProperty = (obj, path, initialValue) => {
                const keys = path.split(".");
                /** @type {any} */
                let current = obj;

                // Navigate to parent object
                for (let i = 0; i < keys.length - 1; i++) {
                    const key = keys[i];
                    if (key && !current[key]) {
                        current[key] = {};
                    }
                    if (key) {
                        current = current[key];
                    }
                }

                const finalKey = keys.at(-1);
                if (!finalKey) {
                    return;
                }

                let value = initialValue;

                const self = this;
                Object.defineProperty(current, finalKey, {
                    configurable: true,
                    enumerable: true,
                    get() {
                        return value;
                    },
                    /**
                     * @param {*} newValue - New value to set
                     */
                    set(newValue) {
                        const oldValue = value,
                            // Validate if validator exists
                            validator = self.validators.get(path);
                        if (validator && !validator(newValue, oldValue)) {
                            console.warn(`[AppState] Validation failed for ${path}:`, newValue);
                            return;
                        }

                        value = newValue;

                        // Emit change event
                        self.emit(`${path}-changed`, {
                            newValue,
                            oldValue,
                            path,
                            timestamp: Date.now(),
                        }); // Emit specific events based on path
                        self.emitSpecificEvents(path, newValue, oldValue);
                    },
                });
            },
            // Setup reactive properties for key state paths
            reactivePaths = [
                "data.globalData",
                "data.isLoaded",
                "file.isOpening",
                "ui.activeTab",
                "ui.theme",
                "charts.controlsVisible",
                "charts.isRendered",
            ];

        for (const path of reactivePaths) {
            const keys = path.split(".");
            /** @type {any} */
            let initialValue = this.state;
            for (const key of keys) {
                initialValue = initialValue[key];
            }
            createReactiveProperty(this.state, path, initialValue);
        }
    }

    /**
     * Update multiple state values atomically
     * @param {Object} updates - Object with path:value pairs
     */
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
            // Could implement rollback here if needed
        }
    }
}

// Create singleton instance
const appState = new AppStateManager();

// Expose convenience methods globally (following your existing patterns)
if (globalThis.window !== undefined) {
    // Backward compatibility with existing globalData usage.
    // Guard against re-definition if another module already defined it (e.g., multiple imports of renderer/main-ui during tests).
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
        /* Ignore */
    }

    // Expose app state for debugging
    globalThis.__appState = appState;

    console.log("[AppState] Global window properties configured");
}

/**
 * High-level convenience functions following your established patterns
 */

/**
 * Add error to state
 * @param {Error|string} error - Error to add
 * @param {string} context - Error context
 */
export function addError(error, context = "") {
    const currentErrors = appState.get("errors.current") || [],
        errorHistory = appState.get("errors.history") || [],
        errorObj = {
            context,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: Date.now(),
        };

    appState.update({
        "errors.current": [...currentErrors, errorObj],
        "errors.history": [...errorHistory, errorObj].slice(-100), // Keep last 100 errors
        "errors.lastError": errorObj,
    });

    appState.emit(STATE_EVENTS.ERROR_OCCURRED, errorObj);
}

/**
 * Clear current errors
 */
export function clearErrors() {
    appState.set("errors.current", []);
}

/**
 * Clear global data
 */
export function clearGlobalData() {
    appState.update({
        "data.globalData": null,
        "data.isLoaded": false,
        "data.lastModified": null,
        "data.recordCount": 0,
    });
}

/**
 * Get current state value
 * @param {string} path - State path
 * @returns {*} State value
 */
export function getState(path) {
    return appState.get(path);
}

/**
 * Set active tab
 * @param {string} tabId - Active tab identifier
 */
export function setActiveTab(tabId) {
    appState.set("ui.activeTab", tabId);
}

/**
 * Set chart controls visibility
 * @param {boolean} visible - Whether controls are visible
 */
export function setChartControlsVisible(visible) {
    appState.set("charts.controlsVisible", visible);
}

/**
 * Set file opening state
 * @param {boolean} isOpening - Whether file is currently opening
 * @param {string|null} [filePath] - Path to file being opened
 */
export function setFileOpeningState(isOpening, filePath = null) {
    appState.update({
        "file.isOpening": isOpening,
        "file.lastOpened": isOpening ? null : Date.now(),
        "file.path": filePath,
    });
}

/**
 * Set global data (maintains backward compatibility)
 * @param {Object} data - FIT file data
 */
export function setGlobalData(data) {
    /** @type {any} */
    const fitData = data;
    appState.update({
        "data.globalData": data,
        "data.isLoaded": Boolean(data),
        "data.lastModified": Date.now(),
        "data.recordCount": fitData?.recordMesgs?.length || 0,
    });
}

/**
 * Set state value
 * @param {string} path - State path
 * @param {*} value - New value
 */
export function setState(path, value) {
    return appState.set(path, value);
}

/**
 * Set theme
 * @param {string} theme - Theme name
 */
export function setTheme(theme) {
    appState.set("ui.theme", theme);
}

/**
 * Subscribe to state changes with cleanup
 * @param {string} event - Event name or state path
 * @param {Function} callback - Event handler
 * @returns {Function} Cleanup function
 */
export function subscribe(event, callback) {
    return appState.on(event, callback);
}

// Export the state manager instance and constants
export { appState };
export default appState;
