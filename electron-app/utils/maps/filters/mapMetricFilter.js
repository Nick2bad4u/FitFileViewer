/**
 * Map data point metric filtering utilities. Provides helpers to compute the
 * top percentile of record indices for a given metric when rendering markers.
 */

/**
 * @typedef {Object} MetricRecord
 * @property {number} [speed]
 * @property {number} [power]
 * @property {number} [cadence]
 * @property {number} [heartRate]
 * @property {number} [altitude]
 */

/**
 * @typedef {Object} MapDataPointFilterConfig
 * @property {boolean} enabled
 * @property {string} metric
 * @property {number} percent
 */

/**
 * @typedef {Object} MetricDefinition
 * @property {string} key
 * @property {string} label
 * @property {(row:MetricRecord)=>number|null} resolver
 */

/**
 * Available metrics that can be filtered on. Keep in sync with UI control.
 * @type {MetricDefinition[]}
 */
export const MAP_FILTER_METRICS = [
    {
        key: "speed",
        label: "Speed",
        resolver: (row) => (typeof row?.speed === "number" ? row.speed : null),
    },
    {
        key: "power",
        label: "Power",
        resolver: (row) => (typeof row?.power === "number" ? row.power : null),
    },
    {
        key: "cadence",
        label: "Cadence",
        resolver: (row) => (typeof row?.cadence === "number" ? row.cadence : null),
    },
    {
        key: "heartRate",
        label: "Heart Rate",
        resolver: (row) => (typeof row?.heartRate === "number" ? row.heartRate : null),
    },
    {
        key: "altitude",
        label: "Altitude",
        resolver: (row) => (typeof row?.altitude === "number" ? row.altitude : null),
    },
];

/**
 * @typedef {Object} MetricFilterResult
 * @property {boolean} isActive
 * @property {string|null} metric
 * @property {string|null} metricLabel
 * @property {number} percent
 * @property {number|null} threshold
 * @property {number} totalCandidates
 * @property {number} selectedCount
 * @property {Set<number>} allowedIndices
 * @property {number[]} orderedIndices
 * @property {string|null} reason
 */

/**
 * @typedef {Object} MetricFilterOptions
 * @property {(row:any)=>number|null} [valueExtractor]
 */

/**
 * Convenience helper returning a predicate for whether a record index should
 * be displayed, based on the provided metric filter result.
 *
 * @param {MetricFilterResult} result
 * @returns {(recordIndex:number)=>boolean}
 */
export function buildMetricFilterPredicate(result) {
    if (!result.isActive || result.allowedIndices.size === 0) {
        return () => true;
    }
    return (recordIndex) => result.allowedIndices.has(recordIndex);
}

/**
 * Compute the indices belonging to the requested top percentile for a metric.
 *
 * @param {Array<any>} recordMesgs
 * @param {MapDataPointFilterConfig | undefined | null} config
 * @param {MetricFilterOptions} [options]
 * @returns {MetricFilterResult}
 */
export function createMetricFilter(recordMesgs, config, options = {}) {
    const disabledResult = {
        isActive: false,
        metric: null,
        metricLabel: null,
        percent: 0,
        threshold: null,
        totalCandidates: 0,
        selectedCount: 0,
        allowedIndices: new Set(),
        orderedIndices: [],
        reason: null,
    };

    if (!config || !config.enabled) {
        return disabledResult;
    }

    const metricDef = getMetricDefinition(config.metric);
    if (!metricDef) {
        return {
            ...disabledResult,
            reason: `Unknown metric: ${config.metric}`,
        };
    }

    const valueExtractor = typeof options.valueExtractor === "function" ? options.valueExtractor : metricDef.resolver;

    const pct = clamp(Number(config.percent) || 0, 0, 100);
    if (pct <= 0) {
        return {
            ...disabledResult,
            reason: "Percent must be greater than zero for filtering",
        };
    }

    /** @type {{ index:number, value:number }[]} */
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

    const requestedCount = Math.ceil((entries.length * pct) / 100);
    const selectionCount = clamp(requestedCount, 1, entries.length);
    const thresholdEntry = entries.at(selectionCount - 1) ?? entries.at(-1);
    const thresholdValue = thresholdEntry ? thresholdEntry.value : entries[0].value;

    /** @type {number[]} */
    const orderedIndices = [];
    const allowedIndices = new Set();

    for (const entry of entries) {
        if (orderedIndices.length >= selectionCount && entry.value < thresholdValue) {
            break;
        }
        allowedIndices.add(entry.index);
        orderedIndices.push(entry.index);
    }

    return {
        isActive: true,
        metric: metricDef.key,
        metricLabel: metricDef.label,
        percent: pct,
        threshold: thresholdValue,
        totalCandidates: entries.length,
        selectedCount: orderedIndices.length,
        allowedIndices,
        orderedIndices,
        reason: null,
    };
}

/**
 * Resolve metric definition by key.
 * @param {string} metricKey
 * @returns {MetricDefinition|null}
 */
export function getMetricDefinition(metricKey) {
    return MAP_FILTER_METRICS.find((metric) => metric.key === metricKey) ?? null;
}

/**
 * Clamp helper for numeric ranges.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
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
