import { getRecordValue, isObjectRecord } from "./renderChartModuleHelpers.js";
/** Checks whether a value is a single object row from FIT record messages. */
export function isChartDataRecord(value) {
    return isObjectRecord(value);
}
/** Checks whether a value is an array containing only chart data records. */
export function isChartDataRecordArray(value) {
    return Array.isArray(value) && value.every(isChartDataRecord);
}
/** Checks whether a value is a non-empty array of chart data records. */
export function isNonEmptyChartDataRecordArray(value) {
    return isChartDataRecordArray(value) && value.length > 0;
}
/** Checks whether an object exposes non-empty validated chart record messages. */
export function hasChartDataRecordMessages(value) {
    return (
        isChartDataRecord(value) &&
        isNonEmptyChartDataRecordArray(getRecordValue(value, "recordMesgs"))
    );
}
function isActivityStartTime(value) {
    return (
        value instanceof Date ||
        (typeof value === "number" && Number.isFinite(value))
    );
}
/**
 * Checks whether global chart data is a record-like object.
 */
export function isChartDataObject(value) {
    return isChartDataRecord(value);
}
/**
 * Returns the time-series record messages when FIT data contains chartable
 * rows.
 */
export function getRecordMessages(globalData) {
    const recordMesgs = getRecordValue(globalData, "recordMesgs");
    if (!Array.isArray(recordMesgs)) {
        return null;
    }
    if (recordMesgs.length === 0) {
        return null;
    }
    if (isChartDataRecordArray(recordMesgs)) {
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
 * Stores the prepared chart payload in application state for downstream
 * consumers.
 */
export function storeChartData(dependencies, recordMesgs, activityStartTime) {
    dependencies.setState(
        "charts.chartData",
        {
            activityStartTime,
            recordMesgs,
            totalDataPoints: recordMesgs.length,
        },
        { silent: false, source: "renderChartJS" }
    );
}
