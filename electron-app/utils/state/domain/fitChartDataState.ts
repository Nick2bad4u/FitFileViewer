import { getActiveFitRawData } from "./activeFitRawDataState.js";

export type FitChartActivityStartTime = Date | number | null;

export type FitChartRecord = Record<string, unknown>;

export type FitChartRecordSource = {
    readonly recordMesgs: readonly FitChartRecord[];
};

export type ActiveFitChartData = {
    activityStartTime: FitChartActivityStartTime;
    rawData: FitChartRecord | null;
    ready: boolean;
    recordMesgs: FitChartRecord[];
    totalDataPoints: number;
};

export function getActiveFitChartData(
    sourceData?: unknown
): ActiveFitChartData {
    const activeSourceData =
        sourceData === undefined ? getActiveFitRawData() : sourceData;
    const rawData = isFitChartRecord(activeSourceData)
        ? activeSourceData
        : null;
    const recordMesgs = rawData ? getFitChartRecordMessages(rawData) : null;
    const safeRecordMesgs = recordMesgs ?? [];

    return {
        activityStartTime: getFitChartActivityStartTime(safeRecordMesgs),
        rawData,
        ready: safeRecordMesgs.length > 0,
        recordMesgs: safeRecordMesgs,
        totalDataPoints: safeRecordMesgs.length,
    };
}

export function hasActiveFitChartData(): boolean {
    return getActiveFitChartData().ready;
}

export function hasFitChartRecordMessages(
    value: unknown
): value is FitChartRecordSource {
    return (
        isFitChartRecord(value) &&
        isNonEmptyFitChartRecordArray(
            getFitChartRecordValue(value, "recordMesgs")
        )
    );
}

export function getFitChartRecordMessages(
    data: FitChartRecord
): FitChartRecord[] | null {
    const recordMesgs = getFitChartRecordValue(data, "recordMesgs");
    if (!Array.isArray(recordMesgs) || recordMesgs.length === 0) {
        return null;
    }

    if (isFitChartRecordArray(recordMesgs)) {
        return recordMesgs;
    }

    const validRecords = recordMesgs.filter(isFitChartRecord);
    return validRecords.length > 0 ? validRecords : null;
}

export function getFitChartActivityStartTime(
    recordMesgs: readonly FitChartRecord[]
): FitChartActivityStartTime {
    for (const record of recordMesgs) {
        const timestamp = getFitChartRecordValue(record, "timestamp");
        if (isFitChartActivityStartTime(timestamp)) {
            return timestamp;
        }
    }

    return null;
}

export function isFitChartRecord(value: unknown): value is FitChartRecord {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isFitChartRecordArray(
    value: unknown
): value is FitChartRecord[] {
    return Array.isArray(value) && value.every(isFitChartRecord);
}

export function isNonEmptyFitChartRecordArray(
    value: unknown
): value is FitChartRecord[] {
    return isFitChartRecordArray(value) && value.length > 0;
}

function getFitChartRecordValue(record: FitChartRecord, key: string): unknown {
    return record[key];
}

function isFitChartActivityStartTime(value: unknown): value is Date | number {
    return (
        value instanceof Date ||
        (typeof value === "number" && Number.isFinite(value))
    );
}
