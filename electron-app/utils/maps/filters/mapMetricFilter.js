/**
 * Map data point metric filtering utilities. Provides helpers to compute the
 * top percentile of record indices for a given metric when rendering markers.
 */
import { getAuxHeartRateValue } from "../../data/processing/auxHeartRateUtils.js";
/**
 * Available metrics that can be filtered on. Keep in sync with UI control.
 */
export const MAP_FILTER_METRICS = [
    {
        key: "speed",
        label: "Speed",
        resolver: (row) => (typeof row.speed === "number" ? row.speed : null),
    },
    {
        key: "power",
        label: "Power",
        resolver: (row) => (typeof row.power === "number" ? row.power : null),
    },
    {
        key: "cadence",
        label: "Cadence",
        resolver: (row) =>
            typeof row.cadence === "number" ? row.cadence : null,
    },
    {
        key: "heartRate",
        label: "Heart Rate",
        resolver: (row) =>
            typeof row.heartRate === "number" ? row.heartRate : null,
    },
    {
        key: "auxHeartRate",
        label: "Aux Heart Rate",
        resolver: (row) => getAuxHeartRateValue(row),
    },
    {
        key: "altitude",
        label: "Altitude",
        resolver: (row) =>
            typeof row.altitude === "number" ? row.altitude : null,
    },
];
/**
 * Convenience helper returning a predicate for whether a record index should be
 * displayed, based on the provided metric filter result.
 */
export function buildMetricFilterPredicate(result) {
    if (!result.isActive || result.allowedIndices.size === 0) {
        return () => true;
    }
    return (recordIndex) => result.allowedIndices.has(recordIndex);
}
/**
 * Compute descriptive statistics for a metric across record messages.
 */
