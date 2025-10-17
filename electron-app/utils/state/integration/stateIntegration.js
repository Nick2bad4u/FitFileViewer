/**
 * State Integration Utilities
 * Helps migrate from existing state patterns to the new centralized system
 */

import { AppActions } from "../../app/lifecycle/appActions.js";
import { getState, initializeStateManager, setState, subscribe } from "../core/stateManager.js";
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
                // eslint-disable-next-line no-await-in-loop -- Migrations are order-dependent and must run sequentially
                await migration();
            } catch (error) {
                console.error("[StateMigration] Migration failed:", error);
            }
        }

        console.log("[StateMigration] All migrations completed");
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

// Export a single function to initialize everything
export function initializeCompleteStateSystem() {
    initializeAppState();
    migrateChartControlsState();
    integrateWithRendererUtils();
    setupStatePersistence();
    setupStatePerformanceMonitoring();

    console.log("[StateIntegration] Complete state system initialized");
}

/**
 * Helper to integrate with existing renderer utilities
 */
export function integrateWithRendererUtils() {
    // If rendererUtils exists and has state management, integrate it
    if (/** @type {any} */ (globalThis).rendererUtils) {
        console.log("[StateIntegration] Integrating with rendererUtils...");

        // Wrap existing functions to use new state system
        const originalUtils = { .../** @type {any} */ (globalThis).rendererUtils };

        // Example: if there's a setGlobalData function
        if (originalUtils.setGlobalData) {
            /**
             * @param {Object} data - Global data to set
             */
            /** @type {any} */ (globalThis).rendererUtils.setGlobalData = (/** @type {Object} */ data) => {
                setState("globalData", data, { source: "rendererUtils.setGlobalData" });
                return originalUtils.setGlobalData(data);
            };
        }

        // Example: if there's a getGlobalData function
        if (originalUtils.getGlobalData) {
            /** @type {any} */ (globalThis).rendererUtils.getGlobalData = () => getState("globalData");
        }

        console.log("[StateIntegration] rendererUtils integration completed");
    }
}

/**
 * Helper to convert existing chartControlsState to new system
 */
