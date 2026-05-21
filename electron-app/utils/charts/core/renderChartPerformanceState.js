import { isObjectRecord } from "./renderChartModuleHelpers.js";
/**
 * Records summary performance state for the completed Chart.js render.
 *
 * @param dependencies - State accessors used by the chart renderer.
 * @param input - Render duration and rendered chart count.
 */
export function updateChartRenderPerformanceState(dependencies, input) {
    const existingRenderTimes = dependencies.getState(
        "performance.renderTimes"
    );
    const renderTimes = isObjectRecord(existingRenderTimes)
        ? existingRenderTimes
        : {};
    dependencies.updateState(
        "performance",
        {
            chartsRendered: input.totalChartsRendered,
            renderTimes: {
                ...renderTimes,
                lastChartRender: input.renderTime,
            },
        },
        { merge: true, source: "renderChartsWithData" }
    );
}
