/**
 * Provides a clean interface for chart tab functionality without hacky
 * implementations
 *
 * @version 3.0.0
 *
 * @file Chart Tab Integration - Clean integration between chart state and tab
 *   management
 *
 * @author FitFileViewer Development Team
 */

import { getState, subscribe } from "../../state/core/stateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { tabStateManager } from "../../ui/tabs/tabStateManager.js";
import { chartStateManager } from "./chartStateManager.js";

/**
 * Chart Tab Integration - manages the interaction between chart rendering and
 * tab system
 */
class ChartTabIntegration {
    isInitialized = false;

    constructor() {
        // Don't auto-initialize - let setupWindow() control initialization timing
    }

    /**
     * Check if charts should be rendered and do so if needed
     */
    checkAndRenderCharts() {
        const globalData = getState("globalData");

        if (!globalData || !globalData.recordMesgs) {
            console.log(
                "[ChartTabIntegration] No data available for chart rendering"
            );
            return;
        }

        if (this.isChartTabActive()) {
            console.log(
                "[ChartTabIntegration] Chart tab is active, requesting render"
            );
            chartStateManager.debouncedRender(
                "Integration check after file load"
            );
        } else {
            console.log(
                "[ChartTabIntegration] Chart tab not active, skipping render"
            );
        }
    }

    /**
     * Cleanup method for compatibility
     */
    cleanup() {
        this.destroy();
    }

    /**
     * Clean up integration
     */
    destroy() {
        this.isInitialized = false;
        console.log("[ChartTabIntegration] Destroyed");
    }

    /**
     * Disable the chart tab
     */
    disableChartTab() {
        const chartTabButton = this.getChartTabButton();
        if (chartTabButton) {
            /** @type {any} */ (chartTabButton).disabled = true;
            chartTabButton.classList.add("disabled");
            chartTabButton.style.opacity = "0.5";
        }
    }

    /**
     * Enable the chart tab
     */
    enableChartTab() {
        const chartTabButton = this.getChartTabButton();
        if (chartTabButton) {
            /** @type {any} */ (chartTabButton).disabled = false;
            chartTabButton.classList.remove("disabled");
            chartTabButton.style.opacity = "1";
        }
    }

    /**
     * Get the chart tab button element
     *
     * @returns {HTMLElement | null} Chart tab button or null if not found
     */
    getChartTabButton() {
        return (
            document.querySelector("#tab-chartjs") ||
            document.querySelector("#tab-chart") ||
            document.querySelector('[data-tab="chart"]')
        );
    }

    /**
     * Get integration status information
     *
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            chartState: chartStateManager.getChartInfo(),
            chartTabActive: this.isChartTabActive(),
            hasData: Boolean(getState("globalData")?.recordMesgs),
            isInitialized: this.isInitialized,
            tabState: tabStateManager.getActiveTabInfo(),
        };
    }

    /**
     * Handle new data being loaded
     *
     * @param {Object} newData - The new global data
     */
    handleDataChange(newData) {
        console.log(
            "[ChartTabIntegration] Data changed, updating availability"
        );

        if (newData && /** @type {any} */ (newData).recordMesgs) {
            // Enable chart tab
            this.enableChartTab();

            // If chart tab is active, render charts
            if (this.isChartTabActive()) {
                chartStateManager.debouncedRender(
                    "New data loaded via integration"
                );
            }
        } else {
            // Disable chart tab and clear charts
            this.disableChartTab();
            chartStateManager.clearChartState();
        }
    }

    /**
     * Initialize the chart tab integration
     */
    initialize() {
        if (this.isInitialized) {
            console.warn("[ChartTabIntegration] Already initialized");
            return;
        }

        this.setupIntegration();
        this.isInitialized = true;

        console.log("[ChartTabIntegration] Initialized successfully");
    }

    /**
     * Check if chart tab is currently active
     *
     * @returns {boolean} True if chart tab is active
     */
    isChartTabActive() {
        const activeTab = getState("ui.activeTab");
        return activeTab === "chartjs" || activeTab === "chart";
    }

    /**
     * Force chart refresh (for external calls)
     *
     * @param {string} reason - Reason for the refresh
     */
    refreshCharts(reason = "Manual refresh") {
        const globalData = getState("globalData");

        if (!globalData || !globalData.recordMesgs) {
            showNotification(
                "No data available for chart rendering",
                "warning"
            );
            return false;
        }

        chartStateManager.forceRender(reason);
        return true;
    }

    /**
     * Set up integration between chart and tab systems
     */
    setupIntegration() {
        // Subscribe to file loading events to trigger chart updates
        subscribe(
            "globalData",
            (/** @type {any} */ newData, /** @type {any} */ oldData) => {
                if (newData !== oldData) {
                    this.handleDataChange(newData);
                }
            }
        );

        // Subscribe to file loading state
        subscribe("app.isOpeningFile", (/** @type {any} */ isOpening) => {
            if (!isOpening) {
                // File finished loading, check if we need to render charts
                this.checkAndRenderCharts();
            }
        });

        // Expose methods for external calls (backward compatibility)
        /** @type {any} */ (globalThis).chartTabIntegration = this;
    }
    /**
     * Switch to chart tab
     *
     * @returns {boolean} True if switch was successful
     */
    switchToChartTab() {
        const globalData = getState("globalData");

        if (!globalData || !globalData.recordMesgs) {
            showNotification("Please load a FIT file first", "info");
            return false;
        }

        return (
            tabStateManager.switchToTab("chartjs") ||
            tabStateManager.switchToTab("chart")
        );
    }
}

// Create and export singleton instance
export const chartTabIntegration = new ChartTabIntegration();

// Expose for debugging
if (globalThis.window !== undefined) {
    /** @type {any} */ (globalThis).chartTabIntegration = chartTabIntegration;
}

export default chartTabIntegration;
