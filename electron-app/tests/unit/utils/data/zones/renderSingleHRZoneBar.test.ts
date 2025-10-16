import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Define types for our global extensions
declare global {
    interface Window {
        Chart?: any;
        showNotification?: (message: string, type?: string, duration?: number, options?: any) => Promise<void>;
    }
}

// Mock dependencies before importing the module
vi.mock("../../../../../utils/charts/theming/chartThemeUtils.js", () => ({
    detectCurrentTheme: vi.fn().mockReturnValue("light"),
}));

vi.mock("../../../../../utils/data/zones/chartZoneColorUtils.js", () => ({
    getChartZoneColors: vi.fn().mockImplementation(() => ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff"]),
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

vi.mock("../../../../../utils/charts/plugins/chartBackgroundColorPlugin.js", () => ({
    chartBackgroundColorPlugin: {},
}));

const addChartHoverEffectsMock = vi.fn();

const attachChartLabelMetadataMock = vi.fn();

vi.mock("../../../../../utils/charts/components/attachChartLabelMetadata.js", () => ({
    attachChartLabelMetadata: (...args: unknown[]) => attachChartLabelMetadataMock(...args),
}));

vi.mock("../../../../../utils/ui/icons/iconMappings.js", () => ({
    getChartIcon: vi.fn().mockImplementation((name: string) => `icon-${name}`),
}));

vi.mock("../../../../../utils/charts/plugins/addChartHoverEffects.js", () => ({
    addChartHoverEffects: (...args: unknown[]) => addChartHoverEffectsMock(...args),
}));

vi.mock("../../../../../utils/theming/core/theme.js", () => ({
    getThemeConfig: vi.fn().mockReturnValue({ colors: { textPrimary: "#111", accent: "#3b82f6" } }),
}));

// Import the module after mocks
import { renderSingleHRZoneBar } from "../../../../../utils/data/zones/renderSingleHRZoneBar.js";
import * as chartThemeUtils from "../../../../../utils/charts/theming/chartThemeUtils.js";
import * as formatTime from "../../../../../utils/formatting/formatters/formatTime.js";
import * as chartZoneColorUtils from "../../../../../utils/data/zones/chartZoneColorUtils.js";
import { getThemeConfig } from "../../../../../utils/theming/core/theme.js";

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

        addChartHoverEffectsMock.mockReset();
    attachChartLabelMetadataMock.mockReset();

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
        const ChartSpy = vi.fn().mockImplementation((ctx, config) => {
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

    it("should create a Chart.js chart with correct configuration", () => {
        // Prepare test data
        const zoneData = [
            { label: "Zone 1", value: 300, color: "#ff0000" },
            { label: "Zone 2", value: 600, color: "#00ff00" },
            { label: "Zone 3", value: 450, color: "#0000ff" },
        ];

        // Call the function
        const result = renderSingleHRZoneBar(canvas, zoneData);

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
        expect(result).toBe(mockChartInstance);
    expect(addChartHoverEffectsMock).toHaveBeenCalledTimes(1);
    expect(addChartHoverEffectsMock).toHaveBeenCalledWith(canvas.parentElement, expect.any(Object));
    });

    it("should handle custom options like title", () => {
        // Prepare test data
        const zoneData = [{ label: "Zone 1", value: 300, color: "#ff0000" }];

        // Call with custom options
        const chartInstance = renderSingleHRZoneBar(canvas, zoneData, { title: "Custom HR Zones Title" });
        expect(window.Chart).toHaveBeenCalled();

        // Prefer reading the config captured on our mock instance to avoid brittle mock.calls access
        const chartConfig =
            (mockChartInstance as any)?.config ??
            (chartInstance as any)?.config ??
            (window as any)?.Chart?.mock?.calls?.[0]?.[1] ??
            lastChartConfig ??
            (global as any).__lastChartConfig;
        expect(chartConfig).toBeDefined();

        // Verify title was set correctly
        expect(chartConfig?.options?.plugins?.title?.display).toBe(true);
        expect(chartConfig?.options?.plugins?.title?.text).toBe("Custom HR Zones Title");
    expect(addChartHoverEffectsMock).toHaveBeenCalledWith(canvas.parentElement, expect.any(Object));
    });

    it("should use zone colors from chartZoneColorUtils when colors not provided", () => {
        // Create a fresh Chart mock for this test
        window.Chart = vi.fn().mockImplementation((canvasElem, config) => {
            mockChartInstance.config = config;
            return mockChartInstance;
        });

        // Mock the getChartZoneColors function
        vi.spyOn(chartZoneColorUtils, "getChartZoneColors").mockReturnValue(["#ff0000", "#00ff00", "#0000ff"]);

        // Prepare test data without colors
        const zoneData = [
            { label: "Zone 1", value: 300 },
            { label: "Zone 2", value: 600 },
        ];

        // Call the function
        const chart = renderSingleHRZoneBar(canvas, zoneData);

        // Verify the function returned a chart
        expect(chart).toBe(mockChartInstance);

        // Verify that Chart constructor was called
        expect(window.Chart).toHaveBeenCalledTimes(1);

        // Verify the chart was created with correct data structure
        const chartCall = (window.Chart as any).mock.calls[0];
        expect(chartCall).toBeDefined();
        expect(chartCall[0]).toBe(canvas);

        const chartConfig = chartCall[1];
        expect(chartConfig).toBeDefined();
        expect(chartConfig.data.datasets).toHaveLength(2);
        expect(chartConfig.data.datasets[0].label).toBe("Zone 1");
        expect(chartConfig.data.datasets[1].label).toBe("Zone 2");

        // Verify colors were set (mocked getChartZoneColors would provide these)
        expect(chartConfig.data.datasets[0].backgroundColor).toBeDefined();
        expect(chartConfig.data.datasets[1].backgroundColor).toBeDefined();
    expect(addChartHoverEffectsMock).toHaveBeenCalledWith(canvas.parentElement, expect.any(Object));
    });

    it("should attach chart metadata before rendering", () => {
        const zoneData = [{ label: "Zone 1", value: 120 }];
        renderSingleHRZoneBar(canvas, zoneData, { title: "HR Zones" });
        expect(attachChartLabelMetadataMock).toHaveBeenCalledTimes(1);
        const [capturedCanvas, metadata] = attachChartLabelMetadataMock.mock.calls[0];
        expect(capturedCanvas).toBe(canvas);
        expect(metadata.titleText).toBe("HR Zones");
        expect(metadata.yText).toMatch(/Time/);
    });

    it("should wire tooltip and y-axis callbacks that format time", () => {
        const zoneData = [{ label: "Zone 1", value: 120 }];
        const chartInstance = renderSingleHRZoneBar(canvas, zoneData);
        // Prefer validating via the captured config rather than brittle constructor call counts
        // Access the config stored on our mock instance with robust fallbacks
        const cfg =
            (mockChartInstance as any)?.config ??
            (chartInstance as any)?.config ??
            // Prefer globalThis.Chart mock calls since the module uses globalThis.Chart
            (globalThis as any)?.Chart?.mock?.calls?.[0]?.[1] ??
            (window as any)?.Chart?.mock?.calls?.[0]?.[1] ??
            lastChartConfig ??
            (global as any).__lastChartConfig;
        expect(cfg).toBeDefined();
        const yTickCb = cfg.options.scales.y.ticks.callback;
        const tooltipCb = cfg.options.plugins.tooltip.callbacks.label;
        expect(typeof yTickCb).toBe("function");
        expect(typeof tooltipCb).toBe("function");
        // Control the return values of formatTime at call-time to avoid environment brittleness
        const ftSpy = vi.spyOn(formatTime, "formatTime");
        ftSpy.mockReturnValueOnce("90s");
        expect(yTickCb(90)).toBe("90s");
        expect(ftSpy).toHaveBeenCalledWith(90, true);
        expect(addChartHoverEffectsMock).toHaveBeenCalledWith(canvas.parentElement, expect.any(Object));
        ftSpy.mockReturnValueOnce("120s");
        expect(tooltipCb({ dataset: { label: "Zone 1" }, parsed: { y: 120 } })).toBe("Zone 1: 120s");
        expect(ftSpy).toHaveBeenCalledWith(120, true);
    });

    it("should expose styling callbacks in configuration (smoke)", () => {
        const zoneData = [{ label: "Zone 1", value: 120 }];
        const chartInstance = renderSingleHRZoneBar(canvas, zoneData);
        const chartConfig =
            (mockChartInstance as any)?.config ||
            (chartInstance as any)?.config ||
            (globalThis as any)?.Chart?.mock?.calls?.[0]?.[1] ||
            (window as any)?.Chart?.mock?.calls?.[0]?.[1] ||
            (global as any).__lastChartConfig ||
            (lastChartConfig as any);
        expect(chartConfig).toBeDefined();
        // Verify callback presence without asserting exact styles
        expect(typeof chartConfig.options.scales.y.ticks.callback).toBe("function");
        expect(chartConfig.options.plugins.chartBackgroundColorPlugin).toBeDefined();
    expect(addChartHoverEffectsMock).toHaveBeenCalledWith(canvas.parentElement, expect.any(Object));
    });

    it("should handle invalid inputs gracefully", () => {
        // Test with null canvas
        const result1 = renderSingleHRZoneBar(null as any, []);
        expect(result1).toBeNull();
        expect(window.showNotification).toHaveBeenCalledWith("Failed to render HR zone bar", "error");
    expect(addChartHoverEffectsMock).not.toHaveBeenCalled();

        // Reset mocks
        vi.clearAllMocks();

        // Test with null zoneData
        const result2 = renderSingleHRZoneBar(canvas, null as any);
        expect(result2).toBeNull();
        expect(window.showNotification).toHaveBeenCalledWith("Failed to render HR zone bar", "error");
    expect(addChartHoverEffectsMock).not.toHaveBeenCalled();

        // Reset mocks
        vi.clearAllMocks();

        // Test with missing Chart.js
        window.Chart = undefined;
        const result3 = renderSingleHRZoneBar(canvas, [{ label: "Zone 1", value: 300 }]);
        expect(result3).toBeNull();
        expect(window.showNotification).toHaveBeenCalledWith("Failed to render HR zone bar", "error");
    expect(addChartHoverEffectsMock).not.toHaveBeenCalled();
    });

    it("should include tooltip and y-axis format callbacks (smoke)", () => {
        const zoneData = [{ label: "Zone 1", value: 120 }];
        const chartInstance = renderSingleHRZoneBar(canvas, zoneData);
        const chartConfig =
            (mockChartInstance as any)?.config ||
            (chartInstance as any)?.config ||
            (globalThis as any)?.Chart?.mock?.calls?.[0]?.[1] ||
            (window as any)?.Chart?.mock?.calls?.[0]?.[1] ||
            (global as any).__lastChartConfig ||
            (lastChartConfig as any);
        expect(chartConfig).toBeDefined();
        expect(chartConfig.options.plugins.tooltip.callbacks.label).toBeDefined();
        expect(chartConfig.options.scales.y.ticks.callback).toBeDefined();
        expect(addChartHoverEffectsMock).toHaveBeenCalledWith(canvas.parentElement, expect.any(Object));
    });
});
