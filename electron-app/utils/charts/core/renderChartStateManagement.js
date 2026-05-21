import { hasChartDataRecordMessages } from "./renderChartDataPreparation.js";
const INITIAL_CHARTS_STATE = {
    chartData: null,
    chartOptions: {},
    controlsVisible: true,
    isRendered: false,
    isRendering: false,
    lastRenderTime: null,
    previousState: {
        chartCount: 0,
        timestamp: 0,
        visibleFields: 0,
    },
    renderedCount: 0,
    selectedChart: "elevation",
    zoomLevel: 1,
};
/**
 * Initializes chart state, computed chart state, and render middleware.
 *
 * @param dependencies - State and notification dependencies from renderChartJS.
 */
export function initializeChartStateManagement(dependencies) {
    console.log("[ChartJS] Initializing chart state management...");
    dependencies.updateState("charts", INITIAL_CHARTS_STATE, {
        merge: true,
        source: "initializeChartStateManagement",
    });
    const computedStateManager = dependencies.getComputedStateManager();
    computedStateManager.define?.("charts.hasData", () =>
        hasChartDataRecordMessages(dependencies.getState("globalData"))
    );
    computedStateManager.define?.(
        "charts.renderableFieldCount",
        () => dependencies.getChartSummaryState().renderableFields.length
    );
    computedStateManager.define?.("charts.summary", () => {
        const chartState = dependencies.getChartSummaryState();
        return {
            chartCount: dependencies.getState("charts.renderedCount") || 0,
            fieldCount: chartState.renderableFields.length,
            hasData: chartState.hasValidData,
            isRendered: chartState.isRendered,
            lastRender: dependencies.getState("charts.lastRenderTime"),
        };
    });
    const hasChartRenderMiddleware =
        dependencies.middlewareManager.has?.("chart-render") ?? false;
    if (!hasChartRenderMiddleware) {
        dependencies.middlewareManager.register?.("chart-render", {
            afterSet: (context) => {
                console.log(
                    "[ChartJS] Chart render action completed:",
                    context
                );
                return context;
            },
            beforeSet: (context) => {
                console.log("[ChartJS] Starting chart render action:", context);
                return context;
            },
            onError: (error, errorContext) => {
                console.error(
                    "[ChartJS] Chart render action failed:",
                    error,
                    errorContext
                );
                void Promise.resolve().then(() => {
                    dependencies.notify("Chart rendering failed", "error");
                });
            },
        });
    }
    console.log("[ChartJS] Chart state management initialized successfully");
}
/**
 * Requests a chart refresh only when data is available and rendering is idle.
 *
 * @param dependencies - State and action dependencies from renderChartJS.
 *
 * @returns True when a refresh was requested.
 */
export function refreshChartsIfNeeded(dependencies) {
    if (dependencies.hasValidData() && !dependencies.isRendering()) {
        dependencies.requestRerender("Manual refresh requested");
        return true;
    }
    return false;
}
