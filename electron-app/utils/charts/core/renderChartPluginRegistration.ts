import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartLegendItemBoxPlugin } from "../plugins/chartLegendItemBoxPlugin.js";

interface ChartLike extends Record<string, unknown> {
    register?: (...plugins: unknown[]) => void;
}

interface ChartPluginGlobal extends Record<string, unknown> {
    Chart?: ChartLike | undefined;
    ChartZoom?: unknown;
    chartjsPluginZoom?: unknown;
}

function isChartRegistered(chart: unknown): boolean {
    return Boolean(
        chart &&
            typeof chart === "object" &&
            "__ffvPluginsRegistered" in chart &&
            (chart as Record<string, unknown>)["__ffvPluginsRegistered"]
    );
}

function markChartRegistered(chart: unknown): void {
    if (!chart || typeof chart !== "object") {
        return;
    }

    try {
        Object.defineProperty(chart, "__ffvPluginsRegistered", {
            configurable: true,
            value: true,
        });
    } catch {
        // Ignore defineProperty errors from test doubles or locked objects.
    }
}

function registerBundledPlugins(chart: ChartLike): void {
    try {
        chart.register?.(chartBackgroundColorPlugin);
        chart.register?.(chartLegendItemBoxPlugin);
    } catch {
        // Ignore plugin registration failures in non-browser tests.
    }
}

function registerPluginsForChart(
    chartGlobal: ChartPluginGlobal,
    chart: ChartLike | undefined
): void {
    if (!chart || typeof chart.register !== "function") {
        return;
    }

    const chartZoom = chart["Zoom"];
    if (chartZoom) {
        chart.register(chartZoom);
    } else if (chartGlobal.chartjsPluginZoom) {
        chart.register(chartGlobal.chartjsPluginZoom);
    } else if (chartGlobal.ChartZoom) {
        chart.register(chartGlobal.ChartZoom);
    }

    registerBundledPlugins(chart);
    markChartRegistered(chart);
}

/**
 * Registers Chart.js plugins immediately and for late Chart assignments.
 *
 * @param chartGlobal - Mutable chart runtime global object.
 */
export function registerChartJsPlugins(chartGlobal: ChartPluginGlobal): void {
    try {
        if (chartGlobal && !Object.getOwnPropertyDescriptor(chartGlobal, "Chart")?.set) {
            let currentChart = chartGlobal.Chart;

            Object.defineProperty(chartGlobal, "Chart", {
                configurable: true,
                enumerable: true,
                get() {
                    try {
                        if (currentChart && !isChartRegistered(currentChart)) {
                            registerPluginsForChart(chartGlobal, currentChart);
                        }
                    } catch {
                        // Ignore getter registration failures.
                    }

                    return currentChart;
                },
                set(nextChart: ChartLike | undefined) {
                    currentChart = nextChart;
                    try {
                        registerPluginsForChart(chartGlobal, nextChart);
                    } catch {
                        // Ignore setter registration failures.
                    }
                },
            });

            try {
                chartGlobal.Chart = currentChart;
            } catch {
                // Ignore setter trigger failures.
            }
        }
    } catch {
        // Ignore descriptor setup errors in tests.
    }

    try {
        if (chartGlobal?.Chart?.register) {
            const chartZoom = chartGlobal.Chart["Zoom"];
            if (chartZoom) {
                chartGlobal.Chart.register(chartZoom);
                console.log("[ChartJS] chartjs-plugin-zoom registered.");
            } else if (chartGlobal.chartjsPluginZoom) {
                chartGlobal.Chart.register(chartGlobal.chartjsPluginZoom);
                console.log(
                    "[ChartJS] chartjs-plugin-zoom registered (chartGlobal.ChartjsPluginZoom)."
                );
            } else if (chartGlobal.ChartZoom) {
                chartGlobal.Chart.register(chartGlobal.ChartZoom);
                console.log(
                    "[ChartJS] chartjs-plugin-zoom registered (chartGlobal.ChartZoom)."
                );
            }
        }
    } catch {
        // Ignore plugin registration errors in tests.
    }
}
