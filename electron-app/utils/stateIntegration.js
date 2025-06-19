/**
 * State Integration Utilities
 * Helps migrate from existing state patterns to the new centralized system
 */

import { initializeStateManager, setState, getState, subscribe } from "./stateManager.js";
import { AppActions } from "./appActions.js";
import { uiStateManager } from "./uiStateManager.js";

/**
 * Detects if the application is running in development mode
 * Since process is not available in renderer, we use alternative methods
 * @returns {boolean} True if in development mode
 */
function isDevelopmentMode() {
    // Check for development indicators
    return (
        // Check if localhost or dev domains
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.includes("dev") ||
        // Check for dev tools being open
        window.__DEVELOPMENT__ === true ||
        // Check for debug flag in URL
        window.location.search.includes("debug=true") ||
        window.location.hash.includes("debug") ||
        // Check for development build indicators
        document.documentElement.hasAttribute("data-dev-mode") ||
        // Check if running from file:// protocol (dev mode indicator)
        window.location.protocol === "file:" ||
        // Check if electron dev tools are available
        (window.electronAPI && typeof window.electronAPI.__devMode !== "undefined") ||
        // Check console availability and development-specific globals
        (typeof console !== "undefined" && window.location.href.includes("electron"))
    );
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
    if (!window.AppState) {
        window.AppState = {
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
function setupStateDebugging() {
    // Add debug utilities to window
    window.__state_debug = {
        getState,
        setState,
        AppActions,
        uiStateManager,

        // Utility to log current state
        logState(path) {
            const state = path ? getState(path) : getState();
            console.log(`[StateDebug] Current state${path ? ` for ${path}` : ""}:`, state);
            return state;
        },

        // Utility to watch state changes
        watchState(path) {
            console.log(`[StateDebug] Watching state changes for: ${path}`);
            return subscribe(path, (newValue, oldValue) => {
                console.log(`[StateDebug] ${path} changed:`, { oldValue, newValue });
            });
        },

        // Utility to trigger state actions
        triggerAction(actionName, ...args) {
            if (AppActions[actionName]) {
                console.log(`[StateDebug] Triggering action: ${actionName}`, args);
                return AppActions[actionName](...args);
            } else {
                console.warn(`[StateDebug] Unknown action: ${actionName}`);
            }
        },
    };

    console.log("[StateIntegration] Debug utilities available at window.__state_debug");
}

/**
 * Migration helper to convert old state patterns to new system
 */
export class StateMigrationHelper {
    constructor() {
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
    if (window.chartControlsState) {
        console.log("[StateMigration] Migrating chartControlsState...");
        // Copy existing state
        setState("charts.controlsVisible", window.chartControlsState.isVisible, {
            source: "migration",
        });

        // Replace old state with getter/setter
        window.chartControlsState = {
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
    if (window.rendererUtils) {
        console.log("[StateIntegration] Integrating with rendererUtils...");

        // Wrap existing functions to use new state system
        const originalUtils = { ...window.rendererUtils };

        // Example: if there's a setGlobalData function
        if (originalUtils.setGlobalData) {
            window.rendererUtils.setGlobalData = (data) => {
                setState("globalData", data, { source: "rendererUtils.setGlobalData" });
                return originalUtils.setGlobalData(data);
            };
        }

        // Example: if there's a getGlobalData function
        if (originalUtils.getGlobalData) {
            window.rendererUtils.getGlobalData = () => {
                return getState("globalData");
            };
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
            clearTimeout(window.__persistenceTimeout);
            window.__persistenceTimeout = setTimeout(() => {
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
 * @private
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
 * Set up performance monitoring for state changes
 */
export function setupStatePerformanceMonitoring() {
    let stateChangeCount = 0;
    let lastResetTime = Date.now();

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
    if (performance.memory) {
        setInterval(() => {
            const memoryInfo = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
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
