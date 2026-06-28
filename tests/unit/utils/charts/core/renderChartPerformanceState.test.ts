import { describe, expect, it, vi } from "vitest";

import { updateChartRenderPerformanceState } from "../../../../../electron-app/utils/charts/core/renderChartPerformanceState.js";

describe("renderChartPerformanceState", () => {
    it("records chart render summaries through the typed performance facade", () => {
        expect.assertions(1);

        const updatePerformanceSummary = vi.fn();

        updateChartRenderPerformanceState(
            {
                updatePerformanceSummary,
            },
            {
                renderTime: 45,
                totalChartsRendered: 3,
            }
        );

        expect(updatePerformanceSummary).toHaveBeenCalledExactlyOnceWith(
            {
                chartsRendered: 3,
                lastChartRender: 45,
            },
            { source: "renderChartsWithData" }
        );
    });
});
