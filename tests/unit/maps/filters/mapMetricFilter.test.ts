import { describe, expect, it } from "vitest";
import {
    buildMetricFilterPredicate,
    computeMetricStatistics,
    createMetricFilter,
    getMetricDefinition,
    MAP_FILTER_METRICS,
} from "../../../../electron-app/utils/maps/filters/mapMetricFilter.js";
import type { MetricRecord } from "../../../../electron-app/utils/maps/filters/mapMetricFilter.js";

function getRequiredMetricDefinition(
    metricKey: string
): NonNullable<ReturnType<typeof getMetricDefinition>> {
    const definition = getMetricDefinition(metricKey);

    if (!definition) {
        throw new Error(`Expected metric definition for ${metricKey}`);
    }

    return definition;
}

describe(createMetricFilter, () => {
    it("returns inactive result when disabled", () => {
        expect.assertions(1);

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
        expect.assertions(1);

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

    it("selects the requested top percentile and includes threshold ties", () => {
        expect.assertions(2);

        const result = createMetricFilter(
            [
                { power: 100 },
                { power: 300 },
                { power: 200 },
                { power: 300 },
            ],
            { enabled: true, metric: "power", percent: 25 }
        );
        const predicate = buildMetricFilterPredicate(result);

        expect({
            isActive: result.isActive,
            orderedIndices: result.orderedIndices,
            threshold: result.threshold,
        }).toStrictEqual({
            isActive: true,
            orderedIndices: [1, 3],
            threshold: 300,
        });
        expect(
            [
                0,
                1,
                2,
                3,
            ].filter(predicate)
        ).toStrictEqual([1, 3]);
    });

    it("supports custom value extractors for derived datasets", () => {
        expect.assertions(2);

        const metric = getMetricDefinition("speed");
        expect({
            label: metric?.label,
            resolvedMissingValue: metric?.resolver({ cadence: 80 }),
            resolvedSpeed: metric?.resolver({ speed: 12 }),
            key: metric?.key,
        }).toStrictEqual({
            key: "speed",
            label: "Speed",
            resolvedMissingValue: null,
            resolvedSpeed: 12,
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
        expect.assertions(1);

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

    it("returns inactive predicate results for disabled or unavailable data", () => {
        expect.assertions(1);

        const disabled = createMetricFilter([{ heartRate: 150 }], {
            enabled: false,
            metric: "heartRate",
            percent: 50,
        });
        const unavailable = createMetricFilter([{}], {
            enabled: true,
            metric: "cadence",
            percent: 50,
        });

        expect({
            disabledIsActive: disabled.isActive,
            disabledPredicateResult: buildMetricFilterPredicate(disabled)(123),
            unavailableIsActive: unavailable.isActive,
            unavailableReason: unavailable.reason,
        }).toStrictEqual({
            disabledIsActive: false,
            disabledPredicateResult: true,
            unavailableIsActive: false,
            unavailableReason: "No valid cadence data available for filtering",
        });
    });
});

describe("map filter metrics", () => {
    it("exposes a speed metric by default", () => {
        expect.assertions(2);

        const metricKeys = MAP_FILTER_METRICS.map((metric) => metric.key);
        expect(metricKeys).toContain("speed");
        expect(metricKeys).not.toContain("__missing_metric__");
    });

    it("exposes the configured metric definitions in order", () => {
        expect.assertions(3);

        expect(MAP_FILTER_METRICS.map((metric) => metric.key)).toStrictEqual([
            "speed",
            "power",
            "cadence",
            "heartRate",
            "auxHeartRate",
            "altitude",
        ]);
        expect(getRequiredMetricDefinition("heartRate").label).toBe(
            "Heart Rate"
        );
        expect(getMetricDefinition("unknown")).toBeNull();
    });
});

describe("createMetricFilter range mode", () => {
    it("selects entries within the requested value range", () => {
        expect.assertions(2);

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

    it("normalizes reversed value-range filters", () => {
        expect.assertions(1);

        const result = createMetricFilter(
            [
                { altitude: 10 },
                { altitude: 20 },
                { altitude: 30 },
                { altitude: 40 },
            ],
            {
                enabled: true,
                maxValue: 15,
                metric: "altitude",
                minValue: 35,
                mode: "valueRange",
            }
        );

        expect({
            appliedMax: result.appliedMax,
            appliedMin: result.appliedMin,
            orderedIndices: result.orderedIndices,
            selectedCount: result.selectedCount,
        }).toStrictEqual({
            appliedMax: 35,
            appliedMin: 15,
            orderedIndices: [2, 1],
            selectedCount: 2,
        });
    });

    it("returns a reason when the range excludes all data", () => {
        expect.assertions(1);

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
    it("computes metric statistics for finite values only", () => {
        expect.assertions(1);

        const statistics = computeMetricStatistics(
            [
                { speed: 4 },
                { speed: 6.5 },
                { speed: Number.NaN },
                { power: 250 },
            ],
            "speed"
        );

        expect(statistics).toStrictEqual({
            average: 5.25,
            count: 2,
            decimals: 2,
            max: 6.5,
            metric: "speed",
            metricLabel: "Speed",
            min: 4,
            step: 0.01,
        });
    });

    it("computes bounds and averages for a metric", () => {
        expect.assertions(4);

        const stats = computeMetricStatistics(
            [
                { speed: 1.5 },
                { speed: 2.25 },
                { speed: 3.75 },
            ],
            "speed"
        );
        expect(computeMetricStatistics([], "speed")).toBe(null);
        expect(stats).not.toStrictEqual({
            average: 0,
            count: 0,
            decimals: 0,
            max: 0,
            metric: "unknown",
            metricLabel: "Unknown",
            min: 0,
            step: 1,
        });
        expect(stats).toStrictEqual({
            average: 2.5,
            count: 3,
            decimals: 2,
            max: 3.75,
            metric: "speed",
            metricLabel: "Speed",
            min: 1.5,
            step: 0.01,
        });
        expect({
            count: stats?.count,
            hasSamples: (stats?.count ?? 0) > 0,
        }).toStrictEqual({
            count: 3,
            hasSamples: true,
        });
    });

    it("returns null for an unknown metric", () => {
        expect.assertions(1);

        const stats = computeMetricStatistics([{ speed: 1.5 }], "unknown");
        expect(stats).toBeNull();
    });
});
