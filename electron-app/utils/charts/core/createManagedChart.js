const chartGlobal = globalThis;
/**
 * Create a Chart.js instance and register it in the shared lifecycle registry.
 *
 * @param canvas - Canvas element to render into.
 * @param config - Chart.js configuration object.
 *
 * @returns The created chart instance, or null when Chart.js is not loaded.
 */
export function createManagedChart(canvas, config) {
    const ChartCtor = chartGlobal.Chart;
    if (typeof ChartCtor !== "function") {
        return null;
    }
    const chart = new ChartCtor(canvas, config);
    if (!Array.isArray(chartGlobal._chartjsInstances)) {
        chartGlobal._chartjsInstances = [];
    }
    chartGlobal._chartjsInstances.push(chart);
    return chart;
}
