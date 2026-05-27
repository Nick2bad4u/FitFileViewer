import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
    "../../../../utils/charts/rendering/renderSpeedVsDistanceChart.js",
    () => ({
        renderSpeedVsDistanceChart: vi.fn(),
    })
);
vi.mock(
    "../../../../utils/charts/rendering/renderPowerVsHeartRateChart.js",
    () => ({
        renderPowerVsHeartRateChart: vi.fn(),
    })
);
vi.mock(
    "../../../../utils/charts/rendering/renderAltitudeProfileChart.js",
    () => ({
        renderAltitudeProfileChart: vi.fn(),
    })
);

describe("renderPerformanceAnalysisCharts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("invokes all sub renderers", async () => {
        const spd =
            await import("../../../../utils/charts/rendering/renderSpeedVsDistanceChart.js");
        const pvh =
            await import("../../../../utils/charts/rendering/renderPowerVsHeartRateChart.js");
        const alt =
            await import("../../../../utils/charts/rendering/renderAltitudeProfileChart.js");
        const { renderPerformanceAnalysisCharts } =
            await import("../../../../utils/charts/rendering/renderPerformanceAnalysisCharts.js");

        const container = document.createElement("div");
        expect(
            renderPerformanceAnalysisCharts(
                container,
                { points: [] },
                [
                    1,
                    2,
                    3,
                ],
                {}
            )
        ).toBeUndefined();

        expect(spd.renderSpeedVsDistanceChart).toHaveBeenCalled();
        expect(pvh.renderPowerVsHeartRateChart).toHaveBeenCalled();
        expect(alt.renderAltitudeProfileChart).toHaveBeenCalled();
    });

    it("handles renderer errors gracefully", async () => {
        const spd =
            await import("../../../../utils/charts/rendering/renderSpeedVsDistanceChart.js");
        const pvh =
            await import("../../../../utils/charts/rendering/renderPowerVsHeartRateChart.js");
        const alt =
            await import("../../../../utils/charts/rendering/renderAltitudeProfileChart.js");
        const { renderPerformanceAnalysisCharts } =
            await import("../../../../utils/charts/rendering/renderPerformanceAnalysisCharts.js");

        const error = new Error("boom");
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        (spd.renderSpeedVsDistanceChart as any).mockImplementation(() => {
            throw error;
        });

        const container = document.createElement("div");
        expect(
            renderPerformanceAnalysisCharts(
                container,
                { points: [] },
                [
                    1,
                    2,
                    3,
                ],
                {}
            )
        ).toBeUndefined();

        expect(consoleError).toHaveBeenCalledWith(
            "[ChartJS] Error rendering performance analysis charts:",
            error
        );
        expect(pvh.renderPowerVsHeartRateChart).not.toHaveBeenCalled();
        expect(alt.renderAltitudeProfileChart).not.toHaveBeenCalled();
    });
});
