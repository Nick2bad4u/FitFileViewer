import { registerChartJsPlugins } from "./renderChartPluginRegistration.js";
import { registerChartRequestListener } from "./renderChartRequestListener.js";
import { getMutableChartRuntimeGlobal } from "./renderChartRuntimeHelpers.js";

type ChartRequestStateManager = {
    debouncedRender(reason: string): void;
};

type InitializeChartRuntimeBootstrapDependencies = {
    getChartStateManager(): ChartRequestStateManager | null;
    renderChart(
        container?: Element | null | string,
        options?: unknown
    ): unknown;
};

type ChartPluginGlobal = Parameters<typeof registerChartJsPlugins>[0];

/** Mutable global object used by the renderer chart runtime. */
export type ChartRuntimeGlobal = ReturnType<
    typeof getMutableChartRuntimeGlobal
>;

/**
 * Initializes Chart.js global plugin registration and legacy render requests.
 *
 * @param dependencies - Runtime render bridge dependencies.
 *
 * @returns Mutable chart runtime global.
 */
export function initializeChartRuntimeBootstrap(
    dependencies: InitializeChartRuntimeBootstrapDependencies
): ChartRuntimeGlobal {
    const chartGlobal = getMutableChartRuntimeGlobal();

    registerChartJsPlugins(chartGlobal as ChartPluginGlobal);
    registerChartRequestListener({
        getChartStateManager: () => dependencies.getChartStateManager(),
        renderChart: (container) => dependencies.renderChart(container),
    });

    return chartGlobal;
}
