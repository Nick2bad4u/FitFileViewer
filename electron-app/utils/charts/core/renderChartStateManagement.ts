import { hasChartDataRecordMessages } from "./renderChartDataPreparation.js";

interface ComputedStateManager {
    define?(key: string, compute: () => unknown): void;
}

interface MiddlewareManagerLike {
    middleware?: {
        has?(key: string): boolean;
    };
    register?(
        key: string,
        middleware: {
            afterSet(context: unknown): unknown;
            beforeSet(context: unknown): unknown;
            onError(context: unknown): unknown;
        }
    ): void;
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

    if (!dependencies.middlewareManager.middleware?.has?.("chart-render")) {
        dependencies.middlewareManager.register?.("chart-render", {
            afterSet: (context: unknown) => {
                console.log(
                    "[ChartJS] Chart render action completed:",
                    context
                );
                return context;
            },
            beforeSet: (context: unknown) => {
                console.log("[ChartJS] Starting chart render action:", context);
                return context;
            },
            onError: (context: unknown) => {
                console.error("[ChartJS] Chart render action failed:", context);
                void Promise.resolve().then(() => {
                    dependencies.notify("Chart rendering failed", "error");
                });
                return context;
            },
        });
    }

    console.log("[ChartJS] Chart state management initialized successfully");
}

/**
 * Requests a chart refresh only when data is available and rendering is idle.
 *
 * @param dependencies - State and action dependencies from renderChartJS.
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
