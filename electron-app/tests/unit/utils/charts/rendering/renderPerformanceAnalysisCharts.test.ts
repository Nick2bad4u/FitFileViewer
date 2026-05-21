import { describe, expect, it, vi } from "vitest";

const rendererMocks = vi.hoisted(() => ({
    renderAltitudeProfileChart: vi.fn<(container: HTMLElement) => void>(
        (container: HTMLElement) => {
            container.dataset.altitudeProfile = "rendered";
        }
    ),
    renderPowerVsHeartRateChart: vi.fn<(container: HTMLElement) => void>(
        (container: HTMLElement) => {
            container.dataset.powerHeartRate = "rendered";
        }
    ),
    renderSpeedVsDistanceChart: vi.fn<(container: HTMLElement) => void>(
        (container: HTMLElement) => {
            container.dataset.speedDistance = "rendered";
        }
    ),
}));

vi.mock(
    import("../../../../../utils/charts/rendering/renderAltitudeProfileChart.js"),
    () => ({
        renderAltitudeProfileChart: rendererMocks.renderAltitudeProfileChart,
    })
);

vi.mock(
    import("../../../../../utils/charts/rendering/renderPowerVsHeartRateChart.js"),
    () => ({
        renderPowerVsHeartRateChart: rendererMocks.renderPowerVsHeartRateChart,
    })
);

vi.mock(
    import("../../../../../utils/charts/rendering/renderSpeedVsDistanceChart.js"),
    () => ({
        renderSpeedVsDistanceChart: rendererMocks.renderSpeedVsDistanceChart,
    })
);

const { renderPerformanceAnalysisCharts } =
    await import("../../../../../utils/charts/rendering/renderPerformanceAnalysisCharts.js");

const chartData = [
    {
        distance: 1000,
        enhancedAltitude: 42,
        enhancedSpeed: 8,
        heartRate: 150,
        power: 220,
    },
];

const chartOptions = {
    maxPoints: "all" as const,
    showFill: true,
    showGrid: true,
    showLegend: true,
    showPoints: true,
    showTitle: true,
};

describe(renderPerformanceAnalysisCharts, () => {
    it("dispatches performance analysis rendering to all chart renderers", () => {
        expect.assertions(6);

        const container = document.createElement("div");
        const labels = [
            0,
            60,
            120,
        ];

        renderPerformanceAnalysisCharts(
            container,
            chartData,
            labels,
            chartOptions
        );

        expect(container.dataset.speedDistance).toBe("rendered");
        expect(container.dataset.powerHeartRate).toBe("rendered");
        expect(container.dataset.altitudeProfile).toBe("rendered");
        expect(rendererMocks.renderSpeedVsDistanceChart).toHaveBeenCalledWith(
            container,
            chartData,
            chartOptions
        );
        expect(rendererMocks.renderPowerVsHeartRateChart).toHaveBeenCalledWith(
            container,
            chartData,
            chartOptions
        );
        expect(rendererMocks.renderAltitudeProfileChart).toHaveBeenCalledWith(
            container,
            chartData,
            labels,
            chartOptions
        );
    });

    it("logs renderer failures without throwing", () => {
        expect.assertions(3);

        const container = document.createElement("div");
        const error = new Error("speed chart failed");
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        rendererMocks.renderSpeedVsDistanceChart.mockImplementationOnce(() => {
            throw error;
        });

        try {
            expect(() =>
                renderPerformanceAnalysisCharts(
                    container,
                    chartData,
                    [0],
                    chartOptions
                )
            ).not.toThrow();
            expect(errorSpy).toHaveBeenCalledWith(
                "[ChartJS] Error rendering performance analysis charts:",
                error
            );
            expect(container.dataset.powerHeartRate).toBeUndefined();
        } finally {
            errorSpy.mockRestore();
        }
    });
});
