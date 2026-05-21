import type { StateUpdateOptions } from "../../state/core/stateManager.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";

type GetStateFunction = (path: string) => unknown;
type UpdateStateFunction = (
    path: string,
    value: Record<string, unknown>,
    options?: StateUpdateOptions
) => void;

interface ChartRenderPerformanceStateDependencies {
    getState: GetStateFunction;
    updateState: UpdateStateFunction;
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
