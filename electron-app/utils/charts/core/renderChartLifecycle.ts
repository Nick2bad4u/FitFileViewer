import { destroyRegisteredChartInstances } from "./chartInstanceRegistry.js";

interface ChartLifecycleActions {
    clearCharts?: () => void;
    completeRendering?: (
        success: boolean,
        chartCount?: number,
        renderTime?: number
    ) => void;
    startRendering?: () => void;
}

export type ChartClearStatePatch = Readonly<{
    readonly chartData: null;
    readonly isRendered: false;
    readonly renderedCount: 0;
}> &
    Record<string, unknown>;

interface StartChartRenderingDependencies {
    getChartLifecycleActions(): ChartLifecycleActions | null;
    isLoadingStateSuppressed(): boolean;
    setState(path: string, value: unknown, options: unknown): void;
}

interface ClearExistingChartsDependencies {
    getChartLifecycleActions(): ChartLifecycleActions | null;
    updateState(
        path: string,
        value: ChartClearStatePatch,
        options: unknown
    ): void;
}

interface CompleteChartRenderingDependencies {
    getChartLifecycleActions(): ChartLifecycleActions | null;
    safeCompleteRendering(success: boolean): void;
}

/** Starts chart rendering through registered actions or the state fallback. */
export function startChartRendering(
    dependencies: StartChartRenderingDependencies
): void {
    const actions = dependencies.getChartLifecycleActions();
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

/**
 * Clears existing chart instances through registered actions or the local
 * fallback.
 */
export function clearExistingCharts(
    dependencies: ClearExistingChartsDependencies
): void {
    const actions = dependencies.getChartLifecycleActions();
    if (actions?.clearCharts) {
        actions.clearCharts();
        return;
    }

    destroyRegisteredChartInstances((index, error) => {
        console.warn(`[ChartJS] Error destroying chart ${index}:`, error);
    });

    dependencies.updateState(
        "charts",
        { chartData: null, isRendered: false, renderedCount: 0 },
        { silent: false, source: "renderChartJS.clear" }
    );
}

/** Completes chart rendering through registered actions or the safe fallback. */
export function completeChartRendering(
    dependencies: CompleteChartRenderingDependencies,
    success: boolean,
    chartCount: number,
    renderTime: number
): void {
    try {
        const actions = dependencies.getChartLifecycleActions();
        if (actions?.completeRendering) {
            actions.completeRendering(success, chartCount, renderTime);
            return;
        }

        dependencies.safeCompleteRendering(success);
    } catch {
        dependencies.safeCompleteRendering(success);
    }
}
