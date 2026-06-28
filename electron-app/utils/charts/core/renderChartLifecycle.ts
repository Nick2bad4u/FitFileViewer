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

interface StartChartRenderingDependencies {
    getChartLifecycleActions(): ChartLifecycleActions | null;
    isLoadingStateSuppressed(): boolean;
    setChartRendering(rendering: boolean, options: unknown): void;
    setLoadingState(loading: boolean, options: unknown): void;
}

interface ClearExistingChartsDependencies {
    clearChartRenderState(options: unknown): void;
    getChartLifecycleActions(): ChartLifecycleActions | null;
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

    dependencies.setChartRendering(true, {
        silent: false,
        source: "renderChartJS.start",
    });

    if (!dependencies.isLoadingStateSuppressed()) {
        dependencies.setLoadingState(true, {
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

    dependencies.clearChartRenderState({
        silent: false,
        source: "renderChartJS.clear",
    });
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
