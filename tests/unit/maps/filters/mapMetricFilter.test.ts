import { describe, expect, it } from "vitest";
import {
    computeMetricStatistics,
    createMetricFilter,
    getMetricDefinition,
    MAP_FILTER_METRICS,
} from "../../../../electron-app/utils/maps/filters/mapMetricFilter.js";
import type { MetricRecord } from "../../../../electron-app/utils/maps/filters/mapMetricFilter.js";

describe(createMetricFilter, () => {
    it("returns inactive result when disabled", () => {
        expect.hasAssertions();

        const records = [{ speed: 10 }, { speed: 20 }];
        const result = createMetricFilter(records, {
            enabled: false,
            metric: "speed",
            percent: 10,
        });
        expect(result.isActive).toBe(false);
        expect(result.selectedCount).toBe(0);
    });

    it("selects the correct number of entries for the requested percentile", () => {
        expect.hasAssertions();

        const records = [
            { speed: 1 },
            { speed: 5 },
            { speed: 9 },
            { speed: 13 },
            { speed: 17 },
        ];
        const result = createMetricFilter(records, {
            enabled: true,
            metric: "speed",
            percent: 40,
        });
        expect(result.isActive).toBe(true);
        expect(result.reason).toBeNull();
        expect(result.selectedCount).toBe(2);
        expect(result.threshold).toBe(13);
        expect([...result.allowedIndices]).toEqual([4, 3]);
    });

    it("supports custom value extractors for derived datasets", () => {
        expect.hasAssertions();

        const metric = getMetricDefinition("speed");
        expect(metric).toMatchObject({
            key: "speed",
            label: "Speed",
        });
        const coords = [
            [
                0,
                0,
                null,
                null,
                null,
                null,
                0,
                { speed: 5 },
                1,
            ],
            [
                0,
                0,
                null,
                null,
                null,
                null,
                1,
                { speed: 15 },
                1,
            ],
            [
                0,
                0,
                null,
                null,
                null,
                null,
                2,
                { speed: 25 },
                1,
            ],
        ];
        const result = createMetricFilter(
            coords as unknown as MetricRecord[],
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
        expect.hasAssertions();

        const records = [{ cadence: undefined }, { cadence: undefined }];
        const result = createMetricFilter(records, {
            enabled: true,
            metric: "cadence",
            percent: 20,
        });
        expect(result.isActive).toBe(false);
        expect(result.reason).toMatch(/no valid cadence/i);
    });
});

describe("map filter metrics", () => {
    it("exposes a speed metric by default", () => {
        expect.hasAssertions();

        const metricKeys = MAP_FILTER_METRICS.map((metric) => metric.key);
        expect(metricKeys).toContain("speed");
        expect(metricKeys).not.toContain("__missing_metric__");
    });
});

describe("createMetricFilter range mode", () => {
    it("selects entries within the requested value range", () => {
        expect.hasAssertions();

        const records = [
            { speed: 2 },
            { speed: 4 },
            { speed: 6 },
        ];
        const result = createMetricFilter(records, {
            enabled: true,
            maxValue: 6,
            metric: "speed",
            minValue: 3,
            mode: "valueRange",
        });
        expect(result.isActive).toBe(true);
        expect(result.mode).toBe("valueRange");
        expect(result.selectedCount).toBe(2);
        expect([...result.allowedIndices]).toEqual([2, 1]);
        expect([...result.allowedIndices]).not.toContain(0);
        expect(result.appliedMin).toBe(3);
        expect(result.appliedMax).toBe(6);
    });

    it("returns a reason when the range excludes all data", () => {
        expect.hasAssertions();

        const records = [{ power: 100 }, { power: 150 }];
        const result = createMetricFilter(records, {
            enabled: true,
            maxValue: 130,
            metric: "power",
            minValue: 120,
            mode: "valueRange",
        });
        expect(result.isActive).toBe(false);
        expect(result.selectedCount).toBe(0);
        expect(result.reason).toMatch(/no data points/i);
    });
});

describe(computeMetricStatistics, () => {
    it("computes bounds and averages for a metric", () => {
        expect.hasAssertions();

        const stats = computeMetricStatistics(
            [
                { speed: 1.5 },
                { speed: 2.25 },
                { speed: 3.75 },
            ],
            "speed"
        );
        expect(stats).toMatchObject({
            count: 3,
            decimals: 2,
            metric: "speed",
            metricLabel: "Speed",
        });
        expect(stats?.min).toBeCloseTo(1.5);
        expect(stats?.max).toBeCloseTo(3.75);
        expect(stats?.average).toBeCloseTo((1.5 + 2.25 + 3.75) / 3);
        expect(stats?.count).toBe(3);
        expect(stats?.count).not.toBe(0);
        expect(stats?.step).toBeGreaterThan(0);
    });

    it("returns null for an unknown metric", () => {
        expect.hasAssertions();

        const stats = computeMetricStatistics([{ speed: 1.5 }], "unknown");
        expect(stats).toEqual(null);
    });
});
