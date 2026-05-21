/**
 * Resolves late-bound chart renderer dependencies for a render pass.
 *
 * @param input - Accessors for dynamically injected renderer dependencies.
 *
 * @returns Safe dependency aliases consumed by the chart render loop.
 */
export async function resolveChartRuntimeDependencies(input) {
    const themeConfig = await input.getThemeConfig();
    const convert = input.getConverters();
    const { createChartCanvas: createChartCanvasSafe, createEnhancedChart: createEnhancedChartSafe, renderEventMessagesChart: renderEventMessagesChartSafe, renderGPSTimeChart: renderGPSTimeChartSafe, renderGPSTrackChart: renderGPSTrackChartSafe, renderLapZoneCharts: renderLapZoneChartsSafe, renderPerformanceAnalysisCharts: renderPerformanceAnalysisChartsSafe, renderTimeInZoneCharts: renderTimeInZoneChartsSafe, } = input.getRendererModules();
    const { addChartHoverEffects: addChartHoverEffectsSafe, addHoverEffectsToExistingCharts: addHoverEffectsToExistingChartsSafe, removeChartHoverEffects: removeChartHoverEffectsSafe, } = input.getHoverPlugins();
    const showRenderNotificationSafe = input.getShowRenderNotification();
    const { getState: gs_rcwd, setState: ss_rcwd, updateState: us_rcwd, } = input.getStateManager();
    return {
        addChartHoverEffectsSafe,
        addHoverEffectsToExistingChartsSafe,
        convert,
        createChartCanvasSafe,
        createEnhancedChartSafe,
        gs_rcwd,
        removeChartHoverEffectsSafe,
        renderEventMessagesChartSafe,
        renderGPSTimeChartSafe,
        renderGPSTrackChartSafe,
        renderLapZoneChartsSafe,
        renderPerformanceAnalysisChartsSafe,
        renderTimeInZoneChartsSafe,
        showRenderNotificationSafe,
        ss_rcwd,
        themeConfig,
        us_rcwd,
    };
}
