/**
 * Application State Actions and Transitions
 * Higher-level actions that encapsulate common state changes
 */

import { getState, setState, subscribe, updateState } from "../../state/core/stateManager.js";
import { setThemePreference, THEME_MODES } from "../../theming/core/theme.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

/**
 * @typedef {Object} ChartData
 * @property {any} datasets - Underlying chart dataset collection (library specific)
 * @property {any} [meta] - Optional metadata about the chart
 */

/**
 * @typedef {Object<string, any>} ChartOptions
 */

/**
 * @typedef {[number, number]} MapCenter Tuple of [latitude, longitude]
 */

/**
 * @typedef {Object} TableConfig
 * @property {boolean} [isRendered]
 * @property {any} [data]
 * @property {any} [columns]
 * @property {Object<string, any>} [options]
 */

/**
 * @typedef {(path: string, value: any, oldValue: any, options: Record<string, any>) => any} MiddlewareFn
 */

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} [lastLoadTime]
 * @property {{chart?: number, map?: number, table?: number}} [renderTimes]
 */

/**
 * Application state actions - higher-level functions for common state changes
 */
export const AppActions = {
    /**
     * Clear all data and reset to initial state
     */
    clearData() {
        setState("globalData", null, { source: "AppActions.clearData" });
        setState("currentFile", null, { source: "AppActions.clearData" });
        setState("charts.isRendered", false, { source: "AppActions.clearData" });
        setState("map.isRendered", false, { source: "AppActions.clearData" });
        setState("tables.isRendered", false, { source: "AppActions.clearData" });

        console.log("[AppActions] Data cleared");
        showNotification("Data cleared", "info");
    },

    /**
     * Load a new FIT file and update related state
     * @param {Object} fileData - Parsed FIT file data
     * @param {string} filePath - Path to the loaded file
     */
    async loadFile(fileData, filePath) {
        try {
            setState("isLoading", true, { source: "AppActions.loadFile" });

            // Update file-related state
            setState("globalData", fileData, { source: "AppActions.loadFile" });
            setState("currentFile", filePath, { source: "AppActions.loadFile" });

            // Reset component states
            setState("charts.isRendered", false, { source: "AppActions.loadFile" });
            setState("map.isRendered", false, { source: "AppActions.loadFile" });
            setState("tables.isRendered", false, { source: "AppActions.loadFile" });

            // Update performance metrics
            setState("performance.lastLoadTime", Date.now(), { source: "AppActions.loadFile" });

            showNotification("File loaded successfully", "success");
            console.log("[AppActions] File loaded:", filePath);
        } catch (error) {
            console.error("[AppActions] Error loading file:", error);
            showNotification("Failed to load file", "error");
            throw error;
        } finally {
            setState("isLoading", false, { source: "AppActions.loadFile" });
        }
    },

    /**
     * Update chart rendering state and options
     * @param {Object} chartData - Chart data
     * @param {Object} options - Chart options
     */
    renderChart(chartData, options = /** @type {ChartOptions} */ ({})) {
        const startTime = performance.now();

        updateState(
            "charts",
            {
                chartData,
                chartOptions: options,
                isRendered: true,
            },
            { source: "AppActions.renderChart" }
        );

        const renderTime = performance.now() - startTime;
        updateState(
            "performance.renderTimes",
            {
                chart: renderTime,
            },
            { source: "AppActions.renderChart" }
        );

        console.log(`[AppActions] Chart rendered in ${renderTime.toFixed(2)}ms`);
    },

    /**
     * Update map rendering state and center
     * @param {MapCenter} center - [lat, lng] coordinates for map center
     * @param {number} zoom - Zoom level
     */
    renderMap(center, zoom = 13) {
        const startTime = performance.now();

        updateState(
            "map",
            {
                center,
                isRendered: true,
                zoom,
            },
            { source: "AppActions.renderMap" }
        );

        const renderTime = performance.now() - startTime;
        updateState(
            "performance.renderTimes",
            {
                map: renderTime,
            },
            { source: "AppActions.renderMap" }
        );

        console.log(`[AppActions] Map rendered in ${renderTime.toFixed(2)}ms`);
    },

    /**
     * Update table rendering state
     * @param {Object} tableConfig - Table configuration
     */
    renderTable(tableConfig = /** @type {TableConfig} */ ({})) {
        const startTime = performance.now();

        updateState(
            "tables",
            {
                isRendered: true,
                ...tableConfig,
            },
            { source: "AppActions.renderTable" }
        );

        const renderTime = performance.now() - startTime;
        updateState(
            "performance.renderTimes",
            {
                table: renderTime,
            },
            { source: "AppActions.renderTable" }
        );

        console.log(`[AppActions] Table rendered in ${renderTime.toFixed(2)}ms`);
    },

    /**
     * Select a lap on the map
     * @param {number} lapNumber - Lap number to select (0-based)
     */
    selectLap(lapNumber) {
        setState("map.selectedLap", lapNumber, { source: "AppActions.selectLap" });
        console.log(`[AppActions] Selected lap: ${lapNumber}`);
    },

    /**
     * Set file opening state
     * @param {boolean} isOpening - Whether a file is being opened
     */
    setFileOpening(isOpening) {
        setState("app.isOpeningFile", isOpening, { source: "AppActions.setFileOpening" });
        console.log(`[AppActions] File opening state: ${isOpening}`);
    },

    /**
     * Set application initialization state
     * @param {boolean} initialized - Whether the app is initialized
     */
    setInitialized(initialized) {
        setState("app.initialized", initialized, { source: "AppActions.setInitialized" });
        console.log(`[AppActions] App initialization state: ${initialized}`);
    },

    /**
     * Switch to a different tab
     * @param {string} tabName - Name of the tab to switch to
     */
    switchTab(tabName) {
        const validTabs = ["summary", "chart", "map", "table"];

        if (!validTabs.includes(tabName)) {
            console.warn(`[AppActions] Invalid tab name: ${tabName}`);
            return;
        }

        setState("ui.activeTab", tabName, { source: "AppActions.switchTab" });
        console.log(`[AppActions] Switched to tab: ${tabName}`);
    },

    /**
     * Toggle theme between light, dark, and auto (system)
     * @param {string} theme - Theme to switch to ('light', 'dark', 'auto' | legacy 'system')
     */
    switchTheme(theme) {
        const normalizedTheme = theme === "system" ? THEME_MODES.AUTO : theme;
        const validThemes = new Set(Object.values(THEME_MODES));

        if (!validThemes.has(normalizedTheme)) {
            console.warn(`[AppActions] Invalid theme: ${theme}`);
            return;
        }

        setThemePreference(normalizedTheme, { withTransition: true });
        console.log(`[AppActions] Theme switched to: ${normalizedTheme}`);
    },

    /**
     * Toggle chart controls visibility
     */
    toggleChartControls() {
        const currentState = getState("charts.controlsVisible");
        setState("charts.controlsVisible", !currentState, { source: "AppActions.toggleChartControls" });
        console.log(`[AppActions] Chart controls ${currentState ? "hidden" : "shown"}`);
    },

    /**
     * Toggle map measurement mode
     */
    toggleMeasurementMode() {
        const currentState = getState("map.measurementMode");
        setState("map.measurementMode", !currentState, { source: "AppActions.toggleMeasurementMode" });
        console.log(`[AppActions] Measurement mode ${currentState ? "disabled" : "enabled"}`);
    },

    /**
     * Update window state
     * @param {Object} windowState - Window state object
     */
    updateWindowState(windowState) {
        updateState("ui.windowState", windowState, { source: "AppActions.updateWindowState" });
        console.log("[AppActions] Window state updated:", windowState);
    },
};

