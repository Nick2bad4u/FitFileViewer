function isVisible(visibility) {
    return visibility !== "hidden";
}
/**
 * Resolves state-managed visibility for the lap-zone supplemental chart variants.
 */
export function resolveLapZoneVisibility(visibility) {
    return {
        hrIndividualVisible: isVisible(visibility.getFieldVisibility("hr_lap_zone_individual")),
        hrStackedVisible: isVisible(visibility.getFieldVisibility("hr_lap_zone_stacked")),
        powerIndividualVisible: isVisible(visibility.getFieldVisibility("power_lap_zone_individual")),
        powerStackedVisible: isVisible(visibility.getFieldVisibility("power_lap_zone_stacked")),
    };
}
function shouldRenderLapZones(visibility) {
    return Object.values(visibility).some(Boolean);
}
/**
 * Renders the supplemental chart families that sit outside the per-field metric loop.
 */
export function renderSupplementalCharts(dependencies, input) {
    const { chartContainer, labels, renderers, visibility } = dependencies;
    const commonOptions = {
        showGrid: input.showGrid,
        showLegend: input.showLegend,
        showTitle: input.showTitle,
        zoomPluginConfig: input.zoomPluginConfig,
    };
    const gpsOptions = {
        maxPoints: input.maxPoints,
        showGrid: input.showGrid,
        showLegend: input.showLegend,
        showPoints: input.showPoints,
        showTitle: input.showTitle,
    };
    if (isVisible(visibility.getFieldVisibility("event_messages"))) {
        renderers.renderEventMessagesChart(chartContainer, commonOptions, input.startTime);
    }
    renderers.renderTimeInZoneCharts(chartContainer, commonOptions);
    const lapZoneVisibility = resolveLapZoneVisibility(visibility);
    if (shouldRenderLapZones(lapZoneVisibility)) {
        renderers.renderLapZoneCharts(chartContainer, {
            ...commonOptions,
            visibilitySettings: lapZoneVisibility,
        });
    }
    renderers.renderGPSTrackChart(chartContainer, input.data, gpsOptions);
    renderers.renderGPSTimeChart(chartContainer, input.data, gpsOptions);
    renderers.renderPerformanceAnalysisCharts(chartContainer, input.data, labels, {
        ...commonOptions,
        animationStyle: input.animationStyle,
        chartType: input.chartType,
        customColors: input.customColors,
        interpolation: input.interpolation,
        maxPoints: input.maxPoints,
        showFill: input.showFill,
        showPoints: input.showPoints,
        smoothing: input.smoothing,
    });
}
