/**
 * State Integration Utilities
 * Helps migrate from existing state patterns to the new centralized system
 */

import { getState, initializeStateManager, setState, subscribe } from "../core/stateManager.js";
import { AppActions } from "../../app/lifecycle/appActions.js";
import { uiStateManager } from "../domain/uiStateManager.js";

/**
 * @typedef {Object} DebugUtilities
 * @property {Function} getState - Get state by path
 * @property {Function} setState - Set state value
 * @property {Object} AppActions - Application action functions
 * @property {Object} uiStateManager - UI state manager
 * @property {Function} logState - Log current state
 * @property {Function} watchState - Watch state changes
 * @property {Function} triggerAction - Trigger state action
 */

/**
 * @typedef {Object} AppStateMigration
 * @property {Function[]} migrations - Array of migration functions
 */

/**
 * Detects if the application is running in development mode
 * Since process is not available in renderer, we use alternative methods
 * @returns {boolean} True if in development mode
 */
function isDevelopmentMode() {
    // Guarded access for jsdom/mocked environments
    try {
        const loc = /** @type {any} */ (typeof window !== "undefined" ? window.location : undefined) || {};
        const hostname = typeof loc.hostname === "string" ? loc.hostname : "";
        const search = typeof loc.search === "string" ? loc.search : "";
        const hash = typeof loc.hash === "string" ? loc.hash : "";
        const protocol = typeof loc.protocol === "string" ? loc.protocol : "";
        const href = typeof loc.href === "string" ? loc.href : "";

        return (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            (hostname && hostname.includes("dev")) ||
            /** @type {any} */ (window).__DEVELOPMENT__ === true ||
            (search && search.includes("debug=true")) ||
            (hash && hash.includes("debug")) ||
            (typeof document !== "undefined" &&
                document.documentElement &&
                document.documentElement.hasAttribute("data-dev-mode")) ||
            protocol === "file:" ||
            /** @type {any} */ (
                typeof window !== "undefined" &&
                    window.electronAPI &&
                    typeof (/** @type {any} */ (window).electronAPI.__devMode) !== "undefined"
            ) ||
            (typeof console !== "undefined" && typeof href === "string" && href.includes("electron"))
        );
    } catch {
        // Default to non-dev on any unexpected error
        return false;
    }
}

/**
 * Initialize the complete state management system
 * Call this once during application startup
 */
export function initializeAppState() {
    console.log("[StateIntegration] Initializing application state management...");

    // Initialize core state manager
    initializeStateManager();
    // Initialize UI state manager
    uiStateManager.initialize();

    // Set up backward compatibility
    setupBackwardCompatibility();

    // Set up state debugging in development
    if (isDevelopmentMode()) {
        setupStateDebugging();
    }

    console.log("[StateIntegration] Application state management initialized");
}

/**
 * Set up backward compatibility with existing state patterns
 */
function setupBackwardCompatibility() {
    // Make sure window.globalData is reactive
    if (!Object.getOwnPropertyDescriptor(window, "globalData")) {
        Object.defineProperty(window, "globalData", {
            get() {
                return getState("globalData");
            },
            set(value) {
                setState("globalData", value, { source: "window.globalData" });
            },
            configurable: true,
        });
    }

    // Make sure window.isChartRendered is reactive
    if (!Object.getOwnPropertyDescriptor(window, "isChartRendered")) {
        Object.defineProperty(window, "isChartRendered", {
            get() {
                return getState("charts.isRendered");
            },
            set(value) {
                setState("charts.isRendered", value, { source: "window.isChartRendered" });
            },
            configurable: true,
        });
    }

    // Create compatibility layer for existing AppState usage
    if (!(/** @type {any} */ (window).AppState)) {
        /** @type {any} */ (window).AppState = {
            get globalData() {
                return getState("globalData");
            },
            set globalData(value) {
                setState("globalData", value, { source: "AppState.globalData" });
            },
            get isChartRendered() {
                return getState("charts.isRendered");
            },
            set isChartRendered(value) {
                setState("charts.isRendered", value, { source: "AppState.isChartRendered" });
            },
            get eventListeners() {
                return getState("eventListeners") || new Map();
            },
            set eventListeners(value) {
                setState("eventListeners", value, { source: "AppState.eventListeners" });
            },
        };
    }

    console.log("[StateIntegration] Backward compatibility layer established");
}

