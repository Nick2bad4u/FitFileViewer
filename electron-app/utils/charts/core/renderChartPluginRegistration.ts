import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { chartLegendItemBoxPlugin } from "../plugins/chartLegendItemBoxPlugin.js";
import { resolveChartRuntime, resolveChartZoomPlugin } from "./chartRuntime.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";

interface ChartLike extends Record<string, unknown> {
    defaults?: {
        plugins?: {
            legend?: {
                labels?: Record<string, unknown>;
            };
        };
    };
    registry?: {
        plugins?: {
            get?(pluginId: string): unknown;
        };
    };
    register?: (...plugins: unknown[]) => void;
}

const registeredChartPluginRuntimes = new WeakSet<ChartLike>();

function isChartRegistered(chart: unknown): boolean {
    return isObjectRecord(chart) && registeredChartPluginRuntimes.has(chart);
}

function markChartRegistered(chart: unknown): void {
    if (!isObjectRecord(chart)) {
        return;
    }

    registeredChartPluginRuntimes.add(chart);
}

function registerBundledPlugins(chart: ChartLike): void {
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
    } catch {
        // Ignore plugin registration failures in non-browser tests.
    }
}

function configureLegendLabelDefaults(chart: ChartLike): void {
    try {
        const legendDefaults = chart.defaults?.plugins?.legend?.labels;
        if (!legendDefaults) {
            return;
        }

        if (
            typeof legendDefaults["padding"] !== "number" ||
            legendDefaults["padding"] < 10
        ) {
            legendDefaults["padding"] = 12;
        }
        if (
            typeof legendDefaults["boxWidth"] !== "number" ||
            legendDefaults["boxWidth"] < 14
        ) {
            legendDefaults["boxWidth"] = 16;
        }
        if (
            typeof legendDefaults["boxHeight"] !== "number" ||
            legendDefaults["boxHeight"] < 10
        ) {
            legendDefaults["boxHeight"] = 12;
        }
        if (
            typeof legendDefaults["pointStyleWidth"] !== "number" ||
            legendDefaults["pointStyleWidth"] < 14
        ) {
            legendDefaults["pointStyleWidth"] = 16;
        }
    } catch {
        // Ignore legend default updates for non-standard Chart test doubles.
    }
}

function registerPluginsForChart(chart: ChartLike | undefined): void {
    if (!chart || typeof chart.register !== "function") {
        return;
    }

    const zoomPlugin = resolveChartZoomPlugin();
    if (zoomPlugin && !chart.registry?.plugins?.get?.("zoom")) {
        chart.register(zoomPlugin);
    }

    registerBundledPlugins(chart);
    configureLegendLabelDefaults(chart);
    markChartRegistered(chart);
}

/**
 * Registers Chart.js plugins for the bundled Chart.js runtime.
 */
export function registerChartJsPlugins(): void {
    try {
        const chart = resolveChartRuntime(isChartLike);
        if (!isChartRegistered(chart)) {
            registerPluginsForChart(chart ?? undefined);
        }
    } catch {
        // Ignore plugin registration errors in tests and non-browser runtimes.
    }
}

function isChartLike(value: unknown): value is ChartLike {
    return isObjectRecord(value);
}
