import { describe, expect, it } from "vitest";
import {
    createMetricFilter,
    getMetricDefinition,
    MAP_FILTER_METRICS,
} from "../../../../utils/maps/filters/mapMetricFilter.js";

describe("createMetricFilter", () => {
    it("returns inactive result when disabled", () => {
        const records = [{ speed: 10 }, { speed: 20 }];
        const result = createMetricFilter(records, { enabled: false, metric: "speed", percent: 10 });
        expect(result.isActive).toBe(false);
        expect(result.selectedCount).toBe(0);
    });

    it("selects the correct number of entries for the requested percentile", () => {
        const records = [{ speed: 1 }, { speed: 5 }, { speed: 9 }, { speed: 13 }, { speed: 17 }];
        const result = createMetricFilter(records, { enabled: true, metric: "speed", percent: 40 });
        expect(result.isActive).toBe(true);
        expect(result.reason).toBeNull();
        expect(result.selectedCount).toBe(2);
        expect(result.threshold).toBe(13);
        expect([...result.allowedIndices]).toEqual([4, 3]);
    });

    it("supports custom value extractors for derived datasets", () => {
        const metric = getMetricDefinition("speed");
        expect(metric).toBeTruthy();
        const coords = [
            [0, 0, null, null, null, null, 0, { speed: 5 }, 1],
            [0, 0, null, null, null, null, 1, { speed: 15 }, 1],
            [0, 0, null, null, null, null, 2, { speed: 25 }, 1],
        ];
        const result = createMetricFilter(
            coords as unknown as any[],
            { enabled: true, metric: "speed", percent: 50 },
            {
                valueExtractor: (coord: unknown) => {
                    if (!Array.isArray(coord)) {
                        return null;
                    }
                    return metric?.resolver(coord[7] ?? {}) ?? null;
                },
            }
        );
        expect(result.isActive).toBe(true);
        expect(result.selectedCount).toBe(2);
        expect(result.orderedIndices).toEqual([2, 1]);
    });

    it("returns a reason when metric data is missing", () => {
        const records = [{ cadence: undefined }, { cadence: undefined }];
        const result = createMetricFilter(records, { enabled: true, metric: "cadence", percent: 20 });
        expect(result.isActive).toBe(false);
        expect(result.reason).toMatch(/no valid cadence/i);
    });
});

describe("MAP_FILTER_METRICS", () => {
    it("exposes a speed metric by default", () => {
        const metricKeys = MAP_FILTER_METRICS.map((metric) => metric.key);
        expect(metricKeys).toContain("speed");
    });
});
