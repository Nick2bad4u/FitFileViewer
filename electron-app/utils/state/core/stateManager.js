/**
 * Centralized State Management System for FitFileViewer
 * Provides reactive state management with event listeners and persistence
 */

/**
 * @typedef {Object} WindowState
 * @property {number} width
 * @property {number} height
 * @property {?number} x
 * @property {?number} y
 * @property {boolean} maximized
 */
/**
 * @typedef {Object} UIState
 * @property {string} activeTab
 * @property {boolean} sidebarCollapsed
 * @property {string} theme
 * @property {boolean} isFullscreen
 * @property {WindowState} windowState
 */
/**
 * @typedef {Object} ChartsState
 * @property {boolean} isRendered
 * @property {boolean} controlsVisible
 * @property {string} selectedChart
 * @property {number} zoomLevel
 * @property {*} chartData
 * @property {Object<string, any>} chartOptions
 */
/**
 * @typedef {Object} MapState
 * @property {boolean} isRendered
 * @property {*} center
 * @property {number} zoom
 * @property {number} selectedLap
 * @property {boolean} showElevationProfile
 * @property {boolean} trackVisible
 * @property {string} baseLayer
 * @property {boolean} measurementMode
 */
/**
 * @typedef {Object} TablesState
 * @property {boolean} isRendered
 * @property {?string} sortColumn
 * @property {string} sortDirection
 * @property {number} pageSize
 * @property {number} currentPage
 * @property {Object<string, any>} filters
 */
/**
 * @typedef {Object} PerformanceState
 * @property {?number} lastLoadTime
 * @property {Object<string, number>} renderTimes
 * @property {?number} memoryUsage
 */
/**
 * @typedef {Object} SystemState
 * @property {?string} version
 * @property {?number} startupTime
 * @property {string} mode
 * @property {boolean} initialized
 */
/**
 * @typedef {Object} AppStateShape
 * @property {{ initialized: boolean, isOpeningFile: boolean, startTime: number }} app
 * @property {*} globalData
 * @property {*} currentFile
 * @property {boolean} isLoading
 * @property {UIState} ui
 * @property {ChartsState} charts
 * @property {MapState} map
 * @property {TablesState} tables
 * @property {PerformanceState} performance
 * @property {SystemState} system
 */
/**
 * Central application state container
 * @type {AppStateShape}
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
},

/**
 * Event listeners for state changes
 * @type {Map<string, Set<Function>>}
 */
 stateListeners = new Map(),

/**
 * State change history for debugging
 * @type {Array<Object>}
 */
 stateHistory = [],

