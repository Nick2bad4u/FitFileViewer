import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock(
    "../../../../../electron-app/utils/ui/controls/createHRZoneControls.js",
    () => ({
        getHRZoneVisibilitySettings: () => ({ doughnutVisible: true }),
    })
);
vi.mock(
    "../../../../../electron-app/utils/ui/controls/createPowerZoneControls.js",
    () => ({
        getPowerZoneVisibilitySettings: () => ({ doughnutVisible: true }),
    })
);
vi.mock(
    "../../../../../electron-app/utils/charts/rendering/renderZoneChart.js",
    () => ({
        renderZoneChart: vi.fn((container: HTMLElement, _title, _zones, id) => {
            const chart = document.createElement("div");
            chart.dataset.chartId = id;
            container.append(chart);
        }),
    })
);

describe("renderTimeInZoneCharts", () => {
    beforeEach(() => {
        (window as any).heartRateZones = [{ label: "Z1", total: 10 }];
        (window as any).powerZones = [{ label: "Z2", total: 20 }];
    });

    it("renders both HR and power when visible and data exists", async () => {
        const { renderZoneChart } =
            await import("../../../../../electron-app/utils/charts/rendering/renderZoneChart.js");
        const { renderTimeInZoneCharts } =
            await import("../../../../../electron-app/utils/charts/rendering/renderTimeInZoneCharts.js");
        const container = document.createElement("div");
        renderTimeInZoneCharts(container, { chartType: "doughnut" });
        expect(
            [...container.querySelectorAll("[data-chart-id]")].map((chart) =>
                chart.getAttribute("data-chart-id")
            )
        ).toEqual(["heart-rate-zones", "power-zones"]);
        expect(renderZoneChart).toHaveBeenCalledTimes(2);
    });

    it("skips when container missing and when visibility is false", async () => {
        const controls =
            await import("../../../../../electron-app/utils/ui/controls/createHRZoneControls.js");
        vi.spyOn(controls, "getHRZoneVisibilitySettings").mockReturnValue({
            doughnutVisible: false,
        } as any);
        const { renderZoneChart } =
            await import("../../../../../electron-app/utils/charts/rendering/renderZoneChart.js");
        const { renderTimeInZoneCharts } =
            await import("../../../../../electron-app/utils/charts/rendering/renderTimeInZoneCharts.js");
        renderTimeInZoneCharts(null as any);
        expect(document.body.childElementCount).toBe(0);
        expect(renderZoneChart).not.toHaveBeenCalled();
    });
});
