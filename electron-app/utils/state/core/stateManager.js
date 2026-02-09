import { AppState } from "./stateManagerDefaults.js";
import {
    clearStateHistory,
    getStateHistory,
    stateHistory,
} from "./stateManagerHistory.js";
import { getNestedValue, setNestedValue } from "./stateManagerPathUtils.js";
import { resetState } from "./stateManagerReset.js";
/**
 * Centralized State Management System for FitFileViewer Provides reactive state
 * management with event listeners and persistence
 */
/**
 * Maximum number of state changes to keep in history
 */
const MAX_HISTORY_SIZE = 50;
/**
 * Event listeners for state changes
 *
 * @type {Map<string, Set<Function>>}
 */
const stateListeners = new Map();
/**
 * Event listeners for state changes subscriptions
 *
 * @type {{ initialized: boolean }}
 */
const stateManagerInitState = { initialized: false };

/**
 * TEST-ONLY: Clear all registered state listeners. This helps ensure unit tests
 * don't leak subscriptions across suites.
 */
function __clearAllListenersForTests() {
    try {
        stateListeners.clear();
        console.log("[StateManager] All listeners cleared (tests)");
    } catch (error) {
        console.warn("[StateManager] Failed to clear listeners:", error);
    }
}

/**
 * TEST-ONLY: Fully reset the state manager.
 *
 * - Clears all listeners
 * - Clears history
 * - Resets AppState to initial values
 */
function __resetStateManagerForTests() {
    try {
        __clearAllListenersForTests();
    } catch {
        /* Ignore errors */
    }
    try {
        clearStateHistory();
    } catch {
        /* Ignore errors */
    }
    try {
        resetState();
    } catch {
        /* Ignore errors */
    }
    stateManagerInitState.initialized = false;
}

/**
 * Create a reactive property on the global object that maps to a state path.
 *
 * @param {string} propertyName
 * @param {string} statePath
 */
function createReactiveProperty(propertyName, statePath) {
    try {
        const descriptor = Object.getOwnPropertyDescriptor(
            globalThis,
            propertyName
        );
        if (descriptor) {
            // If property exists, check if it's already reactive
            if (descriptor.get && descriptor.set) {
                console.log(
                    `[StateManager] Property ${propertyName} is already reactive`
                );
                return;
            }

            // If it exists but isn't reactive, preserve the current value
            const currentValue = /** @type {any} */ (window)[propertyName];
            if (currentValue !== undefined && currentValue !== null) {
                setState(statePath, currentValue, {
                    source: `createReactiveProperty.${propertyName}`,
                });
            }
        }

        Object.defineProperty(globalThis, propertyName, {
            configurable: true,
            get() {
                return getState(statePath);
            },
            set(value) {
                setState(statePath, value, {
                    source: `window.${propertyName}`,
                });
            },
        });

        console.log(
            `[StateManager] Created reactive property: ${propertyName} -> ${statePath}`
        );
    } catch (error) {
        console.warn(
            `[StateManager] Failed to create reactive property ${propertyName}:`,
            error
        );
        // Fallback: just ensure the state path exists
        if (getState(statePath) === undefined) {
            setState(statePath, null, {
                source: `createReactiveProperty.fallback.${propertyName}`,
            });
        }
    }
}

/**
 * Get state value by path
 *
 * @param {string} path - Dot notation path to state property
 *
 * @returns {any} State value
 */
function getState(path) {
    if (!path) {
        return AppState;
    }

    const keys = path.split(".");
    /** @type {any} */
    let value = AppState;
    for (const key of keys) {
        if (value == null) {
            return;
        }
        const container = /** @type {Record<string, any>} */ (value);
        if (Object.hasOwn(container, key)) {
            value = container[key];
        } else {
            return;
        }
    }
    return value;
}

/**
 * Get subscription information for debugging
 *
 * @returns {Object} Subscription information
 */
function getSubscriptions() {
    const subscriptionInfo = {
        paths: Array.from(stateListeners.keys()),
        totalListeners: 0,
        subscriptionDetails: {},
    };

    for (const [path, listeners] of stateListeners.entries()) {
        const listenerCount = listeners.size;
        subscriptionInfo.totalListeners += listenerCount;
        subscriptionInfo.subscriptionDetails[path] = {
            listenerCount,
            hasListeners: listenerCount > 0,
        };
    }

    return subscriptionInfo;
}

/**
 * Initialize state manager with default reactive properties
 */
