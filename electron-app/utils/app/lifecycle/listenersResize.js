/**
 * Registers the window resize listener for chart redraws.
 *
 * @param {{ cleanupCallbacks: (() => void)[] }} params
 */
export function registerChartResizeListener({ cleanupCallbacks }) {
    /** @type {ReturnType<typeof setTimeout> | null} */
    let chartRenderTimeout = null;

    const handleWindowResize = () => {
        if (
            document
                .querySelector("#tab_chart")
                ?.classList.contains("active") ||
            document.querySelector("#tab_chartjs")?.classList.contains("active")
        ) {
            if (chartRenderTimeout) {
                clearTimeout(chartRenderTimeout);
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
