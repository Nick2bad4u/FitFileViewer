import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartLegendItemBoxPlugin } from "../plugins/chartLegendItemBoxPlugin.js";
function isChartRegistered(chart) {
    return Boolean(chart &&
        typeof chart === "object" &&
        "__ffvPluginsRegistered" in chart &&
        chart["__ffvPluginsRegistered"]);
}
function markChartRegistered(chart) {
    if (!chart || typeof chart !== "object") {
        return;
    }
    try {
        Object.defineProperty(chart, "__ffvPluginsRegistered", {
            configurable: true,
            value: true,
        });
    }
    catch {
        // Ignore defineProperty errors from test doubles or locked objects.
    }
}
function registerBundledPlugins(chart) {
    try {
        const registry = chart.registry?.plugins;
        if (!registry?.get?.("chartBackgroundColorPlugin")) {
            chart.register?.(chartBackgroundColorPlugin);
            console.log("[ChartJS] chartBackgroundColorPlugin registered");
        }
        if (!registry?.get?.("chartLegendItemBoxPlugin")) {
            chart.register?.(chartLegendItemBoxPlugin);
            console.log("[ChartJS] chartLegendItemBoxPlugin registered");
        }
    }
    catch {
        // Ignore plugin registration failures in non-browser tests.
    }
}
function configureLegendLabelDefaults(chart) {
    try {
        const legendDefaults = chart.defaults?.plugins?.legend?.labels;
        if (!legendDefaults) {
            return;
        }
        if (typeof legendDefaults["padding"] !== "number" ||
            legendDefaults["padding"] < 10) {
            legendDefaults["padding"] = 12;
        }
        if (typeof legendDefaults["boxWidth"] !== "number" ||
            legendDefaults["boxWidth"] < 14) {
            legendDefaults["boxWidth"] = 16;
        }
        if (typeof legendDefaults["boxHeight"] !== "number" ||
            legendDefaults["boxHeight"] < 10) {
            legendDefaults["boxHeight"] = 12;
        }
        if (typeof legendDefaults["pointStyleWidth"] !== "number" ||
            legendDefaults["pointStyleWidth"] < 14) {
            legendDefaults["pointStyleWidth"] = 16;
        }
    }
    catch {
        // Ignore legend default updates for non-standard Chart test doubles.
    }
}
function registerPluginsForChart(chartGlobal, chart) {
    if (!chart || typeof chart.register !== "function") {
        return;
    }
    const chartZoom = chart["Zoom"];
    if (chartZoom) {
        chart.register(chartZoom);
    }
    else if (chartGlobal.chartjsPluginZoom) {
        chart.register(chartGlobal.chartjsPluginZoom);
    }
    else if (chartGlobal.ChartZoom) {
        chart.register(chartGlobal.ChartZoom);
    }
    registerBundledPlugins(chart);
    configureLegendLabelDefaults(chart);
    markChartRegistered(chart);
}
/**
 * Registers Chart.js plugins immediately and for late Chart assignments.
 *
 * @param chartGlobal - Mutable chart runtime global object.
 */
export function registerChartJsPlugins(chartGlobal) {
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
                    }
                    catch {
                        // Ignore getter registration failures.
                    }
                    return currentChart;
                },
                set(nextChart) {
                    currentChart = nextChart;
                    try {
                        registerPluginsForChart(chartGlobal, nextChart);
                    }
                    catch {
                        // Ignore setter registration failures.
                    }
                },
            });
            try {
                chartGlobal.Chart = currentChart;
            }
            catch {
                // Ignore setter trigger failures.
            }
        }
    }
    catch {
        // Ignore descriptor setup errors in tests.
    }
    try {
        if (chartGlobal?.Chart?.register) {
            const chartZoom = chartGlobal.Chart["Zoom"];
            if (chartZoom) {
                chartGlobal.Chart.register(chartZoom);
                console.log("[ChartJS] chartjs-plugin-zoom registered.");
            }
            else if (chartGlobal.chartjsPluginZoom) {
                chartGlobal.Chart.register(chartGlobal.chartjsPluginZoom);
                console.log("[ChartJS] chartjs-plugin-zoom registered (chartGlobal.ChartjsPluginZoom).");
            }
            else if (chartGlobal.ChartZoom) {
                chartGlobal.Chart.register(chartGlobal.ChartZoom);
                console.log("[ChartJS] chartjs-plugin-zoom registered (chartGlobal.ChartZoom).");
            }
        }
    }
    catch {
        // Ignore plugin registration errors in tests.
    }
}
