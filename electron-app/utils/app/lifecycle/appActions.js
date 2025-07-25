/**
 * Application State Actions and Transitions
 * Higher-level actions that encapsulate common state changes
 */

import { setState, getState, updateState, subscribe } from "../../state/core/stateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

/**
 * Application state actions - higher-level functions for common state changes
 */
export const AppActions = {
    /**
     * Set application initialization state
     * @param {boolean} initialized - Whether the app is initialized
     */
    setInitialized(initialized) {
        setState("app.initialized", initialized, { source: "AppActions.setInitialized" });
        console.log(`[AppActions] App initialization state: ${initialized}`);
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
     * Toggle theme between light, dark, and system
     * @param {string} theme - Theme to switch to ('light', 'dark', 'system')
     */
    switchTheme(theme) {
        const validThemes = ["light", "dark", "system"];

        if (!validThemes.includes(theme)) {
            console.warn(`[AppActions] Invalid theme: ${theme}`);
            return;
        }

        setState("ui.theme", theme, { source: "AppActions.switchTheme" });
        console.log(`[AppActions] Theme switched to: ${theme}`);
    },

    /**
     * Update chart rendering state and options
     * @param {Object} chartData - Chart data
     * @param {Object} options - Chart options
     */
    renderChart(chartData, options = {}) {
        const startTime = performance.now();

        updateState(
            "charts",
            {
                isRendered: true,
                chartData,
                chartOptions: options,
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
     * @param {Array} center - [lat, lng] coordinates for map center
     * @param {number} zoom - Zoom level
     */
    renderMap(center, zoom = 13) {
        const startTime = performance.now();

        updateState(
            "map",
            {
                isRendered: true,
                center,
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
    renderTable(tableConfig = {}) {
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
     * Toggle chart controls visibility
     */
    toggleChartControls() {
        const currentState = getState("charts.controlsVisible");
        setState("charts.controlsVisible", !currentState, { source: "AppActions.toggleChartControls" });
        console.log(`[AppActions] Chart controls ${!currentState ? "shown" : "hidden"}`);
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
     * Toggle map measurement mode
     */
    toggleMeasurementMode() {
        const currentState = getState("map.measurementMode");
        setState("map.measurementMode", !currentState, { source: "AppActions.toggleMeasurementMode" });
        console.log(`[AppActions] Measurement mode ${!currentState ? "enabled" : "disabled"}`);
    },

    /**
     * Update window state
     * @param {Object} windowState - Window state object
     */
    updateWindowState(windowState) {
        updateState("ui.windowState", windowState, { source: "AppActions.updateWindowState" });
        console.log("[AppActions] Window state updated:", windowState);
    },

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
};

/**
 * State selectors - helper functions to get computed state values
 */
export const AppSelectors = {
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
     * Get the current active tab
     * @returns {string} Active tab name
     */
    activeTab() {
        return getState("ui.activeTab") || "summary";
    },

    /**
     * Check if a specific tab is active
     * @param {string} tabName - Tab name to check
     * @returns {boolean} True if tab is active
     */
    isTabActive(tabName) {
        return this.activeTab() === tabName;
    },

    /**
     * Get current theme
     * @returns {string} Current theme
     */
    currentTheme() {
        return getState("ui.theme") || "system";
    },

    /**
     * Check if charts are rendered
     * @returns {boolean} True if charts are rendered
     */
    areChartsRendered() {
        return getState("charts.isRendered") || false;
    },

    /**
     * Check if map is rendered
     * @returns {boolean} True if map is rendered
     */
    isMapRendered() {
        return getState("map.isRendered") || false;
    },

    /**
     * Check if tables are rendered
     * @returns {boolean} True if tables are rendered
     */
    areTablesRendered() {
        return getState("tables.isRendered") || false;
    },

    /**
     * Get performance metrics
     * @returns {Object} Performance data
     */
    getPerformanceMetrics() {
        return getState("performance") || {};
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
     * Get chart configuration
     * @returns {Object} Chart configuration
     */
    getChartConfig() {
        return getState("charts") || {};
    },
};

/**
 * State middleware - functions that can intercept and modify state changes
 */
export class StateMiddleware {
    constructor() {
        this.middlewares = [];
    }

    /**
     * Add middleware function
     * @param {Function} middleware - Middleware function
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * Apply all middlewares to a state change
     * @param {string} path - State path
     * @param {*} value - New value
     * @param {*} oldValue - Old value
     * @param {Object} options - Options
     * @returns {*} Potentially modified value
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
}

// Create global middleware instance
export const stateMiddleware = new StateMiddleware();

// Add some default middleware
stateMiddleware.use((path, value, oldValue) => {
    // Log important state changes
    if (path.includes("isRendered") || path === "ui.activeTab") {
        console.log(`[StateMiddleware] ${path} changed:`, { oldValue, newValue: value });
    }
});

/**
 * Create a hook-like function for components to use state
 * @param {string} path - State path to watch
 * @param {*} defaultValue - Default value if state is undefined
 * @returns {Array} [value, setter] tuple
 */
export function useState(path, defaultValue = undefined) {
    const currentValue = getState(path) ?? defaultValue;

    const setter = (newValue) => {
        setState(path, newValue, { source: "useState" });
    };

    return [currentValue, setter];
}

/**
 * Create a computed state value that updates when dependencies change
 * @param {Function} computeFn - Function to compute the value
 * @param {Array<string>} dependencies - Array of state paths to watch
 * @returns {Function} Function that returns the computed value
 */
export function useComputed(computeFn, dependencies = []) {
    let cachedValue;
    let isValid = false;

    // Subscribe to dependency changes
    const unsubscribers = dependencies.map((dep) =>
        subscribe(dep, () => {
            isValid = false;
        })
    );

    const getComputedValue = () => {
        if (!isValid) {
            cachedValue = computeFn();
            isValid = true;
        }
        return cachedValue;
    };

    // Cleanup function
    getComputedValue.cleanup = () => {
        unsubscribers.forEach((unsub) => unsub());
    };

    return getComputedValue;
}
