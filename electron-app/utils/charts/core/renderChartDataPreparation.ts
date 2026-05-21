import { getRecordValue, isRecord } from "./renderChartModuleHelpers.js";

/** Supported activity start-time values consumed by chart label normalization. */
export type ActivityStartTime = Date | number | null;

/** Object row from FIT record messages after validating chart data input. */
export type ChartDataRecord = Record<string, unknown>;

/** State payload stored for downstream chart data consumers. */
export interface PreparedChartData {
    readonly activityStartTime: ActivityStartTime;
    readonly recordMesgs: readonly ChartDataRecord[];
    readonly totalDataPoints: number;
}

/** Object that exposes validated chart record messages. */
export interface ChartDataRecordSource {
    readonly recordMesgs: readonly ChartDataRecord[];
}

interface StoreChartDataDependencies {
    setState(path: string, value: PreparedChartData, options: unknown): void;
}

/** Checks whether a value is a single object row from FIT record messages. */
export function isChartDataRecord(value: unknown): value is ChartDataRecord {
    return isRecord(value) && !Array.isArray(value);
}

/** Checks whether a value is an array containing only chart data records. */
export function isChartDataRecordArray(
    value: unknown
): value is ChartDataRecord[] {
    return Array.isArray(value) && value.every(isChartDataRecord);
}

/** Checks whether a value is a non-empty array of chart data records. */
export function isNonEmptyChartDataRecordArray(
    value: unknown
): value is ChartDataRecord[] {
    return isChartDataRecordArray(value) && value.length > 0;
}

/** Checks whether an object exposes non-empty validated chart record messages. */
export function hasChartDataRecordMessages(
    value: unknown
): value is ChartDataRecordSource {
    return (
        isChartDataRecord(value) &&
        isNonEmptyChartDataRecordArray(getRecordValue(value, "recordMesgs"))
    );
}

function isActivityStartTime(value: unknown): value is Date | number {
    return (
        value instanceof Date ||
        (typeof value === "number" && Number.isFinite(value))
    );
}

/**
 * Checks whether global chart data is a record-like object.
 */
export function isChartDataObject(value: unknown): value is ChartDataRecord {
    return isChartDataRecord(value);
}

/**
 * Returns the time-series record messages when FIT data contains chartable rows.
 */
export function getRecordMessages(
    globalData: ChartDataRecord
): ChartDataRecord[] | null {
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
export function getActivityStartTime(
    recordMesgs: readonly ChartDataRecord[]
): ActivityStartTime {
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
export function storeChartData(
    dependencies: StoreChartDataDependencies,
    recordMesgs: readonly ChartDataRecord[],
    activityStartTime: ActivityStartTime
): void {
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
