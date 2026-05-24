import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Define types for our global extensions
declare global {
    interface Window {
        Chart?: any;
        showNotification?: (
            message: string,
            type?: string,
            duration?: number,
            options?: any
        ) => Promise<void>;
    }
}

// Mock dependencies before importing the module
vi.mock("../../../../../utils/charts/theming/chartThemeUtils.js", () => ({
    detectCurrentTheme: vi.fn().mockReturnValue("light"),
}));

vi.mock("../../../../../utils/data/zones/chartZoneColorUtils.js", () => ({
    getChartZoneColors: vi.fn().mockImplementation(() => [
        "#ff0000",
        "#00ff00",
        "#0000ff",
        "#ffff00",
        "#00ffff",
    ]),
}));

vi.mock("../../../../../utils/data/lookups/getUnitSymbol.js", () => ({
    getUnitSymbol: vi.fn().mockReturnValue("h:m:s"),
}));

vi.mock("../../../../../utils/formatting/formatters/formatTime.js", () => ({
    formatTime: vi.fn().mockImplementation((value) => `${value}s`),
}));

// Mock Chart.js plugins
vi.mock("../../../../../utils/charts/plugins/chartZoomResetPlugin.js", () => ({
    chartZoomResetPlugin: {},
}));

vi.mock(
    "../../../../../utils/charts/plugins/chartBackgroundColorPlugin.js",
    () => ({
        chartBackgroundColorPlugin: {},
    })
);

// Import the module after mocks
import { renderSingleHRZoneBar } from "../../../../../utils/data/zones/renderSingleHRZoneBar.js";
import * as chartThemeUtils from "../../../../../utils/charts/theming/chartThemeUtils.js";
import * as formatTime from "../../../../../utils/formatting/formatters/formatTime.js";
import * as chartZoneColorUtils from "../../../../../utils/data/zones/chartZoneColorUtils.js";

