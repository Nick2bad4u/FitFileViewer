import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import { chartPerformanceMonitor } from "../../../../../electron-app/utils/charts/core/renderChartPerformanceMonitor.js";
import { getRendererChartPerformanceHistory } from "../../../../../electron-app/utils/state/domain/rendererChartPerformanceState.js";

describe("chartPerformanceMonitor", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("tracks chart operation duration and records bounded history", () => {
        expect.assertions(5);

        vi.spyOn(Date, "now").mockReturnValue(1234);
        vi.spyOn(performance, "now")
            .mockReturnValueOnce(10)
            .mockReturnValueOnce(42);

        const trackingId = chartPerformanceMonitor.startTracking("render");
        chartPerformanceMonitor.endTracking(trackingId, {
            chartCount: 3,
        });

        expect(trackingId).toBe("chart-render-1234");
        expect(
            stateManager.getState(`performance.tracking.${trackingId}`)
        ).toEqual({
            chartCount: 3,
            duration: 32,
            endTime: 42,
            operation: "render",
            startTime: 10,
            status: "completed",
        });
        expect(stateManager.getState("performance.chartHistory")).toEqual([
            {
                chartCount: 3,
                duration: 32,
                endTime: 42,
                operation: "render",
                startTime: 10,
                status: "completed",
            },
        ]);
        expect(chartPerformanceMonitor.getSummary()).toMatchObject({
            averageDuration: 32,
            maxDuration: 32,
            minDuration: 32,
            totalOperations: 1,
        });
        expect(
            chartPerformanceMonitor.getSummary().recentOperations
        ).toHaveLength(1);
    });

    it("ignores unknown tracking ids", () => {
        expect.assertions(1);

        chartPerformanceMonitor.endTracking("missing");

        expect(getRendererChartPerformanceHistory()).toEqual([]);
    });
});
