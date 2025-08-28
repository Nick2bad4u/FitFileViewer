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
            value: undefined,
            isValid: false,
            lastComputed: null,
            error: null,
        });

        this.dependencies.set(key, deps);

        // Set up subscriptions for all dependencies
        const subscriptions = deps.map((dep) => {
            return subscribe(dep, () => {
                this.invalidateComputed(key);
            });
        });

        this.subscriptions.set(key, subscriptions);

        // Compute initial value
        this.computeValue(key);

        console.log(`[ComputedState] Registered computed value "${key}" with dependencies:`, deps);

        // Return cleanup function
        return () => this.removeComputed(key);
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
        subscriptions.forEach(
            /** @param {*} unsubscribe */ (unsubscribe) => {
                if (typeof unsubscribe === "function") {
                    unsubscribe();
                }
            }
        );

        // Remove from all maps
        this.computedValues.delete(key);
        this.dependencies.delete(key);
        this.subscriptions.delete(key);
        this.isComputing.delete(key);

        console.log(`[ComputedState] Removed computed value "${key}"`);
    }

    /**
     * Get a computed value
     * @param {string} key - Key of computed value
     * @returns {*} Computed value
     */
    getComputed(key) {
        if (!this.computedValues.has(key)) {
            console.warn(`[ComputedState] Computed value "${key}" does not exist`);
            return undefined;
        }

        const computed = this.computedValues.get(key);

        // If value is invalid, recompute it
        if (!computed.isValid || computed.error) {
            this.computeValue(key);
        }

        return computed.value;
    }

    /**
     * Invalidate a computed value (mark it for recomputation)
     * @param {string} key - Key of computed value to invalidate
     */
    invalidateComputed(key) {
        if (!this.computedValues.has(key)) return;

        const computed = this.computedValues.get(key);
        computed.isValid = false;
        computed.error = null;

        console.log(`[ComputedState] Invalidated computed value "${key}"`);
    }

    /**
     * Compute the value for a computed state
     * @param {string} key - Key of computed value
     */
    computeValue(key) {
        if (!this.computedValues.has(key)) return;

        // Prevent circular dependencies
        if (this.isComputing.has(key)) {
            console.error(`[ComputedState] Circular dependency detected for computed value "${key}"`);
            return;
        }

        const computed = this.computedValues.get(key);
        this.isComputing.add(key);

        try {
            const state = getState(""); // Pass empty string to get root state
            const startTime = performance.now();

            // Call the compute function with current state
            const newValue = computed.computeFn(state);

            const duration = performance.now() - startTime;

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
     * Get all computed values with their metadata
     * @returns {Object} All computed values and metadata
     */
    getAllComputed() {
        /** @type {Record<string, any>} */
        const result = {};

        this.computedValues.forEach((computed, key) => {
            result[key] = {
                value: computed.value,
                isValid: computed.isValid,
                lastComputed: computed.lastComputed,
                dependencies: this.dependencies.get(key),
                error: computed.error,
            };
        });

        return result;
    }

    /**
     * Force recomputation of all computed values
     */
    recomputeAll() {
        console.log("[ComputedState] Recomputing all computed values...");

        this.computedValues.forEach((_, key) => {
            this.invalidateComputed(key);
            this.computeValue(key);
        });
    }

    /**
     * Get dependency graph
     * @returns {Object} Dependency relationships
     */
    getDependencyGraph() {
        /** @type {Record<string, any>} */
        const graph = {};

        this.dependencies.forEach((deps, key) => {
            graph[key] = deps;
        });

        return graph;
    }

    /**
     * Clean up all computed values
     */
    cleanup() {
        console.log("[ComputedState] Cleaning up all computed values...");

        // Clean up all subscriptions
        this.subscriptions.forEach((subscriptions) => {
            subscriptions.forEach(
                /** @param {*} unsubscribe */ (unsubscribe) => {
                    if (typeof unsubscribe === "function") {
                        unsubscribe();
                    }
                }
            );
        });

        // Clear all maps
        this.computedValues.clear();
        this.dependencies.clear();
        this.subscriptions.clear();
        this.isComputing.clear();
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
 * Get a computed value (convenience function)
 * @param {string} key - Key of computed value
 * @returns {*} Computed value
 */
export function getComputed(key) {
    return computedStateManager.getComputed(key);
}

/**
 * Remove a computed value (convenience function)
 * @param {string} key - Key of computed value to remove
 */
export function removeComputed(key) {
    return computedStateManager.removeComputed(key);
}

/**
 * Predefined computed values for FitFileViewer
 */

/**
 * Initialize common computed values for the FitFileViewer application
 */
export function initializeCommonComputedValues() {
    console.log("[ComputedState] Initializing common computed values...");

    // File loading state
    addComputed(
        "isFileLoaded",
        /** @param {*} state */ (state) => {
            return !!(state.globalData && Object.keys(state.globalData).length > 0);
        },
        ["globalData"]
    );

    // Application ready state
    addComputed(
        "isAppReady",
        /** @param {*} state */ (state) => {
            return state.app?.initialized && !state.app?.isOpeningFile;
        },
        ["app.initialized", "app.isOpeningFile"]
    );

    // Chart data available
    addComputed(
        "hasChartData",
        /** @param {*} state */ (state) => {
            return !!(state.globalData?.recordMesgs && state.globalData.recordMesgs.length > 0);
        },
        ["globalData.recordMesgs"]
    );

    // Map data available
    addComputed(
        "hasMapData",
        /** @param {*} state */ (state) => {
            const records = state.globalData?.recordMesgs;
            return !!(
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
            if (!state.globalData?.sessionMesgs) return null;

            const session = state.globalData.sessionMesgs[0];
            if (!session) return null;

            return {
                totalTime: session.totalElapsedTime,
                totalDistance: session.totalDistance,
                avgSpeed: session.avgSpeed,
                maxSpeed: session.maxSpeed,
                avgHeartRate: session.avgHeartRate,
                maxHeartRate: session.maxHeartRate,
                avgPower: session.avgPower,
                maxPower: session.maxPower,
                totalAscent: session.totalAscent,
                totalDescent: session.totalDescent,
            };
        },
        ["globalData.sessionMesgs"]
    );

    // Performance metrics
    addComputed(
        "performanceMetrics",
        /** @param {*} state */ (state) => {
            const startTime = state.app?.startTime;
            if (!startTime) return null;

            return {
                uptime: Date.now() - startTime,
                isFileLoaded: !!(state.globalData && Object.keys(state.globalData).length > 0),
                tabsEnabled: state.ui?.tabs || {},
                lastActivity: state.system?.lastActivity || startTime,
            };
        },
        ["app.startTime", "globalData", "ui.tabs", "system.lastActivity"]
    );

    // Theme information
    addComputed(
        "themeInfo",
        /** @param {*} state */ (state) => {
            const theme = state.settings?.theme || "dark";
            const mapTheme = state.settings?.mapTheme || true;

            return {
                currentTheme: theme,
                mapThemeInverted: mapTheme,
                isDarkTheme:
                    theme === "dark" ||
                    (theme === "auto" &&
                        window.matchMedia &&
                        window.matchMedia("(prefers-color-scheme: dark)").matches),
                isLightTheme:
                    theme === "light" ||
                    (theme === "auto" &&
                        window.matchMedia &&
                        !window.matchMedia("(prefers-color-scheme: dark)").matches),
            };
        },
        ["settings.theme", "settings.mapTheme"]
    );

    // UI state summary
    addComputed(
        "uiStateSummary",
        /** @param {*} state */ (state) => {
            return {
                activeTab: state.ui?.activeTab || "summary",
                loadingState: state.ui?.loading || false,
                notificationCount: state.ui?.notifications?.length || 0,
                controlsEnabled: state.ui?.controlsEnabled || false,
                tabsVisible: state.ui?.tabsVisible || false,
            };
        },
        ["ui.activeTab", "ui.loading", "ui.notifications", "ui.controlsEnabled", "ui.tabsVisible"]
    );

    console.log("[ComputedState] Common computed values initialized");
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

    commonKeys.forEach((key) => removeComputed(key));
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
        get() {
            return getComputed(key);
        },
        enumerable: true,
        configurable: true,
    };
}
