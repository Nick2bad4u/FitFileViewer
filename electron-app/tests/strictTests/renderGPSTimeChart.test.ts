import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { chartSettingsManager } from "../../utils/charts/core/renderChartJS.js";

let renderGPSTimeChart: any;
let Chart: any;
let chartInstanceMock: any;
let mockLocalStorage: any;
let getThemeConfigMock: ReturnType<typeof vi.fn>;
let createChartCanvasMock: ReturnType<typeof vi.fn>;

const MOCK_COLORS = {
    bgPrimary: "#101010",
    chartBackground: "#111111",
    chartSurface: "#1c1c1c",
    chartBorder: "#333333",
    gridLines: "#222222",
    primary: "#1677ff",
    primaryAlpha: "rgba(22, 119, 255, 0.25)",
    success: "#13c2c2",
    successAlpha: "rgba(19, 194, 194, 0.2)",
    shadow: "0 2px 16px rgba(0,0,0,0.2)",
    text: "#f5f5f5",
    textPrimary: "#e8e8e8",
};

describe("renderGPSTimeChart.js - GPS Position vs Time Chart Utility", () => {
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
            error: vi.fn(),
            warn: vi.fn(),
        };

        mockLocalStorage = {
            getItem: vi.fn(() => null),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        };
        (globalThis as any).localStorage = mockLocalStorage;

        chartInstanceMock = {
            destroy: vi.fn(),
            update: vi.fn(),
        };

        Chart = vi.fn(function ChartConstructor() {
            return chartInstanceMock;
        });
        (globalThis as any).Chart = Chart;
        (globalThis as any)._chartjsInstances = [];

        createChartCanvasMock = vi.fn(() => document.createElement("canvas"));
        getThemeConfigMock = vi.fn(() => ({ colors: MOCK_COLORS }));

        vi.doMock("../../utils/theming/core/theme.js", () => ({
            getThemeConfig: getThemeConfigMock,
        }));
        vi.doMock("../../utils/charts/components/createChartCanvas.js", () => ({
            createChartCanvas: createChartCanvasMock,
        }));
        vi.doMock("../../utils/charts/plugins/chartZoomResetPlugin.js", () => ({
            chartZoomResetPlugin: { id: "zoom-reset" },
        }));

        const module = await import("../../utils/charts/rendering/renderGPSTimeChart.js");
        renderGPSTimeChart = module.renderGPSTimeChart;
    });

    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        delete (globalThis as any).Chart;
        delete (globalThis as any)._chartjsInstances;
        delete (globalThis as any).window;
        delete (globalThis as any).document;
        delete (globalThis as any).HTMLCanvasElement;
        delete (globalThis as any).HTMLElement;
        delete (globalThis as any).localStorage;
    });

    it("should exit early when GPS or timestamp data is missing", () => {
        const container = document.createElement("div");
        const data = [{ positionLat: null, positionLong: null, timestamp: null }];

        renderGPSTimeChart(container, data, { maxPoints: "all" });

        expect(Chart).not.toHaveBeenCalled();
        expect(container.children.length).toBe(0);
    });

    it.skip("should respect field visibility from settings manager (handled by chart state manager)", () => {
        const container = document.createElement("div");
        const data = [{ positionLat: 0, positionLong: 0, timestamp: "2024-01-01T00:00:00.000Z" }];

        (chartSettingsManager as any).getFieldVisibility = vi.fn(() => "hidden" as any);

        renderGPSTimeChart(container, data, { maxPoints: "all" });

        expect(Chart).not.toHaveBeenCalled();
    });

    it("should convert GPS semicircles to degrees, limit points, and configure chart options", () => {
        const container = document.createElement("div");
        const data = [
            {
                positionLat: 0,
                positionLong: 0,
                timestamp: "2024-01-01T00:00:00.000Z",
            },
            {
                positionLat: 1_073_741_824, // 90 degrees
                positionLong: 1_073_741_824,
                timestamp: "2024-01-01T00:00:01.500Z",
            },
            {
                positionLat: -1_073_741_824, // -90 degrees
                positionLong: -1_073_741_824,
                timestamp: "2024-01-01T00:00:02.500Z",
            },
        ];

        const options = {
            maxPoints: 2,
            showGrid: false,
            showLegend: false,
            showPoints: true,
            showTitle: true,
        };

        renderGPSTimeChart(container, data, options);

        expect(createChartCanvasMock).toHaveBeenCalledWith("gps-time", 0);
        expect(Chart).toHaveBeenCalledTimes(1);

        const config = Chart.mock.calls[0][1];
        const latitudeDataset = config.data.datasets[0];
        const longitudeDataset = config.data.datasets[1];

        expect(latitudeDataset.data).toHaveLength(2);
        expect(longitudeDataset.data).toHaveLength(2);
        expect(latitudeDataset.pointRadius).toBe(2);
        expect(config.options.plugins.legend.display).toBe(false);
        expect(config.options.scales.x.grid.display).toBe(false);

        const firstLatPoint = latitudeDataset.data[0];
        const secondLatPoint = latitudeDataset.data[1];
        expect(firstLatPoint.y).toBeCloseTo(0, 6);
        expect(secondLatPoint.y).toBeCloseTo(-90, 6);
        expect(secondLatPoint.pointIndex).toBe(2);
        expect(secondLatPoint.elapsedSeconds).toBeCloseTo(2.5, 5);

        const tooltipLabel = config.options.plugins.tooltip.callbacks.label({
            datasetIndex: 0,
            raw: secondLatPoint,
        });
        expect(tooltipLabel).toEqual(["Latitude: -90.000000°", "Elapsed: 2s", "Point: 2"]);

        const tooltipTitle = config.options.plugins.tooltip.callbacks.title([{ raw: secondLatPoint }]);
        expect(tooltipTitle).toBe(new Date(secondLatPoint.timestamp).toLocaleString());

        expect(config.plugins[0]).toEqual({ id: "zoom-reset" });
        expect(container.querySelector("canvas")).not.toBeNull();
    });
});