/**
 * Set up state debugging utilities
 */
/**
 * Sets up debug utilities for development mode
 */
function setupStateDebugging() {
    // Add debug utilities to window
    /** @type {DebugUtilities} */
    const debugUtilities = {
        getState,
        setState,
        AppActions,
        uiStateManager,

        // Utility to log current state
        /**
         * @param {string} [path] - Optional state path
         * @returns {*} Current state
         */
        logState(path) {
            const state = path ? getState(path) : getState("data");
            console.log(`[StateDebug] Current state${path ? ` for ${path}` : ""}:`, state);
            return state;
        },

        // Utility to watch state changes
        /**
         * @param {string} path - State path to watch
         * @returns {Function} Unsubscribe function
         */
        watchState(path) {
            console.log(`[StateDebug] Watching state changes for: ${path}`);
            return subscribe(
                path,
                /** @param {*} newValue */ /** @param {*} oldValue */ (/** @type {any} */ newValue, oldValue) => {
                    console.log(`[StateDebug] ${path} changed:`, { oldValue, newValue });
                }
            );
        },

        // Utility to trigger state actions
        /**
         * @param {string} actionName - Name of action to trigger
         * @param {...*} args - Action arguments
         * @returns {*} Action result
         */
        triggerAction(actionName, ...args) {
            /** @type {any} */
            const actions = AppActions;
            if (actions[actionName]) {
                console.log(`[StateDebug] Triggering action: ${actionName}`, args);
                return actions[actionName](...args);
            }
            console.warn(`[StateDebug] Unknown action: ${actionName}`);
            return undefined;
        },
    };

    // @ts-ignore - Debug utilities assignment to window
    window.__state_debug = debugUtilities;
}

/**
 * Migration helper to convert old state patterns to new system
 */
export class StateMigrationHelper {
    constructor() {
        /** @type {Function[]} */
        this.migrations = [];
    }

    /**
     * Add a migration function
     * @param {Function} migrationFn - Function to run migration
     */
    addMigration(migrationFn) {
        this.migrations.push(migrationFn);
    }

    /**
     * Run all migrations
     */
    async runMigrations() {
        console.log("[StateMigration] Running state migrations...");

        for (const migration of this.migrations) {
            try {
                await migration();
            } catch (error) {
                console.error("[StateMigration] Migration failed:", error);
            }
        }

        console.log("[StateMigration] All migrations completed");
    }
}

/**
 * Helper to convert existing chartControlsState to new system
 */
export function migrateChartControlsState() {
    // Check if old chartControlsState exists
    if (/** @type {any} */ (window).chartControlsState) {
        console.log("[StateMigration] Migrating chartControlsState...");
        // Copy existing state
        setState("charts.controlsVisible", /** @type {any} */ (window).chartControlsState.isVisible, {
            source: "migration",
        });

        // Replace old state with getter/setter
        /** @type {any} */ (window).chartControlsState = {
            get isVisible() {
                return getState("charts.controlsVisible");
            },
            set isVisible(value) {
                setState("charts.controlsVisible", value, { source: "chartControlsState" });
            },
        };

        console.log("[StateMigration] chartControlsState migrated");
    }
}

/**
 * Helper to integrate with existing renderer utilities
 */
export function integrateWithRendererUtils() {
    // If rendererUtils exists and has state management, integrate it
    if (/** @type {any} */ (window).rendererUtils) {
        console.log("[StateIntegration] Integrating with rendererUtils...");

        // Wrap existing functions to use new state system
        const originalUtils = { .../** @type {any} */ (window).rendererUtils };

        // Example: if there's a setGlobalData function
        if (originalUtils.setGlobalData) {
            /**
             * @param {Object} data - Global data to set
             */
            /** @type {any} */ (window).rendererUtils.setGlobalData = (/** @type {Object} */ data) => {
                setState("globalData", data, { source: "rendererUtils.setGlobalData" });
                return originalUtils.setGlobalData(data);
            };
        }

        // Example: if there's a getGlobalData function
        if (originalUtils.getGlobalData) {
            /** @type {any} */ (window).rendererUtils.getGlobalData = () => getState("globalData");
        }

        console.log("[StateIntegration] rendererUtils integration completed");
    }
}

