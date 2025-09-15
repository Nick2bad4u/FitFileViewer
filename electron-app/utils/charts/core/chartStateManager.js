/**
 * @fileoverview Chart State Manager - Centralized chart state management with reactive updates
 * @description Manages chart rendering, theming, and lifecycle through the centralized state system
 * @author FitFileViewer Development Team
 * @version 3.0.0
 */

import { getState, setState, subscribe, updateState } from "../../state/core/stateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { renderChartJS } from "./renderChartJS.js";

/**
 * @typedef {Object} FitGlobalData
 * @property {Array<Object>} [recordMesgs]
 */

/**
 * @typedef {Object} ChartInfo
 * @property {boolean} isRendered
 * @property {boolean} isRendering
 * @property {boolean} tabActive
 * @property {string} selectedChart
 * @property {number|undefined} [lastRenderTime]
 * @property {number} instanceCount
 */

/**
 * Chart State Manager - handles all chart-related state and reactive updates
 */
class ChartStateManager {
    constructor() {
        this.renderDebounceTime = 250; // Ms
        /** @type {number|ReturnType<typeof setTimeout>|null} */
        this.renderTimeout = null;
        /** @type {boolean} */
        this.isInitialized = false;

        // Initialize state subscriptions
        this.initializeSubscriptions();

        console.log("[ChartStateManager] Initialized");
    }

    /**
     * Initialize reactive subscriptions for chart updates
     */
    initializeSubscriptions() {
        // Subscribe to theme changes for automatic chart re-theming
        subscribe("ui.theme", (/** @type {string} */ newTheme, /** @type {string} */ oldTheme) => {
            if (oldTheme && newTheme !== oldTheme) {
                console.log(`[ChartStateManager] Theme changed: ${oldTheme} -> ${newTheme}`);
                this.handleThemeChange(newTheme);
            }
        });

        // Subscribe to active tab changes
        subscribe("ui.activeTab", (/** @type {string} */ activeTab) => {
            if (activeTab === "chartjs" || activeTab === "chart") {
                this.handleTabActivation();
            }
        });

        // Subscribe to global data changes (new file loaded)
        subscribe("globalData", (/** @type {FitGlobalData} */ newData, /** @type {FitGlobalData} */ oldData) => {
            if (newData !== oldData) {
                this.handleDataChange(newData);
            }
        });

        // Subscribe to chart settings changes
        subscribe("charts.selectedChart", (/** @type {string} */ chartType) => {
            this.debouncedRender(`Chart type changed to ${chartType}`);
        });

        subscribe("charts.controlsVisible", (/** @type {boolean} */ visible) => {
            this.updateControlsVisibility(visible);
        });

        this.isInitialized = true;
    }

    /**
     * Handle theme changes with proper chart re-rendering
     * @param {string} [newTheme] - The new theme name (optional for legacy callers)
     */
    handleThemeChange(/** @type {string|undefined} */ newTheme) {
        const chartState = getState("charts");
        if (!chartState) {
            return;
        }
        // Only re-render if charts are currently rendered and visible
        if (chartState.isRendered && this.isChartTabActive()) {
            this.debouncedRender(newTheme ? `Theme change to ${newTheme}` : "Theme change");
        }
    }

    /**
     * Handle chart tab activation
     */
    handleTabActivation() {
        const chartState = getState("charts"),
            globalData = getState("globalData");

        console.log("[ChartStateManager] Chart tab activated");

        // Set chart tab as active in state
        setState("charts.tabActive", true, { source: "ChartStateManager.handleTabActivation" });

        // Render charts if we have data but charts aren't rendered yet
        if (globalData && !chartState?.isRendered) {
            this.debouncedRender("Tab activation with data available");
        }
    }

    /**
     * Handle new data being loaded
     * @param {Object} newData - The new global data
     */
    handleDataChange(/** @type {FitGlobalData|null|undefined} */ newData) {
        console.log("[ChartStateManager] Data changed, checking if charts need update");

        // Clear existing chart state
        this.clearChartState();

        if (newData && Array.isArray(newData.recordMesgs) && this.isChartTabActive()) {
            // Data is available and chart tab is active, render charts
            this.debouncedRender("New data loaded");
        }
    }

