import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { renderChartJS } from "../../charts/core/renderChartJS.js";
import { getRegisteredChartInstanceForCanvas } from "../../charts/core/chartInstanceRegistry.js";
import { updateCharts } from "../../charts/core/chartUpdater.js";

type ResizableChart = { resize: () => void };

type ChartResizeListenerParams = {
    cleanupCallbacks: Array<() => void>;
};

type TimerHandle = ReturnType<typeof setTimeout>;

function getFullscreenElement(): Element | null {
    return (
        document.fullscreenElement ||
        getOptionalElementProperty(document, "webkitFullscreenElement") ||
        getOptionalElementProperty(document, "mozFullScreenElement") ||
        getOptionalElementProperty(document, "msFullscreenElement") ||
        null
    );
}

function getOptionalElementProperty(
    target: object,
    propertyKey: string
): Element | null {
    const value: unknown = Reflect.get(target, propertyKey);
    return value instanceof Element ? value : null;
}

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
    const resizeListenerController = new AbortController();
    let chartRenderTimeout: TimerHandle | null = null;
    let resizeCleanup: (() => void) | undefined;

    const handleWindowResize = (): void => {
        const chartTab = querySelectorByIdFlexible(document, "#tab_chart");
        const chartJsTab = querySelectorByIdFlexible(document, "#tab_chartjs");
        const fullscreenElement = getFullscreenElement();

        if (
            chartTab?.classList.contains("active") ||
            chartJsTab?.classList.contains("active")
        ) {
            if (chartRenderTimeout) {
                clearTimeout(chartRenderTimeout);
            }

            // During fullscreen transitions, avoid full chart re-rendering.
            // Re-rendering can tear down chart wrappers and immediately exit
            // element fullscreen; a direct Chart.js resize is sufficient.
            if (fullscreenElement) {
                resizeCleanup?.();
                resizeCleanup = scheduleExistingChartResizes();
                return;
            }

            chartRenderTimeout = setTimeout(() => {
                void updateCharts("window-resize").catch(() => {
                    void renderChartJS();
                });
            }, 200);
        }
    };

    window.addEventListener("resize", handleWindowResize, {
        signal: resizeListenerController.signal,
    });
    cleanupCallbacks.push(() => {
        try {
            resizeListenerController.abort();
        } catch {
            /* ignore */
        }
        if (chartRenderTimeout) {
            try {
                clearTimeout(chartRenderTimeout);
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
function resizeExistingCharts(): void {
    const canvases = document.querySelectorAll("canvas.chart-canvas");
    if (canvases.length === 0) {
        return;
    }

    const resizeAll = (): void => {
        for (const canvas of canvases) {
            if (!(canvas instanceof HTMLCanvasElement)) {
                continue;
            }
            const chart = getRegisteredChartInstanceForCanvas(canvas);
            if (isResizableChart(chart)) {
                chart.resize();
            }
        }
    };

    resizeAll();
}

function scheduleExistingChartResizes(): () => void {
    const timerHandles: TimerHandle[] = [];
    let animationFrameHandle: number | undefined;

    if (typeof globalThis.requestAnimationFrame === "function") {
        animationFrameHandle =
            globalThis.requestAnimationFrame(resizeExistingCharts);
    } else {
        timerHandles.push(setTimeout(resizeExistingCharts, 0));
    }

    timerHandles.push(setTimeout(resizeExistingCharts, 120));

    return () => {
        if (
            animationFrameHandle !== undefined &&
            typeof globalThis.cancelAnimationFrame === "function"
        ) {
            try {
                globalThis.cancelAnimationFrame(animationFrameHandle);
            } catch {
                /* ignore */
            }
        }

        for (const timerHandle of timerHandles) {
            try {
                clearTimeout(timerHandle);
            } catch {
                /* ignore */
            }
        }
    };
}
