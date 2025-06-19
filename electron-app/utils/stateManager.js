/**
 * Centralized State Management System for FitFileViewer
 * Provides reactive state management with event listeners and persistence
 */

/**
 * Central application state container
 * @type {Object}
 */
const AppState = {
    // Application lifecycle state
    app: {
        initialized: false,
        isOpeningFile: false,
        startTime: performance.now(),
    },

    // Core application data
    globalData: null,
    currentFile: null,
    isLoading: false,

    // UI state
    ui: {
        activeTab: "summary",
        sidebarCollapsed: false,
        theme: "system",
        isFullscreen: false,
        windowState: {
            width: 1200,
            height: 800,
            x: null,
            y: null,
            maximized: false,
        },
    },

    // Chart state
    charts: {
        isRendered: false,
        controlsVisible: true,
        selectedChart: "elevation",
        zoomLevel: 1,
        chartData: null,
        chartOptions: {},
    },

    // Map state
    map: {
        isRendered: false,
        center: null,
        zoom: 13,
        selectedLap: 0,
        showElevationProfile: true,
        trackVisible: true,
        baseLayer: "openstreetmap",
        measurementMode: false,
    },

    // Table state
    tables: {
        isRendered: false,
        sortColumn: null,
        sortDirection: "asc",
        pageSize: 50,
        currentPage: 1,
        filters: {},
    },
    // Performance metrics
    performance: {
        lastLoadTime: null,
        renderTimes: {},
        memoryUsage: null,
    },

    // System information
    system: {
        version: null,
        startupTime: null,
        mode: "production",
        initialized: false,
    },
};

/**
 * Event listeners for state changes
 * @type {Map<string, Set<Function>>}
 */
const stateListeners = new Map();

/**
 * State change history for debugging
 * @type {Array<Object>}
 */
const stateHistory = [];

/**
 * Maximum number of state changes to keep in history
 */
const MAX_HISTORY_SIZE = 50;

/**
 * Subscribe to state changes for a specific path
 * @param {string} path - Dot notation path to state property (e.g., 'ui.activeTab')
 * @param {Function} callback - Function to call when state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribe(path, callback) {
    if (!stateListeners.has(path)) {
        stateListeners.set(path, new Set());
    }

    const listeners = stateListeners.get(path);
    listeners.add(callback);

    // Return unsubscribe function
    return () => {
        listeners.delete(callback);
        if (listeners.size === 0) {
            stateListeners.delete(path);
        }
    };
}

/**
 * Get state value by path
 * @param {string} path - Dot notation path to state property
 * @returns {*} State value
 */
export function getState(path) {
    if (!path) return AppState;

    const keys = path.split(".");
    let value = AppState;

    for (const key of keys) {
        if (value === null || value === undefined) {
            return undefined;
        }
        value = value[key];
    }

    return value;
}

/**
 * Set state value by path and notify listeners
 * @param {string} path - Dot notation path to state property
 * @param {*} value - New value to set
 * @param {Object} options - Options for state update
 * @param {boolean} options.silent - If true, don't notify listeners
 * @param {string} options.source - Source of the state change for debugging
 */
export function setState(path, value, options = {}) {
    const { silent = false, source = "unknown" } = options;

    // Get the old value for comparison
    const oldValue = getState(path);

    // Set the new value
    const keys = path.split(".");
    let target = AppState;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in target) || typeof target[key] !== "object") {
            target[key] = {};
        }
        target = target[key];
    }

    const finalKey = keys[keys.length - 1];
    target[finalKey] = value;

    // Add to history
    if (stateHistory.length >= MAX_HISTORY_SIZE) {
        stateHistory.shift();
    }

    stateHistory.push({
        timestamp: Date.now(),
        path,
        oldValue,
        newValue: value,
        source,
    });

    // Notify listeners if not silent
    if (!silent) {
        notifyListeners(path, value, oldValue);
    }

    console.log(`[StateManager] ${path} updated by ${source}:`, { oldValue, newValue: value });
}

