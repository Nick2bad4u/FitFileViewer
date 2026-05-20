import { describe, expect, it, vi } from "vitest";

import { createSummaryRefresher } from "../../../../../../utils/ui/controls/dataPointFilterControl/summaryRefresher.js";

type MutableDataPointFilterGlobal = typeof globalThis & {
    mapDataPointFilter?: { enabled?: boolean };
    mapDataPointFilterLastResult?: unknown;
};

const testGlobal = globalThis as MutableDataPointFilterGlobal;

function runWithSummaryFixture(callback: (summary: HTMLElement) => void): void {
    try {
        Reflect.deleteProperty(testGlobal, "mapDataPointFilter");
        Reflect.deleteProperty(testGlobal, "mapDataPointFilterLastResult");
        document.body.replaceChildren();

        const summary = document.createElement("p");
        document.body.append(summary);

        callback(summary);
    } finally {
        Reflect.deleteProperty(testGlobal, "mapDataPointFilter");
        Reflect.deleteProperty(testGlobal, "mapDataPointFilterLastResult");
        document.body.replaceChildren();
    }
}

function createRefreshSummary(summary: HTMLElement): () => void {
    return createSummaryRefresher({
        formatMetricValue: (value) => `${value.toFixed(1)}u`,
        formatPercent: (value) => `pct:${value}`,
        summary,
    });
}

describe(createSummaryRefresher, () => {
    it("renders value-range summaries with finite fallback values", () => {
        expect.assertions(1);

        runWithSummaryFixture((summary) => {
            testGlobal.mapDataPointFilterLastResult = {
                applied: true,
                appliedMax: 42,
                appliedMin: Number.NaN,
                coverage: undefined,
                maxCandidate: 50,
                metric: "speed",
                metricLabel: "Speed",
                minCandidate: 10,
                mode: "valueRange",
                percent: 37.5,
                selectedCount: 7,
                totalCandidates: 20,
            };

            createRefreshSummary(summary)();

            expect(summary.textContent).toBe(
                "Showing 7 of 20 points between 10.0u and 42.0u Speed (pct:37.5% coverage)"
            );
        });
    });

    it("renders top-percent summaries", () => {
        expect.assertions(1);

        runWithSummaryFixture((summary) => {
            testGlobal.mapDataPointFilterLastResult = {
                applied: true,
                metric: "power",
                mode: "topPercent",
                percent: 15,
                selectedCount: 3,
                totalCandidates: 30,
            };

            createRefreshSummary(summary)();

            expect(summary.textContent).toBe(
                "Showing top 15% (3 of 30) by power"
            );
        });
    });

    it("renders reason text when the last result is not applied", () => {
        expect.assertions(1);

        runWithSummaryFixture((summary) => {
            testGlobal.mapDataPointFilterLastResult = {
                reason: "No matching points",
            };

            createRefreshSummary(summary)();

            expect(summary.textContent).toBe("No matching points");
        });
    });

    it("renders the default hint when filtering is disabled", () => {
        expect.assertions(1);

        runWithSummaryFixture((summary) => {
            testGlobal.mapDataPointFilter = { enabled: false };

            createRefreshSummary(summary)();

            expect(summary.textContent).toBe(
                "Highlight the most intense sections of your ride."
            );
        });
    });

    it("ignores malformed global state without replacing existing text", () => {
        expect.assertions(1);

        runWithSummaryFixture((summary) => {
            const formatMetricValue = vi.fn<() => string>(() => {
                throw new Error("format failed");
            });
            const refreshSummary = createSummaryRefresher({
                formatMetricValue,
                formatPercent: (value) => String(value),
                summary,
            });
            summary.textContent = "existing";
            testGlobal.mapDataPointFilterLastResult = {
                applied: true,
                appliedMax: 2,
                appliedMin: 1,
                mode: "valueRange",
            };

            refreshSummary();

            expect(summary.textContent).toBe("existing");
        });
    });
});
