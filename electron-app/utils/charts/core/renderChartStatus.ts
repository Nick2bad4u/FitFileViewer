interface ChartStatusStateView {
    controlsVisible: unknown;
    hasValidData: unknown;
    isRendered: unknown;
    isRendering: unknown;
    renderableFields: unknown;
    selectedChart: unknown;
}

interface GetChartStatusDependencies {
    chartState: ChartStatusStateView;
    getState(path: string): unknown;
}

/** Public chart rendering status snapshot. */
export interface ChartStatus {
    chartOptions: unknown;
    controlsVisible: unknown;
    hasData: unknown;
    isRendered: unknown;
    isRendering: unknown;
    lastRenderTime: unknown;
    performance: unknown;
    renderableFields: unknown;
    renderedCount: unknown;
    selectedChart: unknown;
}

/**
 * Reads the public chart status snapshot from state and the chart state view.
 *
 * @param dependencies - Runtime state getter and chart state view.
 *
 * @returns Public chart status object.
 */
export function getChartStatus(
    dependencies: GetChartStatusDependencies
): ChartStatus {
    return {
        chartOptions: dependencies.getState("charts.chartOptions"),
        controlsVisible: dependencies.chartState.controlsVisible,
        hasData: dependencies.chartState.hasValidData,
        isRendered: dependencies.chartState.isRendered,
        isRendering: dependencies.chartState.isRendering,
        lastRenderTime: dependencies.getState("charts.lastRenderTime"),
        performance: dependencies.getState("performance.renderTimes.chart"),
        renderableFields: dependencies.chartState.renderableFields,
        renderedCount: dependencies.getState("charts.renderedCount") || 0,
        selectedChart: dependencies.chartState.selectedChart,
    };
}