/**
 * State selectors - helper functions to get computed state values
 */
export const AppSelectors = {
    /**
     * Get the current active tab
     * @returns {string} Active tab name
     */
    activeTab() {
        return getState("ui.activeTab") || "summary";
    },

    /**
     * Check if charts are rendered
     * @returns {boolean} True if charts are rendered
     */
    areChartsRendered() {
        return getState("charts.isRendered") || false;
    },

    /**
     * Check if tables are rendered
     * @returns {boolean} True if tables are rendered
     */
    areTablesRendered() {
        return getState("tables.isRendered") || false;
    },

    /**
     * Get current theme
     * @returns {string} Current theme
     */
    currentTheme() {
        return getState("ui.theme") || THEME_MODES.AUTO;
    },

    /**
     * Get chart configuration
     * @returns {Object} Chart configuration
     */
    getChartConfig() {
        return getState("charts") || {};
    },

    /**
     * Get current file path
     * @returns {string|null} Current file path
     */
    getCurrentFile() {
        return getState("currentFile");
    },

    /**
     * Get map configuration
     * @returns {Object} Map configuration
     */
    getMapConfig() {
        return getState("map") || {};
    },

    /**
     * Get performance metrics
     * @returns {Object} Performance data
     */
    getPerformanceMetrics() {
        return getState("performance") || {};
    },

    /**
     * Check if any data is loaded
     * @returns {boolean} True if data is loaded
     */
    hasData() {
        return getState("globalData") !== null;
    },

    /**
     * Check if app is currently loading
     * @returns {boolean} True if loading
     */
    isLoading() {
        return getState("isLoading") || false;
    },

    /**
     * Check if map is rendered
     * @returns {boolean} True if map is rendered
     */
    isMapRendered() {
        return getState("map.isRendered") || false;
    },

    /**
     * Check if a specific tab is active
     * @param {string} tabName - Tab name to check
     * @returns {boolean} True if tab is active
     */
    isTabActive(tabName) {
        return this.activeTab() === tabName;
    },
};

