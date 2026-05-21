import { getState, subscribe } from "./stateManager.js";
function getComputedStateInput() {
    return getState("");
}
function getRecordMessages(state) {
    return state.globalData?.recordMesgs ?? [];
}
function hasLoadedGlobalData(state) {
    const globalData = state.globalData;
    return (globalData !== null &&
        typeof globalData === "object" &&
        Object.keys(globalData).length > 0);
}
function isDarkSchemePreferred() {
    return Boolean(globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches);
}
/**
 * Manages derived values that recompute from state dependencies.
 */
class ComputedStateManager {
    computedValues = new Map();
    dependencies = new Map();
    isComputing = new Set();
    subscriptions = new Map();
    /**
     * Registers a computed value and subscribes it to dependency invalidations.
     */
    addComputed(key, computeFn, deps = []) {
        if (this.computedValues.has(key)) {
            console.warn(`[ComputedState] Computed value "${key}" already exists, replacing...`);
            this.removeComputed(key);
        }
        this.computedValues.set(key, {
            computeFn,
            deps,
            error: null,
            isValid: false,
            lastComputed: null,
            value: undefined,
        });
        this.dependencies.set(key, deps);
        const subscriptions = deps.map((dep) => subscribe(dep, () => {
            this.invalidateComputed(key);
        }));
        this.subscriptions.set(key, subscriptions);
        this.computeValue(key);
        console.log(`[ComputedState] Registered computed value "${key}" with dependencies:`, deps);
        return () => {
            this.removeComputed(key);
        };
    }
    /** Cleans up all computed values and dependency subscriptions. */
    cleanup() {
        console.log("[ComputedState] Cleaning up all computed values...");
        for (const subscriptions of this.subscriptions.values()) {
            for (const unsubscribe of subscriptions) {
                unsubscribe();
            }
        }
        this.computedValues.clear();
        this.dependencies.clear();
        this.subscriptions.clear();
        this.isComputing.clear();
    }
    /** Computes a value by key if it exists and is not already computing. */
    computeValue(key) {
        const computed = this.computedValues.get(key);
        if (!computed) {
            return;
        }
        if (this.isComputing.has(key)) {
            console.error(`[ComputedState] Circular dependency detected for computed value "${key}"`);
            return;
        }
        this.isComputing.add(key);
        try {
            const startTime = performance.now();
            const state = getComputedStateInput();
            const newValue = computed.computeFn(state);
            const duration = performance.now() - startTime;
            computed.value = newValue;
            computed.isValid = true;
            computed.lastComputed = Date.now();
            computed.error = null;
            if (duration > 10) {
                console.warn(`[ComputedState] Slow computation for "${key}": ${duration.toFixed(2)}ms`);
            }
            console.log(`[ComputedState] Computed value "${key}" updated in ${duration.toFixed(2)}ms`);
        }
        catch (error) {
            console.error(`[ComputedState] Error computing value for "${key}":`, error);
            computed.error = error;
            computed.isValid = false;
        }
        finally {
            this.isComputing.delete(key);
        }
    }
    /** Alias for addComputed for backward compatibility. */
    define(key, computeFn, deps = []) {
        return this.addComputed(key, computeFn, deps);
    }
    /** Gets all computed values with metadata. */
    getAllComputed() {
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
    /** Gets a computed value, recomputing invalid entries first. */
    getComputed(key) {
        const computed = this.computedValues.get(key);
        if (!computed) {
            console.warn(`[ComputedState] Computed value "${key}" does not exist`);
            return undefined;
        }
        if (!computed.isValid || computed.error) {
            this.computeValue(key);
        }
        return computed.value;
    }
    /** Gets dependency relationships for debugging. */
    getDependencyGraph() {
        const graph = {};
        for (const [key, deps] of this.dependencies.entries()) {
            graph[key] = deps;
        }
        return graph;
    }
    /** Marks a computed value as stale. */
    invalidateComputed(key) {
        const computed = this.computedValues.get(key);
        if (!computed) {
            return;
        }
        computed.isValid = false;
        computed.error = null;
        console.log(`[ComputedState] Invalidated computed value "${key}"`);
    }
    /** Forces recomputation of all computed values. */
    recomputeAll() {
        console.log("[ComputedState] Recomputing all computed values...");
        for (const key of this.computedValues.keys()) {
            this.invalidateComputed(key);
            this.computeValue(key);
        }
    }
    /** Removes a computed value and its dependency subscriptions. */
    removeComputed(key) {
        if (!this.computedValues.has(key)) {
            console.warn(`[ComputedState] Computed value "${key}" does not exist`);
            return;
        }
        const subscriptions = this.subscriptions.get(key) ?? [];
        for (const unsubscribe of subscriptions) {
            unsubscribe();
        }
        this.computedValues.delete(key);
        this.dependencies.delete(key);
        this.subscriptions.delete(key);
        this.isComputing.delete(key);
        console.log(`[ComputedState] Removed computed value "${key}"`);
    }
}
/** Global computed state manager. */
export const computedStateManager = new ComputedStateManager();
/** Registers a computed value. */
export function addComputed(key, computeFn, deps = []) {
    return computedStateManager.addComputed(key, computeFn, deps);
}
/** Cleans up common computed values. */
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
    for (const key of commonKeys) {
        removeComputed(key);
    }
    console.log("[ComputedState] Common computed values cleaned up");
}
/** Creates a property descriptor backed by a computed value. */
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
/** Alias for addComputed for backward compatibility. */
export function define(key, computeFn, deps = []) {
    return computedStateManager.define(key, computeFn, deps);
}
/** Gets a computed value. */
export function getComputed(key) {
    return computedStateManager.getComputed(key);
}
let commonComputedValuesInitialized = false;
/** Initializes common computed values for the FitFileViewer application. */
export function initializeCommonComputedValues() {
    if (commonComputedValuesInitialized) {
        console.log("[ComputedState] Common computed values already initialized, skipping...");
        return;
    }
    console.log("[ComputedState] Initializing common computed values...");
    addComputed("isFileLoaded", hasLoadedGlobalData, ["globalData"]);
    addComputed("isAppReady", (state) => state.app.initialized && !state.app.isOpeningFile, ["app.initialized", "app.isOpeningFile"]);
    addComputed("hasChartData", (state) => getRecordMessages(state).length > 0, ["globalData.recordMesgs"]);
    addComputed("hasMapData", (state) => getRecordMessages(state).some((record) => record.positionLat !== undefined &&
        record.positionLong !== undefined), ["globalData.recordMesgs"]);
    addComputed("summaryData", (state) => {
        const [session] = state.globalData?.sessionMesgs ?? [];
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
    }, ["globalData.sessionMesgs"]);
    addComputed("performanceMetrics", (state) => {
        const startTime = state.app.startTime;
        if (!startTime) {
            return null;
        }
        return {
            isFileLoaded: hasLoadedGlobalData(state),
            lastActivity: state.system?.lastActivity ?? startTime,
            tabsEnabled: state.ui?.tabs ?? {},
            uptime: Date.now() - startTime,
        };
    }, [
        "app.startTime",
        "globalData",
        "ui.tabs",
        "system.lastActivity",
    ]);
    addComputed("themeInfo", (state) => {
        const mapTheme = state.settings?.mapTheme ?? true;
        const theme = state.settings?.theme ?? "dark";
        const darkSchemePreferred = isDarkSchemePreferred();
        return {
            currentTheme: theme,
            isDarkTheme: theme === "dark" ||
                (theme === "auto" && darkSchemePreferred),
            isLightTheme: theme === "light" ||
                (theme === "auto" && !darkSchemePreferred),
            mapThemeInverted: mapTheme,
        };
    }, ["settings.theme", "settings.mapTheme"]);
    addComputed("uiStateSummary", (state) => ({
        activeTab: state.ui?.activeTab ?? "summary",
        controlsEnabled: state.ui?.controlsEnabled ?? false,
        loadingState: state.ui?.loading ?? false,
        notificationCount: state.ui?.notifications?.length ?? 0,
        tabsVisible: state.ui?.tabsVisible ?? false,
    }), [
        "ui.activeTab",
        "ui.loading",
        "ui.notifications",
        "ui.controlsEnabled",
        "ui.tabsVisible",
    ]);
    commonComputedValuesInitialized = true;
    console.log("[ComputedState] Common computed values initialized");
}
/** Removes a computed value. */
export function removeComputed(key) {
    computedStateManager.removeComputed(key);
}