/**
 * Maximum number of state changes to keep in history
 */
 MAX_HISTORY_SIZE = 50;

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
    if (listeners) {
        listeners.add(callback);
    }

    // Return unsubscribe function
    return () => {
        const current = stateListeners.get(path);
        if (!current) {return;}
        current.delete(callback);
        if (current.size === 0) {
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
    if (!path) {return AppState;}

    const keys = path.split(".");
    /** @type {any} */
    let value = AppState;
    for (let i = 0; i < keys.length; i++) {
        const key = /** @type {string} */ (keys[i]);
        if (value == null) {return undefined;}
        const container = /** @type {Record<string, any>} */ (value);
        if (Object.hasOwn(container, key)) {
            value = container[key];
        } else {
            return undefined;
        }
    }
    return value;
}

/**
 * @typedef {Object} StateUpdateOptions
 * @property {boolean} [silent=false] If true, don't notify listeners of this update
 * @property {string} [source="unknown"] Source tag for debugging / history
 * @property {boolean} [merge=false] If true and both old & new values are plain objects, perform a shallow merge
 */

/**
 * Set state value by path and notify listeners
 * @param {string} path - Dot notation path to state property
 * @param {*} value - New value to set
 * @param {StateUpdateOptions} [options] - Optional update options
 */
export function setState(path, value, options = {}) {
    const { silent = false, source = "unknown", merge = false } = options,

    // Get the old value for comparison
     oldValue = getState(path),

    // Set / merge the new value
     keys = path.split(".");
    let target = AppState;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = /** @type {string} */ (keys[i]);
        if (!key) {continue;} // Defensive
        if (typeof target !== "object" || target == null) {break;}
        const container = /** @type {Record<string, any>} */ (target);
        if (
            !Object.hasOwn(container, key) ||
            typeof container[key] !== "object" ||
            container[key] === null
        ) {
            container[key] = {};
        }
        target = container[key];
    }

    const finalKey = keys[keys.length - 1];
    if (typeof finalKey !== "string" || !finalKey) {
        console.warn("[StateManager] Invalid final key for path", path);
        return;
    }
    if (
        merge &&
        typeof oldValue === "object" &&
        oldValue !== null &&
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(oldValue) &&
        !Array.isArray(value)
    ) {
        // Shallow merge
        /** @type {Record<string, any>} */
        (target)[finalKey] = { ...oldValue, ...value };
    } else {
        /** @type {Record<string, any>} */
        (target)[finalKey] = value;
    }

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
 * @param {StateUpdateOptions} [options] - Optional update options
 */
export function updateState(path, updates, options = {}) {
    // Force merge semantics; caller may still override silent/source
    setState(path, updates, { ...options, merge: true });
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
        const parentPath = pathParts.slice(0, i).join("."),
         parentListeners = stateListeners.get(parentPath);

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
        /** @type {any} */
        let target = AppState;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = /** @type {string} */ (keys[i]);
            if (target == null) {return;}
            if (Object.hasOwn(target, k)) {
                target = target[k];
            } else {
                return;
            }
        }
        const finalKey = keys[keys.length - 1];
        if (finalKey && target) {
            const rec = /** @type {Record<string, any>} */ (target);
            if (Object.hasOwn(rec, finalKey)) {
                delete rec[finalKey];
            }
        }
    } else {
        // Reset entire state
        Object.keys(AppState).forEach((key) => {
            delete (/** @type {any} */ (AppState)[key]);
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
 * TEST-ONLY: Clear all registered state listeners.
 * This helps ensure unit tests don't leak subscriptions across suites.
 */
export function __clearAllListenersForTests() {
    try {
        stateListeners.clear();
        console.log("[StateManager] All listeners cleared (tests)");
    } catch (error) {
        console.warn("[StateManager] Failed to clear listeners:", error);
    }
}

/**
 * TEST-ONLY: Fully reset the state manager.
 * - Clears all listeners
 * - Clears history
 * - Resets AppState to initial values
 */
export function __resetStateManagerForTests() {
    try {
        __clearAllListenersForTests();
    } catch {}
    try {
        clearStateHistory();
    } catch {}
    try {
        resetState();
    } catch {}
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
        if (!savedState) {return;}

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
    /** @type {any} */
    let target = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = /** @type {string} */ (keys[i]);
        if (!key) {continue;}
        if (target == null || typeof target !== "object") {return;}
        const container = /** @type {Record<string, any>} */ (target);
        if (
            !Object.hasOwn(container, key) ||
            typeof container[key] !== "object" ||
            container[key] === null
        ) {
            container[key] = {};
        }
        target = container[key];
    }
    const finalKey = keys[keys.length - 1];
    if (finalKey && target != null && typeof target === "object") {
        /** @type {Record<string, any>} */ (target)[finalKey] = value;
    }
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
    /** @type {any} */
    let value = obj;
    for (let i = 0; i < keys.length; i++) {
        const key = /** @type {string} */ (keys[i]);
        if (value == null) {return undefined;}
        const container = /** @type {Record<string, any>} */ (value);
        if (Object.hasOwn(container, key)) {
            value = container[key];
        } else {
            return undefined;
        }
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
            const currentValue = /** @type {any} */ (window)[propertyName];
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
