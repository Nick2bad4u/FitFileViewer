/** Point count above which Chart.js decimation and span-gap tuning are enabled. */
export const DECIMATION_THRESHOLD = 2500;
/** Target maximum x-axis tick sample size before reducing tick calculations. */
export const MAX_TICK_TARGET = 600;
const performanceSettingsCache = new Map();
/** Clears cached chart performance settings after data or settings changes. */
export function clearPerformanceSettingsCache() {
    performanceSettingsCache.clear();
}
/** Resolves performance tuning options for a chart render. */
export function resolvePerformanceSettings(totalPoints, settings, dataSettingsSignature) {
    const key = `${totalPoints}|${settings?.chartType || "line"}|${dataSettingsSignature}`;
    const cached = performanceSettingsCache.get(key);
    if (cached) {
        return cached;
    }
    const allowDecimation = (!settings?.chartType ||
        [
            "area",
            "line",
            "radar",
        ].includes(String(settings.chartType))) &&
        totalPoints > DECIMATION_THRESHOLD;
    const decimation = allowDecimation
        ? {
            algorithm: "min-max",
            enabled: true,
            samples: 4,
            threshold: 1000,
        }
        : { enabled: false };
    const tickSampleSize = totalPoints > MAX_TICK_TARGET
        ? Math.ceil(totalPoints / MAX_TICK_TARGET)
        : undefined;
    const enableSpanGaps = totalPoints > DECIMATION_THRESHOLD;
    const result = { decimation, enableSpanGaps, tickSampleSize };
    performanceSettingsCache.set(key, result);
    return result;
}
/** Returns whether a dataset should use Chart.js spanGaps. */
export function shouldUseSpanGaps(performanceSettings, seriesEntry) {
    if (!performanceSettings?.enableSpanGaps) {
        return false;
    }
    return Boolean(seriesEntry?.hasNull);
}
