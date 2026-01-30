/**
 * Organized exports for all chart-related utilities
 *
 * @version 1.0.0
 *
 * @file Charts Utilities Barrel Export
 *
 * @author FitFileViewer Development Team
 */

// Chart components
export * from "./components/createChartCanvas.js";
export * from "./components/createChartStatusIndicator.js";
export * from "./components/createChartStatusIndicatorFromCounts.js";
export * from "./components/createEnhancedChart.js";

export * from "./components/createGlobalChartStatusIndicator.js";
export * from "./components/createGlobalChartStatusIndicatorFromCounts.js";
// Core chart functionality
export * from "./core/chartStateManager.js";
export * from "./core/chartTabIntegration.js";
export * from "./core/chartUpdater.js";
export * from "./core/renderChartJS.js";
export * from "./plugins/addChartHoverEffects.js";
// Chart plugins
export * from "./plugins/chartBackgroundColorPlugin.js";
export * from "./plugins/chartOptionsConfig.js";
export * from "./plugins/chartZoomResetPlugin.js";
// Chart rendering utilities
export * from "./rendering/renderAltitudeProfileChart.js";

export * from "./rendering/renderEventMessagesChart.js";
export * from "./rendering/renderGPSTimeChart.js";
export * from "./rendering/renderGPSTrackChart.js";
export * from "./rendering/renderLapZoneChart.js";
// Removed wildcard export that re-exported LapZoneDatum / LapZoneEntry already exported by renderLapZoneChart.js
export { renderLapZoneCharts } from "./rendering/renderLapZoneCharts.js";
export * from "./rendering/renderPerformanceAnalysisCharts.js";
export * from "./rendering/renderPowerVsHeartRateChart.js";

export * from "./rendering/renderSpeedVsDistanceChart.js";
export * from "./rendering/renderTimeInZoneCharts.js";
export * from "./rendering/renderZoneChart.js";
// Avoid duplicate named export 'renderZoneChart' from legacy renderZoneChart.js
export { renderZoneChart as renderZoneChartNew } from "./rendering/renderZoneChartNew.js";
export * from "./theming/chartColorSchemes.js";

export * from "./theming/chartOverlayColorPalette.js";
// Chart theming
export * from "./theming/chartThemeListener.js";
export * from "./theming/chartThemeUtils.js";
export * from "./theming/getThemeColors.js";

/**
 * Default export object for namespace imports Usage: import charts from
 * './utils/charts';
 */
export default {
    addChartHoverEffects: () => import("./plugins/addChartHoverEffects.js"),
    // Plugins
    chartBackgroundColorPlugin: () =>
        import("./plugins/chartBackgroundColorPlugin.js"),
    chartColorSchemes: () => import("./theming/chartColorSchemes.js"),
    // Core
    chartStateManager: () => import("./core/chartStateManager.js"),

    chartTabIntegration: () => import("./core/chartTabIntegration.js"),
    // Theming
    chartThemeListener: () => import("./theming/chartThemeListener.js"),
    chartUpdater: () => import("./core/chartUpdater.js"),
    // Components
    createChartCanvas: () => import("./components/createChartCanvas.js"),

    createEnhancedChart: () => import("./components/createEnhancedChart.js"),
    // Rendering
    renderAltitudeProfileChart: () =>
        import("./rendering/renderAltitudeProfileChart.js"),

    renderChartJS: () => import("./core/renderChartJS.js"),
    renderEventMessagesChart: () =>
        import("./rendering/renderEventMessagesChart.js"),

    renderGPSTimeChart: () => import("./rendering/renderGPSTimeChart.js"),
    renderGPSTrackChart: () => import("./rendering/renderGPSTrackChart.js"),
    renderLapZoneChart: () => import("./rendering/renderLapZoneChart.js"),
};

console.log("[Charts] Barrel export loaded - all chart utilities available");
