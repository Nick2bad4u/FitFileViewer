import { getRecordValue } from "./renderChartModuleHelpers.js";
import { calculateAxisRanges, createChartPoints, getMaxPointCacheKey, limitChartPoints, } from "./renderChartPointUtils.js";
import { resolveRecordFieldKey } from "./renderChartRecordKeyUtils.js";
let fieldSeriesCache = new WeakMap();
const chartSeriesCacheStats = { hits: 0, misses: 0 };
/** Clears all per-record chart series data and resets cache counters. */
export function clearChartSeriesCache() {
    fieldSeriesCache = new WeakMap();
    chartSeriesCacheStats.hits = 0;
    chartSeriesCacheStats.misses = 0;
}
/** Returns a snapshot of current series cache hit/miss counters. */
export function getChartSeriesCacheStats() {
    return { ...chartSeriesCacheStats };
}
function ensureFieldSeriesCache(recordMesgs) {
    let cache = fieldSeriesCache.get(recordMesgs);
    if (!cache) {
        cache = {
            fields: new Map(),
            readKeys: new Map(),
        };
        fieldSeriesCache.set(recordMesgs, cache);
    }
    else if (!(cache.readKeys instanceof Map)) {
        cache.readKeys = new Map();
    }
    return cache;
}
/** Returns cached Chart.js points and axis bounds for a field/label/limit tuple. */
export function getCachedSeriesForSettings(entry, labels, maxPointsValue) {
    entry.pointCache ??= new WeakMap();
    let labelCache = entry.pointCache.get(labels);
    if (!labelCache) {
        const basePoints = createChartPoints(labels, entry.values);
        const baseAxisRange = calculateAxisRanges(basePoints);
        const baseHasValidData = basePoints.some(({ y }) => typeof y === "number" && Number.isFinite(y));
        labelCache = {
            baseAxisRange,
            baseHasValidData,
            basePoints,
            limits: new Map(),
        };
        entry.pointCache.set(labels, labelCache);
    }
    const key = getMaxPointCacheKey(maxPointsValue);
    const cached = labelCache.limits.get(key);
    if (cached) {
        chartSeriesCacheStats.hits += 1;
        return cached;
    }
    chartSeriesCacheStats.misses += 1;
    const points = maxPointsValue === "all"
        ? labelCache.basePoints
        : limitChartPoints(labelCache.basePoints, maxPointsValue);
    const hasValidData = maxPointsValue === "all"
        ? labelCache.baseHasValidData
        : points.some(({ y }) => typeof y === "number" && Number.isFinite(y));
    const axisRanges = maxPointsValue === "all"
        ? labelCache.baseAxisRange
        : calculateAxisRanges(points) ?? labelCache.baseAxisRange;
    const series = {
        axisRanges,
        hasValidData,
        points,
    };
    labelCache.limits.set(key, series);
    return series;
}
/** Returns converted numeric values for a record field and settings signature. */
export function getFieldSeriesEntry(recordMesgs, field, dataSettingsSignature, convert) {
    const cache = ensureFieldSeriesCache(recordMesgs);
    let fieldMap = cache.fields.get(field);
    if (!fieldMap) {
        fieldMap = new Map();
        cache.fields.set(field, fieldMap);
    }
    let entry = fieldMap.get(dataSettingsSignature);
    if (!entry) {
        const readKey = resolveRecordFieldKey(cache, recordMesgs, field);
        const values = [];
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        let hasNull = false;
        for (const row of recordMesgs) {
            const raw = getRecordValue(row, readKey);
            let numeric = Number(raw);
            if (!Number.isFinite(numeric)) {
                values.push(null);
                hasNull = true;
                continue;
            }
            try {
                numeric = convert(numeric, field);
            }
            catch {
                // Keep the original numeric value if unit conversion fails.
            }
            if (!Number.isFinite(numeric)) {
                values.push(null);
                hasNull = true;
                continue;
            }
            if (numeric < min) {
                min = numeric;
            }
            if (numeric > max) {
                max = numeric;
            }
            values.push(numeric);
        }
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            min = Number.NaN;
            max = Number.NaN;
        }
        entry = {
            hasNull,
            max,
            min,
            pointCache: new WeakMap(),
            values,
        };
        fieldMap.set(dataSettingsSignature, entry);
    }
    else {
        entry.pointCache ??= new WeakMap();
    }
    return entry;
}
