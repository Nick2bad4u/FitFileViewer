import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderLapZoneChart } from "../../utils/charts/rendering/renderLapZoneChart.js";
import { getThemeConfig } from "../../utils/theming/core/theme.js";
import { getZoneColor } from "../../utils/data/zones/chartZoneColorUtils.js";

// Mock dependencies
vi.mock("../../utils/theming/core/theme.js", () => ({
    getThemeConfig: vi.fn(() => ({
        name: "mockTheme",
        colors: {
            textPrimary: "#111",
            textSecondary: "#222",
            chartSurface: "#333",
            chartBackground: "#444",
            chartGrid: "#555",
            chartBorder: "#666",
            primary: "#777",
            primaryAlpha: "#888",
        },
    })),
}));

vi.mock("../../utils/data/zones/chartZoneColorUtils.js", () => ({
    getZoneColor: vi.fn((type, index) => {
        const colors = {
            hr: ["#ff0000", "#ff5500", "#ffaa00", "#ffff00", "#00ff00"],
            power: ["#ff00ff", "#aa00ff", "#5500ff", "#0000ff", "#00ffff"],
        };
        // Type-safe indexing
        const colorArray = type === "hr" ? colors.hr : type === "power" ? colors.power : [];
        return colorArray[index] || "#cccccc";
    }),
}));

vi.mock("../../utils/data/lookups/getUnitSymbol.js", () => ({
    getUnitSymbol: vi.fn(() => "h:m:s"),
}));

vi.mock("../../utils/formatting/formatters/formatTime.js", () => ({
    formatTime: vi.fn((seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }),
}));

vi.mock("../../utils/charts/plugins/chartZoomResetPlugin.js", () => ({
    chartZoomResetPlugin: { id: "chartZoomResetPlugin", beforeDraw: vi.fn() },
}));

