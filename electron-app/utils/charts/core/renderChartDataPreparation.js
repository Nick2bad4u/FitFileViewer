import { getRecordValue, isRecord } from "./renderChartModuleHelpers.js";
/**
 * Checks whether global chart data is a record-like object.
 */
export function isChartDataObject(value) {
    return isRecord(value);
}
/**
 * Returns the time-series record messages when FIT data contains chartable rows.
 */
export function getRecordMessages(globalData) {
    const recordMesgs = getRecordValue(globalData, "recordMesgs");
    return Array.isArray(recordMesgs) && recordMesgs.length > 0
        ? recordMesgs
        : null;
}
/**
 * Finds the first non-null timestamp from the chartable record messages.
 */
export function getActivityStartTime(recordMesgs) {
    for (const record of recordMesgs) {
        const timestamp = getRecordValue(record, "timestamp");
        if (timestamp != null) {
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
