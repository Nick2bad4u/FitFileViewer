/**
 * Reads the public chart status snapshot from state and the chart state view.
 *
 * @param dependencies - Runtime state getter and chart state view.
 * @returns Public chart status object.
 */
export function getChartStatus(dependencies) {
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
