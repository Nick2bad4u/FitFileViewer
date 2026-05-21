import { registerChartJsPlugins } from "./renderChartPluginRegistration.js";
import { registerChartRequestListener } from "./renderChartRequestListener.js";
import { getMutableChartRuntimeGlobal } from "./renderChartRuntimeHelpers.js";
/**
 * Initializes Chart.js global plugin registration and legacy render requests.
 *
 * @param dependencies - Runtime render bridge dependencies.
 *
 * @returns Mutable chart runtime global.
 */
export function initializeChartRuntimeBootstrap(dependencies) {
    const chartGlobal = getMutableChartRuntimeGlobal();
    registerChartJsPlugins(chartGlobal);
    registerChartRequestListener({
        chartGlobal,
        getChartStateManager: dependencies.getChartStateManager,
        renderChart: dependencies.renderChart,
    });
    return chartGlobal;
}
