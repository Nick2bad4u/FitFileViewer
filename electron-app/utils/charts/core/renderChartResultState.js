function getRenderedChartCount(chartInstances) {
    return Array.isArray(chartInstances) ? chartInstances.length : 0;
}
function getEmptyChartMessage(totalChartsRendered, visibleFieldCount) {
    if (totalChartsRendered !== 0) {
        return null;
    }
    return visibleFieldCount === 0
        ? 'No visible metrics selected. Enable metrics in the "Visible Metrics" section above.'
        : "No suitable numeric data available for selected chart type.";
}
/**
 * Resolves the post-render chart count and renders the appropriate empty-state
 * message when no chart instances were created.
 *
 * @param dependencies - Chart instance and empty-state rendering dependencies.
 * @param input - Render-visible metric count.
 * @returns Resolved render result state.
 */
export function resolveChartRenderResultState(dependencies, input) {
    const totalChartsRendered = getRenderedChartCount(dependencies.chartInstances);
    const emptyChartMessage = getEmptyChartMessage(totalChartsRendered, input.visibleFieldCount);
    if (emptyChartMessage !== null) {
        dependencies.renderNoDataMessage(dependencies.chartContainer, emptyChartMessage);
    }
    return { totalChartsRendered };
}
