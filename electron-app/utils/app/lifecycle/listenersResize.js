import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";

/**
 * @typedef {object} LegacyFullscreenDocument
 * @property {Element | null | undefined} [mozFullScreenElement]
 * @property {Element | null | undefined} [msFullscreenElement]
 * @property {Element | null | undefined} [webkitFullscreenElement]
 */
/** @typedef {{ resize: () => void }} ResizableChart */
/** @typedef {{ getChart?: (canvas: HTMLCanvasElement) => unknown }} ChartRegistry */
/** @typedef {HTMLCanvasElement & { __chartjs?: unknown }} LegacyChartCanvas */
/**
 * @typedef {typeof globalThis & {
 *     Chart?: ChartRegistry;
 *     ChartUpdater?: { updateCharts?: (reason: string) => void };
 *     renderChart?: () => void;
 *     renderChartJS?: () => void | Promise<boolean>;
 * }} ChartResizeGlobal
 */

/**
 * @returns {ChartResizeGlobal}
 */
function getChartResizeGlobal() {
    return /** @type {ChartResizeGlobal} */ (globalThis);
}

/**
 * @returns {Element | null}
 */
function getFullscreenElement() {
    const doc = /** @type {Document & LegacyFullscreenDocument} */ (document);
    return (
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement ||
        null
    );
}

/**
 * @param {unknown} value
 * @returns {value is ResizableChart}
 */
function isResizableChart(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = /** @type {Record<string, unknown>} */ (value);
    return typeof candidate.resize === "function";
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {unknown}
 */
function getLegacyCanvasChart(canvas) {
    return /** @type {LegacyChartCanvas} */ (canvas).__chartjs;
}

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
                resizeExistingCharts();
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
                    chartGlobal.renderChartJS();
                } else if (chartGlobal.renderChart) {
                    // Legacy fallback for older renderer bundles.
                    chartGlobal.renderChart();
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

    if (typeof globalThis.requestAnimationFrame === "function") {
        globalThis.requestAnimationFrame(resizeAll);
    } else {
        setTimeout(resizeAll, 0);
    }

    setTimeout(resizeAll, 120);
}