export function migrateChartControlsState() {
    // Check if old chartControlsState exists
    if (/** @type {any} */ (globalThis).chartControlsState) {
        console.log("[StateMigration] Migrating chartControlsState...");
        // Copy existing state
        setState("charts.controlsVisible", /** @type {any} */(globalThis).chartControlsState.isVisible, {
            source: "migration",
        });

        // Replace old state with getter/setter
        /** @type {any} */ (globalThis).chartControlsState = {
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
 * Set up performance monitoring for state changes
 */
export function setupStatePerformanceMonitoring() {
    let lastResetTime = Date.now(),
        stateChangeCount = 0;

    // Monitor state change frequency
    subscribe("", () => {
        stateChangeCount++;

        // Reset counter every minute and log stats
        const now = Date.now();
        if (now - lastResetTime > 60_000) {
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
                limit: Math.round(perfMemory.memory.jsHeapSizeLimit / 1024 / 1024),
                total: Math.round(perfMemory.memory.totalJSHeapSize / 1024 / 1024),
                used: Math.round(perfMemory.memory.usedJSHeapSize / 1024 / 1024),
            };

            setState("performance.memoryUsage", memoryInfo, {
                silent: true,
                source: "performanceMonitoring",
            });
        }, 30_000); // Update every 30 seconds
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
    for (const path of persistedPaths) {
        subscribe(path, () => {
            // Debounce the persistence to avoid excessive writes
            clearTimeout(/** @type {any} */(globalThis).__persistenceTimeout);
            /** @type {any} */ (globalThis).__persistenceTimeout = setTimeout(() => {
                try {
                    const stateToSave = {};
                    for (const p of persistedPaths) {
                        const value = getState(p);
                        if (value !== undefined) {
                            setNestedValue(stateToSave, p, value);
                        }
                    }

                    localStorage.setItem("fitFileViewer_uiState", JSON.stringify(stateToSave));
                    console.log("[StateIntegration] UI state persisted to localStorage");
                } catch (error) {
                    console.error("[StateIntegration] Failed to persist state:", error);
                }
            }, 500);
        });
    }

    // Load persisted state on initialization
    try {
        const savedState = localStorage.getItem("fitFileViewer_uiState");
        if (savedState) {
            const parsedState = JSON.parse(savedState);

            for (const path of persistedPaths) {
                const value = getNestedValue(parsedState, path);
                if (value !== undefined) {
                    setState(path, value, { silent: true, source: "localStorage" });
                }
            }

            console.log("[StateIntegration] UI state loaded from localStorage");
        }
    } catch (error) {
        console.error("[StateIntegration] Failed to load persisted state:", error);
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
            return;
        }
        value = value[key];
    }

    return value;
}

/**
 * Detects if the application is running in development mode
 * Since process is not available in renderer, we use alternative methods
 * @returns {boolean} True if in development mode
 */
function isDevelopmentMode() {
    // Guarded access for jsdom/mocked environments
    try {
        const loc = /** @type {any} */ (globalThis.window === undefined ? undefined : globalThis.location) || {};
        const hostname = typeof loc.hostname === "string" ? loc.hostname : "";
        const search = typeof loc.search === "string" ? loc.search : "";
        const hash = typeof loc.hash === "string" ? loc.hash : "";
        const protocol = typeof loc.protocol === "string" ? loc.protocol : "";
        const href = typeof loc.href === "string" ? loc.href : "";

        return (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            (hostname && hostname.includes("dev")) ||
            /** @type {any} */ (globalThis).__DEVELOPMENT__ === true ||
            (search && search.includes("debug=true")) ||
            (hash && hash.includes("debug")) ||
            (typeof document !== "undefined" &&
                document.documentElement &&
                Object.hasOwn(document.documentElement.dataset, "devMode")) ||
            protocol === "file:" ||
            /** @type {any} */ (
                globalThis.window !== undefined &&
                globalThis.electronAPI &&
                    /** @type {any} */ (globalThis).electronAPI.__devMode !== undefined
            ) ||
            (typeof console !== "undefined" && typeof href === "string" && href.includes("electron"))
        );
    } catch {
        // Default to non-dev on any unexpected error
        return false;
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

    const finalKey = keys.at(-1);
    if (finalKey) {
        target[finalKey] = value;
    }
}

/**
 * Set up backward compatibility with existing state patterns
 */
function setupBackwardCompatibility() {
    const defineProperty = (propName, getterPath, setterPath = getterPath, transform = (value) => value) => {
        if (!Object.getOwnPropertyDescriptor(globalThis, propName)) {
            Object.defineProperty(globalThis, propName, {
                configurable: true,
                get() {
                    return getState(getterPath);
                },
                set(value) {
                    setState(setterPath, transform(value), { source: `window.${propName}` });
                },
            });
        }
    };

    defineProperty("globalData", "globalData");
    defineProperty(
        "loadedFitFiles",
        "overlays.loadedFitFiles",
        "overlays.loadedFitFiles",
        (value) => (Array.isArray(value) ? Array.from(value) : [])
    );
    defineProperty("mapMarkerCount", "overlays.mapMarkerCount");
    defineProperty("heartRateZones", "zones.heartRate");
    defineProperty("powerZones", "zones.power");
    defineProperty("_highlightedOverlayIdx", "overlays.highlightedOverlayIndex");

    // Maintain legacy chart rendered flag
    if (!Object.getOwnPropertyDescriptor(globalThis, "isChartRendered")) {
        Object.defineProperty(globalThis, "isChartRendered", {
            configurable: true,
            get() {
                return getState("charts.isRendered");
            },
            set(value) {
                setState("charts.isRendered", value, { source: "window.isChartRendered" });
            },
        });
    }

    // Create compatibility layer for existing AppState usage
    if (!(/** @type {any} */ (globalThis).AppState)) {
        /** @type {any} */ (globalThis).AppState = {
            get eventListeners() {
                return getState("eventListeners") || new Map();
            },
            set eventListeners(value) {
                setState("eventListeners", value, { source: "AppState.eventListeners" });
            },
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
        AppActions,
        getState,
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
        setState,

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
        },

        uiStateManager,

        // Utility to watch state changes
        /**
         * @param {string} path - State path to watch
         * @returns {Function} Unsubscribe function
         */
        watchState(path) {
            console.log(`[StateDebug] Watching state changes for: ${path}`);
            return subscribe(
                path,
                /** @param {*} newValue */ /** @param {*} oldValue */(/** @type {any} */ newValue, oldValue) => {
                    console.log(`[StateDebug] ${path} changed:`, { newValue, oldValue });
                }
            );
        },
    };

    // @ts-ignore - Debug utilities assignment to window
    globalThis.__state_debug = debugUtilities;
}
