import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";

let renderZoneChart: any;
let Chart: any;
let chartInstanceMock: any;
let detectCurrentThemeMock: ReturnType<typeof vi.fn>;
let getThemeConfigMock: ReturnType<typeof vi.fn>;
let getChartZoneColorsMock: ReturnType<typeof vi.fn>;
let getZoneTypeFromFieldMock: ReturnType<typeof vi.fn>;
let formatTimeMock: ReturnType<typeof vi.fn>;
let createChartCanvasMock: ReturnType<typeof vi.fn>;

describe("renderZoneChart.js - Zone Chart Rendering Utility", () => {
    beforeEach(async () => {
        vi.resetModules();

        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
            pretendToBeVisual: true,
            resources: "usable",
        });

        (globalThis as any).window = dom.window as any;
        (globalThis as any).document = dom.window.document as any;
        (globalThis as any).HTMLCanvasElement = dom.window.HTMLCanvasElement as any;
        (globalThis as any).HTMLElement = dom.window.HTMLElement as any;

        (globalThis as any).console = {
            log: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        };

        chartInstanceMock = {
            update: vi.fn(),
        };
        Chart = vi.fn(() => chartInstanceMock);
        (globalThis as any).Chart = Chart;
        (globalThis as any)._chartjsInstances = [];

        detectCurrentThemeMock = vi.fn(() => "light");
        getThemeConfigMock = vi.fn(() => ({
            colors: {
                zoneColors: ["#111111", "#222222", "#333333"],
                shadowLight: "rgba(0, 0, 0, 0.15)",
            },
        }));
        getChartZoneColorsMock = vi.fn(() => ["#aaaaaa", "#bbbbbb", "#cccccc"]);
        getZoneTypeFromFieldMock = vi.fn(() => "heartRate");
        formatTimeMock = vi.fn((value: number) => `formatted-${value}`);
        createChartCanvasMock = vi.fn(() => document.createElement("canvas"));

        vi.doMock("../../utils/charts/theming/chartThemeUtils.js", () => ({
            detectCurrentTheme: detectCurrentThemeMock,
        }));
        vi.doMock("../../utils/theming/core/theme.js", () => ({
            getThemeConfig: getThemeConfigMock,
        }));
        vi.doMock("../../utils/data/zones/chartZoneColorUtils.js", () => ({
            getChartZoneColors: getChartZoneColorsMock,
            getZoneTypeFromField: getZoneTypeFromFieldMock,
        }));
        vi.doMock("../../utils/formatting/formatters/formatTime.js", () => ({
            formatTime: formatTimeMock,
        }));
        vi.doMock("../../utils/charts/components/createChartCanvas.js", () => ({
            createChartCanvas: createChartCanvasMock,
        }));
        vi.doMock("../../utils/charts/plugins/chartBackgroundColorPlugin.js", () => ({
            chartBackgroundColorPlugin: { id: "background-color" },
        }));

        const module = await import("../../utils/charts/rendering/renderZoneChart.js");
        renderZoneChart = module.renderZoneChart;
    });

    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        if ((globalThis as any)._chartjsInstances) {
            (globalThis as any)._chartjsInstances = [];
        }
        delete (globalThis as any).Chart;
        delete (globalThis as any).window;
        delete (globalThis as any).document;
        delete (globalThis as any).HTMLCanvasElement;
        delete (globalThis as any).HTMLElement;
    });

    it("should warn and exit when container is invalid", () => {
        renderZoneChart(null as any, "Invalid", [], "heart-rate-zones");

        expect((console as any).warn).toHaveBeenCalledWith("renderZoneChart: invalid container", null);
        expect(Chart).not.toHaveBeenCalled();
    });

    it("should warn and exit when zone data is not an array", () => {
        const container = document.createElement("div");
        renderZoneChart(container, "Invalid", null as any, "heart-rate-zones");

        expect((console as any).warn).toHaveBeenCalledWith("renderZoneChart: zoneData not array", null);
        expect(Chart).not.toHaveBeenCalled();
    });

    it("should render doughnut chart with colors provided in zone data", () => {
        const container = document.createElement("div");
        const zoneData = [
            { zone: 1, label: "Z1", time: 120, color: "#ff0000" },
            { zone: 2, label: "Z2", time: 240, color: "#00ff00" },
        ];

        renderZoneChart(container, "HR Zones", zoneData, "heart-rate-zones", { chartType: "doughnut" });

        expect(getChartZoneColorsMock).not.toHaveBeenCalled();
        expect(createChartCanvasMock).toHaveBeenCalledWith("heart-rate-zones", 0);
        const config = Chart.mock.calls[0][1];
        expect(config.type).toBe("doughnut");
        expect(config.data.datasets[0].backgroundColor).toEqual(["#ff0000", "#00ff00"]);

        const tooltipLabel = config.options.plugins.tooltip.callbacks.label({
            dataset: { data: [120, 240], backgroundColor: ["#ff0000", "#00ff00"] },
            parsed: 120,
            dataIndex: 0,
        });
        expect(formatTimeMock).toHaveBeenCalledWith(120, true);
        expect(tooltipLabel).toEqual(["Time: formatted-120", "Percentage: 33.3%"]);
        expect(container.querySelector("canvas")).not.toBeNull();
    });

    it("should fallback to computed zone colors and render bar chart when requested", () => {
        const container = document.createElement("div");
        const zoneData = [
            { zone: 1, label: "Z1", time: 150 },
            { zone: 2, label: "Z2", time: 300 },
        ];
        getZoneTypeFromFieldMock.mockReturnValueOnce("power");

        renderZoneChart(container, "Power Zones", zoneData, "power-zones", { chartType: "bar" });

        expect(getZoneTypeFromFieldMock).toHaveBeenCalledWith("power-zones");
        expect(getChartZoneColorsMock).toHaveBeenCalledWith("power", zoneData.length);

        const config = Chart.mock.calls[0][1];
        expect(config.type).toBe("bar");
        expect(config.data.datasets[0].backgroundColor).toEqual(["#aaaaaa", "#bbbbbb"]);
        expect(config.options.plugins.chartBackgroundColorPlugin.backgroundColor).toBe("#ffffff");

        const label = config.options.plugins.tooltip.callbacks.label({ parsed: { y: 150 } });
        expect(formatTimeMock).toHaveBeenCalledWith(150, true);
        expect(label).toBe("Time: formatted-150");
    });
});