describe("renderSingleHRZoneBar", () => {
    let canvas: HTMLCanvasElement;
    let originalChart: any;
    let originalShowNotification: any;
    let mockChartInstance: any;
    let lastChartConfig: any;
    let dom: JSDOM;

    beforeEach(() => {
        // Setup JSDOM environment
        dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
            pretendToBeVisual: true,
            resources: "usable",
        });

        global.window = dom.window as any;
        global.document = dom.window.document as any;
        global.HTMLCanvasElement = dom.window.HTMLCanvasElement as any;
        global.HTMLElement = dom.window.HTMLElement as any;

        // Create a canvas element for testing
        canvas = document.createElement("canvas");
        document.body.appendChild(canvas);

        // Save original globals
        originalChart = window.Chart;
        originalShowNotification = window.showNotification;

        // Create a complete mock Chart instance with all required structures
        mockChartInstance = {
            destroy: vi.fn(),
            update: vi.fn(),
            data: {
                datasets: [],
            },
            options: {
                scales: {
                    y: { ticks: { callback: vi.fn(), color: null } },
                    x: { ticks: { color: null } },
                },
                plugins: {
                    tooltip: { callbacks: { label: vi.fn() } },
                    chartBackgroundColorPlugin: { backgroundColor: null },
                },
            },
        };

        // Reset last captured config
        lastChartConfig = undefined;

        // Create a completely fresh Chart spy for each test
        // This is the key change to fix the failing tests
        const ChartSpy = vi
            .fn()
            .mockImplementation(function ChartMock(ctx, config) {
                mockChartInstance.config = config;
                lastChartConfig = config;
                (global as any).__lastChartConfig = config;
                return mockChartInstance;
            });

        // Explicitly assign our spy to window.Chart
        window.Chart = ChartSpy;
        (global as any).globalThis.Chart = ChartSpy;

        // Sync Chart constructor between window and globalThis using property descriptor
        Object.defineProperty((global as any).globalThis, "Chart", {
            get() {
                return window.Chart;
            },
            set(value) {
                window.Chart = value;
            },
            configurable: true,
        });

        // Mock showNotification
        window.showNotification = vi.fn();

        // Sync showNotification between window and globalThis
        Object.defineProperty((global as any).globalThis, "showNotification", {
            get() {
                return window.showNotification;
            },
            set(value) {
                window.showNotification = value;
            },
            configurable: true,
        });

        // Mock console methods
        global.console = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
        } as any;
    });

    afterEach(() => {
        // Restore original globals
        window.Chart = originalChart;
        window.showNotification = originalShowNotification;

        // Clean up DOM
        if (global.document && global.document.body) {
            document.body.innerHTML = "";
        }

        // Clean up JSDOM
        global.window = undefined as any;
        global.document = undefined as any;
        global.HTMLCanvasElement = undefined as any;
        global.HTMLElement = undefined as any;

        // Reset all mocks
        vi.clearAllMocks();
    });

    function getCapturedChartConfig(view?: any) {
        const chartConfig =
            (mockChartInstance as any)?.config ??
            view?.config ??
            (globalThis as any)?.Chart?.mock?.calls?.[0]?.[1] ??
            (window as any)?.Chart?.mock?.calls?.[0]?.[1] ??
            lastChartConfig ??
            (global as any).__lastChartConfig;

        expect(chartConfig).toMatchObject({
            data: { labels: ["Time in Zone"] },
            options: expect.any(Object),
            type: "bar",
        });
        return chartConfig;
    }

    it("should create a Chart.js chart with correct configuration", () => {
        // Prepare test data
        const zoneData = [
            { label: "Zone 1", value: 300, color: "#ff0000" },
            { label: "Zone 2", value: 600, color: "#00ff00" },
            { label: "Zone 3", value: 450, color: "#0000ff" },
        ];

        // Call the function
        const view = renderSingleHRZoneBar(canvas, zoneData);

        // Verify Chart.js was called with correct parameters
        expect(window.Chart).toHaveBeenCalledTimes(1);
        expect(window.Chart).toHaveBeenCalledWith(
            canvas,
            expect.objectContaining({
                type: "bar",
                data: expect.objectContaining({
                    labels: ["Time in Zone"],
                }),
            })
        );

        // Verify the result
        expect(view).toBe(mockChartInstance);
    });

    it("should handle custom options like title", () => {
        // Prepare test data
        const zoneData = [{ label: "Zone 1", value: 300, color: "#ff0000" }];

        // Call with custom options
        const view = renderSingleHRZoneBar(canvas, zoneData, {
            title: "Custom HR Zones Title",
        });
        expect(window.Chart).toHaveBeenCalled();

        const chartConfig = getCapturedChartConfig(view);

        // Verify title was set correctly
        expect(chartConfig?.options?.plugins?.title?.display).toBe(true);
        expect(chartConfig?.options?.plugins?.title?.text).toBe(
            "Custom HR Zones Title"
        );
    });

    it("should use zone colors from chartZoneColorUtils when colors not provided", () => {
        // Create a fresh Chart mock for this test
        window.Chart = vi
            .fn()
            .mockImplementation(
                function ChartMockForColors(canvasElem, config) {
                    mockChartInstance.config = config;
                    return mockChartInstance;
                }
            );

        // Mock the getChartZoneColors function
        vi.spyOn(chartZoneColorUtils, "getChartZoneColors").mockReturnValue([
            "#ff0000",
            "#00ff00",
            "#0000ff",
        ]);

        // Prepare test data without colors
        const zoneData = [
            { label: "Zone 1", value: 300 },
            { label: "Zone 2", value: 600 },
        ];

        // Call the function
        const view = renderSingleHRZoneBar(canvas, zoneData);

        // Verify the function returned a chart
        expect(view).toBe(mockChartInstance);

        // Verify that Chart constructor was called
        expect(window.Chart).toHaveBeenCalledTimes(1);

        // Verify the chart was created with correct data structure
        const chartCall = (window.Chart as any).mock.calls[0];
        expect(chartCall).toEqual([canvas, expect.any(Object)]);
        expect(chartCall[0]).toBe(canvas);

        const chartConfig = getCapturedChartConfig(view);
        expect(chartConfig.data.datasets).toHaveLength(2);
        expect(chartConfig.data.datasets[0].label).toBe("Zone 1");
        expect(chartConfig.data.datasets[1].label).toBe("Zone 2");

        // Verify colors were set (mocked getChartZoneColors would provide these)
        expect(chartConfig.data.datasets[0].backgroundColor).toBe("#ff0000");
        expect(chartConfig.data.datasets[1].backgroundColor).toBe("#00ff00");
    });

    it("should wire tooltip and y-axis callbacks that format time", () => {
        const zoneData = [{ label: "Zone 1", value: 120 }];
        const view = renderSingleHRZoneBar(canvas, zoneData);
        const cfg = getCapturedChartConfig(view);
        const yTickCb = cfg.options.scales.y.ticks.callback;
        const tooltipCb = cfg.options.plugins.tooltip.callbacks.label;
        expect(typeof yTickCb).toBe("function");
        expect(typeof tooltipCb).toBe("function");
        // Control the return values of formatTime at call-time to avoid environment brittleness
        const ftSpy = vi.spyOn(formatTime, "formatTime");
        ftSpy.mockReturnValueOnce("90s");
        expect(yTickCb(90)).toBe("90s");
        expect(ftSpy).toHaveBeenCalledWith(90, true);
        ftSpy.mockReturnValueOnce("120s");
        expect(
            tooltipCb({ dataset: { label: "Zone 1" }, parsed: { y: 120 } })
        ).toBe("Zone 1: 120s");
        expect(ftSpy).toHaveBeenCalledWith(120, true);
    });

    it("should expose styling callbacks in configuration (smoke)", () => {
        const zoneData = [{ label: "Zone 1", value: 120 }];
        const view = renderSingleHRZoneBar(canvas, zoneData);
        const chartConfig = getCapturedChartConfig(view);
        // Verify callback presence without asserting exact styles
        expect(typeof chartConfig.options.scales.y.ticks.callback).toBe(
            "function"
        );
        expect(chartConfig.options.plugins.chartBackgroundColorPlugin).toEqual(
            expect.objectContaining({
                backgroundColor: "#ffffff",
                display: true,
                text: "chart background plugin",
            })
        );
    });

    it("should handle invalid inputs gracefully", () => {
        // Test with null canvas
        expect(renderSingleHRZoneBar(null as any, [])).toBeNull();
        expect(window.showNotification).toHaveBeenCalledWith(
            "Failed to render HR zone bar",
            "error"
        );
        expect(window.Chart).not.toHaveBeenCalled();

        // Reset mocks
        vi.clearAllMocks();

        // Test with null zoneData
        expect(renderSingleHRZoneBar(canvas, null as any)).toBeNull();
        expect(canvas.classList.contains("chart-canvas")).toBe(false);
        expect(window.showNotification.mock.calls).toStrictEqual([
            ["Failed to render HR zone bar", "error"],
        ]);

        // Reset mocks
        vi.clearAllMocks();

        // Test with missing Chart.js
        window.Chart = undefined;
        expect(
            renderSingleHRZoneBar(canvas, [{ label: "Zone 1", value: 300 }])
        ).toBeNull();
        expect(window.Chart).toBeUndefined();
        expect(window.showNotification).toHaveBeenCalledTimes(1);
    });

    it("should include tooltip and y-axis format callbacks (smoke)", () => {
        const zoneData = [{ label: "Zone 1", value: 120 }];
        const view = renderSingleHRZoneBar(canvas, zoneData);
        const chartConfig = getCapturedChartConfig(view);
        expect(typeof chartConfig.options.plugins.tooltip.callbacks.label).toBe(
            "function"
        );
        expect(typeof chartConfig.options.scales.y.ticks.callback).toBe(
            "function"
        );
    });
});
