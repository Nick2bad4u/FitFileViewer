import { getRecordValue } from "./renderChartModuleHelpers.js";

type LabelCacheEntry = {
    readonly startTime: unknown;
    readonly values: number[];
};

let labelsCache = new WeakMap<readonly unknown[], LabelCacheEntry>();

/** Clears cached x-axis labels for chart record arrays. */
export function clearChartLabelsCache(): void {
    labelsCache = new WeakMap();
}

/** Returns x-axis labels for records, reusing cached values by record array. */
export function getLabelsForRecords(
    recordMesgs: readonly unknown[],
    startTime: unknown
): number[] {
    if (labelsCache.has(recordMesgs)) {
        const cached = labelsCache.get(recordMesgs);
        if (cached && cached.startTime === startTime) {
            return cached.values;
        }
    }

    const result: number[] = [];
    const base = normalizeStartTime(startTime);

    for (const [index, row] of recordMesgs.entries()) {
        let labelValue = index;
        const rawTimestamp = getRecordValue(row, "timestamp");

        if (rawTimestamp != null) {
            const timestamp = normalizeTimestamp(rawTimestamp);
            if (timestamp != null) {
                labelValue =
                    base != null
                        ? Math.max(0, Math.round(timestamp - base))
                        : Math.round(timestamp);
            }
        }

        result.push(labelValue);
    }

    labelsCache.set(recordMesgs, { startTime, values: result });

    return result;
}

function normalizeStartTime(startTime: unknown): null | number {
    if (typeof startTime === "number") {
        return startTime > 1_000_000_000_000 ? startTime / 1000 : startTime;
    }

    if (
        startTime &&
        typeof startTime === "object" &&
        "getTime" in startTime &&
        typeof startTime.getTime === "function"
    ) {
        return startTime.getTime() / 1000;
    }

    return null;
}

function normalizeTimestamp(rawTimestamp: unknown): null | number {
    if (rawTimestamp instanceof Date) {
        return rawTimestamp.getTime() / 1000;
    }

    if (
        typeof rawTimestamp === "number" &&
        Number.isFinite(rawTimestamp)
    ) {
        return rawTimestamp > 1_000_000_000_000
            ? rawTimestamp / 1000
            : rawTimestamp;
    }

    return null;
}
