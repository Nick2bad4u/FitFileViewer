import { subscribeToActiveFitRawDataChange } from "../../state/domain/activeFitRawDataState.js";
import {
    hasActiveFitChartData,
    hasFitChartRecordMessages,
} from "../../state/domain/fitChartDataState.js";
import {
    getRendererActiveTab,
    subscribeToRendererActiveTab,
} from "../../state/domain/rendererActiveTabState.js";
import { subscribeToRendererChartControlsVisibleState } from "../../state/domain/rendererChartControlsState.js";
import {
    getRendererChartState,
    setRendererChartLastRenderTime,
    setRendererChartRendering,
    setRendererChartTabActive,
    subscribeToRendererSelectedChart,
    updateRendererChartState,
} from "../../state/domain/rendererChartRenderState.js";
import { subscribeToRendererTheme } from "../../state/domain/rendererThemeState.js";
import {
    setCachedChartSettings,
    type ChartSettings,
    subscribeToChartSettings,
} from "../../state/domain/settingsStateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import {
    destroyRegisteredChartInstances,
    getRegisteredChartInstanceCount,
} from "./chartInstanceRegistry.js";
import {
    getChartStateManagerRuntime,
    type ChartStateManagerRuntime,
    type ChartStateManagerTimeout,
} from "./chartStateManagerRuntime.js";
import { invalidateChartRenderCache, renderChartJS } from "./renderChartJS.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";
import { registerChartStateManager } from "./chartStateManagerRegistry.js";

type ChartInfo = {
    instanceCount: number;
    isRendered: boolean;
    isRendering: boolean;
    lastRenderTime?: number;
    selectedChart: string;
    tabActive: boolean;
};

type ChartState = {
    isRendered?: boolean;
    isRendering?: boolean;
    lastRenderTime?: number;
    selectedChart?: string;
    tabActive?: boolean;
};

/**
 * Chart state manager handles chart-related state, lifecycle, and reactive
 * updates.
 */
export class ChartStateManager {
    isInitialized = false;
    isRendering = false;
    pendingRenderReason: null | string = null;
    renderDebounceTime = 250;
    renderTimeout: ChartStateManagerTimeout | null = null;

    constructor(private readonly runtime = getChartStateManagerRuntime()) {
        this.initializeSubscriptions();

        console.log("[ChartStateManager] Initialized");
    }

    /**
     * Clears chart state when new data is loaded or charts are unloaded.
     */
    clearChartState(): void {
        invalidateChartRenderCache("ChartStateManager.clearChartState");
        this.destroyExistingCharts();

        updateRendererChartState(
            {
                chartData: null,
                isRendered: false,
                tabActive: false,
            },
            { source: "ChartStateManager.clearChartState" }
        );
    }

    /**
     * Debounced chart rendering to prevent excessive re-renders.
     *
     * @param reason - Reason for the render request.
     */
    debouncedRender(reason = "State change"): void {
        if (this.isRendering) {
            this.pendingRenderReason = reason;
            return;
        }

        if (this.renderTimeout) {
            this.runtime.clearRenderTimeout(this.renderTimeout);
        }

        this.renderTimeout = this.runtime.setRenderTimeout(() => {
            void this.performChartRender(reason);
        }, this.renderDebounceTime);
    }

    /**
     * Cleanup method for removing subscriptions and clearing timers.
     */
    destroy(): void {
        if (this.renderTimeout) {
            this.runtime.clearRenderTimeout(this.renderTimeout);
        }
        this.clearChartState();
        console.log("[ChartStateManager] Destroyed");
    }

    /**
     * Properly destroys existing chart instances.
     */
    destroyExistingCharts(): void {
        destroyRegisteredChartInstances((index, error) => {
            console.warn(
                `[ChartStateManager] Error destroying chart ${index}:`,
                error
            );
        });
    }

    /**
     * Forces an immediate chart re-render.
     *
     * @param reason - Reason for the render.
     */
    forceRender(reason = "Manual trigger"): void {
        if (this.renderTimeout) {
            this.runtime.clearRenderTimeout(this.renderTimeout);
        }
        void this.performChartRender(reason);
    }

