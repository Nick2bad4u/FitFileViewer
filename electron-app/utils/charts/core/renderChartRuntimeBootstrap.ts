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
 * Initializes Chart.js plugin registration and chart render request handling.
 *
 * @param dependencies - Runtime chart rendering dependencies.
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