describe("renderLapZoneChart", () => {
    let mockCanvas: HTMLCanvasElement;
    let mockChart: any;

    beforeEach(() => {
        // Create mock canvas
        mockCanvas = /** @type {HTMLCanvasElement} */ document.createElement("canvas");
        document.body.appendChild(mockCanvas);

        // Mock Chart.js
        mockChart = {
            destroy: vi.fn(),
        };

    (window as any).Chart = vi.fn(() => mockChart);
    (window as any).showNotification = vi.fn();
    });

    afterEach(() => {
        // Clean up
        if (mockCanvas && mockCanvas.parentNode) {
            mockCanvas.parentNode.removeChild(mockCanvas);
        }

        vi.clearAllMocks();

        // Remove Chart.js mock
    delete (window as any).Chart;
    delete (window as any).showNotification;
    });

    it("should return null when Chart.js is missing", () => {
    delete (window as any).Chart;

        const result = renderLapZoneChart(mockCanvas, []);

        expect(result).toBeNull();
    expect((window as any).showNotification).toHaveBeenCalledWith("Failed to render lap zone chart", "error");
    });

    it("should return null when canvas is missing", () => {
        // @ts-ignore - Intentionally passing null to test error handling
        const result = renderLapZoneChart(null, []);

        expect(result).toBeNull();
    expect((window as any).showNotification).toHaveBeenCalledWith("Failed to render lap zone chart", "error");
    });

    it("should return null when lapZoneData is not an array", () => {
        // @ts-ignore - Intentionally passing null to test error handling
        const result = renderLapZoneChart(mockCanvas, null);

        expect(result).toBeNull();
    expect((window as any).showNotification).toHaveBeenCalledWith("Failed to render lap zone chart", "error");
    });

    it("should create a Chart.js chart with correct configuration", () => {
        const lapZoneData = [
            {
                lapLabel: "Lap 1",
                zones: [
                    { label: "HR Zone 1", value: 120, color: "#ff0000", zoneIndex: 0 },
                    { label: "HR Zone 2", value: 180, color: "#ff5500", zoneIndex: 1 },
                ],
            },
            {
                lapLabel: "Lap 2",
                zones: [
                    { label: "HR Zone 1", value: 60, color: "#ff0000", zoneIndex: 0 },
                    { label: "HR Zone 2", value: 240, color: "#ff5500", zoneIndex: 1 },
                ],
            },
        ];

        const options = { title: "Heart Rate Zones by Lap" };

        const result = renderLapZoneChart(mockCanvas, lapZoneData, options);

    expect(result).toBe(mockChart);
    expect((window as any).Chart).toHaveBeenCalledTimes(1);

        // Check that Chart was called with the correct parameters
    const chartCall = (window as any).Chart.mock.calls[0];
        expect(chartCall[0]).toBe(mockCanvas);

        const chartConfig = chartCall[1];
        expect(chartConfig.type).toBe("bar");
        expect(chartConfig.data.labels).toEqual(["Lap 1", "Lap 2"]);
        expect(chartConfig.data.datasets).toHaveLength(2);
        expect(chartConfig.data.datasets[0].label).toBe("HR Zone 1");
        expect(chartConfig.data.datasets[1].label).toBe("HR Zone 2");
        expect(chartConfig.data.datasets[0].data).toEqual([120, 60]);
        expect(chartConfig.data.datasets[1].data).toEqual([180, 240]);

        // Check theme configuration
        expect(getThemeConfig).toHaveBeenCalled();
        expect(chartConfig.options.plugins.title.text).toBe("Heart Rate Zones by Lap");
    });

    it("should handle empty lap zone data", () => {
        const result = renderLapZoneChart(mockCanvas, [], {});

        expect(result).toBe(mockChart);
    expect((window as any).Chart).toHaveBeenCalledTimes(1);

    const chartCall = (window as any).Chart.mock.calls[0];
        const chartConfig = chartCall[1];
        expect(chartConfig.data.labels).toEqual([]);
        expect(chartConfig.data.datasets).toHaveLength(0);
    });

    it('should use power zone colors when title includes "power"', () => {
        const lapZoneData = [
            {
                lapLabel: "Lap 1",
                zones: [
                    { label: "Power Zone 1", value: 120, zoneIndex: 0 },
                    { label: "Power Zone 2", value: 180, zoneIndex: 1 },
                ],
            },
        ];

        const options = { title: "Power Zones by Lap" };

        renderLapZoneChart(mockCanvas, lapZoneData, options);

        expect(getZoneColor).toHaveBeenCalledWith("power", 0);
        expect(getZoneColor).toHaveBeenCalledWith("power", 1);
    });

    it("should use HR zone colors by default", () => {
        const lapZoneData = [
            {
                lapLabel: "Lap 1",
                zones: [
                    { label: "Zone 1", value: 120, zoneIndex: 0 },
                    { label: "Zone 2", value: 180, zoneIndex: 1 },
                ],
            },
        ];

        renderLapZoneChart(mockCanvas, lapZoneData, {});

        expect(getZoneColor).toHaveBeenCalledWith("hr", 0);
        expect(getZoneColor).toHaveBeenCalledWith("hr", 1);
    });

    it("should sort zones by their numeric index", () => {
        const lapZoneData = [
            {
                lapLabel: "Lap 1",
                zones: [
                    { label: "HR Zone 3", value: 100, zoneIndex: 2 },
                    { label: "HR Zone 1", value: 200, zoneIndex: 0 },
                    { label: "HR Zone 2", value: 150, zoneIndex: 1 },
                ],
            },
        ];

        renderLapZoneChart(mockCanvas, lapZoneData, {});

    const chartCall = (window as any).Chart.mock.calls[0];
        const chartConfig = chartCall[1];

        // Zones should be sorted by numeric index
        expect(chartConfig.data.datasets[0].label).toBe("HR Zone 1");
        expect(chartConfig.data.datasets[1].label).toBe("HR Zone 2");
        expect(chartConfig.data.datasets[2].label).toBe("HR Zone 3");
    });

    it("should handle missing zone data for some laps", () => {
        const lapZoneData = [
            {
                lapLabel: "Lap 1",
                zones: [
                    { label: "HR Zone 1", value: 120, zoneIndex: 0 },
                    { label: "HR Zone 2", value: 180, zoneIndex: 1 },
                ],
            },
            {
                lapLabel: "Lap 2",
                zones: [
                    { label: "HR Zone 1", value: 60, zoneIndex: 0 },
                    // HR Zone 2 missing
                ],
            },
        ];

        renderLapZoneChart(mockCanvas, lapZoneData, {});

    const chartCall = (window as any).Chart.mock.calls[0];
        const chartConfig = chartCall[1];

        // Check that missing zone data is properly handled
        expect(chartConfig.data.datasets[0].data).toEqual([120, 60]);
        expect(chartConfig.data.datasets[1].data).toEqual([180, 0]); // Missing data becomes 0
    });

    it("tooltip callbacks compute total footer and label string", () => {
        const lapZoneData = [
            {
                lapLabel: "Lap 1",
                zones: [
                    { label: "HR Zone 1", value: 120, zoneIndex: 0 },
                    { label: "HR Zone 2", value: 180, zoneIndex: 1 },
                ],
            },
            {
                lapLabel: "Lap 2",
                zones: [
                    { label: "HR Zone 1", value: 60, zoneIndex: 0 },
                    { label: "HR Zone 2", value: 240, zoneIndex: 1 },
                ],
            },
        ];

        renderLapZoneChart(mockCanvas, lapZoneData, { title: "Heart Rate Zones by Lap" });

    const chartConfig = ((window as any).Chart as any).mock.calls[0][1];
        const callbacks = chartConfig.options.plugins.tooltip.callbacks;

        // Footer should sum parsed.y values and format with formatTime mock
        const footer = callbacks.footer([
            { parsed: { y: 120 } },
            { parsed: { y: 180 } },
        ]);
        expect(footer).toBe("Total: 0:05:00");

        // Label should compute percentage of total for the given dataIndex
        // Build a context resembling Chart.js tooltip item
        const context = {
            chart: { data: { datasets: chartConfig.data.datasets } },
            dataIndex: 0, // index for Lap 1
            dataset: { label: "HR Zone 1" },
            parsed: { y: 120 },
        };
        const label = callbacks.label(context);
        // For Lap 1: total = 120 + 180 = 300 -> 120/300 = 40.0%
        expect(label).toBe("HR Zone 1: 0:02:00 (40.0%)");
    });
});