function initializeStateManager() {
    if (stateManagerInitState.initialized) {
        console.log(
            "[StateManager] initializeStateManager invoked multiple times; ignoring subsequent calls"
        );
        return;
    }

    // Create reactive properties for backward compatibility
    createReactiveProperty("globalData", "globalData");
    createReactiveProperty("isChartRendered", "charts.isRendered");

    // Load persisted state
    loadPersistedState();

    // Set up auto-persistence on certain state changes
    subscribe("ui", () => persistState(["ui"]));
    subscribe("charts.controlsVisible", () =>
        persistState(["charts.controlsVisible"])
    );
    subscribe("map.baseLayer", () => persistState(["map.baseLayer"]));
    // Browser tab: persist selected sub-view (files/library/calendar)
    subscribe("browser.view", () => persistState(["browser.view"]));

    stateManagerInitState.initialized = true;

    console.log(
        "[StateManager] Initialized with reactive properties and persistence"
    );
}

/**
 * Load persisted state from localStorage
 *
 * @param {string[]} paths - Array of state paths to load
 */
function loadPersistedState(
    paths = [
        "ui",
        "charts.controlsVisible",
        "map.baseLayer",
        "browser.view",
    ]
) {
    try {
        const savedState = localStorage.getItem("fitFileViewer_state");
        if (!savedState) {
            return;
        }

        const parsedState = JSON.parse(savedState);

        for (const path of paths) {
            const value = getNestedValue(parsedState, path);
            if (value !== undefined) {
                setState(path, value, { silent: true, source: "localStorage" });
            }
        }

        console.log("[StateManager] State loaded from localStorage");
    } catch (error) {
        console.error("[StateManager] Failed to load persisted state:", error);
    }
}

/**
 * Notify all listeners for a given path and its parent paths
 *
 * @private
 *
 * @param {string} path - State path that changed
 * @param {any} newValue - New value
 * @param {any} oldValue - Previous value
 */
function notifyListeners(path, newValue, oldValue) {
    // Notify exact path listeners
    const exactListeners = stateListeners.get(path);
    if (exactListeners) {
        for (const callback of exactListeners) {
            try {
                callback(newValue, oldValue, path);
            } catch (error) {
                console.error(
                    `[StateManager] Error in listener for ${path}:`,
                    error
                );
            }
        }
    }

    // Notify parent path listeners
    const pathParts = path.split(".");
    for (let i = pathParts.length - 1; i > 0; i--) {
        const parentPath = pathParts.slice(0, i).join("."),
            parentListeners = stateListeners.get(parentPath);

        if (parentListeners) {
            const parentValue = getState(parentPath);
            for (const callback of parentListeners) {
                try {
                    callback(parentValue, parentValue, parentPath);
                } catch (error) {
                    console.error(
                        `[StateManager] Error in parent listener for ${parentPath}:`,
                        error
                    );
                }
            }
        }
    }
}

/**
 * Persist state to localStorage
 *
 * @param {string[]} paths - Array of state paths to persist
 */
function persistState(
    paths = [
        "ui",
        "charts.controlsVisible",
        "map.baseLayer",
        "browser.view",
    ]
) {
    /** @type {Record<string, unknown>} */
    let stateToSave = {};

    // Merge into existing persisted state so persisting a single path does not
    // wipe other persisted paths.
    try {
        const existingRaw = localStorage.getItem("fitFileViewer_state");
        if (existingRaw) {
            const parsed = JSON.parse(existingRaw);
            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                stateToSave = /** @type {Record<string, unknown>} */ (parsed);
            }
        }
    } catch {
        // Ignore parse errors and overwrite with a fresh object.
        stateToSave = {};
    }

    for (const path of paths) {
        const value = getState(path);
        if (value !== undefined) {
            setNestedValue(stateToSave, path, value);
        }
    }

    try {
        localStorage.setItem(
            "fitFileViewer_state",
            JSON.stringify(stateToSave)
        );
        console.log("[StateManager] State persisted to localStorage");
    } catch (error) {
        console.error("[StateManager] Failed to persist state:", error);
    }
}

/**
 * Set state value by path and notify listeners
 *
 * @param {string} path - Dot notation path to state property
 * @param {any} value - New value to set
 * @param {StateUpdateOptions} [options] - Optional update options
 */
