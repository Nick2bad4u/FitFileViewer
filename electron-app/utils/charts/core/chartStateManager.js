/**
 * Manages chart rendering, theming, and lifecycle through the centralized state
 * system
 *
 * @version 3.0.0
 *
 * @file Chart State Manager - Centralized chart state management with reactive
 *   updates
 *
 * @author FitFileViewer Development Team
 */

import {
    getState,
    setState,
    subscribe,
    updateState,
} from "../../state/core/stateManager.js";
import { subscribeToChartSettings } from "../../state/domain/settingsStateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { getChartRenderContainer } from "../dom/chartDomUtils.js";
import { invalidateChartRenderCache, renderChartJS } from "./renderChartJS.js";

/**
 * @typedef {Object} FitGlobalData
 *
 * @property {Object[]} [recordMesgs]
 */

/**
 * @typedef {Object} ChartInfo
 *
 * @property {boolean} isRendered
 * @property {boolean} isRendering
 * @property {boolean} tabActive
 * @property {string} selectedChart
 * @property {number | undefined} [lastRenderTime]
 * @property {number} instanceCount
 */

/**
 * Chart State Manager - handles all chart-related state and reactive updates
 */
class ChartStateManager {
    isInitialized = false;

    /**
     * Internal render lock to prevent concurrent renderChartJS() calls. State
     * also tracks charts.isRendering, but we need a synchronous in-process
     * guard.
     */
    isRendering = false;

    /**
     * If a render is requested while one is already running, store the reason
     * here. When the current render completes, we will run exactly one
     * follow-up render.
     */
    pendingRenderReason = null;

    renderDebounceTime = 250;

    /** @type {ReturnType<typeof setTimeout> | null} */
    renderTimeout = null;

    constructor() {
        // Initialize state subscriptions
        this.initializeSubscriptions();

        console.log("[ChartStateManager] Initialized");
    }

    /**
     * Backwards compatibility alias expected by legacy code (setupWindow
     * cleanup calls)
     */
    cleanup() {
        this.destroy();
    }

