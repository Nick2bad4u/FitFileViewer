import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createEnhancedChart } from "../../utils/charts/components/createEnhancedChart.js";
import { detectCurrentTheme } from "../../utils/charts/theming/chartThemeUtils.js";

// Mock dependencies
vi.mock("../../utils/data/lookups/getUnitSymbol.js", () => ({
    getUnitSymbol: vi.fn((field) => {
        if (field === "speed") return "km/h";
        if (field === "distance") return "km";
        if (field === "altitude") return "m";
        if (field === "temperature") return "°C";
        return "";
    }),
}));

vi.mock("../../utils/formatting/converters/convertTimeUnits.js", () => ({
    convertTimeUnits: vi.fn((val, unit) => {
        if (unit === "hours") return val / 3600;
        if (unit === "minutes") return val / 60;
        return val;
    }),
}));

vi.mock("../../utils/formatting/display/formatTooltipWithUnits.js", () => ({
    formatTooltipWithUnits: vi.fn((val, field) => `${val} units`),
}));

vi.mock("../../utils/formatting/formatters/formatTime.js", () => ({
    formatTime: vi.fn((val) => `${val}s`),
}));

vi.mock("../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

vi.mock("../../utils/charts/core/renderChartJS.js", () => ({
    hexToRgba: vi.fn((hex, alpha) => `rgba(0,0,0,${alpha})`),
}));

vi.mock("../../utils/charts/core/updateChartAnimations.js", () => ({
    updateChartAnimations: vi.fn(),
}));

vi.mock("../../utils/charts/plugins/chartBackgroundColorPlugin.js", () => ({
    chartBackgroundColorPlugin: { id: "chartBackgroundColorPlugin" },
}));

vi.mock("../../utils/charts/plugins/chartZoomResetPlugin.js", () => ({
    chartZoomResetPlugin: { id: "chartZoomResetPlugin" },
}));

vi.mock("../../utils/charts/theming/chartThemeUtils.js", () => ({
    detectCurrentTheme: vi.fn(() => "light"),
}));

vi.mock("../../utils/charts/theming/getFieldColor.js", () => ({
    getFieldColor: vi.fn(() => "#ff0000"),
}));

describe("createEnhancedChart Settings", () => {
    /** @type {HTMLCanvasElement} */
    let mockCanvas;
    /** @type {{ destroy: import("vitest").Mock; options: Record<string, unknown>; data: Record<string, unknown> }} */
    let mockChart;
    /** @type {import("vitest").Mock} */
    let ChartMock;

    beforeEach(() => {
        mockCanvas = document.createElement("canvas");
        mockChart = {
            destroy: vi.fn(),
            options: {},
            data: {},
        };
        ChartMock = vi.fn(() => mockChart);
        global.Chart = ChartMock;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const defaultOptions = {
        chartData: [{ x: 1, y: 10 }, { x: 2, y: 20 }],
        field: "speed",
        fieldLabels: { speed: "Speed" },
        customColors: {},
    };

    it("1. Max points (handled via data passed in, but checking decimation config)", () => {
        const options = {
            ...defaultOptions,
            decimation: { enabled: true, algorithm: "lttb" },
        };
        createEnhancedChart(mockCanvas, options);
        const config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.decimation).toEqual({ enabled: true, algorithm: "lttb" });
    });

    it("2. Chart type (line/bar/scatter/area)", () => {
        // Line
        createEnhancedChart(mockCanvas, { ...defaultOptions, chartType: "line" });
        expect(ChartMock.mock.calls[0][1].type).toBe("line");
        ChartMock.mockClear();

        // Bar
        createEnhancedChart(mockCanvas, { ...defaultOptions, chartType: "bar" });
        expect(ChartMock.mock.calls[0][1].type).toBe("bar");
        ChartMock.mockClear();

        // Scatter
        createEnhancedChart(mockCanvas, { ...defaultOptions, chartType: "scatter" });
        expect(ChartMock.mock.calls[0][1].type).toBe("scatter");
        ChartMock.mockClear();

        // Area (should be line with fill)
        createEnhancedChart(mockCanvas, { ...defaultOptions, chartType: "area" });
        expect(ChartMock.mock.calls[0][1].type).toBe("line");
    });

    it("3. Interpolation (linear/monotone/step)", () => {
        // Linear
        createEnhancedChart(mockCanvas, { ...defaultOptions, interpolation: "linear" });
        let config = ChartMock.mock.calls[0][1];
        expect(config.data.datasets[0].stepped).toBe(false);
        expect(config.data.datasets[0].cubicInterpolationMode).toBe("default");
        ChartMock.mockClear();

        // Monotone
        createEnhancedChart(mockCanvas, { ...defaultOptions, interpolation: "monotone" });
        config = ChartMock.mock.calls[0][1];
        expect(config.data.datasets[0].cubicInterpolationMode).toBe("monotone");
        ChartMock.mockClear();

        // Step
        createEnhancedChart(mockCanvas, { ...defaultOptions, interpolation: "step" });
        config = ChartMock.mock.calls[0][1];
        expect(config.data.datasets[0].stepped).toBe(true);
        expect(config.data.datasets[0].tension).toBe(0);
    });

    it("4. Animation: smooth/fast/none", () => {
        // Smooth (default/normal) -> 1000ms
        createEnhancedChart(mockCanvas, { ...defaultOptions, animationStyle: "normal" });
        expect(ChartMock.mock.calls[0][1].options.animation.duration).toBe(1000);
        ChartMock.mockClear();

        // Fast -> 500ms
        createEnhancedChart(mockCanvas, { ...defaultOptions, animationStyle: "fast" });
        expect(ChartMock.mock.calls[0][1].options.animation.duration).toBe(500);
        ChartMock.mockClear();

        // None -> 0ms
        createEnhancedChart(mockCanvas, { ...defaultOptions, animationStyle: "none" });
        expect(ChartMock.mock.calls[0][1].options.animation.duration).toBe(0);
    });

    it("5. Export theme: light/dark/auto", () => {
        // Auto (uses detected theme, mocked as light)
        createEnhancedChart(mockCanvas, { ...defaultOptions, theme: "auto" });
        let config = ChartMock.mock.calls[0][1];
        // Light theme background color for plugin
        expect(config.options.plugins.chartBackgroundColorPlugin.backgroundColor).toBe("#ffffff");
        expect(detectCurrentTheme).toHaveBeenCalled();
        ChartMock.mockClear();

        // Dark explicit
        createEnhancedChart(mockCanvas, { ...defaultOptions, theme: "dark" });
        config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.chartBackgroundColorPlugin.backgroundColor).toBe("#181c24");
        expect(config.options.scales.x.grid.color).toBe("rgba(255,255,255,0.1)");
        ChartMock.mockClear();

        // Light explicit
        createEnhancedChart(mockCanvas, { ...defaultOptions, theme: "light" });
        config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.chartBackgroundColorPlugin.backgroundColor).toBe("#ffffff");
        expect(config.options.scales.x.grid.color).toBe("rgba(0,0,0,0.1)");
    });

    it("6. Grid (on/off)", () => {
        // On
        createEnhancedChart(mockCanvas, { ...defaultOptions, showGrid: true });
        let config = ChartMock.mock.calls[0][1];
        expect(config.options.scales.x.grid.display).toBe(true);
        expect(config.options.scales.y.grid.display).toBe(true);
        ChartMock.mockClear();

        // Off
        createEnhancedChart(mockCanvas, { ...defaultOptions, showGrid: false });
        config = ChartMock.mock.calls[0][1];
        expect(config.options.scales.x.grid.display).toBe(false);
        expect(config.options.scales.y.grid.display).toBe(false);
    });

    it("7. Legend (on/off)", () => {
        // On
        createEnhancedChart(mockCanvas, { ...defaultOptions, showLegend: true });
        let config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.legend.display).toBe(true);
        ChartMock.mockClear();

        // Off
        createEnhancedChart(mockCanvas, { ...defaultOptions, showLegend: false });
        config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.legend.display).toBe(false);
    });

    it("8. Title (on/off)", () => {
        // On
        createEnhancedChart(mockCanvas, { ...defaultOptions, showTitle: true });
        let config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.title.display).toBe(true);
        ChartMock.mockClear();

        // Off
        createEnhancedChart(mockCanvas, { ...defaultOptions, showTitle: false });
        config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.title.display).toBe(false);
    });

    it("9. Data points (on/off)", () => {
        // On
        createEnhancedChart(mockCanvas, { ...defaultOptions, showPoints: true });
        let config = ChartMock.mock.calls[0][1];
        expect(config.data.datasets[0].pointRadius).toBe(3);
        ChartMock.mockClear();

        // Off
        createEnhancedChart(mockCanvas, { ...defaultOptions, showPoints: false });
        config = ChartMock.mock.calls[0][1];
        expect(config.data.datasets[0].pointRadius).toBe(0);
    });

    it("10. Fill area (on/off)", () => {
        // On
        createEnhancedChart(mockCanvas, { ...defaultOptions, showFill: true });
        let config = ChartMock.mock.calls[0][1];
        expect(config.data.datasets[0].fill).toBe(true);
        ChartMock.mockClear();

        // Off
        createEnhancedChart(mockCanvas, { ...defaultOptions, showFill: false });
        config = ChartMock.mock.calls[0][1];
        expect(config.data.datasets[0].fill).toBe(false);
    });

    it("11. Line smoothing (slider)", () => {
        createEnhancedChart(mockCanvas, { ...defaultOptions, smoothing: 50 });
        let config = ChartMock.mock.calls[0][1];
        expect(config.data.datasets[0].tension).toBe(0.5); // 50 / 100
    });

    it("12. Time units (seconds/minutes/hours)", () => {
        // Seconds
        createEnhancedChart(mockCanvas, { ...defaultOptions, timeUnits: "seconds" });
        let config = ChartMock.mock.calls[0][1];
        expect(config.options.scales.x.title.text).toContain("(s)");
        ChartMock.mockClear();

        // Minutes
        createEnhancedChart(mockCanvas, { ...defaultOptions, timeUnits: "minutes" });
        config = ChartMock.mock.calls[0][1];
        expect(config.options.scales.x.title.text).toContain("(min)");
        ChartMock.mockClear();

        // Hours
        createEnhancedChart(mockCanvas, { ...defaultOptions, timeUnits: "hours" });
        config = ChartMock.mock.calls[0][1];
        expect(config.options.scales.x.title.text).toContain("(h)");
    });

    it("13. Distance units (feet/meters/km/miles)", () => {
        const distanceFieldOptions = { ...defaultOptions, field: "distance" };

        // Kilometers
        createEnhancedChart(mockCanvas, { ...distanceFieldOptions, distanceUnits: "kilometers" });
        let config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.title.text).toContain("(km)");
        ChartMock.mockClear();

        // Miles
        createEnhancedChart(mockCanvas, { ...distanceFieldOptions, distanceUnits: "miles" });
        config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.title.text).toContain("(mi)");
        ChartMock.mockClear();

        // Meters
        createEnhancedChart(mockCanvas, { ...distanceFieldOptions, distanceUnits: "meters" });
        config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.title.text).toContain("(m)");
        ChartMock.mockClear();

        // Feet
        createEnhancedChart(mockCanvas, { ...distanceFieldOptions, distanceUnits: "feet" });
        config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.title.text).toContain("(ft)");
    });

    it("14. Temperature (F/C)", () => {
        const tempFieldOptions = { ...defaultOptions, field: "temperature" };

        // Celsius
        createEnhancedChart(mockCanvas, { ...tempFieldOptions, temperatureUnits: "celsius" });
        let config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.title.text).toContain("(°C)");
        ChartMock.mockClear();

        // Fahrenheit
        createEnhancedChart(mockCanvas, { ...tempFieldOptions, temperatureUnits: "fahrenheit" });
        config = ChartMock.mock.calls[0][1];
        expect(config.options.plugins.title.text).toContain("(°F)");
    });
});
