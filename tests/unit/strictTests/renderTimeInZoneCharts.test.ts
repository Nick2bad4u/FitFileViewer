import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import type { ZoneData } from "../../../electron-app/utils/types/sharedChartTypes.js";

interface TimeInZoneChartOptions {
    readonly chartType?: string;
    readonly [key: string]: unknown;
}

interface ZoneVisibilitySettings {
    readonly doughnutVisible?: boolean;
}

type RenderTimeInZoneCharts = (
    container: HTMLElement | null | undefined,
    options?: TimeInZoneChartOptions
) => void;

type RenderZoneChart = (
    container: HTMLElement,
    title: string,
    zones: ZoneData[],
    chartId: string,
    options?: TimeInZoneChartOptions
) => void;

type GetZoneVisibilitySettings = () => ZoneVisibilitySettings;

type TimeInZoneTestGlobal = typeof globalThis & {
    heartRateZones?: ZoneData[];
    powerZones?: ZoneData[];
};

function getTimeInZoneGlobal(): TimeInZoneTestGlobal {
    return globalThis as TimeInZoneTestGlobal;
}

let renderTimeInZoneCharts: RenderTimeInZoneCharts;
let renderZoneChartMock: ReturnType<typeof vi.fn<RenderZoneChart>>;
let getHRZoneVisibilitySettingsMock: ReturnType<
    typeof vi.fn<GetZoneVisibilitySettings>
>;
let getPowerZoneVisibilitySettingsMock: ReturnType<
    typeof vi.fn<GetZoneVisibilitySettings>
>;

describe("renderTimeInZoneCharts.js - Time in Zone Composite Renderer", () => {
    beforeEach(async () => {
        vi.resetModules();

        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
            pretendToBeVisual: true,
            resources: "usable",
        });

        globalThis.window = dom.window as unknown as Window & typeof globalThis;
        globalThis.document = dom.window.document;
        globalThis.HTMLElement = dom.window.HTMLElement;

        globalThis.console = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
        } as unknown as Console;

        renderZoneChartMock = vi.fn<RenderZoneChart>(
            (
                container: HTMLElement,
                title: string,
                _zones,
                chartId: string
            ) => {
                const chartMarker = document.createElement("section");
                chartMarker.dataset.chartId = chartId;
                chartMarker.textContent = title;
                container.append(chartMarker);
            }
        );
        getHRZoneVisibilitySettingsMock = vi.fn<GetZoneVisibilitySettings>(
            () => ({
                doughnutVisible: true,
            })
        );
        getPowerZoneVisibilitySettingsMock = vi.fn<GetZoneVisibilitySettings>(
            () => ({
                doughnutVisible: true,
            })
        );

        vi.doMock(
            "../../../electron-app/utils/ui/controls/createHRZoneControls.js",
            () => ({
                getHRZoneVisibilitySettings: getHRZoneVisibilitySettingsMock,
            })
        );
        vi.doMock(
            "../../../electron-app/utils/ui/controls/createPowerZoneControls.js",
            () => ({
                getPowerZoneVisibilitySettings:
                    getPowerZoneVisibilitySettingsMock,
            })
        );
        vi.doMock(
            "../../../electron-app/utils/charts/rendering/renderZoneChart.js",
            () => ({
                renderZoneChart: renderZoneChartMock,
            })
        );

        const module =
            await import("../../../electron-app/utils/charts/rendering/renderTimeInZoneCharts.js");
        renderTimeInZoneCharts = module.renderTimeInZoneCharts;
    });

    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        const timeInZoneGlobal = getTimeInZoneGlobal();
        delete timeInZoneGlobal.window;
        delete timeInZoneGlobal.document;
        delete timeInZoneGlobal.HTMLElement;
        delete timeInZoneGlobal.heartRateZones;
        delete timeInZoneGlobal.powerZones;
    });

    it("should return immediately when container is not provided", () => {
        renderTimeInZoneCharts(null, {});
        expect(renderZoneChartMock).not.toHaveBeenCalled();
        expect(document.body.childElementCount).toBe(0);
    });

    it("should render both HR and power zone charts when visible and data is present", () => {
        const container = document.createElement("div");
        const hrZones = [
            { zone: 1, label: "Z1", time: 120 },
            { zone: 2, label: "Z2", time: 240 },
        ];
        const powerZones = [{ zone: 1, label: "Endurance", time: 300 }];
        const timeInZoneGlobal = getTimeInZoneGlobal();
        timeInZoneGlobal.heartRateZones = hrZones;
        timeInZoneGlobal.powerZones = powerZones;

        const options = { chartType: "doughnut" };
        renderTimeInZoneCharts(container, options);

        expect(
            [...container.querySelectorAll("section")].map((chart) => ({
                chartId: chart.dataset.chartId,
                title: chart.textContent,
            }))
        ).toEqual([
            {
                chartId: "heart-rate-zones",
                title: "HR Zone Distribution (Doughnut)",
            },
            {
                chartId: "power-zones",
                title: "Power Zone Distribution (Doughnut)",
            },
        ]);
        expect(renderZoneChartMock).toHaveBeenCalledTimes(2);
        expect(renderZoneChartMock).toHaveBeenNthCalledWith(
            1,
            container,
            "HR Zone Distribution (Doughnut)",
            hrZones,
            "heart-rate-zones",
            options
        );
        expect(renderZoneChartMock).toHaveBeenNthCalledWith(
            2,
            container,
            "Power Zone Distribution (Doughnut)",
            powerZones,
            "power-zones",
            options
        );
    });

    it("should honor visibility toggles and skip missing datasets", () => {
        const container = document.createElement("div");
        const timeInZoneGlobal = getTimeInZoneGlobal();
        timeInZoneGlobal.heartRateZones = [{ zone: 1, label: "Z1", time: 120 }];
        timeInZoneGlobal.powerZones = undefined;

        getHRZoneVisibilitySettingsMock.mockReturnValueOnce({
            doughnutVisible: false,
        });

        renderTimeInZoneCharts(container, {});

        expect(renderZoneChartMock).not.toHaveBeenCalled();
        expect(container.childElementCount).toBe(0);
    });
});
