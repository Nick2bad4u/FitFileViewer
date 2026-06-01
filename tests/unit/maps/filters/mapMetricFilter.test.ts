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
        expect({
            isActive: result.isActive,
            selectedCount: result.selectedCount,
        }).toStrictEqual({
            isActive: false,
            selectedCount: 0,
        });
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
        expect({
            allowedIndices: [...result.allowedIndices],
            isActive: result.isActive,
            reason: result.reason,
            selectedCount: result.selectedCount,
            threshold: result.threshold,
        }).toStrictEqual({
            allowedIndices: [4, 3],
            isActive: true,
            reason: null,
            selectedCount: 2,
            threshold: 13,
        });
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
        expect({
            isActive: result.isActive,
            orderedIndices: result.orderedIndices,
            selectedCount: result.selectedCount,
        }).toStrictEqual({
            isActive: true,
            orderedIndices: [2, 1],
            selectedCount: 2,
        });
    });

    it("returns a reason when metric data is missing", () => {
        expect.hasAssertions();

        const records = [{ cadence: undefined }, { cadence: undefined }];
        const result = createMetricFilter(records, {
            enabled: true,
            metric: "cadence",
            percent: 20,
        });
        expect({
            isActive: result.isActive,
            reason: result.reason,
        }).toStrictEqual({
            isActive: false,
            reason: expect.stringMatching(/no valid cadence/i),
        });
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
        expect({
            allowedIndices: [...result.allowedIndices],
            appliedMax: result.appliedMax,
            appliedMin: result.appliedMin,
            isActive: result.isActive,
            mode: result.mode,
            selectedCount: result.selectedCount,
        }).toStrictEqual({
            allowedIndices: [2, 1],
            appliedMax: 6,
            appliedMin: 3,
            isActive: true,
            mode: "valueRange",
            selectedCount: 2,
        });
        expect([...result.allowedIndices]).not.toContain(0);
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
        expect({
            isActive: result.isActive,
            reason: result.reason,
            selectedCount: result.selectedCount,
        }).toStrictEqual({
            isActive: false,
            reason: expect.stringMatching(/no data points/i),
            selectedCount: 0,
        });
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
        expect({
            count: stats?.count,
            hasSamples: (stats?.count ?? 0) > 0,
        }).toStrictEqual({
            count: 3,
            hasSamples: true,
        });
        expect(stats?.step).toBe(0.01);
    });

    it("returns null for an unknown metric", () => {
        expect.hasAssertions();

        const stats = computeMetricStatistics([{ speed: 1.5 }], "unknown");
        expect(stats).toEqual(null);
    });
});