/**
 * Set up state persistence for important UI state
 */
export function setupStatePersistence() {
    // Define which state paths should be persisted
    const persistedPaths = [
        "ui.theme",
        "ui.sidebarCollapsed",
        "charts.controlsVisible",
        "charts.selectedChart",
        "map.baseLayer",
        "map.showElevationProfile",
        "tables.pageSize",
    ];

    // Set up auto-persistence for these paths
    persistedPaths.forEach((path) => {
        subscribe(path, () => {
            // Debounce the persistence to avoid excessive writes
            clearTimeout(/** @type {any} */ (window).__persistenceTimeout);
            /** @type {any} */ (window).__persistenceTimeout = setTimeout(() => {
                try {
                    const stateToSave = {};
                    persistedPaths.forEach((p) => {
                        const value = getState(p);
                        if (value !== undefined) {
                            setNestedValue(stateToSave, p, value);
                        }
                    });

                    localStorage.setItem("fitFileViewer_uiState", JSON.stringify(stateToSave));
                    console.log("[StateIntegration] UI state persisted to localStorage");
                } catch (error) {
                    console.error("[StateIntegration] Failed to persist state:", error);
                }
            }, 500);
        });
    });

    // Load persisted state on initialization
    try {
        const savedState = localStorage.getItem("fitFileViewer_uiState");
        if (savedState) {
            const parsedState = JSON.parse(savedState);

            persistedPaths.forEach((path) => {
                const value = getNestedValue(parsedState, path);
                if (value !== undefined) {
                    setState(path, value, { source: "localStorage", silent: true });
                }
            });

            console.log("[StateIntegration] UI state loaded from localStorage");
        }
    } catch (error) {
        console.error("[StateIntegration] Failed to load persisted state:", error);
    }
}

/**
 * Helper function to set nested value in object
 * @param {Object} obj - Target object
 * @param {string} path - Dot notation path
 * @param {*} value - Value to set
 * @private
 */
function setNestedValue(obj, path, value) {
    const keys = path.split(".");
    /** @type {any} */
    let target = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key && (!(key in target) || typeof target[key] !== "object")) {
            target[key] = {};
        }
        if (key) {
            target = target[key];
        }
    }

    const finalKey = keys[keys.length - 1];
    if (finalKey) {
        target[finalKey] = value;
    }
}

/**
 * Helper function to get nested value from object
 * @param {Object} obj - Source object
 * @param {string} path - Dot notation path
 * @returns {*} Retrieved value
 * @private
 */
function getNestedValue(obj, path) {
    const keys = path.split(".");
    /** @type {any} */
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
 * Set up performance monitoring for state changes
 */
export function setupStatePerformanceMonitoring() {
    let stateChangeCount = 0,
        lastResetTime = Date.now();

    // Monitor state change frequency
    subscribe("", () => {
        stateChangeCount++;

        // Reset counter every minute and log stats
        const now = Date.now();
        if (now - lastResetTime > 60000) {
            console.log(`[StatePerformance] ${stateChangeCount} state changes in the last minute`);
            stateChangeCount = 0;
            lastResetTime = now;
        }
    });

    // Monitor memory usage periodically
    /** @type {any} */
    const perfMemory = performance;
    if (perfMemory.memory) {
        setInterval(() => {
            const memoryInfo = {
                used: Math.round(perfMemory.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(perfMemory.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(perfMemory.memory.jsHeapSizeLimit / 1024 / 1024),
            };

            setState("performance.memoryUsage", memoryInfo, {
                source: "performanceMonitoring",
                silent: true,
            });
        }, 30000); // Update every 30 seconds
    }
}

// Export a single function to initialize everything
export function initializeCompleteStateSystem() {
    initializeAppState();
    migrateChartControlsState();
    integrateWithRendererUtils();
    setupStatePersistence();
    setupStatePerformanceMonitoring();

    console.log("[StateIntegration] Complete state system initialized");
}
