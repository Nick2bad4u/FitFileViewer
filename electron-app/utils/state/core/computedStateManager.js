/**
 * Computed State Manager
 * Provides derived/computed state values that automatically update when dependencies change
 */

import { getState, subscribe } from "./stateManager.js";

/**
 * Computed State Manager Class
 */
class ComputedStateManager {
    constructor() {
        this.computedValues = new Map();
        this.dependencies = new Map();
        this.subscriptions = new Map();
        this.isComputing = new Set();
    }

    /**
     * Register a computed value
     * @param {string} key - Unique key for the computed value
     * @param {Function} computeFn - Function that computes the value
     * @param {Array<string>} deps - Array of state paths this computed value depends on
     * @returns {Function} Cleanup function
     */
    addComputed(key, computeFn, deps = []) {
        if (this.computedValues.has(key)) {
            console.warn(`[ComputedState] Computed value "${key}" already exists, replacing...`);
            this.removeComputed(key);
        }

        // Store the compute function and dependencies
        this.computedValues.set(key, {
            computeFn,
            deps,
            error: null,
            isValid: false,
            lastComputed: null,
            value: undefined,
        });

        this.dependencies.set(key, deps);

        // Set up subscriptions for all dependencies
        const subscriptions = deps.map((dep) =>
            subscribe(dep, () => {
                this.invalidateComputed(key);
            })
        );

        this.subscriptions.set(key, subscriptions);

        // Compute initial value
        this.computeValue(key);

        console.log(`[ComputedState] Registered computed value "${key}" with dependencies:`, deps);

        // Return cleanup function
        return () => this.removeComputed(key);
    }

    /**
     * Clean up all computed values
     */
    cleanup() {
        console.log("[ComputedState] Cleaning up all computed values...");

        // Clean up all subscriptions
        for (const subscriptions of this.subscriptions) {
            for (const unsubscribe of subscriptions) {
                if (typeof unsubscribe === "function") {
                    unsubscribe();
                }
            }
        }

        // Clear all maps
        this.computedValues.clear();
        this.dependencies.clear();
        this.subscriptions.clear();
        this.isComputing.clear();
    }

    /**
     * Compute the value for a computed state
     * @param {string} key - Key of computed value
     */
    computeValue(key) {
        if (!this.computedValues.has(key)) {
            return;
        }

        // Prevent circular dependencies
        if (this.isComputing.has(key)) {
            console.error(`[ComputedState] Circular dependency detected for computed value "${key}"`);
            return;
        }

        const computed = this.computedValues.get(key);
        this.isComputing.add(key);

        try {
            const startTime = performance.now(),
                duration = performance.now() - startTime,
                state = getState(""), // Pass empty string to get root state
                // Call the compute function with current state
                newValue = computed.computeFn(state);

            // Update the computed value
            computed.value = newValue;
            computed.isValid = true;
            computed.lastComputed = Date.now();
            computed.error = null;

            // Log slow computations
            if (duration > 10) {
                console.warn(`[ComputedState] Slow computation for "${key}": ${duration.toFixed(2)}ms`);
            }

            console.log(`[ComputedState] Computed value "${key}" updated in ${duration.toFixed(2)}ms`);
        } catch (error) {
            console.error(`[ComputedState] Error computing value for "${key}":`, error);
            computed.error = error;
            computed.isValid = false;
        } finally {
            this.isComputing.delete(key);
        }
    }

    /**
     * Alias for addComputed (for backward compatibility)
     * @param {string} key - Unique key for the computed value
     * @param {Function} computeFn - Function that computes the value
     * @param {Array<string>} deps - Array of state paths this computed value depends on
     * @returns {Function} Cleanup function
     */
    define(key, computeFn, deps = []) {
        return this.addComputed(key, computeFn, deps);
    }

    /**
     * Get all computed values with their metadata
     * @returns {Object} All computed values and metadata
     */
    getAllComputed() {
        /** @type {Record<string, any>} */
        const result = {};

        for (const [key, computed] of this.computedValues.entries()) {
            result[key] = {
                dependencies: this.dependencies.get(key),
                error: computed.error,
                isValid: computed.isValid,
                lastComputed: computed.lastComputed,
                value: computed.value,
            };
        }

        return result;
    }

