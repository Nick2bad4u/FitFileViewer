export * from "./components/createChartCanvas.js";
export * from "./components/createChartStatusIndicator.js";
export * from "./components/createChartStatusIndicatorFromCounts.js";
export * from "./components/createEnhancedChart.js";
export * from "./dom/chartDomUtils.js";
export * from "./components/createGlobalChartStatusIndicator.js";
export * from "./components/createGlobalChartStatusIndicatorFromCounts.js";
export * from "./core/chartStateManager.js";
export * from "./core/chartTabIntegration.js";
export * from "./core/chartUpdater.js";
export * from "./core/renderChartJS.js";
export * from "./plugins/addChartHoverEffects.js";
export * from "./plugins/chartBackgroundColorPlugin.js";
export * from "./plugins/chartLegendItemBoxPlugin.js";
export * from "./plugins/chartOptionsConfig.js";
export * from "./plugins/chartZoomResetPlugin.js";
export * from "./rendering/renderAltitudeProfileChart.js";
export * from "./rendering/renderEventMessagesChart.js";
export * from "./rendering/renderGPSTimeChart.js";
export * from "./rendering/renderGPSTrackChart.js";
export * from "./rendering/renderLapZoneChart.js";
export * from "./rendering/renderPerformanceAnalysisCharts.js";
export * from "./rendering/renderPowerVsHeartRateChart.js";
export * from "./rendering/renderSpeedVsDistanceChart.js";
export * from "./rendering/renderTimeInZoneCharts.js";
export * from "./rendering/renderZoneChart.js";
export * from "./theming/chartColorSchemes.js";
export * from "./theming/chartOverlayColorPalette.js";
export * from "./theming/chartThemeListener.js";
export * from "./theming/chartThemeUtils.js";
export * from "./theming/getThemeColors.js";
export { renderLapZoneCharts } from "./rendering/renderLapZoneCharts.js";
export { renderZoneChart as renderZoneChartNew } from "./rendering/renderZoneChartNew.js";
declare namespace _default {
    function addChartHoverEffects(): Promise<
        typeof import("./plugins/addChartHoverEffects.js")
    >;
    function chartBackgroundColorPlugin(): Promise<
        typeof import("./plugins/chartBackgroundColorPlugin.js")
    >;
    function chartLegendItemBoxPlugin(): Promise<
        typeof import("./plugins/chartLegendItemBoxPlugin.js")
    >;
    function chartColorSchemes(): Promise<
        typeof import("./theming/chartColorSchemes.js")
    >;
    function chartStateManager(): Promise<
        typeof import("./core/chartStateManager.js")
    >;
    function chartTabIntegration(): Promise<
        typeof import("./core/chartTabIntegration.js")
    >;
    function chartThemeListener(): Promise<
        typeof import("./theming/chartThemeListener.js")
    >;
    function chartUpdater(): Promise<typeof import("./core/chartUpdater.js")>;
    function createChartCanvas(): Promise<
        typeof import("./components/createChartCanvas.js")
    >;
    function createEnhancedChart(): Promise<
        typeof import("./components/createEnhancedChart.js")
    >;
    function renderAltitudeProfileChart(): Promise<
        typeof import("./rendering/renderAltitudeProfileChart.js")
    >;
    function renderChartJS(): Promise<typeof import("./core/renderChartJS.js")>;
    function renderEventMessagesChart(): Promise<
        typeof import("./rendering/renderEventMessagesChart.js")
    >;
    function renderGPSTimeChart(): Promise<
        typeof import("./rendering/renderGPSTimeChart.js")
    >;
    function renderGPSTrackChart(): Promise<
        typeof import("./rendering/renderGPSTrackChart.js")
    >;
    function renderLapZoneChart(): Promise<
        typeof import("./rendering/renderLapZoneChart.js")
    >;
}
export default _default;