/**
 * State middleware - functions that can intercept and modify state changes
 */
export class StateMiddleware {
    constructor() {
        /** @type {MiddlewareFn[]} */
        this.middlewares = [];
    }

    /**
     * Apply all middlewares to a state change
     * @param {string} path - State path
     * @param {*} value - New value
     * @param {*} oldValue - Old value
     * @param {Object} options - Options
     * @returns {*} Potentially modified value
     */
    /**
     * @param {string} path
     * @param {any} value
     * @param {any} oldValue
     * @param {Record<string, any>} options
     * @returns {any}
     */
    apply(path, value, oldValue, options) {
        let modifiedValue = value;

        for (const middleware of this.middlewares) {
            try {
                const result = middleware(path, modifiedValue, oldValue, options);
                if (result !== undefined) {
                    modifiedValue = result;
                }
            } catch (error) {
                console.error("[StateMiddleware] Error in middleware:", error);
            }
        }

        return modifiedValue;
    }

    /**
     * Add middleware function
     * @param {Function} middleware - Middleware function
     */
    /**
     * @param {MiddlewareFn} middleware
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }
}

// Create global middleware instance
export const stateMiddleware = new StateMiddleware();

// Add some default middleware
stateMiddleware.use((path, value, oldValue) => {
    // Log important state changes
    if (path.includes("isRendered") || path === "ui.activeTab") {
        console.log(`[StateMiddleware] ${path} changed:`, { newValue: value, oldValue });
    }
});

/**
 * Create a computed state value that updates when dependencies change
 * @param {Function} computeFn - Function to compute the value
 * @param {Array<string>} dependencies - Array of state paths to watch
 * @returns {Function} Function that returns the computed value
 */
/**
 * Create a lazily evaluated memoized computed value invalidated by dependencies.
 * @template T
 * @param {() => T} computeFn
 * @param {string[]} [dependencies]
 * @returns {(() => T) & { cleanup: () => void }}
 */
export function useComputed(computeFn, dependencies = []) {
    /** @type {T} */
    let cachedValue,
        isValid = false;

    // Subscribe to dependency changes
    const getComputedValue = () => {
        if (!isValid) {
            cachedValue = computeFn();
            isValid = true;
        }
        return cachedValue;
    },
        unsubscribers = dependencies.map((dep) =>
            subscribe(dep, () => {
                isValid = false;
            })
        );

    // Cleanup function
    getComputedValue.cleanup = () => {
        for (const unsub of unsubscribers) unsub();
    };

    return getComputedValue;
}

/**
 * Create a hook-like function for components to use state
 * @param {string} path - State path to watch
 * @param {*} defaultValue - Default value if state is undefined
 * @returns {Array} [value, setter] tuple
 */
/**
 * Hook-like accessor for state values with a setter.
 * @template T
 * @param {string} path
 * @param {T} [defaultValue]
 * @returns {[T, (newValue: T) => void]}
 */
export function useState(path, defaultValue) {
    const currentValue = getState(path) ?? defaultValue,
        /** @type {(newValue: any) => void} */
        setter = (newValue) => {
            setState(path, newValue, { source: "useState" });
        };

    return /** @type {[any, (newValue: any) => void]} */ ([currentValue, setter]);
}