    /**
     * Get a computed value
     * @param {string} key - Key of computed value
     * @returns {*} Computed value
     */
    getComputed(key) {
        if (!this.computedValues.has(key)) {
            console.warn(`[ComputedState] Computed value "${key}" does not exist`);
            return;
        }

        const computed = this.computedValues.get(key);

        // If value is invalid, recompute it
        if (!computed.isValid || computed.error) {
            this.computeValue(key);
        }

        return computed.value;
    }

    /**
     * Get dependency graph
     * @returns {Object} Dependency relationships
     */
    getDependencyGraph() {
        /** @type {Record<string, any>} */
        const graph = {};

        for (const [key, deps] of this.dependencies.entries()) {
            graph[key] = deps;
        }

        return graph;
    }

    /**
     * Invalidate a computed value (mark it for recomputation)
     * @param {string} key - Key of computed value to invalidate
     */
    invalidateComputed(key) {
        if (!this.computedValues.has(key)) {
            return;
        }

        const computed = this.computedValues.get(key);
        computed.isValid = false;
        computed.error = null;

        console.log(`[ComputedState] Invalidated computed value "${key}"`);
    }

    /**
     * Force recomputation of all computed values
     */
    recomputeAll() {
        console.log("[ComputedState] Recomputing all computed values...");

        for (const [key, _] of this.computedValues.entries()) {
            this.invalidateComputed(key);
            this.computeValue(key);
        }
    }

    /**
     * Remove a computed value
     * @param {string} key - Key of computed value to remove
     */
    removeComputed(key) {
        if (!this.computedValues.has(key)) {
            console.warn(`[ComputedState] Computed value "${key}" does not exist`);
            return;
        }

        // Clean up subscriptions
        const subscriptions = this.subscriptions.get(key) || [];
        for (const unsubscribe of subscriptions) {
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }
        }

        // Remove from all maps
        this.computedValues.delete(key);
        this.dependencies.delete(key);
        this.subscriptions.delete(key);
        this.isComputing.delete(key);

        console.log(`[ComputedState] Removed computed value "${key}"`);
    }
}

// Create global computed state manager
export const computedStateManager = new ComputedStateManager();

/**
 * Register a computed value (convenience function)
 * @param {string} key - Unique key for the computed value
 * @param {Function} computeFn - Function that computes the value
 * @param {Array<string>} deps - Array of state paths this computed value depends on
 * @returns {Function} Cleanup function
 */
export function addComputed(key, computeFn, deps = []) {
    return computedStateManager.addComputed(key, computeFn, deps);
}

/**
 * Cleanup common computed values
 */
export function cleanupCommonComputedValues() {
    const commonKeys = [
        "isFileLoaded",
        "isAppReady",
        "hasChartData",
        "hasMapData",
        "summaryData",
        "performanceMetrics",
        "themeInfo",
        "uiStateSummary",
    ];

    for (const key of commonKeys) removeComputed(key);
    console.log("[ComputedState] Common computed values cleaned up");
}

/**
 * Create a reactive computed value that can be used with property descriptors
 * @param {string} key - Computed value key
 * @param {Function} computeFn - Compute function
 * @param {Array<string>} deps - Dependencies
 * @returns {Object} Property descriptor
 */
export function createReactiveComputed(key, computeFn, deps = []) {
    addComputed(key, computeFn, deps);

    return {
        configurable: true,
        enumerable: true,
        get() {
            return getComputed(key);
        },
    };
}

/**
 * Alias for addComputed (convenience function for backward compatibility)
 * @param {string} key - Unique key for the computed value
 * @param {Function} computeFn - Function that computes the value
 * @param {Array<string>} deps - Array of state paths this computed value depends on
 * @returns {Function} Cleanup function
 */
export function define(key, computeFn, deps = []) {
    return computedStateManager.define(key, computeFn, deps);
}

/**
 * Predefined computed values for FitFileViewer
 */

/**
 * Get a computed value (convenience function)
 * @param {string} key - Key of computed value
 * @returns {*} Computed value
 */
export function getComputed(key) {
    return computedStateManager.getComputed(key);
}

/**
 * @type {boolean} - Track if common computed values have been initialized
 */
let commonComputedValuesInitialized = false;

/**
 * Initialize common computed values for the FitFileViewer application
 */