    /**
     * Clear chart state when new data is loaded or charts are unloaded
     */
    clearChartState() {
        invalidateChartRenderCache("ChartStateManager.clearChartState");
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
     *
     * @param {string} reason - Reason for the render request
     */
    debouncedRender(reason = "State change") {
        // If we're currently rendering, do not schedule another timer.
        // Queue one follow-up render instead (collapsed).
        if (this.isRendering) {
            this.pendingRenderReason = reason;
            return;
        }

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
        if (
            globalThis._chartjsInstances &&
            Array.isArray(globalThis._chartjsInstances)
        ) {
            for (const [
                index,
                chart,
            ] of globalThis._chartjsInstances.entries()) {
                try {
                    if (chart && typeof chart.destroy === "function") {
                        chart.destroy();
                    }
                } catch (error) {
                    console.warn(
                        `[ChartStateManager] Error destroying chart ${index}:`,
                        error
                    );
                }
            }
            globalThis._chartjsInstances = [];
        }
    }

    /**
     * Force immediate chart re-render (for external calls)
     *
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
     *
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
     *
     * @param {Object} newData - The new global data
     */
    handleDataChange(/** @type {FitGlobalData | null | undefined} */ newData) {
        console.log(
            "[ChartStateManager] Data changed, checking if charts need update"
        );

        // Clear existing chart state
        this.clearChartState();

        if (
            newData &&
            Array.isArray(newData.recordMesgs) &&
            this.isChartTabActive()
        ) {
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
        setState("charts.tabActive", true, {
            source: "ChartStateManager.handleTabActivation",
        });

        // If a render is already in progress (e.g., another trigger fired recently),
        // do not enqueue another render.
        if (
            chartState &&
            typeof chartState === "object" &&
            /** @type {any} */ (chartState).isRendering === true
        ) {
            console.log(
                "[ChartStateManager] Render already in progress - skipping activation render"
            );
            return;
        }

        // Render charts if we have data but charts aren't rendered yet.
        // Safety: if state claims rendered but we don't have any Chart.js instances or canvases,
        // treat it as not-rendered to avoid a blank Charts tab.
        if (globalData) {
            const isRendered = Boolean(chartState?.isRendered);
            let hasRenderableOutput = false;

            try {
                const g = /** @type {any} */ (globalThis);
                const w = /** @type {any} */ (g.window);
                const instances =
                    (g && g._chartjsInstances) ||
                    (w && w._chartjsInstances) ||
                    [];
                const instanceCount = Array.isArray(instances)
                    ? instances.length
                    : 0;
                const container = getChartRenderContainer(document);
                const canvasCount = container
                    ? container.querySelectorAll("canvas").length
                    : 0;
                hasRenderableOutput = instanceCount > 0 && canvasCount > 0;
            } catch {
                hasRenderableOutput = false;
            }

            if (!isRendered || !hasRenderableOutput) {
                this.debouncedRender("Tab activation with data available");
            }
        }
    }

    /**
     * Handle theme changes with proper chart re-rendering
     *
     * @param {string} [newTheme] - The new theme name (optional for legacy
     *   callers)
     */
    handleThemeChange(/** @type {string | undefined} */ newTheme) {
        const chartState = getState("charts");
        if (!chartState) {
            return;
        }
        // Only re-render if charts are currently rendered and visible
        if (chartState.isRendered && this.isChartTabActive()) {
            this.debouncedRender(
                newTheme ? `Theme change to ${newTheme}` : "Theme change"
            );
        }
    }

    /**
     * Initialize reactive subscriptions for chart updates
     */
    initializeSubscriptions() {
        // Subscribe to theme changes for automatic chart re-theming
        subscribe(
            "ui.theme",
            (
                /** @type {string} */ newTheme,
                /** @type {string} */ oldTheme
            ) => {
                if (oldTheme && newTheme !== oldTheme) {
                    console.log(
                        `[ChartStateManager] Theme changed: ${oldTheme} -> ${newTheme}`
                    );
                    this.handleThemeChange(newTheme);
                }
            }
        );

        // Subscribe to active tab changes
        subscribe("ui.activeTab", (/** @type {string} */ activeTab) => {
            if (activeTab === "chartjs" || activeTab === "chart") {
                this.handleTabActivation();
            }
        });

        // Subscribe to global data changes (new file loaded)
        subscribe(
            "globalData",
            (
                /** @type {FitGlobalData} */ newData,
                /** @type {FitGlobalData} */ oldData
            ) => {
                if (newData !== oldData) {
                    this.handleDataChange(newData);
                }
            }
        );

        // Subscribe to chart settings changes
        subscribe("charts.selectedChart", (/** @type {string} */ chartType) => {
            this.debouncedRender(`Chart type changed to ${chartType}`);
        });

        subscribe(
            "charts.controlsVisible",
            (/** @type {boolean} */ visible) => {
                this.updateControlsVisibility(visible);
            }
        );

        subscribeToChartSettings((nextSettings, previousSettings) => {
            const hasChanges =
                !areObjectsShallowEqual(nextSettings, previousSettings) ||
                !areObjectsShallowEqual(
                    nextSettings.fieldVisibility,
                    previousSettings.fieldVisibility
                );

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
     * Check if chart tab is currently active
     *
     * @returns {boolean} True if chart tab is active
     */
    isChartTabActive() {
        const activeTab = getState("ui.activeTab");
        return activeTab === "chartjs" || activeTab === "chart";
    }
    /**
     * Perform actual chart rendering
     *
     * @param {string} reason - Reason for rendering
     */
    async performChartRender(reason) {
        console.log(`[ChartStateManager] Rendering charts: ${reason}`);

        // Prevent concurrent renders. This is critical to avoid the UX where the
        // Charts tab appears to "reload" multiple times while settings/theme/data
        // subscriptions are firing.
        if (this.isRendering) {
            this.pendingRenderReason = reason;
            console.log(
                `[ChartStateManager] Render in progress - queued follow-up render: ${reason}`
            );
            return;
        }

        this.isRendering = true;

        try {
            // Set rendering state
            setState("charts.isRendering", true, {
                source: "ChartStateManager.performChartRender",
            });

            // Get chart container
            const container = getChartRenderContainer(document);

            if (!container) {
                console.warn("[ChartStateManager] Chart container not found");
                setState("charts.isRendering", false, {
                    source: "ChartStateManager.performChartRender",
                });
                return;
            }

            // Clear existing charts properly
            this.destroyExistingCharts();

            // Render new charts
            const success = await renderChartJS(container);

            if (success) {
                setState("charts.lastRenderTime", Date.now(), {
                    source: "ChartStateManager.performChartRender",
                });
                console.log(
                    `[ChartStateManager] Charts rendered successfully: ${reason}`
                );
            } else {
                const skipReasons = [];

                if (!this.isChartTabActive()) {
                    skipReasons.push("chart tab inactive");
                }

                const globalData = getState("globalData"),
                    hasRecords =
                        Array.isArray(globalData?.recordMesgs) &&
                        globalData.recordMesgs.length > 0;

                if (!hasRecords) {
                    skipReasons.push("no chartable data");
                }

                if (skipReasons.length > 0) {
                    console.info(
                        `[ChartStateManager] Skipped chart render (${reason}): ${skipReasons.join(", ")}`
                    );
                } else {
                    console.warn(
                        `[ChartStateManager] Chart rendering failed: ${reason}`
                    );
                }
            }
        } catch (error) {
            console.error(
                "[ChartStateManager] Error during chart rendering:",
                error
            );
            showNotification("Failed to render charts", "error");
        } finally {
            setState("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });

            // Release lock
            this.isRendering = false;

            // If a render was requested during this render, run one follow-up render.
            if (
                typeof this.pendingRenderReason === "string" &&
                this.pendingRenderReason.length > 0
            ) {
                const followUpReason = this.pendingRenderReason;
                this.pendingRenderReason = null;

                // Only render if we're still on the chart tab.
                if (this.isChartTabActive()) {
                    // Run the follow-up render after yielding to the event loop.
                    setTimeout(() => {
                        this.debouncedRender(`Follow-up: ${followUpReason}`);
                    }, 0);
                }
            }
        }
    }
    /**
     * Update chart controls visibility
     *
     * @param {boolean} visible - Whether controls should be visible
     */
    updateControlsVisibility(/** @type {boolean} */ visible) {
        const controlsPanel = document.querySelector(".chart-controls");
        if (controlsPanel instanceof HTMLElement) {
            controlsPanel.style.display = visible ? "block" : "none";
        }
    }
}

/**
 * Shallow compare two objects, treating null/undefined as empty objects.
 *
 * @param {Record<string, unknown> | null | undefined} first
 * @param {Record<string, unknown> | null | undefined} second
 *
 * @returns {boolean}
 */
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

// Create and export singleton instance
export const chartStateManager = new ChartStateManager();

// Expose some methods globally for backward compatibility and debugging
if (globalThis.window !== undefined) {
    globalThis.chartStateManager = chartStateManager;
}

export default chartStateManager;
