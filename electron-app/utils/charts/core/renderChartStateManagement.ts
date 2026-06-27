import type {
    MiddlewareContext,
    MiddlewareDefinition,
} from "../../state/core/stateMiddleware.js";
import { hasActiveFitChartData } from "../../state/domain/fitChartDataState.js";

interface ComputedStateManager {
    addComputed(key: string, compute: () => unknown): void;
}

interface MiddlewareManagerLike {
    has?(key: string): boolean;
    register?(key: string, middleware: MiddlewareDefinition): void;
}

interface ChartSummaryState {
    hasValidData: boolean;
    isRendered: boolean;
    renderableFields: readonly unknown[];
}

interface InitializeChartStateManagementDependencies {
    getChartSummaryState(): ChartSummaryState;
    getComputedStateManager(): ComputedStateManager;
    getState(path: string): unknown;
    middlewareManager: MiddlewareManagerLike;
    notify(message: string, type: string): unknown;
    updateState(path: string, value: unknown, options: unknown): void;
}

interface RefreshChartsIfNeededDependencies {
    hasValidData(): boolean;
    isRendering(): boolean;
    requestRerender(reason: string): void;
}

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
} as const;

/**
 * Initializes chart state, computed chart state, and render middleware.
 *
 * @param dependencies - State and notification dependencies from renderChartJS.
 */
export function initializeChartStateManagement(
    dependencies: InitializeChartStateManagementDependencies
): void {
    console.log("[ChartJS] Initializing chart state management...");

    dependencies.updateState("charts", INITIAL_CHARTS_STATE, {
        merge: true,
        source: "initializeChartStateManagement",
    });

    const computedStateManager = dependencies.getComputedStateManager();
    computedStateManager.addComputed("charts.hasData", () =>
        hasActiveFitChartData()
    );

    computedStateManager.addComputed(
        "charts.renderableFieldCount",
        () => dependencies.getChartSummaryState().renderableFields.length
    );

    computedStateManager.addComputed("charts.summary", () => {
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
            afterSet: (context: MiddlewareContext) => {
                console.log(
                    "[ChartJS] Chart render action completed:",
                    context
                );
                return context;
            },
            beforeSet: (context: MiddlewareContext) => {
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
                    return undefined;
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
export function refreshChartsIfNeeded(
    dependencies: RefreshChartsIfNeededDependencies
): boolean {
    if (dependencies.hasValidData() && !dependencies.isRendering()) {
        dependencies.requestRerender("Manual refresh requested");
        return true;
    }

    return false;
}
