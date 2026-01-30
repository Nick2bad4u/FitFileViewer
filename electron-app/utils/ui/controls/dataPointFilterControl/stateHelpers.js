import { computeMetricStatistics } from "../../../maps/filters/mapMetricFilter.js";

export function clampPercent(value) {
    if (!Number.isFinite(value) || Number.isNaN(value) || value < 1) {
        return 1;
    }
    if (value > 100) {
        return 100;
    }
    return Math.trunc(value);
}

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

export function computeMetricStats(metricKey) {
    const records = getGlobalRecords();
    return computeMetricStatistics(records, metricKey);
}

export function computeRangeState(metricKey, currentRangeValues, options = {}) {
    try {
        const stats = computeMetricStats(metricKey);
        if (!stats) {
            return { stats: null, rangeValues: null, sliderValues: null };
        }

        const preserveSelection = Boolean(options?.preserveSelection);
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

export function getGlobalRecords() {
    const win = /** @type {any} */ (globalThis);
    const records = Array.isArray(win?.globalData?.recordMesgs)
        ? win.globalData.recordMesgs
        : [];
    return records;
}

export function resolveInitialConfig(defaultMetric, defaultPercent) {
    const win = /** @type {any} */ (globalThis);
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

export function updateGlobalFilter(config) {
    const win = /** @type {any} */ (globalThis);
    win.mapDataPointFilter = { ...config };
}
