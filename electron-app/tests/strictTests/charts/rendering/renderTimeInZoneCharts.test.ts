import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../utils/ui/controls/createHRZoneControls.js", () => ({
    getHRZoneVisibilitySettings: () => ({ doughnutVisible: true }),
}));
vi.mock("../../../../utils/ui/controls/createPowerZoneControls.js", () => ({
    getPowerZoneVisibilitySettings: () => ({ doughnutVisible: true }),
}));
vi.mock("../../../../utils/charts/rendering/renderZoneChart.js", () => ({
    renderZoneChart: vi.fn(),
}));

describe("renderTimeInZoneCharts", () => {
    beforeEach(() => {
        (window as any).heartRateZones = [{ label: "Z1", total: 10 }];
        (window as any).powerZones = [{ label: "Z2", total: 20 }];
    });

    it("renders both HR and power when visible and data exists", async () => {
        const { renderZoneChart } = await import("../../../../utils/charts/rendering/renderZoneChart.js");
        const { renderTimeInZoneCharts } = await import("../../../../utils/charts/rendering/renderTimeInZoneCharts.js");
        const container = document.createElement("div");
        renderTimeInZoneCharts(container, { chartType: "doughnut" });
        expect(renderZoneChart).toHaveBeenCalledTimes(2);
    });

    it("skips when container missing and when visibility is false", async () => {
        const controls = await import("../../../../utils/ui/controls/createHRZoneControls.js");
        vi.spyOn(controls, "getHRZoneVisibilitySettings").mockReturnValue({ doughnutVisible: false } as any);
        const { renderZoneChart } = await import("../../../../utils/charts/rendering/renderZoneChart.js");
        const { renderTimeInZoneCharts } = await import("../../../../utils/charts/rendering/renderTimeInZoneCharts.js");
        renderTimeInZoneCharts(null as any);
        expect(renderZoneChart).not.toHaveBeenCalled();
    });
});
