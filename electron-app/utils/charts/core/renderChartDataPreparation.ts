import {
    getFitChartActivityStartTime,
    getFitChartRecordMessages,
    hasFitChartRecordMessages,
    isFitChartRecord,
    isFitChartRecordArray,
    isNonEmptyFitChartRecordArray,
    type FitChartActivityStartTime,
    type FitChartRecord,
    type FitChartRecordSource,
} from "../../state/domain/fitChartDataState.js";

/** Supported activity start-time values consumed by chart label normalization. */
export type ActivityStartTime = FitChartActivityStartTime;

/** Object row from FIT record messages after validating chart data input. */
export type ChartDataRecord = FitChartRecord;

/** State payload stored for downstream chart data consumers. */
export interface PreparedChartData {
    readonly activityStartTime: ActivityStartTime;
    readonly recordMesgs: readonly ChartDataRecord[];
    readonly totalDataPoints: number;
}

/** Object that exposes validated chart record messages. */
export type ChartDataRecordSource = FitChartRecordSource;

interface StoreChartDataDependencies {
    setChartData(
        value: PreparedChartData,
        options: { readonly silent: boolean; readonly source: string }
    ): void;
}

/** Checks whether a value is a single object row from FIT record messages. */
export function isChartDataRecord(value: unknown): value is ChartDataRecord {
    return isFitChartRecord(value);
}

/** Checks whether a value is an array containing only chart data records. */
export function isChartDataRecordArray(
    value: unknown
): value is ChartDataRecord[] {
    return isFitChartRecordArray(value);
}

/** Checks whether a value is a non-empty array of chart data records. */
export function isNonEmptyChartDataRecordArray(
    value: unknown
): value is ChartDataRecord[] {
    return isNonEmptyFitChartRecordArray(value);
}

/** Checks whether an object exposes non-empty validated chart record messages. */
export function hasChartDataRecordMessages(
    value: unknown
): value is ChartDataRecordSource {
    return hasFitChartRecordMessages(value);
}

/**
 * Checks whether FIT activity chart data is a record-like object.
 */
export function isChartDataObject(value: unknown): value is ChartDataRecord {
    return isFitChartRecord(value);
}

/**
 * Returns the time-series record messages when FIT data contains chartable
 * rows.
 */
export function getRecordMessages(
    activityData: ChartDataRecord
): ChartDataRecord[] | null {
    return getFitChartRecordMessages(activityData);
}

/**
 * Finds the first non-null timestamp from the chartable record messages.
 */
export function getActivityStartTime(
    recordMesgs: readonly ChartDataRecord[]
): ActivityStartTime {
    return getFitChartActivityStartTime(recordMesgs);
}

/**
 * Stores the prepared chart payload in application state for downstream
 * consumers.
 */
export function storeChartData(
    dependencies: StoreChartDataDependencies,
    recordMesgs: readonly ChartDataRecord[],
    activityStartTime: ActivityStartTime
): void {
    dependencies.setChartData(
        {
            activityStartTime,
            recordMesgs,
            totalDataPoints: recordMesgs.length,
        },
        { silent: false, source: "renderChartJS" }
    );
}
