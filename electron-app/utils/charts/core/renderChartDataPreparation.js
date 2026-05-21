import { getRecordValue, isRecord } from "./renderChartModuleHelpers.js";
function isChartDataRecord(value) {
    return isRecord(value) && !Array.isArray(value);
}
function isActivityStartTime(value) {
    return (value instanceof Date ||
        (typeof value === "number" && Number.isFinite(value)));
}
/**
 * Checks whether global chart data is a record-like object.
 */
export function isChartDataObject(value) {
    return isChartDataRecord(value);
}
/**
 * Returns the time-series record messages when FIT data contains chartable rows.
 */
export function getRecordMessages(globalData) {
    const recordMesgs = getRecordValue(globalData, "recordMesgs");
    if (!Array.isArray(recordMesgs)) {
        return null;
    }
    if (recordMesgs.length === 0) {
        return null;
    }
    if (recordMesgs.every(isChartDataRecord)) {
        return recordMesgs;
    }
    const validRecords = recordMesgs.filter(isChartDataRecord);
    return validRecords.length > 0 ? validRecords : null;
}
/**
 * Finds the first non-null timestamp from the chartable record messages.
 */
export function getActivityStartTime(recordMesgs) {
    for (const record of recordMesgs) {
        const timestamp = getRecordValue(record, "timestamp");
        if (isActivityStartTime(timestamp)) {
            return timestamp;
        }
    }
    return null;
}
/**
 * Stores the prepared chart payload in application state for downstream consumers.
 */
export function storeChartData(dependencies, recordMesgs, activityStartTime) {
    dependencies.setState("charts.chartData", {
        activityStartTime,
        recordMesgs,
        totalDataPoints: recordMesgs.length,
    }, { silent: false, source: "renderChartJS" });
}