function setState(path, value, options = {}) {
    const keys = path.split(".");
    const oldValue = getState(path);
    const { merge = false, silent = false, source = "unknown" } = options;
    let target = AppState;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = /** @type {string} */ (keys[i]);
        if (!key) {
            continue;
        }
        if (typeof target !== "object" || target == null) {
            break;
        }
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

    const finalKey = keys.at(-1);
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
        /** @type {Record<string, any>} */
        (target)[finalKey] = { ...oldValue, ...value };
    } else {
        /** @type {Record<string, any>} */
        (target)[finalKey] = value;
    }

    const hasChanged = !Object.is(oldValue, value);

    if (hasChanged) {
        if (stateHistory.length >= MAX_HISTORY_SIZE) {
            stateHistory.shift();
        }

        stateHistory.push({
            newValue: value,
            oldValue,
            path,
            source,
            timestamp: Date.now(),
        });
    }

    if (!silent && hasChanged) {
        notifyListeners(path, value, oldValue);
    }

    if (hasChanged || source.includes("dev") || source.includes("debug")) {
        console.log(`[StateManager] ${path} updated by ${source}:`, {
            newValue: value,
            oldValue,
        });
    }
}

/**
 * Subscribe to state changes for a specific path
 *
 * @param {string} path - Dot notation path to state property (e.g.,
 *   'ui.activeTab')
 * @param {Function} callback - Function to call when state changes
 *
 * @returns {Function} Unsubscribe function
 */
function subscribe(path, callback) {
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
        if (!current) {
            return;
        }
        current.delete(callback);
        if (current.size === 0) {
            stateListeners.delete(path);
        }
    };
}

/**
 * Subscribe to state changes ensuring there is only one active subscription for
 * a given id.
 *
 * This is intended for UI initializers that may run multiple times due to
 * re-renders. It prevents leaking subscriptions across map/tab rebuilds.
 *
 * @param {string} path - Dot notation path to state property (e.g.,
 *   'ui.activeTab')
 * @param {string} id - Unique identifier for this subscription (e.g.,
 *   'tabs:activeTab')
 * @param {Function} callback - Function to call when state changes
 *
 * @returns {Function} Unsubscribe function
 */
function subscribeSingleton(path, id, callback) {
    /** @type {any} */
    const g = /** @type {any} */ (globalThis);
    if (
        !g.__ffvSingletonStateSubscriptions ||
        typeof g.__ffvSingletonStateSubscriptions !== "object"
    ) {
        g.__ffvSingletonStateSubscriptions = Object.create(null);
    }

    const registry = /** @type {Record<string, Function>} */ (
        g.__ffvSingletonStateSubscriptions
    );
    const key = typeof id === "string" ? id.trim() : "";

    if (!key) {
        // Fall back to normal subscription if caller didn't provide an id
        return subscribe(path, callback);
    }

    // Best-effort unsubscribe any existing subscription for this id
    try {
        if (typeof registry[key] === "function") {
            registry[key]();
        }
    } catch {
        /* ignore */
    }

    const unsubscribe = subscribe(path, callback);
    registry[key] = unsubscribe;

    return () => {
        try {
            // Only delete if we're still the current subscription for this id
            if (registry[key] === unsubscribe) {
                delete registry[key];
            }
        } catch {
            /* ignore */
        }
        unsubscribe();
    };
}

/**
 * Update state by merging with existing object
 *
 * @param {string} path - Dot notation path to state property
 * @param {Object} updates - Object to merge with existing state
 * @param {StateUpdateOptions} [options] - Optional update options
 */
function updateState(path, updates, options = {}) {
    // Force merge semantics; caller may still override silent/source
    setState(path, updates, { ...options, merge: true });
}

// Debug state object
const __debugState = AppState;

// Export all functions using ES6 named exports

export { __clearAllListenersForTests };
export { __debugState };
export { __resetStateManagerForTests };
export { clearStateHistory };
export { createReactiveProperty };
export { getState };
export { getStateHistory };
export { getSubscriptions };
export { initializeStateManager };
export { loadPersistedState };
export { persistState };
export { resetState };
export { setState };
export { subscribe };
export { subscribeSingleton };
export { updateState };

try {
    const g = /** @type {any} */ (
        typeof globalThis === "object" ? globalThis : undefined
    );
    if (g && typeof g === "object") {
        const api = {
            __clearAllListenersForTests,
            __debugState,
            __resetStateManagerForTests,
            clearStateHistory,
            createReactiveProperty,
            getState,
            getStateHistory,
            getSubscriptions,
            initializeStateManager,
            loadPersistedState,
            persistState,
            resetState,
            setState,
            subscribe,
            subscribeSingleton,
            updateState,
        };

        if (
            !g.__STATE_MANAGER_API__ ||
            typeof g.__STATE_MANAGER_API__ !== "object"
        ) {
            Object.defineProperty(g, "__STATE_MANAGER_API__", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: api,
            });
        } else {
            Object.assign(g.__STATE_MANAGER_API__, api);
        }
    }
} catch {
    /* ignore global exposure errors */
}
