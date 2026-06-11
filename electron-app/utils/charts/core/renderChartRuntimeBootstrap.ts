import { registerChartJsPlugins } from "./renderChartPluginRegistration.js";
import { registerChartRequestListener } from "./renderChartRequestListener.js";
import { getMutableChartRuntimeEnvironment } from "./renderChartRuntimeHelpers.js";

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

/** Mutable environment object used by the renderer chart runtime. */
export type ChartRuntimeEnvironment = ReturnType<
    typeof getMutableChartRuntimeEnvironment
>;

/**
 * Initializes Chart.js global plugin registration and legacy render requests.
 *
 * @param dependencies - Runtime render bridge dependencies.
 *
 * @returns Mutable chart runtime environment.
 */
export function initializeChartRuntimeBootstrap(
    dependencies: InitializeChartRuntimeBootstrapDependencies
): ChartRuntimeEnvironment {
    const chartEnvironment = getMutableChartRuntimeEnvironment();

    registerChartJsPlugins(chartEnvironment as ChartPluginGlobal);
    registerChartRequestListener({
        getChartStateManager: () => dependencies.getChartStateManager(),
        renderChart: (container) => dependencies.renderChart(container),
    });

    return chartEnvironment;
}
