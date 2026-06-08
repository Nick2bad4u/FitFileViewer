import {
    getActiveFitMessageArray,
    getActiveFitRawData,
} from "./activeFitRawDataState.js";

export type FitRouteRecord = Record<string, unknown>;

export type FitRouteCoordinate = {
    latitude: number;
    longitude: number;
    record: FitRouteRecord;
    recordIndex: number;
};

export type ActiveFitRouteData = {
    coordinateCount: number;
    lapMesgs: FitRouteRecord[];
    rawData: FitRouteRecord | null;
    ready: boolean;
    recordMesgs: FitRouteRecord[];
    routeCoordinates: FitRouteCoordinate[];
    totalRecords: number;
};

export function getActiveFitRouteData(
    sourceData?: unknown
): ActiveFitRouteData {
    const readsActiveState = sourceData === undefined;
    const activeSourceData = readsActiveState
        ? getActiveFitRawData()
        : sourceData;
    const rawData = isFitRouteRecord(activeSourceData)
        ? activeSourceData
        : null;
    const recordMesgs = rawData ? getFitRouteRecords(rawData) : [];
    const lapMesgs = readsActiveState
        ? getActiveFitMessageArray<FitRouteRecord>("lapMesgs")
        : getFitRouteMessageArray(rawData, "lapMesgs");
    const routeCoordinates = getFitRouteCoordinates(recordMesgs);

    return {
        coordinateCount: routeCoordinates.length,
        lapMesgs,
        rawData,
        ready: routeCoordinates.length > 0,
        recordMesgs,
        routeCoordinates,
        totalRecords: recordMesgs.length,
    };
}

function getFitRouteMessageArray(
    sourceData: FitRouteRecord | null,
    key: string
): FitRouteRecord[] {
    const messages = sourceData?.[key];
    return Array.isArray(messages) ? messages.filter(isFitRouteRecord) : [];
}

export function hasActiveFitRouteData(): boolean {
    return getActiveFitRouteData().ready;
}

export function getFitRouteRecords(sourceData: unknown): FitRouteRecord[] {
    if (!isFitRouteRecord(sourceData)) {
        return [];
    }

    const recordMesgs = sourceData["recordMesgs"];
    return Array.isArray(recordMesgs)
        ? recordMesgs.filter(isFitRouteRecord)
        : [];
}

export function getFitRouteCoordinates(
    records: readonly FitRouteRecord[]
): FitRouteCoordinate[] {
    const coordinates: FitRouteCoordinate[] = [];

    for (const [recordIndex, record] of records.entries()) {
        const latitude = semicirclesToDegrees(getRouteLatitude(record));
        const longitude = semicirclesToDegrees(getRouteLongitude(record));

        if (latitude === null || longitude === null) {
            continue;
        }

        coordinates.push({
            latitude,
            longitude,
            record,
            recordIndex,
        });
    }

    return coordinates;
}

export function isFitRouteRecord(value: unknown): value is FitRouteRecord {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function semicirclesToDegrees(raw: unknown): number | null {
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
        return null;
    }

    return Number((raw / 2 ** 31) * 180);
}

export function getFitRouteRecordLatitude(record: FitRouteRecord): unknown {
    return record["positionLat"] ?? record["position_lat"];
}

export function getFitRouteRecordLongitude(record: FitRouteRecord): unknown {
    return record["positionLong"] ?? record["position_long"];
}

function getRouteLatitude(record: FitRouteRecord): unknown {
    return getFitRouteRecordLatitude(record);
}

function getRouteLongitude(record: FitRouteRecord): unknown {
    return getFitRouteRecordLongitude(record);
}