export function initializeCommonComputedValues() {
    if (commonComputedValuesInitialized) {
        console.log("[ComputedState] Common computed values already initialized, skipping...");
        return;
    }

    console.log("[ComputedState] Initializing common computed values...");

    // File loading state
    addComputed(
        "isFileLoaded",
        /** @param {*} state */ (state) => Boolean(state.globalData && Object.keys(state.globalData).length > 0),
        ["globalData"]
    );

    // Application ready state
    addComputed("isAppReady", /** @param {*} state */ (state) => state.app?.initialized && !state.app?.isOpeningFile, [
        "app.initialized",
        "app.isOpeningFile",
    ]);

    // Chart data available
    addComputed(
        "hasChartData",
        /** @param {*} state */ (state) =>
            Boolean(state.globalData?.recordMesgs && state.globalData.recordMesgs.length > 0),
        ["globalData.recordMesgs"]
    );

    // Map data available
    addComputed(
        "hasMapData",
        /** @param {*} state */ (state) => {
            const records = state.globalData?.recordMesgs;
            return Boolean(
                records &&
                    records.some(
                        /** @param {*} record */ (record) =>
                            record.positionLat !== undefined && record.positionLong !== undefined
                    )
            );
        },
        ["globalData.recordMesgs"]
    );

    // Summary data
    addComputed(
        "summaryData",
        /** @param {*} state */ (state) => {
            if (!state.globalData?.sessionMesgs) {
                return null;
            }

            const [session] = state.globalData.sessionMesgs;
            if (!session) {
                return null;
            }

            return {
                avgHeartRate: session.avgHeartRate,
                avgPower: session.avgPower,
                avgSpeed: session.avgSpeed,
                maxHeartRate: session.maxHeartRate,
                maxPower: session.maxPower,
                maxSpeed: session.maxSpeed,
                totalAscent: session.totalAscent,
                totalDescent: session.totalDescent,
                totalDistance: session.totalDistance,
                totalTime: session.totalElapsedTime,
            };
        },
        ["globalData.sessionMesgs"]
    );

    // Performance metrics
    addComputed(
        "performanceMetrics",
        /** @param {*} state */ (state) => {
            const startTime = state.app?.startTime;
            if (!startTime) {
                return null;
            }

            return {
                isFileLoaded: Boolean(state.globalData && Object.keys(state.globalData).length > 0),
                lastActivity: state.system?.lastActivity || startTime,
                tabsEnabled: state.ui?.tabs || {},
                uptime: Date.now() - startTime,
            };
        },
        ["app.startTime", "globalData", "ui.tabs", "system.lastActivity"]
    );

    // Theme information
    addComputed(
        "themeInfo",
        /** @param {*} state */ (state) => {
            const mapTheme = state.settings?.mapTheme || true,
                theme = state.settings?.theme || "dark";

            return {
                currentTheme: theme,
                isDarkTheme:
                    theme === "dark" ||
                    (theme === "auto" &&
                        globalThis.matchMedia &&
                        globalThis.matchMedia("(prefers-color-scheme: dark)").matches),
                isLightTheme:
                    theme === "light" ||
                    (theme === "auto" &&
                        globalThis.matchMedia &&
                        !globalThis.matchMedia("(prefers-color-scheme: dark)").matches),
                mapThemeInverted: mapTheme,
            };
        },
        ["settings.theme", "settings.mapTheme"]
    );

    // UI state summary
    addComputed(
        "uiStateSummary",
        /** @param {*} state */ (state) => ({
            activeTab: state.ui?.activeTab || "summary",
            controlsEnabled: state.ui?.controlsEnabled || false,
            loadingState: state.ui?.loading || false,
            notificationCount: state.ui?.notifications?.length || 0,
            tabsVisible: state.ui?.tabsVisible || false,
        }),
        ["ui.activeTab", "ui.loading", "ui.notifications", "ui.controlsEnabled", "ui.tabsVisible"]
    );

    commonComputedValuesInitialized = true;
    console.log("[ComputedState] Common computed values initialized");
}

/**
 * Remove a computed value (convenience function)
 * @param {string} key - Key of computed value to remove
 */
export function removeComputed(key) {
    return computedStateManager.removeComputed(key);
}
