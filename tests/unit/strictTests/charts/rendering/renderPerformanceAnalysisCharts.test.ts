import { beforeEach, describe, expect, it, vi } from "vitest";

type PerformanceAnalysisOptions = {
    maxPoints: number | "all";
};

type PerformanceAnalysisDatum = Record<string, unknown>;

type BasicRenderer = (
    container: HTMLElement,
    data: PerformanceAnalysisDatum[],
    options: PerformanceAnalysisOptions
) => void;

type AltitudeRenderer = (
    container: HTMLElement,
    data: PerformanceAnalysisDatum[],
    labels: Array<number | string>,
    options: PerformanceAnalysisOptions
) => void;

vi.mock(
    import("../../../../../electron-app/utils/charts/rendering/renderSpeedVsDistanceChart.js"),
    () => ({
        renderSpeedVsDistanceChart: vi.fn<BasicRenderer>(),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/charts/rendering/renderPowerVsHeartRateChart.js"),
    () => ({
        renderPowerVsHeartRateChart: vi.fn<BasicRenderer>(),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/charts/rendering/renderAltitudeProfileChart.js"),
    () => ({
        renderAltitudeProfileChart: vi.fn<AltitudeRenderer>(),
    })
);

describe("renderPerformanceAnalysisCharts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("invokes all sub renderers", async () => {
        expect.assertions(4);

        const spd =
            await import("../../../../../electron-app/utils/charts/rendering/renderSpeedVsDistanceChart.js");
        const pvh =
            await import("../../../../../electron-app/utils/charts/rendering/renderPowerVsHeartRateChart.js");
        const alt =
            await import("../../../../../electron-app/utils/charts/rendering/renderAltitudeProfileChart.js");
        const { renderPerformanceAnalysisCharts } =
            await import("../../../../../electron-app/utils/charts/rendering/renderPerformanceAnalysisCharts.js");

        const container = document.createElement("div");
        const data = [{ points: [] }];
        const labels = [
            1,
            2,
            3,
        ];
        const options = { maxPoints: "all" as const };
        expect(
            renderPerformanceAnalysisCharts(container, data, labels, options)
        ).toBeUndefined();

        expect(spd.renderSpeedVsDistanceChart).toHaveBeenCalledWith(
            container,
            data,
            options
        );
        expect(pvh.renderPowerVsHeartRateChart).toHaveBeenCalledWith(
            container,
            data,
            options
        );
        expect(alt.renderAltitudeProfileChart).toHaveBeenCalledWith(
            container,
            data,
            labels,
            options
        );
    });

    it("handles renderer errors gracefully", async () => {
        expect.assertions(4);

        const spd =
            await import("../../../../../electron-app/utils/charts/rendering/renderSpeedVsDistanceChart.js");
        const pvh =
            await import("../../../../../electron-app/utils/charts/rendering/renderPowerVsHeartRateChart.js");
        const alt =
            await import("../../../../../electron-app/utils/charts/rendering/renderAltitudeProfileChart.js");
        const { renderPerformanceAnalysisCharts } =
            await import("../../../../../electron-app/utils/charts/rendering/renderPerformanceAnalysisCharts.js");

        const error = new Error("boom");
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.mocked(spd.renderSpeedVsDistanceChart).mockImplementation(() => {
            throw error;
        });

        const container = document.createElement("div");
        const data = [{ points: [] }];
        const labels = [
            1,
            2,
            3,
        ];
        const options = { maxPoints: "all" as const };
        expect(
            renderPerformanceAnalysisCharts(container, data, labels, options)
        ).toBeUndefined();

        expect(consoleError).toHaveBeenCalledWith(
            "[ChartJS] Error rendering performance analysis charts:",
            error
        );
        expect(pvh.renderPowerVsHeartRateChart).not.toHaveBeenCalled();
        expect(alt.renderAltitudeProfileChart).not.toHaveBeenCalled();
    });
});
