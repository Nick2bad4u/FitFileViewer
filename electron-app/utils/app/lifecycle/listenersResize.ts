import { renderChartJS } from "../../charts/core/renderChartJS.js";
import { getRegisteredChartInstanceForCanvas } from "../../charts/core/chartInstanceRegistry.js";
import { updateCharts } from "../../charts/core/chartUpdater.js";
import {
    getListenersResizeRuntime,
    type ListenersResizeTimerHandle,
} from "./listenersResizeRuntime.js";

type ResizableChart = { resize: () => void };

type ChartResizeListenerParams = {
    cleanupCallbacks: Array<() => void>;
};

function isResizableChart(value: unknown): value is ResizableChart {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    return "resize" in value && typeof value.resize === "function";
}

/**
 * Registers the window resize listener for chart redraws.
 */
export function registerChartResizeListener({
    cleanupCallbacks,
}: ChartResizeListenerParams): void {
    const runtime = getListenersResizeRuntime();
    const resizeListenerController = runtime.createAbortController();
    let chartRenderTimeout: ListenersResizeTimerHandle | null = null;
    let resizeCleanup: (() => void) | undefined;

    const handleWindowResize = (): void => {
        const chartTab = runtime.queryChartTab("#tab_chart");
        const chartJsTab = runtime.queryChartTab("#tab_chartjs");
        const fullscreenElement = runtime.getFullscreenElement();

        if (
            chartTab?.classList.contains("active") === true ||
            chartJsTab?.classList.contains("active") === true
        ) {
            if (chartRenderTimeout !== null) {
                runtime.clearTimeout(chartRenderTimeout);
            }

            // During fullscreen transitions, avoid full chart re-rendering.
            // Re-rendering can tear down chart wrappers and immediately exit
            // element fullscreen; a direct Chart.js resize is sufficient.
            if (fullscreenElement) {
                resizeCleanup?.();
                resizeCleanup = scheduleExistingChartResizes(runtime);
                return;
            }

            chartRenderTimeout = runtime.setTimeout(() => {
                void updateCharts("window-resize").catch(() => {
                    void renderChartJS();
                });
            }, 200);
        }
    };

    runtime.addResizeListener(handleWindowResize, {
        signal: resizeListenerController.signal,
    });
    cleanupCallbacks.push(() => {
        try {
            resizeListenerController.abort();
        } catch {
            /* ignore */
        }
        if (chartRenderTimeout !== null) {
            try {
                runtime.clearTimeout(chartRenderTimeout);
            } catch {
                /* ignore */
            }
            chartRenderTimeout = null;
        }
        resizeCleanup?.();
        resizeCleanup = undefined;
    });
}

/**
 * Resize existing chart instances without triggering a full chart re-render.
 */
function resizeExistingCharts(
    runtime = getListenersResizeRuntime()
): void {
    const canvases = runtime.queryChartCanvases();
    if (canvases.length === 0) {
        return;
    }

    const resizeAll = (): void => {
        for (const canvas of canvases) {
            const chart = getRegisteredChartInstanceForCanvas(canvas);
            if (isResizableChart(chart)) {
                chart.resize();
            }
        }
    };

    resizeAll();
}

function scheduleExistingChartResizes(
    runtime = getListenersResizeRuntime()
): () => void {
    const timerHandles: ListenersResizeTimerHandle[] = [];
    let animationFrameHandle: number | undefined;

    animationFrameHandle = runtime.requestAnimationFrame(() => {
        resizeExistingCharts(runtime);
    });
    if (animationFrameHandle === undefined) {
        timerHandles.push(
            runtime.setTimeout(() => {
                resizeExistingCharts(runtime);
            }, 0)
        );
    } else {
        void animationFrameHandle;
    }

    timerHandles.push(
        runtime.setTimeout(() => {
            resizeExistingCharts(runtime);
        }, 120)
    );

    return () => {
        if (animationFrameHandle !== undefined) {
            try {
                runtime.cancelAnimationFrame(animationFrameHandle);
            } catch {
                /* ignore */
            }
        }

        for (const timerHandle of timerHandles) {
            try {
                runtime.clearTimeout(timerHandle);
            } catch {
                /* ignore */
            }
        }
    };
}
