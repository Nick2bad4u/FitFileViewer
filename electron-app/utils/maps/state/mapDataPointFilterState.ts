import type { MapDataPointFilterConfig } from "../filters/mapMetricFilter.js";

export type MapDataPointFilterLastResult = {
    readonly applied?: boolean;
    readonly appliedMax?: number | null;
    readonly appliedMin?: number | null;
    readonly coverage?: number | null;
    readonly maxCandidate?: number | null;
    readonly metric?: string | null;
    readonly metricLabel?: string | null;
    readonly minCandidate?: number | null;
    readonly mode?: string;
    readonly percent?: number | null;
    readonly reason?: unknown;
    readonly selectedCount?: number;
    readonly threshold?: number | null;
    readonly totalCandidates?: number;
};

let dataPointFilter: object | null = null;
let lastDataPointFilterResult: MapDataPointFilterLastResult | null = null;

export function getMapDataPointFilter<
    T extends object = MapDataPointFilterConfig,
>(): T | null {
    return dataPointFilter as T | null;
}

export function getMapDataPointFilterLastResult<
    T extends MapDataPointFilterLastResult = MapDataPointFilterLastResult,
>(): T | null {
    return lastDataPointFilterResult as T | null;
}

export function resetMapDataPointFilterStateForTests(): void {
    setMapDataPointFilter(null);
    setMapDataPointFilterLastResult(null);
}

export function setMapDataPointFilter<T extends object>(
    config: T | null
): void {
    dataPointFilter = config ? { ...config } : null;
}

export function setMapDataPointFilterLastResult<
    T extends MapDataPointFilterLastResult,
>(result: T | null): void {
    lastDataPointFilterResult = result;
}
