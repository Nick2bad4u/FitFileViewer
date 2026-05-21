import { isChartLibraryUnavailable, touchStringTargetContainer, } from "./renderChartPreflight.js";
import { clearExistingCharts, startChartRendering, } from "./renderChartLifecycle.js";
/**
 * Starts a chart render session and validates runtime availability.
 *
 * @param dependencies - DOM, state, lifecycle, and notification dependencies.
 * @param input - Render target input.
 *
 * @returns Session timing when chart rendering can continue.
 */
export async function beginChartRenderSession(dependencies, input) {
    touchStringTargetContainer(dependencies.doc, input.targetContainer);
    startChartRendering({
        getGlobalChartActions: dependencies.getGlobalChartActions,
        isLoadingStateSuppressed: dependencies.isLoadingStateSuppressed,
        setState: dependencies.setState,
    });
    await dependencies.waitIfRapidRender();
    const performanceStart = dependencies.now();
    if (!dependencies.chartGlobal._chartjsInstances) {
        dependencies.chartGlobal._chartjsInstances = [];
    }
    clearExistingCharts({
        chartGlobal: dependencies.chartGlobal,
        getGlobalChartActions: dependencies.getGlobalChartActions,
        updateState: dependencies.updateState,
    });
    if (isChartLibraryUnavailable(dependencies.chartGlobal)) {
        const error = "Chart.js library is not loaded or not available";
        console.error(`[ChartJS] ${error}`);
        await dependencies.notify("Chart library not available", "error");
        dependencies.safeCompleteRendering(false);
        return { ready: false };
    }
    return { performanceStart, ready: true };
}