/**
 * Update state by merging with existing object
 * @param {string} path - Dot notation path to state property
 * @param {Object} updates - Object to merge with existing state
 * @param {Object} options - Options for state update
 */
export function updateState(path, updates, options = {}) {
    const currentValue = getState(path);

    if (typeof currentValue === "object" && currentValue !== null) {
        const newValue = { ...currentValue, ...updates };
        setState(path, newValue, options);
    } else {
        setState(path, updates, options);
    }
}

/**
 * Notify all listeners for a given path and its parent paths
 * @private
 * @param {string} path - State path that changed
 * @param {*} newValue - New value
 * @param {*} oldValue - Previous value
 */
function notifyListeners(path, newValue, oldValue) {
    // Notify exact path listeners
    const exactListeners = stateListeners.get(path);
    if (exactListeners) {
        exactListeners.forEach((callback) => {
            try {
                callback(newValue, oldValue, path);
            } catch (error) {
                console.error(`[StateManager] Error in listener for ${path}:`, error);
            }
        });
    }

    // Notify parent path listeners
    const pathParts = path.split(".");
    for (let i = pathParts.length - 1; i > 0; i--) {
        const parentPath = pathParts.slice(0, i).join(".");
        const parentListeners = stateListeners.get(parentPath);

        if (parentListeners) {
            const parentValue = getState(parentPath);
            parentListeners.forEach((callback) => {
                try {
                    callback(parentValue, parentValue, parentPath);
                } catch (error) {
                    console.error(`[StateManager] Error in parent listener for ${parentPath}:`, error);
                }
            });
        }
    }
}

/**
 * Reset state to initial values
 * @param {string} [path] - Optional path to reset only part of state
 */
export function resetState(path) {
    if (path) {
        const keys = path.split(".");
        let target = AppState;

        for (let i = 0; i < keys.length - 1; i++) {
            target = target[keys[i]];
            if (!target) return;
        }

        const finalKey = keys[keys.length - 1];
        if (finalKey in target) {
            delete target[finalKey];
        }
    } else {
        // Reset entire state
        Object.keys(AppState).forEach((key) => {
            delete AppState[key];
        });

        // Restore initial structure
        Object.assign(AppState, {
            globalData: null,
            currentFile: null,
            isLoading: false,
            ui: {
                activeTab: "summary",
                sidebarCollapsed: false,
                theme: "system",
                isFullscreen: false,
                windowState: {
                    width: 1200,
                    height: 800,
                    x: null,
                    y: null,
                    maximized: false,
                },
            },
            charts: {
                isRendered: false,
                controlsVisible: true,
                selectedChart: "elevation",
                zoomLevel: 1,
                chartData: null,
                chartOptions: {},
            },
            map: {
                isRendered: false,
                center: null,
                zoom: 13,
                selectedLap: 0,
                showElevationProfile: true,
                trackVisible: true,
                baseLayer: "openstreetmap",
                measurementMode: false,
            },
            tables: {
                isRendered: false,
                sortColumn: null,
                sortDirection: "asc",
                pageSize: 50,
                currentPage: 1,
                filters: {},
            },
            performance: {
                lastLoadTime: null,
                renderTimes: {},
                memoryUsage: null,
            },
        });
    }

    console.log(`[StateManager] State reset: ${path || "all"}`);
}

/**
 * Get state change history for debugging
 * @returns {Array<Object>} Array of state changes
 */
export function getStateHistory() {
    return [...stateHistory];
}

/**
 * Clear state change history
 */
export function clearStateHistory() {
    stateHistory.length = 0;
    console.log("[StateManager] State history cleared");
}

/**
 * Persist state to localStorage
 * @param {Array<string>} paths - Array of state paths to persist
 */
