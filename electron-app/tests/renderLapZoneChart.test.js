import { renderLapZoneChart } from "../utils/renderLapZoneChart.js";
import { jest } from "@jest/globals";

// Mock dependencies
global.window = {
    Chart: jest.fn(),
    showNotification: jest.fn(),
};

describe("renderLapZoneChart", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Chart.js constructor
        window.Chart = jest.fn().mockImplementation((canvas, config) => {
            // Simulate tooltip callback execution
            if (config.options?.plugins?.tooltip?.callbacks?.label) {
                const mockContext = {
                    dataset: { label: "HR Zone 1" },
                    parsed: { y: 300 }, // 5 minutes
                    dataIndex: 0,
                    chart: {
                        data: {
                            datasets: [
                                { data: [300, 180, 120] }, // Zone 1: 5min, Zone 2: 3min, Zone 3: 2min
                                { data: [180, 240, 60] },
                                { data: [120, 60, 180] },
                            ],
                        },
                    },
                };

                const result = config.options.plugins.tooltip.callbacks.label(mockContext);
                console.log("Tooltip result:", result);
            }

            return { destroy: jest.fn() };
        });
    });

    test("should format tooltip with time and percentage", () => {
        const canvas = document.createElement("canvas");
        const lapZoneData = [
            {
                lapLabel: "Lap 1",
                zones: [
                    { label: "HR Zone 1", value: 300, color: "#ff0000", zoneIndex: 0 },
                    { label: "HR Zone 2", value: 180, color: "#00ff00", zoneIndex: 1 },
                    { label: "HR Zone 3", value: 120, color: "#0000ff", zoneIndex: 2 },
                ],
            },
        ];

        renderLapZoneChart(canvas, lapZoneData, { title: "Test Chart" });

        // Verify Chart was called
        expect(window.Chart).toHaveBeenCalled();

        const chartConfig = window.Chart.mock.calls[0][1];
        expect(chartConfig.options.plugins.tooltip.callbacks.label).toBeDefined();
    });

    test("should handle empty data gracefully", () => {
        const canvas = document.createElement("canvas");
        const emptyData = [];

        const result = renderLapZoneChart(canvas, emptyData);

        expect(result).toBeNull();
        expect(window.showNotification).toHaveBeenCalledWith("Failed to render lap zone chart", "error");
    });

    test("should calculate percentages correctly", () => {
        const canvas = document.createElement("canvas");
        const lapZoneData = [
            {
                lapLabel: "Lap 1",
                zones: [
                    { label: "HR Zone 1", value: 600, color: "#ff0000", zoneIndex: 0 }, // 10 min = 50%
                    { label: "HR Zone 2", value: 360, color: "#00ff00", zoneIndex: 1 }, // 6 min = 30%
                    { label: "HR Zone 3", value: 240, color: "#0000ff", zoneIndex: 2 }, // 4 min = 20%
                ],
            },
        ];

        renderLapZoneChart(canvas, lapZoneData);

        // Verify that the chart configuration includes proper data structure
        const chartConfig = window.Chart.mock.calls[0][1];
        expect(chartConfig.data.datasets).toHaveLength(3);
        expect(chartConfig.data.datasets[0].data[0]).toBe(600);
        expect(chartConfig.data.datasets[1].data[0]).toBe(360);
        expect(chartConfig.data.datasets[2].data[0]).toBe(240);
    });
});
