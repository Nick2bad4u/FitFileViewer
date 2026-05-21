import { renderPrimaryChartFields } from "./renderChartPrimaryFields.js";
import { renderSupplementalCharts } from "./renderChartSupplementalCharts.js";
/**
 * Renders primary metric charts followed by supplemental chart families.
 *
 * @param dependencies - Runtime chart construction, state, visibility, and
 *   renderer hooks.
 * @param input - Data, settings, labels, and theme-aware render options.
 *
 * @returns Render-loop status and number of visible primary field charts.
 */
export function renderChartDataCharts(dependencies, input) {
    const primaryFieldRenderResult = renderPrimaryChartFields(
        {
            chartContainer: dependencies.chartContainer,
            chartGlobal: dependencies.chartGlobal,
            createChartCanvas: dependencies.createChartCanvas,
            createEnhancedChart: dependencies.createEnhancedChart,
            getActiveTab: dependencies.getActiveTab,
            getFieldVisibility: dependencies.getFieldVisibility,
            isDebugLoggingEnabled: dependencies.isDebugLoggingEnabled,
            isTestRuntime: dependencies.isTestRuntime,
            registerChart: dependencies.registerChart,
            skipTabAbort: dependencies.skipTabAbort,
        },
        input
    );
    if (primaryFieldRenderResult.aborted) {
        return primaryFieldRenderResult;
    }
    renderSupplementalCharts(
        {
            chartContainer: dependencies.chartContainer,
            labels: input.labels,
            renderers: dependencies.renderers,
            visibility: {
                getFieldVisibility: dependencies.getFieldVisibility,
            },
        },
        {
            animationStyle: input.animationStyle,
            chartType: input.chartType,
            customColors: input.customColors,
            data: input.recordMesgs,
            interpolation: input.interpolation,
            maxPoints: input.normalizedMaxPoints,
            showFill: input.boolSettings.showFill,
            showGrid: input.boolSettings.showGrid,
            showLegend: input.boolSettings.showLegend,
            showPoints: input.boolSettings.showPoints,
            showTitle: input.boolSettings.showTitle,
            smoothing: input.smoothing,
            startTime: input.startTime,
            zoomPluginConfig: input.zoomPluginConfig,
        }
    );
    return primaryFieldRenderResult;
}