    /**
     * Gets current chart state information.
     */
    getChartInfo(): ChartInfo {
        const chartState = getChartState();

        const info: ChartInfo = {
            instanceCount: getRegisteredChartInstanceCount(),
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
     * @param newData - The new raw FIT data.
     */
    handleDataChange(newData: unknown): void {
        console.log(
            "[ChartStateManager] Data changed, checking if charts need update"
        );

        this.clearChartState();

        if (hasFitChartRecordMessages(newData) && this.isChartTabActive()) {
            this.debouncedRender("New data loaded");
        }
    }

    /**
     * Handles chart tab activation.
     */
    handleTabActivation(): void {
        const chartState = getChartState();

        console.log("[ChartStateManager] Chart tab activated");

        setRendererChartTabActive(true, {
            source: "ChartStateManager.handleTabActivation",
        });

        if (chartState?.isRendering === true) {
            console.log(
                "[ChartStateManager] Render already in progress - skipping activation render"
            );
            return;
        }

        if (hasActiveFitChartData()) {
            const isRendered = chartState?.isRendered ?? false,
                hasRenderableOutput = hasExistingRenderableChartOutput(
                    this.runtime
                );

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
    handleThemeChange(newTheme?: string): void {
        const chartState = getChartState();
        if (!chartState) {
            return;
        }

        if (chartState.isRendered && this.isChartTabActive()) {
            this.debouncedRender(
                newTheme ? `Theme change to ${newTheme}` : "Theme change"
            );
        }
    }

    /**
     * Initializes reactive subscriptions for chart updates.
     */
    initializeSubscriptions(): void {
        subscribeToRendererTheme((newTheme, oldTheme) => {
            if (
                typeof newTheme === "string" &&
                typeof oldTheme === "string" &&
                oldTheme &&
                newTheme !== oldTheme
            ) {
                console.log(
                    `[ChartStateManager] Theme changed: ${oldTheme} -> ${newTheme}`
                );
                this.handleThemeChange(newTheme);
            }
        });

        subscribeToRendererActiveTab((activeTab) => {
            if (activeTab === "chartjs" || activeTab === "chart") {
                this.handleTabActivation();
            }
        });

        subscribeToActiveFitRawDataChange((newData, oldData) => {
            if (newData !== oldData) {
                this.handleDataChange(newData);
            }
        });

        subscribeToRendererSelectedChart((chartType) => {
            this.debouncedRender(`Chart type changed to ${String(chartType)}`);
        });

        subscribeToRendererChartControlsVisibleState((visible) => {
            this.updateControlsVisibility(visible === true);
        });

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

            setCachedChartSettings(nextSettings, {
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
    isChartTabActive(): boolean {
        const activeTab = getRendererActiveTab();
        return activeTab === "chartjs" || activeTab === "chart";
    }

    /**
     * Performs actual chart rendering.
     *
     * @param reason - Reason for rendering.
     */
    async performChartRender(reason: string): Promise<void> {
        console.log(`[ChartStateManager] Rendering charts: ${reason}`);

        if (this.isRendering) {
            this.pendingRenderReason = reason;
            console.log(
                `[ChartStateManager] Render in progress - queued follow-up render: ${reason}`
            );
            return;
        }

        this.isRendering = true;

        try {
            setRendererChartRendering(true, {
                source: "ChartStateManager.performChartRender",
            });

            const container = this.runtime.getChartRenderContainer();

            if (!container) {
                console.warn("[ChartStateManager] Chart container not found");
                setRendererChartRendering(false, {
                    source: "ChartStateManager.performChartRender",
                });
                return;
            }

            this.destroyExistingCharts();

            const success = await renderChartJS(container);

            if (success) {
                setRendererChartLastRenderTime(this.runtime.dateNow(), {
                    source: "ChartStateManager.performChartRender",
                });
                console.log(
                    `[ChartStateManager] Charts rendered successfully: ${reason}`
                );
            } else {
                this.reportSkippedOrFailedRender(reason);
            }
        } catch (error) {
            console.error(
                "[ChartStateManager] Error during chart rendering:",
                error
            );
            void showNotification("Failed to render charts", "error");
        } finally {
            setRendererChartRendering(false, {
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
    updateControlsVisibility(visible: boolean): void {
        const controlsPanel = this.runtime.getControlsPanel();
        if (controlsPanel) {
            controlsPanel.style.display = visible ? "block" : "none";
        }
    }

    private reportSkippedOrFailedRender(reason: string): void {
        const skipReasons: string[] = [];

        if (!this.isChartTabActive()) {
            skipReasons.push("chart tab inactive");
        }

        const hasRecords = hasActiveFitChartData();

        if (!hasRecords) {
            skipReasons.push("no chartable data");
        }

        if (skipReasons.length > 0) {
            console.info(
                `[ChartStateManager] Skipped chart render (${reason}): ${skipReasons.join(", ")}`
            );
            return;
        }

        console.warn(`[ChartStateManager] Chart rendering failed: ${reason}`);
    }

    private renderPendingFollowUp(): void {
        if (
            typeof this.pendingRenderReason !== "string" ||
            this.pendingRenderReason.length === 0
        ) {
            return;
        }

        const followUpReason = this.pendingRenderReason;
        this.pendingRenderReason = null;

        if (this.isChartTabActive()) {
            const followUpTimeout = this.runtime.setRenderTimeout(() => {
                if (this.renderTimeout === followUpTimeout) {
                    this.renderTimeout = null;
                }
                this.debouncedRender(`Follow-up: ${followUpReason}`);
            }, 0);
            this.renderTimeout = followUpTimeout;
        }
    }
}

function areObjectsShallowEqual(
    first: ChartSettings | Record<string, unknown> | null | undefined,
    second: ChartSettings | Record<string, unknown> | null | undefined
): boolean {
    const left = isObjectRecord(first) ? first : {};
    const right = isObjectRecord(second) ? second : {};
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
        return false;
    }

    return leftKeys.every((key) => Object.is(left[key], right[key]));
}

function getChartInstanceCount(): number {
    return getRegisteredChartInstanceCount();
}

function getChartState(): ChartState | undefined {
    const value = getRendererChartState();
    if (!isObjectRecord(value)) {
        return undefined;
    }

    const chartState: ChartState = {};

    assignBooleanProperty(chartState, value, "isRendered");
    assignBooleanProperty(chartState, value, "isRendering");
    assignNumberProperty(chartState, value, "lastRenderTime");
    assignStringProperty(chartState, value, "selectedChart");
    assignBooleanProperty(chartState, value, "tabActive");

    return chartState;
}

function hasExistingRenderableChartOutput(
    runtime: ChartStateManagerRuntime
): boolean {
    try {
        const instanceCount = getChartInstanceCount(),
            container = runtime.getChartRenderContainer(),
            canvasCount = container
                ? container.querySelectorAll("canvas").length
                : 0;

        return instanceCount > 0 && canvasCount > 0;
    } catch {
        return false;
    }
}

function assignBooleanProperty(
    chartState: ChartState,
    source: Record<string, unknown>,
    key: "isRendered" | "isRendering" | "tabActive"
): void {
    const value = source[key];
    if (typeof value === "boolean") {
        chartState[key] = value;
    }
}

function assignNumberProperty(
    chartState: ChartState,
    source: Record<string, unknown>,
    key: "lastRenderTime"
): void {
    const value = source[key];
    if (typeof value === "number") {
        chartState[key] = value;
    }
}

function assignStringProperty(
    chartState: ChartState,
    source: Record<string, unknown>,
    key: "selectedChart"
): void {
    const value = source[key];
    if (typeof value === "string") {
        chartState[key] = value;
    }
}

/**
 * Singleton chart state manager instance used by legacy chart modules.
 */
export const chartStateManager = new ChartStateManager();
registerChartStateManager(chartStateManager);

export default chartStateManager;
