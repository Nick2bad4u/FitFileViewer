import { describe, expect, it } from "vitest";

import {
    buildSummaryText,
    previewFilterResult,
} from "../../../../../../utils/ui/controls/dataPointFilterControl/metricsPreview.js";
import type { MetricFilterResult } from "../../../../../../utils/maps/filters/mapMetricFilter.js";

type MutableMetricsPreviewGlobal = typeof globalThis & {
    globalData?: {
        recordMesgs?: unknown[];
    };
};

const testGlobal = globalThis as MutableMetricsPreviewGlobal;

function createMetricFilterResult(
    overrides: Partial<MetricFilterResult> = {}
): MetricFilterResult {
    return {
        allowedIndices: new Set([0]),
        appliedMax: null,
        appliedMin: null,
        isActive: true,
        maxCandidate: 40,
        metric: "speed",
        metricLabel: "Speed",
        minCandidate: 10,
        mode: "topPercent",
        orderedIndices: [0],
        percent: 25,
        reason: null,
        selectedCount: 1,
        threshold: 40,
        totalCandidates: 4,
        ...overrides,
    };
}

describe("metricsPreview", () => {
    it("returns null for missing, inactive, or rejected results", () => {
        expect.assertions(3);

        expect(buildSummaryText(null, null)).toBeNull();
        expect(
            buildSummaryText(
                createMetricFilterResult({ isActive: false }),
                null
            )
        ).toBeNull();
        expect(
            buildSummaryText(
                createMetricFilterResult({ reason: "No speed data" }),
                null
            )
        ).toBeNull();
    });

    it("builds value-range summary text with formatted endpoints", () => {
        expect.assertions(1);

        const result = createMetricFilterResult({
            appliedMax: 42.125,
            appliedMin: null,
            maxCandidate: 50,
            minCandidate: 9.5,
            mode: "valueRange",
            percent: 37.5,
            selectedCount: 3,
            totalCandidates: 8,
        });

        expect(buildSummaryText(result, null, { decimals: 2 })).toBe(
            "Showing 3 of 8 points between 9.50 and 42.13 Speed (37.5% coverage)"
        );
    });

    it("builds top-percent summary text using the current config percent", () => {
        expect.assertions(1);

        expect(
            buildSummaryText(createMetricFilterResult(), {
                enabled: true,
                metric: "speed",
                percent: 10,
            })
        ).toBe("Showing top 10% (1 of 4) by Speed");
    });

    it("previews filters from global FIT records", () => {
        expect.assertions(2);

        try {
            testGlobal.globalData = {
                recordMesgs: [
                    { speed: 10 },
                    { speed: 30 },
                    { speed: 20 },
                ],
            };

            const result = previewFilterResult({
                enabled: true,
                metric: "speed",
                percent: 34,
            });

            expect(result).toMatchObject({
                isActive: true,
                selectedCount: 2,
                threshold: 20,
            });
            expect(Array.from(result?.allowedIndices ?? [])).toStrictEqual([
                1,
                2,
            ]);
        } finally {
            Reflect.deleteProperty(testGlobal, "globalData");
        }
    });
});