export function computeMetricStatistics(recordMesgs, metricKey, options = {}) {
    const metricDef = getMetricDefinition(metricKey);
    if (!metricDef) {
        return null;
    }
    const valueExtractor =
        typeof options.valueExtractor === "function"
            ? options.valueExtractor
            : metricDef.resolver;
    const values = [];
    let hasDecimal = false;
    for (const row of recordMesgs) {
        const value = valueExtractor(row);
        if (typeof value === "number" && Number.isFinite(value)) {
            values.push(value);
            if (!Number.isInteger(value)) {
                hasDecimal = true;
            }
        }
    }
    if (values.length === 0) {
        return null;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce(
        (accumulator, current) => accumulator + current,
        0
    );
    const average = sum / values.length;
    const decimals = hasDecimal ? 2 : 0;
    const range = Math.abs(max - min);
    let step;
    if (decimals === 0) {
        const raw = Math.round(range / 200) || 1;
        step = Math.max(1, raw);
    } else {
        const base = range / 200;
        const minimumStep = 1 / 10 ** decimals;
        step = Number(
            Number.isFinite(base) && base > minimumStep
                ? base.toFixed(decimals)
                : minimumStep.toFixed(decimals)
        );
    }
    return {
        average,
        count: values.length,
        decimals,
        max,
        metric: metricDef.key,
        metricLabel: metricDef.label,
        min,
        step,
    };
}
/**
 * Compute the indices belonging to the requested top percentile for a metric.
 */
export function createMetricFilter(recordMesgs, config, options = {}) {
    const mode = config?.mode === "valueRange" ? "valueRange" : "topPercent";
    const disabledResult = {
        allowedIndices: new Set(),
        appliedMax: null,
        appliedMin: null,
        isActive: false,
        maxCandidate: null,
        metric: null,
        metricLabel: null,
        minCandidate: null,
        mode,
        orderedIndices: [],
        percent: 0,
        reason: null,
        selectedCount: 0,
        threshold: null,
        totalCandidates: 0,
    };
    if (!config?.enabled) {
        return disabledResult;
    }
    const metricDef = getMetricDefinition(config.metric);
    if (!metricDef) {
        return {
            ...disabledResult,
            reason: `Unknown metric: ${config.metric}`,
        };
    }
    const valueExtractor =
        typeof options.valueExtractor === "function"
            ? options.valueExtractor
            : metricDef.resolver;
    const entries = [];
    for (const [idx, row] of recordMesgs.entries()) {
        const value = valueExtractor(row);
        if (typeof value === "number" && Number.isFinite(value)) {
            entries.push({ index: idx, value });
        }
    }
    if (entries.length === 0) {
        return {
            ...disabledResult,
            reason: `No valid ${metricDef.label.toLowerCase()} data available for filtering`,
        };
    }
    entries.sort((a, b) => b.value - a.value);
    const maxEntry = entries[0];
    if (!maxEntry) {
        return disabledResult;
    }
    const maxCandidate = maxEntry.value;
    const minCandidate = entries.at(-1)?.value ?? maxCandidate;
    if (mode === "valueRange") {
        return createValueRangeFilter({
            config,
            disabledResult,
            entries,
            maxCandidate,
            metricDef,
            minCandidate,
        });
    }
    return createTopPercentFilter({
        config,
        disabledResult,
        entries,
        maxCandidate,
        metricDef,
        minCandidate,
    });
}
/**
 * Resolve metric definition by key.
 */
export function getMetricDefinition(metricKey) {
    return (
        MAP_FILTER_METRICS.find((metric) => metric.key === metricKey) ?? null
    );
}
function createValueRangeFilter({
    config,
    disabledResult,
    entries,
    maxCandidate,
    metricDef,
    minCandidate,
}) {
    const appliedMin = clampValue(
        typeof config.minValue === "number" ? config.minValue : minCandidate,
        minCandidate,
        maxCandidate
    );
    const appliedMax = clampValue(
        typeof config.maxValue === "number" ? config.maxValue : maxCandidate,
        minCandidate,
        maxCandidate
    );
    const normalizedMin = Math.min(appliedMin, appliedMax);
    const normalizedMax = Math.max(appliedMin, appliedMax);
    const orderedIndices = [];
    const allowedIndices = new Set();
    for (const entry of entries) {
        if (entry.value >= normalizedMin && entry.value <= normalizedMax) {
            allowedIndices.add(entry.index);
            orderedIndices.push(entry.index);
        }
    }
    if (orderedIndices.length === 0) {
        return {
            ...disabledResult,
            appliedMax: normalizedMax,
            appliedMin: normalizedMin,
            maxCandidate,
            minCandidate,
            mode: "valueRange",
            reason: `No data points fall between ${normalizedMin} and ${normalizedMax}`,
        };
    }
    return {
        allowedIndices,
        appliedMax: normalizedMax,
        appliedMin: normalizedMin,
        isActive: true,
        maxCandidate,
        metric: metricDef.key,
        metricLabel: metricDef.label,
        minCandidate,
        mode: "valueRange",
        orderedIndices,
        percent: (orderedIndices.length / entries.length) * 100,
        reason: null,
        selectedCount: orderedIndices.length,
        threshold: null,
        totalCandidates: entries.length,
    };
}
function createTopPercentFilter({
    config,
    disabledResult,
    entries,
    maxCandidate,
    metricDef,
    minCandidate,
}) {
    const pct = clamp(Number(config.percent) || 0, 0, 100);
    if (pct <= 0) {
        return {
            ...disabledResult,
            maxCandidate,
            minCandidate,
            reason: "Percent must be greater than zero for filtering",
        };
    }
    const requestedCount = Math.ceil((entries.length * pct) / 100);
    const selectionCount = clamp(requestedCount, 1, entries.length);
    const thresholdEntry = entries.at(selectionCount - 1) ?? entries.at(-1);
    const thresholdValue = thresholdEntry?.value ?? maxCandidate;
    const orderedIndices = [];
    const allowedIndices = new Set();
    for (const entry of entries) {
        if (
            orderedIndices.length >= selectionCount &&
            entry.value < thresholdValue
        ) {
            break;
        }
        allowedIndices.add(entry.index);
        orderedIndices.push(entry.index);
    }
    return {
        allowedIndices,
        appliedMax: null,
        appliedMin: null,
        isActive: true,
        maxCandidate,
        metric: metricDef.key,
        metricLabel: metricDef.label,
        minCandidate,
        mode: "topPercent",
        orderedIndices,
        percent: pct,
        reason: null,
        selectedCount: orderedIndices.length,
        threshold: thresholdValue,
        totalCandidates: entries.length,
    };
}
function clamp(value, min, max) {
    if (Number.isNaN(value)) {
        return min;
    }
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}
function clampValue(value, min, max) {
    if (!Number.isFinite(value)) {
        return min;
    }
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}