    /**
     * Check if chart tab is currently active
     * @returns {boolean} True if chart tab is active
     */
    isChartTabActive() {
        const activeTab = getState("ui.activeTab");
        return activeTab === "chartjs" || activeTab === "chart";
    }

    /**
     * Debounced chart rendering to prevent excessive re-renders
     * @param {string} reason - Reason for the render request
     */
    debouncedRender(reason = "State change") {
        // Clear existing timeout
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }

        // Set new timeout
        this.renderTimeout = setTimeout(() => {
            this.performChartRender(reason);
        }, this.renderDebounceTime);
    }

    /**
     * Perform actual chart rendering
     * @param {string} reason - Reason for rendering
     */
    async performChartRender(reason) {
        console.log(`[ChartStateManager] Rendering charts: ${reason}`);

        try {
            // Set rendering state
            setState("charts.isRendering", true, { source: "ChartStateManager.performChartRender" });

            // Get chart container
            const container =
                document.getElementById("chartjs-chart-container") ||
                document.getElementById("content-chartjs") ||
                document.getElementById("content-chart");

            if (!container) {
                console.warn("[ChartStateManager] Chart container not found");
                setState("charts.isRendering", false, { source: "ChartStateManager.performChartRender" });
                return;
            }

            // Clear existing charts properly
            this.destroyExistingCharts();

            // Render new charts
            const success = await renderChartJS(container);

            if (success) {
                setState("charts.lastRenderTime", Date.now(), { source: "ChartStateManager.performChartRender" });
                console.log(`[ChartStateManager] Charts rendered successfully: ${reason}`);
            } else {
                console.warn(`[ChartStateManager] Chart rendering failed: ${reason}`);
            }
        } catch (error) {
            console.error("[ChartStateManager] Error during chart rendering:", error);
            showNotification("Failed to render charts", "error");
        } finally {
            setState("charts.isRendering", false, { source: "ChartStateManager.performChartRender" });
        }
    }

    /**
     * Properly destroy existing chart instances
     */
    destroyExistingCharts() {
        if (window._chartjsInstances && Array.isArray(window._chartjsInstances)) {
            window._chartjsInstances.forEach((chart, index) => {
                try {
                    if (chart && typeof chart.destroy === "function") {
                        chart.destroy();
                    }
                } catch (error) {
                    console.warn(`[ChartStateManager] Error destroying chart ${index}:`, error);
                }
            });
            window._chartjsInstances = [];
        }
    }

    /**
     * Clear chart state when new data is loaded or charts are unloaded
     */
    clearChartState() {
        this.destroyExistingCharts();

        updateState(
            "charts",
            {
                isRendered: false,
                chartData: null,
                tabActive: false,
            },
            { source: "ChartStateManager.clearChartState" }
        );
    }

    /**
     * Update chart controls visibility
     * @param {boolean} visible - Whether controls should be visible
     */
    updateControlsVisibility(/** @type {boolean} */ visible) {
        const controlsPanel = document.querySelector(".chart-controls");
        if (controlsPanel instanceof HTMLElement) {
            controlsPanel.style.display = visible ? "block" : "none";
        }
    }

    /**
     * Force immediate chart re-render (for external calls)
     * @param {string} reason - Reason for the render
     */
    forceRender(reason = "Manual trigger") {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        this.performChartRender(reason);
    }

    /**
     * Get current chart state information
     * @returns {Object} Chart state information
     */
    getChartInfo() {
        const chartState = getState("charts");
        return {
            isRendered: chartState?.isRendered || false,
            isRendering: chartState?.isRendering || false,
            tabActive: chartState?.tabActive || false,
            selectedChart: chartState?.selectedChart || "elevation",
            lastRenderTime: chartState?.lastRenderTime,
            instanceCount: window._chartjsInstances?.length || 0,
        };
    }

    /**
     * Cleanup method for removing subscriptions and clearing timers
     */
    destroy() {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        this.clearChartState();
        console.log("[ChartStateManager] Destroyed");
    }

    /**
     * Backwards compatibility alias expected by legacy code (setupWindow cleanup calls)
     */
    cleanup() {
        this.destroy();
    }
}

// Create and export singleton instance
export const chartStateManager = new ChartStateManager();

// Expose some methods globally for backward compatibility and debugging
if (typeof window !== "undefined") {
    window.chartStateManager = chartStateManager;
}

export default chartStateManager;