export function persistState(paths = ["ui", "charts.controlsVisible", "map.baseLayer"]) {
    const stateToSave = {};

    paths.forEach((path) => {
        const value = getState(path);
        if (value !== undefined) {
            setNestedValue(stateToSave, path, value);
        }
    });

    try {
        localStorage.setItem("fitFileViewer_state", JSON.stringify(stateToSave));
        console.log("[StateManager] State persisted to localStorage");
    } catch (error) {
        console.error("[StateManager] Failed to persist state:", error);
    }
}

/**
 * Load persisted state from localStorage
 * @param {Array<string>} paths - Array of state paths to load
 */
export function loadPersistedState(paths = ["ui", "charts.controlsVisible", "map.baseLayer"]) {
    try {
        const savedState = localStorage.getItem("fitFileViewer_state");
        if (!savedState) return;

        const parsedState = JSON.parse(savedState);

        paths.forEach((path) => {
            const value = getNestedValue(parsedState, path);
            if (value !== undefined) {
                setState(path, value, { source: "localStorage", silent: true });
            }
        });

        console.log("[StateManager] State loaded from localStorage");
    } catch (error) {
        console.error("[StateManager] Failed to load persisted state:", error);
    }
}

/**
 * Helper function to set nested value in object
 * @private
 * @param {Object} obj - Target object
 * @param {string} path - Dot notation path
 * @param {*} value - Value to set
 */
function setNestedValue(obj, path, value) {
    const keys = path.split(".");
    let target = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in target) || typeof target[key] !== "object") {
            target[key] = {};
        }
        target = target[key];
    }

    target[keys[keys.length - 1]] = value;
}

/**
 * Helper function to get nested value from object
 * @private
 * @param {Object} obj - Source object
 * @param {string} path - Dot notation path
 * @returns {*} Value at path
 */
function getNestedValue(obj, path) {
    const keys = path.split(".");
    let value = obj;

    for (const key of keys) {
        if (value === null || value === undefined) {
            return undefined;
        }
        value = value[key];
    }

    return value;
}

/**
 * Create reactive property on window object for backward compatibility
 * @param {string} propertyName - Name of the property to create
 * @param {string} statePath - Path in state to bind to
 */
export function createReactiveProperty(propertyName, statePath) {
    try {
        // Check if property already exists
        const descriptor = Object.getOwnPropertyDescriptor(window, propertyName);

        if (descriptor) {
            // If property exists, check if it's already reactive
            if (descriptor.get && descriptor.set) {
                console.log(`[StateManager] Property ${propertyName} is already reactive`);
                return;
            }

            // If it exists but isn't reactive, preserve the current value
            const currentValue = window[propertyName];
            if (currentValue !== undefined && currentValue !== null) {
                setState(statePath, currentValue, { source: `createReactiveProperty.${propertyName}` });
            }
        }

        Object.defineProperty(window, propertyName, {
            get() {
                return getState(statePath);
            },
            set(value) {
                setState(statePath, value, { source: `window.${propertyName}` });
            },
            configurable: true,
        });

        console.log(`[StateManager] Created reactive property: ${propertyName} -> ${statePath}`);
    } catch (error) {
        console.warn(`[StateManager] Failed to create reactive property ${propertyName}:`, error);
        // Fallback: just ensure the state path exists
        if (getState(statePath) === undefined) {
            setState(statePath, null, { source: `createReactiveProperty.fallback.${propertyName}` });
        }
    }
}

/**
 * Initialize state manager with default reactive properties
 */
export function initializeStateManager() {
    // Create reactive properties for backward compatibility
    createReactiveProperty("globalData", "globalData");
    createReactiveProperty("isChartRendered", "charts.isRendered");

    // Load persisted state
    loadPersistedState();

    // Set up auto-persistence on certain state changes
    subscribe("ui", () => persistState(["ui"]));
    subscribe("charts.controlsVisible", () => persistState(["charts.controlsVisible"]));
    subscribe("map.baseLayer", () => persistState(["map.baseLayer"]));

    console.log("[StateManager] Initialized with reactive properties and persistence");
}

// Export the raw state for debugging (read-only)
export const __debugState = AppState;
