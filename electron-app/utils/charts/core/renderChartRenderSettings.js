import { normalizeMaxPointsValue } from "./renderChartPointUtils.js";
function isSettingOn(value) {
    return String(value) === "on" || value === true;
}
function isSettingNotOff(value) {
    return String(value) !== "off" && value !== false;
}
function toFiniteNumber(value, fallback) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
}
/**
 * Resolves persisted chart settings into render-loop inputs and updates state.
 *
 * @param dependencies - Runtime settings, cache signature, performance, and
 *   state hooks.
 * @param params - Data-size inputs for performance tuning.
 *
 * @returns Normalized settings for chart rendering.
 */
export function resolveChartRenderSettings(dependencies, params) {
    const settings = dependencies.getSettings();
    const { animation: animationStyle = "normal", chartType = "line", colors: customColors = [], distanceUnits = "kilometers", exportTheme = "auto", interpolation = "linear", maxpoints: maxPoints = dependencies.defaultMaxPoints, showFill = false, showGrid = true, showLegend = true, showPoints = false, showTitle = true, smoothing = 0.1, temperatureUnits = "celsius", timeUnits = "seconds", } = settings;
    const boolSettings = {
        showFill: isSettingOn(showFill),
        showGrid: isSettingNotOff(showGrid),
        showLegend: isSettingNotOff(showLegend),
        showPoints: isSettingOn(showPoints),
        showTitle: isSettingNotOff(showTitle),
    };
    const normalizedMaxPoints = normalizeMaxPointsValue(maxPoints);
    const dataSettingsSignature = dependencies.ensureDataSettingsSignature(settings);
    const performanceTuning = dependencies.resolvePerformanceSettings(params.recordCount, settings, dataSettingsSignature);
    dependencies.setChartOptionsState("charts.chartOptions", {
        ...settings,
        boolSettings,
        performanceTuning,
        processedAt: params.processedAt ?? Date.now(),
    }, { silent: false, source: "renderChartsWithData" });
    return {
        animationStyle: String(animationStyle),
        boolSettings,
        chartType: String(chartType),
        customColors,
        dataSettingsSignature,
        distanceUnits: String(distanceUnits),
        exportTheme: String(exportTheme),
        interpolation: String(interpolation),
        normalizedMaxPoints,
        performanceTuning,
        settings,
        smoothing: toFiniteNumber(smoothing, 0.1),
        temperatureUnits: String(temperatureUnits),
        timeUnits: String(timeUnits),
    };
}
