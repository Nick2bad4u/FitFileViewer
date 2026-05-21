/**
 * Configuration passed through to the runtime Chart.js constructor.
 */
export type ManagedChartConfig = Record<string, unknown>;

/**
 * Runtime chart instance tracked by the shared Chart.js lifecycle registry.
 */
export type ManagedChartInstance = object;

type ManagedChartConstructor = new (
    canvas: HTMLCanvasElement,
    config: ManagedChartConfig
) => ManagedChartInstance;

type ManagedChartGlobal = typeof globalThis & {
    Chart?: ManagedChartConstructor;
    _chartjsInstances?: ManagedChartInstance[];
};

const chartGlobal = globalThis as ManagedChartGlobal;

/**
 * Create a Chart.js instance and register it in the shared lifecycle registry.
 *
 * @param canvas - Canvas element to render into.
 * @param config - Chart.js configuration object.
 *
 * @returns The created chart instance, or null when Chart.js is not loaded.
 */
export function createManagedChart(
    canvas: HTMLCanvasElement,
    config: ManagedChartConfig
): ManagedChartInstance | null {
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
