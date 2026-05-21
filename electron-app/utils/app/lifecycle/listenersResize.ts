import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";

type LegacyFullscreenDocument = Document & {
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
    webkitFullscreenElement?: Element | null;
};

type ResizableChart = { resize: () => void };
type ChartRegistry = { getChart?: (canvas: HTMLCanvasElement) => unknown };
type LegacyChartCanvas = HTMLCanvasElement & { __chartjs?: unknown };

type ChartResizeGlobal = typeof globalThis & {
    Chart?: ChartRegistry;
    ChartUpdater?: { updateCharts?: (reason: string) => void };
    renderChart?: () => void;
    renderChartJS?: () => Promise<boolean> | void;
};

type ChartResizeListenerParams = {
    cleanupCallbacks: Array<() => void>;
};

type TimerHandle = ReturnType<typeof setTimeout>;

function getChartResizeGlobal(): ChartResizeGlobal {
    return globalThis as ChartResizeGlobal;
}

function getFullscreenElement(): Element | null {
    const doc = document as LegacyFullscreenDocument;
    return (
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement ||
        null
    );
}

function isResizableChart(value: unknown): value is ResizableChart {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return typeof candidate["resize"] === "function";
}

function getLegacyCanvasChart(canvas: HTMLCanvasElement): unknown {
    return (canvas as LegacyChartCanvas).__chartjs;
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
                const chartGlobal = getChartResizeGlobal();
                // Use modern chart state management for resize handling
                if (
                    chartGlobal.ChartUpdater &&
                    chartGlobal.ChartUpdater.updateCharts
                ) {
                    chartGlobal.ChartUpdater.updateCharts("window-resize");
                } else if (chartGlobal.renderChartJS) {
                    void chartGlobal.renderChartJS();
                } else if (chartGlobal.renderChart) {
                    // Legacy fallback for older renderer bundles.
                    chartGlobal.renderChart();
                }
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
            const chartRef = getChartResizeGlobal().Chart;
            const chart =
                chartRef && typeof chartRef.getChart === "function"
                    ? chartRef.getChart(canvas)
                    : getLegacyCanvasChart(canvas);
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

    const resizeAll = (): void => {
        resizeExistingCharts();
    };

    if (typeof globalThis.requestAnimationFrame === "function") {
        animationFrameHandle = globalThis.requestAnimationFrame(resizeAll);
    } else {
        timerHandles.push(setTimeout(resizeAll, 0));
    }

    timerHandles.push(setTimeout(resizeAll, 120));

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
