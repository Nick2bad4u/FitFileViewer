import { computeMetricStatistics } from "../../../maps/filters/mapMetricFilter.js";
/** Clamps a top-percent filter value to the supported integer range. */
export function clampPercent(value) {
    if (!Number.isFinite(value) || Number.isNaN(value) || value < 1) {
        return 1;
    }
    if (value > 100) {
        return 100;
    }
    return Math.trunc(value);
}
/** Clamps a range endpoint to the available metric statistics. */
export function clampRangeValue(value, stats) {
    if (!Number.isFinite(value)) {
        return stats.min;
    }
    if (value < stats.min) {
        return stats.min;
    }
    if (value > stats.max) {
        return stats.max;
    }
    return value;
}
/** Computes statistics for the active global record set. */
export function computeMetricStats(metricKey) {
    const records = getGlobalRecords();
    return computeMetricStatistics(records, metricKey);
}
/** Computes the normalized range state used by the filter sliders. */
export function computeRangeState(metricKey, currentRangeValues, options = {}) {
    try {
        const stats = computeMetricStats(metricKey);
        if (!stats) {
            return { stats: null, rangeValues: null, sliderValues: null };
        }
        const preserveSelection = Boolean(options.preserveSelection);
        let minValue =
            preserveSelection && currentRangeValues?.min !== undefined
                ? currentRangeValues.min
                : stats.min;
        let maxValue =
            preserveSelection && currentRangeValues?.max !== undefined
                ? currentRangeValues.max
                : stats.max;
        minValue = clampRangeValue(minValue, stats);
        maxValue = clampRangeValue(maxValue, stats);
        if (minValue > maxValue) {
            minValue = stats.min;
            maxValue = stats.max;
        }
        return {
            stats,
            rangeValues: { min: minValue, max: maxValue },
            sliderValues: {
                min: toSliderString(minValue, stats.decimals),
                max: toSliderString(maxValue, stats.decimals),
            },
        };
    } catch (error) {
        console.error(
            "[dataPointFilter] Failed to compute metric statistics",
            error
        );
        return { stats: null, rangeValues: null, sliderValues: null };
    }
}
/** Formats a metric value with a stable decimal count. */
export function formatMetricValue(value, stats, decimalsOverride) {
    const decimalsRaw =
        typeof decimalsOverride === "number"
            ? decimalsOverride
            : (stats?.decimals ?? (Number.isInteger(value) ? 0 : 2));
    const decimals = Math.min(4, Math.max(0, decimalsRaw));
    const formatter = new Intl.NumberFormat(undefined, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals > 0 ? Math.min(decimals, 2) : 0,
    });
    return formatter.format(value);
}
/** Formats a percent value for display. */
export function formatPercent(value) {
    if (!Number.isFinite(value)) {
        return "0";
    }
    const formatter = new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
    });
    return formatter.format(value);
}
/** Reads FIT record messages from the renderer global state. */
export function getGlobalRecords() {
    const win = globalThis;
    const records = win.globalData?.recordMesgs;
    return Array.isArray(records) ? records : [];
}
/** Resolves persisted filter settings against UI defaults. */
export function resolveInitialConfig(defaultMetric, defaultPercent) {
    const win = globalThis;
    const existing = win.mapDataPointFilter;
    const metricKey =
        typeof existing?.metric === "string" ? existing.metric : defaultMetric;
    const mode = existing?.mode === "valueRange" ? "valueRange" : "topPercent";
    const percentValue = clampPercent(
        typeof existing?.percent === "number"
            ? existing.percent
            : Number.parseInt(defaultPercent, 10) || 10
    );
    const minValue =
        typeof existing?.minValue === "number" ? existing.minValue : undefined;
    const maxValue =
        typeof existing?.maxValue === "number" ? existing.maxValue : undefined;
    return {
        enabled: Boolean(existing?.enabled),
        maxValue,
        metric: metricKey,
        minValue,
        mode,
        percent: percentValue,
    };
}
/** Converts a metric value to the exact slider string expected by the UI. */
export function toSliderString(value, decimals) {
    if (!Number.isFinite(value)) {
        return "0";
    }
    if (decimals > 0) {
        const limited = Math.min(4, Math.max(0, decimals));
        return value.toFixed(limited);
    }
    return String(Math.round(value));
}
/** Stores the active filter config on the renderer global state. */
export function updateGlobalFilter(config) {
    const win = globalThis;
    win.mapDataPointFilter = { ...config };
}
