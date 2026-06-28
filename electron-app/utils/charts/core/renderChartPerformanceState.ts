import type { ChartStateUpdateOptions } from "./renderChartStateAccess.js";

type UpdatePerformanceSummaryFunction = (
    summary: { chartsRendered: number; lastChartRender: number },
    options?: ChartStateUpdateOptions
) => void;

interface ChartRenderPerformanceStateDependencies {
    updatePerformanceSummary: UpdatePerformanceSummaryFunction;
}

interface ChartRenderPerformanceStateInput {
    renderTime: number;
    totalChartsRendered: number;
}

/**
 * Records summary performance state for the completed Chart.js render.
 *
 * @param dependencies - State accessors used by the chart renderer.
 * @param input - Render duration and rendered chart count.
 */
export function updateChartRenderPerformanceState(
    dependencies: ChartRenderPerformanceStateDependencies,
    input: ChartRenderPerformanceStateInput
): void {
    dependencies.updatePerformanceSummary(
        {
            chartsRendered: input.totalChartsRendered,
            lastChartRender: input.renderTime,
        },
        { source: "renderChartsWithData" }
    );
}
