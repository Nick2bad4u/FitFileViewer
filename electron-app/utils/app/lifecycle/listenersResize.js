import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";

/**
 * Registers the window resize listener for chart redraws.
 *
 * @param {{ cleanupCallbacks: (() => void)[] }} params
 */
export function registerChartResizeListener({ cleanupCallbacks }) {
    /** @type {ReturnType<typeof setTimeout> | null} */
    let chartRenderTimeout = null;

    const handleWindowResize = () => {
        const chartTab = querySelectorByIdFlexible(document, "#tab_chart");
        const chartJsTab = querySelectorByIdFlexible(document, "#tab_chartjs");
        const doc = /** @type {any} */ (document);
        const fullscreenElement =
            document.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement ||
            null;

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
                resizeExistingCharts();
                return;
            }

            chartRenderTimeout = setTimeout(() => {
                // Use modern chart state management for resize handling
                if (
                    globalThis.ChartUpdater &&
                    globalThis.ChartUpdater.updateCharts
                ) {
                    globalThis.ChartUpdater.updateCharts("window-resize");
                } else if (globalThis.renderChartJS) {
                    globalThis.renderChartJS();
                } else if (/** @type {any} */ (globalThis).renderChart) {
                    // Legacy fallback (cast window to any for legacy property)
                    /** @type {any} */ (globalThis).renderChart();
                }
            }, 200);
        }
    };

    window.addEventListener("resize", handleWindowResize);
    cleanupCallbacks.push(() => {
        try {
            window.removeEventListener("resize", handleWindowResize);
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
    });
}

/**
 * Resize existing chart instances without triggering a full chart re-render.
 */
function resizeExistingCharts() {
    const canvases = document.querySelectorAll("canvas.chart-canvas");
    if (canvases.length === 0) {
        return;
    }

    const resizeAll = () => {
        for (const canvas of canvases) {
            if (!(canvas instanceof HTMLCanvasElement)) {
                continue;
            }
            const chartRef = /** @type {any} */ (globalThis).Chart;
            const chart =
                chartRef && typeof chartRef.getChart === "function"
                    ? chartRef.getChart(canvas)
                    : /** @type {any} */ (canvas).__chartjs;
            if (chart && typeof chart.resize === "function") {
                chart.resize();
            }
        }
    };

    if (typeof globalThis.requestAnimationFrame === "function") {
        globalThis.requestAnimationFrame(resizeAll);
    } else {
        setTimeout(resizeAll, 0);
    }

    setTimeout(resizeAll, 120);
}
