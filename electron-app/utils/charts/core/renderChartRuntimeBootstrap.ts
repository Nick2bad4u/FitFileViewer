import { registerChartJsPlugins } from "./renderChartPluginRegistration.js";
import { registerChartRequestListener } from "./renderChartRequestListener.js";

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

/**
 * Initializes Chart.js global plugin registration and legacy render requests.
 *
 * @param dependencies - Runtime render bridge dependencies.
 */
export function initializeChartRuntimeBootstrap(
    dependencies: InitializeChartRuntimeBootstrapDependencies
): void {
    registerChartJsPlugins();
    registerChartRequestListener({
        getChartStateManager: () => dependencies.getChartStateManager(),
        renderChart: (container) => dependencies.renderChart(container),
    });
}
