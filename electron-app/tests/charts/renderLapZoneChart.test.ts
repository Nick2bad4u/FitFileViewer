import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderLapZoneChart } from "../../utils/charts/rendering/renderLapZoneChart.js";
import { getThemeConfig } from "../../utils/theming/core/theme.js";
import { getZoneColor } from "../../utils/data/zones/chartZoneColorUtils.js";

interface ChartConfig {
    data: {
        datasets: ChartDataset[];
        labels: unknown[];
    };
    options: {
        plugins: {
            title: {
                text: string;
            };
            tooltip: {
                callbacks: {
                    footer: (items: { parsed?: { y?: number } }[]) => string;
                    label: (context: {
                        chart: { data: { datasets: ChartDataset[] } };
                        dataIndex: number;
                        dataset: { label: string };
                        parsed: { y: number };
                    }) => string;
                };
            };
        };
    };
    type: string;
}

interface ChartDataset {
    backgroundColor?: string;
    data: number[];
    label: string;
}

interface ChartMockInstance {
    destroy: ReturnType<typeof vi.fn>;
}

type ChartMock = ReturnType<typeof vi.fn>;

type LapZoneChartTestWindow = Window & {
    Chart?: ChartMock;
    showNotification?: ReturnType<typeof vi.fn>;
};

function getChartMock(): ChartMock {
    const chartMock = (window as LapZoneChartTestWindow).Chart;
    if (chartMock === undefined) {
        throw new TypeError("Chart mock is not installed");
    }
    return chartMock;
}

function getChartCalls(): [HTMLCanvasElement, ChartConfig][] {
    return getChartMock().mock.calls as [HTMLCanvasElement, ChartConfig][];
}

function getLatestChartConfig(): ChartConfig {
    const chartConfig = getChartCalls()[0]?.[1];
    if (chartConfig === undefined) {
        throw new TypeError("Chart mock was not called");
    }
    return chartConfig;
}

function getShowNotificationMock(): ReturnType<typeof vi.fn> {
    const showNotification = (window as LapZoneChartTestWindow)
        .showNotification;
    if (showNotification === undefined) {
        throw new TypeError("showNotification mock is not installed");
    }
    return showNotification;
}

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
            hr: [
                "#ff0000",
                "#ff5500",
                "#ffaa00",
                "#ffff00",
                "#00ff00",
            ],
            power: [
                "#ff00ff",
                "#aa00ff",
                "#5500ff",
                "#0000ff",
                "#00ffff",
            ],
        };
        // Type-safe indexing
        const colorArray =
            type === "hr" ? colors.hr : type === "power" ? colors.power : [];
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
    let mockChart: ChartMockInstance;

    beforeEach(() => {
        // Create mock canvas
        mockCanvas =
            /** @type {HTMLCanvasElement} */ document.createElement("canvas");
        document.body.appendChild(mockCanvas);

        // Mock Chart.js
        mockChart = {
            destroy: vi.fn(),
        };

        (window as LapZoneChartTestWindow).Chart = vi.fn(function ChartMock() {
            return mockChart;
        });
        (window as LapZoneChartTestWindow).showNotification = vi.fn();
    });

    afterEach(() => {
        // Clean up
        if (mockCanvas && mockCanvas.parentNode) {
            mockCanvas.parentNode.removeChild(mockCanvas);
        }

        vi.clearAllMocks();

        // Remove Chart.js mock
        delete (window as LapZoneChartTestWindow).Chart;
        delete (window as LapZoneChartTestWindow).showNotification;
    });

    it("should return null when Chart.js is missing", () => {
        delete (window as LapZoneChartTestWindow).Chart;

        const view = renderLapZoneChart(mockCanvas, []);

        expect(view).toBeNull();
        expect(getShowNotificationMock()).toHaveBeenCalledWith(
            "Failed to render lap zone chart",
            "error"
        );
    });

    it("should return null when canvas is missing", () => {
        const view = renderLapZoneChart(null as unknown as HTMLCanvasElement, []);

        expect(view).toBeNull();
        expect(getShowNotificationMock()).toHaveBeenCalledWith(
            "Failed to render lap zone chart",
            "error"
        );
    });

    it("should return null when lapZoneData is not an array", () => {
        const view = renderLapZoneChart(
            mockCanvas,
            null as unknown as Parameters<typeof renderLapZoneChart>[1]
        );

        expect(view).toBeNull();
        expect(getShowNotificationMock()).toHaveBeenCalledWith(
            "Failed to render lap zone chart",
            "error"
        );
    });

    it("should create a Chart.js chart with correct configuration", () => {
        const lapZoneData = [
            {
                lapLabel: "Lap 1",
                zones: [
                    {
                        label: "HR Zone 1",
                        value: 120,
                        color: "#ff0000",
                        zoneIndex: 0,
                    },
                    {
                        label: "HR Zone 2",
                        value: 180,
                        color: "#ff5500",
                        zoneIndex: 1,
                    },
                ],
            },
            {
                lapLabel: "Lap 2",
                zones: [
                    {
                        label: "HR Zone 1",
                        value: 60,
                        color: "#ff0000",
                        zoneIndex: 0,
                    },
                    {
                        label: "HR Zone 2",
                        value: 240,
                        color: "#ff5500",
                        zoneIndex: 1,
                    },
                ],
            },
        ];

        const options = { title: "Heart Rate Zones by Lap" };

        const view = renderLapZoneChart(mockCanvas, lapZoneData, options);

        expect(view).toBe(mockChart);
        expect(getChartMock()).toHaveBeenCalledTimes(1);

        // Check that Chart was called with the correct parameters
        const chartCall = getChartCalls()[0];
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
        expect(chartConfig.options.plugins.title.text).toBe(
            "Heart Rate Zones by Lap"
        );
    });

    it("should handle empty lap zone data", () => {
        const view = renderLapZoneChart(mockCanvas, [], {});

        expect(view).toBe(mockChart);
        expect(getChartMock()).toHaveBeenCalledTimes(1);

        const chartCall = getChartCalls()[0];
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

        const chartConfig = getLatestChartConfig();

        expect(getZoneColor).toHaveBeenCalledWith("power", 0);
        expect(getZoneColor).toHaveBeenCalledWith("power", 1);
        expect(
            chartConfig.data.datasets.map(
                (dataset: ChartDataset) => dataset.backgroundColor
            )
        ).toEqual(["#ff00ff", "#aa00ff"]);
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

        const chartConfig = getLatestChartConfig();

        expect(getZoneColor).toHaveBeenCalledWith("hr", 0);
        expect(getZoneColor).toHaveBeenCalledWith("hr", 1);
        expect(
            chartConfig.data.datasets.map(
                (dataset: ChartDataset) => dataset.backgroundColor
            )
        ).toEqual(["#ff0000", "#ff5500"]);
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

        const chartCall = getChartCalls()[0];
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

        const chartCall = getChartCalls()[0];
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

        renderLapZoneChart(mockCanvas, lapZoneData, {
            title: "Heart Rate Zones by Lap",
        });

        const chartConfig = getLatestChartConfig();
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
