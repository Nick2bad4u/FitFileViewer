import { describe, expect, it } from "vitest";

import {
    buildMetricFilterPredicate,
    computeMetricStatistics,
    createMetricFilter,
    getMetricDefinition,
    MAP_FILTER_METRICS,
} from "../../../utils/maps/filters/mapMetricFilter.js";

describe("mapMetricFilter", () => {
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

    it("applies normalized value-range filters", () => {
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

    it("returns inactive results for disabled or unavailable data", () => {
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

    it("exposes the configured metric definitions", () => {
        expect.assertions(3);

        expect(MAP_FILTER_METRICS.map((metric) => metric.key)).toStrictEqual([
            "speed",
            "power",
            "cadence",
            "heartRate",
            "auxHeartRate",
            "altitude",
        ]);
        expect(getMetricDefinition("heartRate")?.label).toBe("Heart Rate");
        expect(getMetricDefinition("unknown")).toBeNull();
    });
});
