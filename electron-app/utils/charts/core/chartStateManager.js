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
    isInitialized = false;

    renderDebounceTime = 250;

    renderTimeout = null;

    constructor() {
        // Ms
        /** @type {number|ReturnType<typeof setTimeout>|null} */
        /** @type {boolean} */

        // Initialize state subscriptions
        this.initializeSubscriptions();

        console.log("[ChartStateManager] Initialized");
    }

    /**
     * Backwards compatibility alias expected by legacy code (setupWindow cleanup calls)
     */
    cleanup() {
        this.destroy();
    }

    /**
     * Clear chart state when new data is loaded or charts are unloaded
     */
    clearChartState() {
        this.destroyExistingCharts();

        updateState(
            "charts",
            {
                chartData: null,
                isRendered: false,
                tabActive: false,
            },
            { source: "ChartStateManager.clearChartState" }
        );
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
     * Properly destroy existing chart instances
     */
    destroyExistingCharts() {
        if (globalThis._chartjsInstances && Array.isArray(globalThis._chartjsInstances)) {
            for (const [index, chart] of globalThis._chartjsInstances.entries()) {
                try {
                    if (chart && typeof chart.destroy === "function") {
                        chart.destroy();
                    }
                } catch (error) {
                    console.warn(`[ChartStateManager] Error destroying chart ${index}:`, error);
                }
            }
            globalThis._chartjsInstances = [];
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
            instanceCount: globalThis._chartjsInstances?.length || 0,
            isRendered: chartState?.isRendered || false,
            isRendering: chartState?.isRendering || false,
            lastRenderTime: chartState?.lastRenderTime,
            selectedChart: chartState?.selectedChart || "elevation",
            tabActive: chartState?.tabActive || false,
        };
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
     * Check if chart tab is currently active
     * @returns {boolean} True if chart tab is active
     */
    isChartTabActive() {
        const activeTab = getState("ui.activeTab");
        return activeTab === "chartjs" || activeTab === "chart";
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
                document.querySelector("#chartjs-chart-container") ||
                document.querySelector("#content-chartjs") ||
                document.querySelector("#content-chart");

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
     * Update chart controls visibility
     * @param {boolean} visible - Whether controls should be visible
     */
    updateControlsVisibility(/** @type {boolean} */ visible) {
        const controlsPanel = document.querySelector(".chart-controls");
        if (controlsPanel instanceof HTMLElement) {
            controlsPanel.style.display = visible ? "block" : "none";
        }
    }
}

// Create and export singleton instance
export const chartStateManager = new ChartStateManager();

// Expose some methods globally for backward compatibility and debugging
if (globalThis.window !== undefined) {
    globalThis.chartStateManager = chartStateManager;
}

export default chartStateManager;
