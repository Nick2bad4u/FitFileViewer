// @ts-nocheck

import { describe, expect, it } from "vitest";

import {
    buildSummaryText,
    previewFilterResult,
} from "../../../../../../utils/ui/controls/dataPointFilterControl/metricsPreview.js";

import { updateGlobalFilter } from "../../../../../../utils/ui/controls/dataPointFilterControl/stateHelpers.js";

describe("metricsPreview", () => {
    it("buildSummaryText formats range summaries with coverage", () => {
        const result = {
            appliedMax: 350,
            appliedMin: 200,
            isActive: true,
            maxCandidate: 360,
            metric: "power",
            metricLabel: "Power",
            minCandidate: 190,
            mode: "valueRange",
            percent: 42.42,
            reason: null,
            selectedCount: 10,
            totalCandidates: 100,
        };
        const text = buildSummaryText(
            result,
            { mode: "valueRange", metric: "power" },
            { decimals: 0 }
        );
        expect(text).toContain("Power");
        expect(text).toContain("10 of 100");
        expect(text).toContain("42.4% coverage");
    });

    it("buildSummaryText returns null for inactive results", () => {
        const inactive = { isActive: false };
        expect(
            buildSummaryText(inactive, { mode: "topPercent", metric: "speed" })
        ).toBeNull();
    });

    it("buildSummaryText handles top percent summaries", () => {
        const result = {
            isActive: true,
            metric: "speed",
            metricLabel: "Speed",
            mode: "topPercent",
            percent: 15,
            reason: null,
            selectedCount: 30,
            totalCandidates: 200,
        };
        const summary = buildSummaryText(result, {
            metric: "speed",
            mode: "topPercent",
            percent: 15,
        });
        expect(summary).toContain("top 15%");
        expect(summary).toContain("30 of 200");
    });

    it("previewFilterResult derives a filter result from global records", () => {
        globalThis.globalData = {
            recordMesgs: [
                { speed: 5 },
                { speed: 10 },
                { speed: 15 },
                { speed: 20 },
            ],
        };
        updateGlobalFilter({
            enabled: true,
            metric: "speed",
            mode: "topPercent",
            percent: 50,
        });
        const result = previewFilterResult({
            enabled: true,
            metric: "speed",
            mode: "topPercent",
            percent: 50,
        });
        expect(result).toBeTruthy();
        expect(result.isActive).toBe(true);
        expect(result.metric).toBe("speed");
        expect(result.selectedCount).toBeGreaterThan(0);
    });
});
