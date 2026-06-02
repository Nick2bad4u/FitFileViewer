import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ZoneData } from "../../../../../electron-app/utils/types/sharedChartTypes.js";

interface RenderZoneChartOptions {
    readonly chartType?: string;
    readonly showLegend?: boolean;
}

interface TimeInZoneTestGlobal {
    heartRateZones?: ZoneData[];
    powerZones?: ZoneData[];
}

interface ZoneVisibilitySettings {
    readonly doughnutVisible?: boolean;
}

type GetZoneVisibilitySettings = () => ZoneVisibilitySettings;

type RenderZoneChart = (
    container: HTMLElement,
    title: string,
    zoneData: ZoneData[],
    chartId: string,
    options?: RenderZoneChartOptions
) => void;

const visibilityMocks = vi.hoisted(() => ({
    getHRZoneVisibilitySettings: vi.fn<GetZoneVisibilitySettings>(),
    getPowerZoneVisibilitySettings: vi.fn<GetZoneVisibilitySettings>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createHRZoneControls.js"),
    () => ({
        getHRZoneVisibilitySettings:
            visibilityMocks.getHRZoneVisibilitySettings,
    })
);
vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createPowerZoneControls.js"),
    () => ({
        getPowerZoneVisibilitySettings:
            visibilityMocks.getPowerZoneVisibilitySettings,
    })
);
vi.mock(
    import("../../../../../electron-app/utils/charts/rendering/renderZoneChart.js"),
    () => ({
        renderZoneChart: vi.fn<RenderZoneChart>(
            (container, _title, _zones, id) => {
                const chart = document.createElement("div");
                chart.dataset.chartId = id;
                container.append(chart);
            }
        ),
    })
);

describe("renderTimeInZoneCharts", () => {
    const chartGlobal = globalThis as typeof globalThis & TimeInZoneTestGlobal,
        heartRateZones: ZoneData[] = [{ label: "Z1", time: 10 }],
        powerZones: ZoneData[] = [{ label: "Z2", time: 20 }];

    beforeEach(() => {
        vi.clearAllMocks();
        visibilityMocks.getHRZoneVisibilitySettings.mockReturnValue({
            doughnutVisible: true,
        });
        visibilityMocks.getPowerZoneVisibilitySettings.mockReturnValue({
            doughnutVisible: true,
        });
        chartGlobal.heartRateZones = heartRateZones;
        chartGlobal.powerZones = powerZones;
    });

    it("renders both HR and power when visible and data exists", async () => {
        expect.assertions(4);

        const { renderZoneChart } =
            await import("../../../../../electron-app/utils/charts/rendering/renderZoneChart.js");
        const { renderTimeInZoneCharts } =
            await import("../../../../../electron-app/utils/charts/rendering/renderTimeInZoneCharts.js");
        const container = document.createElement("div");
        const options = { chartType: "doughnut" };
        renderTimeInZoneCharts(container, options);

        expect(
            [...container.querySelectorAll("[data-chart-id]")].map((chart) =>
                chart.getAttribute("data-chart-id")
            )
        ).toEqual(["heart-rate-zones", "power-zones"]);
        expect(renderZoneChart).toHaveBeenCalledTimes(2);
        expect(renderZoneChart).toHaveBeenNthCalledWith(
            1,
            container,
            "HR Zone Distribution (Doughnut)",
            heartRateZones,
            "heart-rate-zones",
            options
        );
        expect(renderZoneChart).toHaveBeenNthCalledWith(
            2,
            container,
            "Power Zone Distribution (Doughnut)",
            powerZones,
            "power-zones",
            options
        );
    });

    it("skips rendering when the container is missing", async () => {
        expect.assertions(3);

        const { renderZoneChart } =
            await import("../../../../../electron-app/utils/charts/rendering/renderZoneChart.js");
        const { renderTimeInZoneCharts } =
            await import("../../../../../electron-app/utils/charts/rendering/renderTimeInZoneCharts.js");

        expect(renderTimeInZoneCharts(null)).toBeUndefined();
        expect(renderZoneChart).not.toHaveBeenCalled();
        expect([...document.body.children]).toStrictEqual([]);
    });

    it("respects per-zone visibility settings", async () => {
        expect.assertions(2);

        visibilityMocks.getHRZoneVisibilitySettings.mockReturnValue({
            doughnutVisible: false,
        });
        const { renderZoneChart } =
            await import("../../../../../electron-app/utils/charts/rendering/renderZoneChart.js");
        const { renderTimeInZoneCharts } =
            await import("../../../../../electron-app/utils/charts/rendering/renderTimeInZoneCharts.js");
        const container = document.createElement("div"),
            options = { chartType: "doughnut" };
        renderTimeInZoneCharts(container, options);

        expect(
            [...container.querySelectorAll("[data-chart-id]")].map((chart) =>
                chart.getAttribute("data-chart-id")
            )
        ).toEqual(["power-zones"]);
        expect(renderZoneChart).toHaveBeenCalledExactlyOnceWith(
            container,
            "Power Zone Distribution (Doughnut)",
            powerZones,
            "power-zones",
            options
        );
    });

    it("skips hidden or missing zone datasets without mutating the container", async () => {
        expect.assertions(2);

        visibilityMocks.getHRZoneVisibilitySettings.mockReturnValue({
            doughnutVisible: false,
        });
        chartGlobal.powerZones = undefined;
        const { renderZoneChart } =
            await import("../../../../../electron-app/utils/charts/rendering/renderZoneChart.js");
        const { renderTimeInZoneCharts } =
            await import("../../../../../electron-app/utils/charts/rendering/renderTimeInZoneCharts.js");
        const container = document.createElement("div");

        renderTimeInZoneCharts(container, {});

        expect([...container.children]).toStrictEqual([]);
        expect(renderZoneChart).not.toHaveBeenCalled();
    });
});
