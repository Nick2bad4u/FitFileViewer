interface ChartLifecycleActions {
    clearCharts?: () => void;
    completeRendering?: (
        success: boolean,
        chartCount?: number,
        renderTime?: number
    ) => void;
    startRendering?: () => void;
}

interface ChartLifecycleGlobal {
    _chartjsInstances?: unknown[];
}

interface StartChartRenderingDependencies {
    getGlobalChartActions(): ChartLifecycleActions | null;
    isLoadingStateSuppressed(): boolean;
    setState(path: string, value: unknown, options: unknown): void;
}

interface ClearExistingChartsDependencies {
    chartGlobal: ChartLifecycleGlobal;
    getGlobalChartActions(): ChartLifecycleActions | null;
    updateState(path: string, value: unknown, options: unknown): void;
}

interface CompleteChartRenderingDependencies {
    getGlobalChartActions(): ChartLifecycleActions | null;
    safeCompleteRendering(success: boolean): void;
}

function hasDestroy(value: unknown): value is { destroy(): void } {
    return (
        value !== null &&
        typeof value === "object" &&
        typeof (value as { destroy?: unknown }).destroy === "function"
    );
}

/** Starts chart rendering through global actions or the state fallback. */
export function startChartRendering(
    dependencies: StartChartRenderingDependencies
): void {
    const actions = dependencies.getGlobalChartActions();
    if (actions?.startRendering) {
        actions.startRendering();
        return;
    }

    dependencies.setState("charts.isRendering", true, {
        silent: false,
        source: "renderChartJS.start",
    });

    if (!dependencies.isLoadingStateSuppressed()) {
        dependencies.setState("isLoading", true, {
            silent: false,
            source: "renderChartJS.start",
        });
    }
}

/** Clears existing chart instances through global actions or the local fallback. */
export function clearExistingCharts(
    dependencies: ClearExistingChartsDependencies
): void {
    const actions = dependencies.getGlobalChartActions();
    if (actions?.clearCharts) {
        actions.clearCharts();
        return;
    }

    const instances = dependencies.chartGlobal._chartjsInstances;
    if (instances) {
        for (const [index, chart] of instances.entries()) {
            try {
                if (hasDestroy(chart)) {
                    chart.destroy();
                }
            } catch (error) {
                console.warn(`[ChartJS] Error destroying chart ${index}:`, error);
            }
        }
    }

    dependencies.chartGlobal._chartjsInstances = [];
    dependencies.updateState(
        "charts",
        { chartData: null, isRendered: false, renderedCount: 0 },
        { silent: false, source: "renderChartJS.clear" }
    );
}

/** Completes chart rendering through global actions or the safe fallback. */
export function completeChartRendering(
    dependencies: CompleteChartRenderingDependencies,
    success: boolean,
    chartCount: number,
    renderTime: number
): void {
    try {
        const actions = dependencies.getGlobalChartActions();
        if (actions?.completeRendering) {
            actions.completeRendering(success, chartCount, renderTime);
            return;
        }

        dependencies.safeCompleteRendering(success);
    } catch {
        dependencies.safeCompleteRendering(success);
    }
}
