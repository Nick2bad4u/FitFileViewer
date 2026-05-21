import { getState, subscribe } from "../../state/core/stateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { tabStateManager } from "../../ui/tabs/tabStateManager.js";
import { chartStateManager } from "./chartStateManager.js";
import { hasChartDataRecordMessages } from "./renderChartDataPreparation.js";
/**
 * Coordinates chart rendering state with the application tab system.
 */
export class ChartTabIntegration {
    isInitialized = false;
    /**
     * Check whether loaded data and the active tab require chart rendering.
     */
    checkAndRenderCharts() {
        const globalData = getGlobalFitData();
        if (!hasChartDataRecordMessages(globalData)) {
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
     * Cleanup compatibility alias.
     */
    cleanup() {
        this.destroy();
    }
    /**
     * Clean up integration state.
     */
    destroy() {
        this.isInitialized = false;
        console.log("[ChartTabIntegration] Destroyed");
    }
    /**
     * Disable the chart tab button when no FIT data is loaded.
     */
    disableChartTab() {
        const chartTabButton = this.getChartTabButton();
        if (!chartTabButton) {
            return;
        }
        chartTabButton.disabled = true;
        chartTabButton.classList.add("disabled");
        chartTabButton.style.opacity = "0.5";
    }
    /**
     * Enable the chart tab button when FIT data is loaded.
     */
    enableChartTab() {
        const chartTabButton = this.getChartTabButton();
        if (!chartTabButton) {
            return;
        }
        chartTabButton.disabled = false;
        chartTabButton.classList.remove("disabled");
        chartTabButton.style.opacity = "1";
    }
    /**
     * Get the chart tab button element.
     */
    getChartTabButton() {
        return asDisableableTabButton(
            document.querySelector("#tab_chartjs") ??
                document.querySelector("#tab_chart") ??
                document.querySelector('[data-tab="chart"]')
        );
    }
    /**
     * Get integration status information.
     */
    getStatus() {
        return {
            chartState: chartStateManager.getChartInfo(),
            chartTabActive: this.isChartTabActive(),
            hasData: hasChartDataRecordMessages(getGlobalFitData()),
            isInitialized: this.isInitialized,
            tabState: tabStateManager.getActiveTabInfo(),
        };
    }
    /**
     * Handle new FIT data being loaded or cleared.
     *
     * @param newData - The new global FIT data payload.
     */
    handleDataChange(newData) {
        console.log(
            "[ChartTabIntegration] Data changed, updating availability"
        );
        if (hasChartDataRecordMessages(newData)) {
            this.enableChartTab();
            if (this.isChartTabActive()) {
                chartStateManager.debouncedRender(
                    "New data loaded via integration"
                );
            }
        } else {
            this.disableChartTab();
            chartStateManager.clearChartState();
        }
    }
    /**
     * Initialize the chart tab integration.
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
     * Check if the chart tab is currently active.
     */
    isChartTabActive() {
        const activeTab = getState("ui.activeTab");
        return activeTab === "chartjs" || activeTab === "chart";
    }
    /**
     * Force chart refresh for external callers.
     *
     * @param reason - Reason for the refresh.
     */
    refreshCharts(reason = "Manual refresh") {
        const globalData = getGlobalFitData();
        if (!hasChartDataRecordMessages(globalData)) {
            void showNotification(
                "No data available for chart rendering",
                "warning"
            );
            return false;
        }
        chartStateManager.forceRender(reason);
        return true;
    }
    /**
     * Set up integration between chart and tab systems.
     */
    setupIntegration() {
        subscribe("globalData", (newData, oldData) => {
            if (newData !== oldData) {
                this.handleDataChange(newData);
            }
        });
        subscribe("app.isOpeningFile", (isOpening) => {
            if (isOpening !== true) {
                this.checkAndRenderCharts();
            }
        });
        const chartGlobal = globalThis;
        chartGlobal.chartTabIntegration = this;
    }
    /**
     * Switch to the chart tab when FIT data is available.
     */
    switchToChartTab() {
        const globalData = getGlobalFitData();
        if (!hasChartDataRecordMessages(globalData)) {
            void showNotification("Please load a FIT file first", "info");
            return false;
        }
        return (
            tabStateManager.switchToTab("chartjs") ||
            tabStateManager.switchToTab("chart")
        );
    }
}
function asDisableableTabButton(element) {
    return element instanceof HTMLElement ? element : null;
}
function getGlobalFitData() {
    return getState("globalData");
}
/**
 * Singleton chart tab integration used by the legacy UI bootstrap.
 */
export const chartTabIntegration = new ChartTabIntegration();
const chartGlobal = globalThis;
if (chartGlobal.window !== undefined) {
    chartGlobal.chartTabIntegration = chartTabIntegration;
}
export default chartTabIntegration;
