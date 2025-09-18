import { describe, it, expect, vi } from "vitest";

vi.mock("../../../../utils/charts/rendering/renderSpeedVsDistanceChart.js", () => ({
  renderSpeedVsDistanceChart: vi.fn(),
}));
vi.mock("../../../../utils/charts/rendering/renderPowerVsHeartRateChart.js", () => ({
  renderPowerVsHeartRateChart: vi.fn(),
}));
vi.mock("../../../../utils/charts/rendering/renderAltitudeProfileChart.js", () => ({
  renderAltitudeProfileChart: vi.fn(),
}));

describe("renderPerformanceAnalysisCharts", () => {
  it("invokes all sub renderers and handles errors gracefully", async () => {
    const spd = await import("../../../../utils/charts/rendering/renderSpeedVsDistanceChart.js");
    const pvh = await import("../../../../utils/charts/rendering/renderPowerVsHeartRateChart.js");
    const alt = await import("../../../../utils/charts/rendering/renderAltitudeProfileChart.js");
    const { renderPerformanceAnalysisCharts } = await import(
      "../../../../utils/charts/rendering/renderPerformanceAnalysisCharts.js"
    );

    const container = document.createElement("div");
    renderPerformanceAnalysisCharts(container, { points: [] }, [1, 2, 3], {});
    expect(spd.renderSpeedVsDistanceChart).toHaveBeenCalled();
    expect(pvh.renderPowerVsHeartRateChart).toHaveBeenCalled();
    expect(alt.renderAltitudeProfileChart).toHaveBeenCalled();

    // Error path: make one renderer throw
    (spd.renderSpeedVsDistanceChart as any).mockImplementation(() => { throw new Error("boom"); });
    // Should not throw
    renderPerformanceAnalysisCharts(container, { points: [] }, [1, 2, 3], {});
  });
});
