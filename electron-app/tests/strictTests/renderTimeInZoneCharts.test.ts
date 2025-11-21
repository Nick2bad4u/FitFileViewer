import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";

let renderTimeInZoneCharts: any;
let renderZoneChartMock: ReturnType<typeof vi.fn>;
let getHRZoneVisibilitySettingsMock: ReturnType<typeof vi.fn>;
let getPowerZoneVisibilitySettingsMock: ReturnType<typeof vi.fn>;

describe("renderTimeInZoneCharts.js - Time in Zone Composite Renderer", () => {
    beforeEach(async () => {
        vi.resetModules();

        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
            pretendToBeVisual: true,
            resources: "usable",
        });

        (globalThis as any).window = dom.window as any;
        (globalThis as any).document = dom.window.document as any;
        (globalThis as any).HTMLElement = dom.window.HTMLElement as any;

        (globalThis as any).console = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
        };

        renderZoneChartMock = vi.fn();
        getHRZoneVisibilitySettingsMock = vi.fn(() => ({ doughnutVisible: true }));
        getPowerZoneVisibilitySettingsMock = vi.fn(() => ({ doughnutVisible: true }));

        vi.doMock("../../utils/ui/controls/createHRZoneControls.js", () => ({
            getHRZoneVisibilitySettings: getHRZoneVisibilitySettingsMock,
        }));
        vi.doMock("../../utils/ui/controls/createPowerZoneControls.js", () => ({
            getPowerZoneVisibilitySettings: getPowerZoneVisibilitySettingsMock,
        }));
        vi.doMock("../../utils/charts/rendering/renderZoneChart.js", () => ({
            renderZoneChart: renderZoneChartMock,
        }));

        const module = await import("../../utils/charts/rendering/renderTimeInZoneCharts.js");
        renderTimeInZoneCharts = module.renderTimeInZoneCharts;
    });

    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        delete (globalThis as any).window;
        delete (globalThis as any).document;
        delete (globalThis as any).HTMLElement;
        delete (globalThis as any).heartRateZones;
        delete (globalThis as any).powerZones;
    });

    it("should return immediately when container is not provided", () => {
        renderTimeInZoneCharts(null as any, {});
        expect(renderZoneChartMock).not.toHaveBeenCalled();
    });

    it("should render both HR and power zone charts when visible and data is present", () => {
        const container = document.createElement("div");
        const hrZones = [
            { zone: 1, label: "Z1", time: 120 },
            { zone: 2, label: "Z2", time: 240 },
        ];
        const powerZones = [
            { zone: 1, label: "Endurance", time: 300 },
        ];
        (globalThis as any).heartRateZones = hrZones;
        (globalThis as any).powerZones = powerZones;

        const options = { chartType: "doughnut" };
        renderTimeInZoneCharts(container, options);

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
        (globalThis as any).heartRateZones = [{ zone: 1, label: "Z1", time: 120 }];
        (globalThis as any).powerZones = undefined;

        getHRZoneVisibilitySettingsMock.mockReturnValueOnce({ doughnutVisible: false });

        renderTimeInZoneCharts(container, {});

        expect(renderZoneChartMock).not.toHaveBeenCalled();
    });
});
