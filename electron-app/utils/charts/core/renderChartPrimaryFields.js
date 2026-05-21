import { fieldLabels } from "../../formatting/display/formatChartFields.js";
import { safeAppend } from "./renderChartDomHelpers.js";
import { shouldUseSpanGaps } from "./renderChartPerformanceSettings.js";
import { getCachedSeriesForSettings, getFieldSeriesEntry, } from "./renderChartSeriesCache.js";
/**
 * Renders primary FIT data-field charts into the target container.
 *
 * @param dependencies - DOM, visibility, runtime, and registration hooks.
 * @param options - Normalized settings and data used by the field loop.
 * @returns Render-loop status and number of visible charts created.
 */
export function renderPrimaryChartFields(dependencies, options) {
    let visibleFieldCount = 0;
    for (const field of options.fieldsToRender) {
        if (!dependencies.isTestRuntime && !dependencies.skipTabAbort) {
            const currentTab = dependencies.getActiveTab();
            if (currentTab !== "chart" && currentTab !== "chartjs") {
                console.log(`[ChartJS] Aborting render loop - tab switched to ${String(currentTab)}`);
                return { aborted: true, visibleFieldCount };
            }
        }
        const visibility = dependencies.getFieldVisibility(field);
        if (visibility === "hidden") {
            if (dependencies.isDebugLoggingEnabled) {
                console.log(`[ChartJS] Skipping hidden field: ${field}`);
            }
            continue;
        }
        const seriesEntry = getFieldSeriesEntry(options.recordMesgs, field, options.dataSettingsSignature, options.convert);
        const rawValueCount = seriesEntry.values.length;
        const { axisRanges, hasValidData, points: limitedPoints, } = getCachedSeriesForSettings(seriesEntry, options.labels, options.normalizedMaxPoints);
        if (dependencies.isDebugLoggingEnabled) {
            console.log(`[ChartJS] Field ${field}: ${rawValueCount} values (${limitedPoints.length} after limiting); visibility=${String(visibility)}`);
        }
        if (!hasValidData) {
            if (dependencies.isDebugLoggingEnabled) {
                console.log(`[ChartJS] Skipping field ${field} - no valid data after memoization`);
            }
            continue;
        }
        visibleFieldCount += 1;
        const canvas = dependencies.createChartCanvas(field, visibleFieldCount);
        safeAppend(dependencies.chartContainer, canvas);
        const chart = dependencies.createEnhancedChart(canvas, {
            animationStyle: options.animationStyle,
            axisRanges,
            chartData: limitedPoints,
            chartType: options.chartType,
            customColors: options.customColors,
            decimation: options.performanceTuning.decimation,
            enableSpanGaps: shouldUseSpanGaps(options.performanceTuning, seriesEntry),
            field,
            fieldLabels,
            interpolation: options.interpolation,
            showFill: options.boolSettings.showFill,
            showGrid: options.boolSettings.showGrid,
            showLegend: options.boolSettings.showLegend,
            showPoints: options.boolSettings.showPoints,
            showTitle: options.boolSettings.showTitle,
            smoothing: options.smoothing,
            tickSampleSize: options.performanceTuning.tickSampleSize,
            theme: options.exportTheme,
            zoomPluginConfig: options.zoomPluginConfig,
            timeUnits: options.timeUnits,
            distanceUnits: options.distanceUnits,
            temperatureUnits: options.temperatureUnits,
        });
        if (chart) {
            dependencies.chartGlobal._chartjsInstances.push(chart);
            dependencies.registerChart(chart);
        }
    }
    return { aborted: false, visibleFieldCount };
}
