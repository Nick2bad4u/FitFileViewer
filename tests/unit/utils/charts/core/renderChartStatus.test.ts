import { describe, expect, it, vi } from "vitest";

import { getChartStatus } from "../../../../../electron-app/utils/charts/core/renderChartStatus.js";

describe("getChartStatus", () => {
    it("reads chart status values through typed chart dependencies", () => {
        expect.assertions(2);

        const getPerformanceRenderTime = vi.fn((key: string) =>
            key === "chart" ? 250 : undefined
        );

        const status = getChartStatus({
            chartState: {
                controlsVisible: false,
                hasValidData: true,
                isRendered: true,
                isRendering: false,
                renderableFields: [
                    "speed",
                    "power",
                ],
                selectedChart: "power",
            },
            getChartOptions: vi.fn(() => ({ responsive: true })),
            getLastRenderTime: vi.fn(() => 1234),
            getPerformanceRenderTime,
            getRenderedCount: vi.fn(() => 7),
        });

        expect(status).toStrictEqual({
            chartOptions: { responsive: true },
            controlsVisible: false,
            hasData: true,
            isRendered: true,
            isRendering: false,
            lastRenderTime: 1234,
            performance: 250,
            renderableFields: [
                "speed",
                "power",
            ],
            renderedCount: 7,
            selectedChart: "power",
        });
        expect(getPerformanceRenderTime).toHaveBeenCalledExactlyOnceWith(
            "chart"
        );
    });
});
