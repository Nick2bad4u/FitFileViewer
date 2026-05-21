import { getState, setState, subscribe, updateState, } from "../../state/core/stateManager.js";
import { subscribeToChartSettings, } from "../../state/domain/settingsStateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { getChartRenderContainer } from "../dom/chartDomUtils.js";
import { invalidateChartRenderCache, renderChartJS } from "./renderChartJS.js";
import { hasChartDataRecordMessages } from "./renderChartDataPreparation.js";
/**
 * Chart state manager handles chart-related state, lifecycle, and reactive
 * updates.
 */
export class ChartStateManager {
    isInitialized = false;
    isRendering = false;
    pendingRenderReason = null;
    renderDebounceTime = 250;
    renderTimeout = null;
    constructor() {
        this.initializeSubscriptions();
        console.log("[ChartStateManager] Initialized");
    }
    /**
     * Backwards compatibility alias expected by legacy window cleanup code.
     */
    cleanup() {
        this.destroy();
    }
    /**
     * Clears chart state when new data is loaded or charts are unloaded.
     */
    clearChartState() {
        invalidateChartRenderCache("ChartStateManager.clearChartState");
        this.destroyExistingCharts();
        updateState("charts", {
            chartData: null,
            isRendered: false,
            tabActive: false,
        }, { source: "ChartStateManager.clearChartState" });
    }
    /**
     * Debounced chart rendering to prevent excessive re-renders.
     *
     * @param reason - Reason for the render request.
     */
    debouncedRender(reason = "State change") {
        if (this.isRendering) {
            this.pendingRenderReason = reason;
            return;
        }
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        this.renderTimeout = setTimeout(() => {
            void this.performChartRender(reason);
        }, this.renderDebounceTime);
    }
    /**
     * Cleanup method for removing subscriptions and clearing timers.
     */
    destroy() {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        this.clearChartState();
        console.log("[ChartStateManager] Destroyed");
    }
    /**
     * Properly destroys existing chart instances.
     */
    destroyExistingCharts() {
        const chartGlobal = globalThis;
        if (!Array.isArray(chartGlobal._chartjsInstances)) {
            return;
        }
        for (const [index, chart] of chartGlobal._chartjsInstances.entries()) {
            try {
                if (chart && typeof chart.destroy === "function") {
                    chart.destroy();
                }
            }
            catch (error) {
                console.warn(`[ChartStateManager] Error destroying chart ${index}:`, error);
            }
        }
        chartGlobal._chartjsInstances = [];
    }
    /**
     * Forces an immediate chart re-render.
     *
     * @param reason - Reason for the render.
     */
    forceRender(reason = "Manual trigger") {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        void this.performChartRender(reason);
    }
    /**
     * Gets current chart state information.
     */
    getChartInfo() {
        const chartState = getChartState(), chartGlobal = globalThis;
        const info = {
            instanceCount: chartGlobal._chartjsInstances?.length ?? 0,
            isRendered: chartState?.isRendered ?? false,
            isRendering: chartState?.isRendering ?? false,
            selectedChart: chartState?.selectedChart ?? "elevation",
            tabActive: chartState?.tabActive ?? false,
        };
        if (chartState?.lastRenderTime !== undefined) {
            info.lastRenderTime = chartState.lastRenderTime;
        }
        return info;
    }
    /**
     * Handles new data being loaded.
     *
     * @param newData - The new global FIT data.
     */
    handleDataChange(newData) {
        console.log("[ChartStateManager] Data changed, checking if charts need update");
        this.clearChartState();
        if (hasChartDataRecordMessages(newData) && this.isChartTabActive()) {
            this.debouncedRender("New data loaded");
        }
    }
    /**
     * Handles chart tab activation.
     */
    handleTabActivation() {
        const chartState = getChartState(), globalData = getGlobalFitData();
        console.log("[ChartStateManager] Chart tab activated");
        setState("charts.tabActive", true, {
            source: "ChartStateManager.handleTabActivation",
        });
        if (chartState?.isRendering === true) {
            console.log("[ChartStateManager] Render already in progress - skipping activation render");
            return;
        }
        if (isRecord(globalData)) {
            const isRendered = chartState?.isRendered ?? false, hasRenderableOutput = hasExistingRenderableChartOutput();
            if (!isRendered || !hasRenderableOutput) {
                this.debouncedRender("Tab activation with data available");
            }
        }
    }
    /**
     * Handles theme changes with proper chart re-rendering.
     *
     * @param newTheme - Optional new theme name for legacy callers.
     */
    handleThemeChange(newTheme) {
        const chartState = getChartState();
        if (!chartState) {
            return;
        }
        if (chartState.isRendered && this.isChartTabActive()) {
            this.debouncedRender(newTheme ? `Theme change to ${newTheme}` : "Theme change");
        }
    }
    /**
     * Initializes reactive subscriptions for chart updates.
     */
    initializeSubscriptions() {
        subscribe("ui.theme", (newTheme, oldTheme) => {
            if (typeof newTheme === "string" &&
                typeof oldTheme === "string" &&
                oldTheme &&
                newTheme !== oldTheme) {
                console.log(`[ChartStateManager] Theme changed: ${oldTheme} -> ${newTheme}`);
                this.handleThemeChange(newTheme);
            }
        });
        subscribe("ui.activeTab", (activeTab) => {
            if (activeTab === "chartjs" || activeTab === "chart") {
                this.handleTabActivation();
            }
        });
        subscribe("globalData", (newData, oldData) => {
            if (newData !== oldData) {
                this.handleDataChange(newData);
            }
        });
        subscribe("charts.selectedChart", (chartType) => {
            this.debouncedRender(`Chart type changed to ${String(chartType)}`);
        });
        subscribe("charts.controlsVisible", (visible) => {
            this.updateControlsVisibility(visible === true);
        });
        subscribeToChartSettings((nextSettings, previousSettings) => {
            const hasChanges = !areObjectsShallowEqual(nextSettings, previousSettings) ||
                !areObjectsShallowEqual(nextSettings.fieldVisibility, previousSettings.fieldVisibility);
            if (!hasChanges) {
                return;
            }
            setState("settings.charts", nextSettings, {
                source: "ChartStateManager.chartSettingsSubscription",
            });
            if (this.isChartTabActive()) {
                this.debouncedRender("Chart settings updated");
            }
        });
        this.isInitialized = true;
    }
    /**
     * Checks if the chart tab is currently active.
     */
    isChartTabActive() {
        const activeTab = getState("ui.activeTab");
        return activeTab === "chartjs" || activeTab === "chart";
    }
    /**
     * Performs actual chart rendering.
     *
     * @param reason - Reason for rendering.
     */
    async performChartRender(reason) {
        console.log(`[ChartStateManager] Rendering charts: ${reason}`);
        if (this.isRendering) {
            this.pendingRenderReason = reason;
            console.log(`[ChartStateManager] Render in progress - queued follow-up render: ${reason}`);
            return;
        }
        this.isRendering = true;
        try {
            setState("charts.isRendering", true, {
                source: "ChartStateManager.performChartRender",
            });
            const container = getChartRenderContainer(document);
            if (!container) {
                console.warn("[ChartStateManager] Chart container not found");
                setState("charts.isRendering", false, {
                    source: "ChartStateManager.performChartRender",
                });
                return;
            }
            this.destroyExistingCharts();
            const success = await renderChartJS(container);
            if (success) {
                setState("charts.lastRenderTime", Date.now(), {
                    source: "ChartStateManager.performChartRender",
                });
                console.log(`[ChartStateManager] Charts rendered successfully: ${reason}`);
            }
            else {
                this.reportSkippedOrFailedRender(reason);
            }
        }
        catch (error) {
            console.error("[ChartStateManager] Error during chart rendering:", error);
            void showNotification("Failed to render charts", "error");
        }
        finally {
            setState("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });
            this.isRendering = false;
            this.renderPendingFollowUp();
        }
    }
    /**
     * Updates chart controls visibility.
     *
     * @param visible - Whether controls should be visible.
     */
    updateControlsVisibility(visible) {
        const controlsPanel = document.querySelector(".chart-controls");
        if (controlsPanel instanceof HTMLElement) {
            controlsPanel.style.display = visible ? "block" : "none";
        }
    }
    reportSkippedOrFailedRender(reason) {
        const skipReasons = [];
        if (!this.isChartTabActive()) {
            skipReasons.push("chart tab inactive");
        }
        const globalData = getGlobalFitData(), hasRecords = hasChartDataRecordMessages(globalData);
        if (!hasRecords) {
            skipReasons.push("no chartable data");
        }
        if (skipReasons.length > 0) {
            console.info(`[ChartStateManager] Skipped chart render (${reason}): ${skipReasons.join(", ")}`);
            return;
        }
        console.warn(`[ChartStateManager] Chart rendering failed: ${reason}`);
    }
    renderPendingFollowUp() {
        if (typeof this.pendingRenderReason !== "string" ||
            this.pendingRenderReason.length === 0) {
            return;
        }
        const followUpReason = this.pendingRenderReason;
        this.pendingRenderReason = null;
        if (this.isChartTabActive()) {
            const followUpTimeout = setTimeout(() => {
                if (this.renderTimeout === followUpTimeout) {
                    this.renderTimeout = null;
                }
                this.debouncedRender(`Follow-up: ${followUpReason}`);
            }, 0);
            this.renderTimeout = followUpTimeout;
        }
    }
}
function areObjectsShallowEqual(first, second) {
    const left = first && typeof first === "object" ? first : {};
    const right = second && typeof second === "object" ? second : {};
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
        return false;
    }
    return leftKeys.every((key) => Object.is(left[key], right[key]));
}
function getChartInstanceCount() {
    const chartGlobal = globalThis, instances = chartGlobal._chartjsInstances ??
        chartGlobal.window?._chartjsInstances ??
        [];
    return Array.isArray(instances) ? instances.length : 0;
}
function getChartState() {
    const value = getState("charts");
    return isRecord(value) ? value : undefined;
}
function getGlobalFitData() {
    return getState("globalData");
}
function hasExistingRenderableChartOutput() {
    try {
        const instanceCount = getChartInstanceCount(), container = getChartRenderContainer(document), canvasCount = container
            ? container.querySelectorAll("canvas").length
            : 0;
        return instanceCount > 0 && canvasCount > 0;
    }
    catch {
        return false;
    }
}
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
/**
 * Singleton chart state manager instance used by legacy chart modules.
 */
export const chartStateManager = new ChartStateManager();
const chartGlobal = globalThis;
if (chartGlobal.window !== undefined) {
    chartGlobal.chartStateManager = chartStateManager;
}
export default chartStateManager;
