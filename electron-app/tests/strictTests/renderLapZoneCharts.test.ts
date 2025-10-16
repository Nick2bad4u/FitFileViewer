import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { renderLapZoneCharts } from "../../utils/charts/rendering/renderLapZoneCharts.js";

const addChartHoverEffectsMock = vi.fn();

// Mock dependencies
vi.mock("../../utils/theming/core/theme.js", () => ({
    getThemeConfig: vi.fn(),
}));

vi.mock("../../utils/charts/rendering/renderLapZoneChart.js", () => ({
    renderLapZoneChart: vi.fn(),
}));

vi.mock("../../utils/data/zones/renderSingleHRZoneBar.js", () => ({
    renderSingleHRZoneBar: vi.fn(),
}));

vi.mock("../../utils/data/zones/renderSinglePowerZoneBar.js", () => ({
    renderSinglePowerZoneBar: vi.fn(),
}));

vi.mock("../../utils/data/zones/chartZoneColorUtils.js", () => ({
    getZoneColor: vi.fn(),
}));

vi.mock("../../utils/charts/plugins/addChartHoverEffects.js", () => ({
    addChartHoverEffects: (...args: unknown[]) => addChartHoverEffectsMock(...args),
}));

// Import mocks for manipulation
import { getThemeConfig } from "../../utils/theming/core/theme.js";
import { renderLapZoneChart } from "../../utils/charts/rendering/renderLapZoneChart.js";
import { renderSingleHRZoneBar } from "../../utils/data/zones/renderSingleHRZoneBar.js";
import { renderSinglePowerZoneBar } from "../../utils/data/zones/renderSinglePowerZoneBar.js";
import { getZoneColor } from "../../utils/data/zones/chartZoneColorUtils.js";

describe("renderLapZoneCharts", () => {
    let container: HTMLElement;
    let mockConsoleLog: ReturnType<typeof vi.spyOn>;
    let mockConsoleError: ReturnType<typeof vi.spyOn>;
    let mockShowNotification: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Setup DOM
        container = document.createElement("div");
        document.body.appendChild(container);

        addChartHoverEffectsMock.mockReset();

        // Setup global data
        window.globalData = {
            timeInZoneMesgs: [],
        };

        // Setup zone data globals
        window.heartRateZones = [];
        window.powerZones = [];
        window._chartjsInstances = [];

        // Mock console methods
        mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
        mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        // Mock notification
        mockShowNotification = vi.fn();
        window.showNotification = mockShowNotification;

        // Reset mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        document.body.removeChild(container);
        vi.restoreAllMocks();
    });

    describe("Parameter Validation", () => {
        it("should handle null container gracefully", () => {
            renderLapZoneCharts(null as any);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] renderLapZoneCharts called");
        });

        it("should handle undefined container gracefully", () => {
            renderLapZoneCharts(undefined as any);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] renderLapZoneCharts called");
        });

        it("should accept valid container", () => {
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] renderLapZoneCharts called");
        });

        it("should handle empty options object", () => {
            renderLapZoneCharts(container, {});
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] renderLapZoneCharts called");
        });

        it("should handle null options", () => {
            renderLapZoneCharts(container, null as any);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] renderLapZoneCharts called");
        });
    });

    describe("Global Data Validation", () => {
        it("should return early when window.globalData is missing", () => {
            delete window.globalData;
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] No timeInZoneMesgs available for lap zone charts");
        });

        it("should return early when timeInZoneMesgs is missing", () => {
            window.globalData = {};
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] No timeInZoneMesgs available for lap zone charts");
        });

        it("should return early when timeInZoneMesgs is null", () => {
            window.globalData = { timeInZoneMesgs: null };
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] No timeInZoneMesgs available for lap zone charts");
        });

        it("should return early when timeInZoneMesgs is empty array", () => {
            window.globalData = { timeInZoneMesgs: [] };
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] Found timeInZoneMesgs:", 0);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] No lap-specific zone data found");
        });
    });

    describe("Lap Zone Filtering", () => {
        it("should filter messages with referenceMesg === 'lap'", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "session", timeInHrZone: "[0,10,20]" },
                { referenceMesg: "lap", timeInHrZone: "[0,15,25]" },
                { referenceMesg: "lap", timeInPowerZone: "[0,5,15]" },
                { referenceMesg: "activity", timeInHrZone: "[0,8,12]" },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] Found timeInZoneMesgs:", 4);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] Found lap zone data:", expect.any(Array));
        });

        it("should return early when no lap-specific zone data found", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "session", timeInHrZone: "[0,10,20]" },
                { referenceMesg: "activity", timeInHrZone: "[0,8,12]" },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] No lap-specific zone data found");
        });
    });

    describe("Safe Array Parsing", () => {
        beforeEach(() => {
            (getThemeConfig as any).mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20,30]", referenceIndex: 1 },
                { referenceMesg: "lap", timeInPowerZone: "[0,5,15,25]", referenceIndex: 2 },
            ];
        });

        it("should parse valid JSON array strings", () => {
            renderLapZoneCharts(container);
            // Should process without errors
            expect(mockConsoleError).not.toHaveBeenCalled();
        });

        it("should handle array inputs directly", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: [0, 10, 20, 30], referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
        });

        it("should handle null values", () => {
            window.globalData.timeInZoneMesgs = [{ referenceMesg: "lap", timeInHrZone: null, referenceIndex: 1 }];

            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
        });

        it("should handle invalid JSON strings", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "invalid json", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
        });

        it("should handle non-string non-array values", () => {
            window.globalData.timeInZoneMesgs = [{ referenceMesg: "lap", timeInHrZone: 123, referenceIndex: 1 }];

            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
        });
    });

    describe("Zone Data Processing", () => {
        beforeEach(() => {
            (getZoneColor as any).mockImplementation((type: string, index: number) => `${type}-zone-${index}`);
        });

        it("should process HR zone data correctly", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20,30]", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] HR Zone filtering - meaningfulHRZones:", [0, 1, 2]);
        });

        it("should process Power zone data correctly", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInPowerZone: "[0,5,15,25]", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Power Zone filtering - meaningfulPowerZones:",
                [0, 1, 2]
            );
        });

        it("should skip zone 0 (rest zone) in processing", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[50,10,20,30]", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            // Zone 0 should be skipped, zones 1,2,3 should be processed
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] HR Zone filtering - meaningfulHRZones:", [0, 1, 2]);
        });

        it("should handle multiple laps", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,0,30]", referenceIndex: 1 },
                { referenceMesg: "lap", timeInHrZone: "[0,5,15,0]", referenceIndex: 2 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] HR Zone filtering - meaningfulHRZones:", [0, 1, 2]);
        });
    });

    describe("Meaningful Zone Filtering", () => {
        it("should filter out zones with zero values across all laps", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,0,0]", referenceIndex: 1 },
                { referenceMesg: "lap", timeInHrZone: "[0,5,0,0]", referenceIndex: 2 },
            ];

            renderLapZoneCharts(container);
            // Only zones 1 should be meaningful (zone 0 is rest, zones 2,3 have no data)
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] HR Zone filtering - meaningfulHRZones:", [0]);
        });

        it("should include zones with data from any lap", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,0,30]", referenceIndex: 1 },
                { referenceMesg: "lap", timeInHrZone: "[0,0,15,0]", referenceIndex: 2 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] HR Zone filtering - meaningfulHRZones:", [0, 1, 2]);
        });

        it("should handle empty zone data after filtering", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,0,0,0]", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] HR Zone filtering - meaningfulHRZones:", []);
        });
    });

    describe("Canvas Creation and Styling", () => {
        beforeEach(() => {
            (getThemeConfig as any).mockReturnValue({
                name: "test-theme",
                colors: {
                    bgPrimary: "#ffffff",
                    shadow: "0 2px 4px rgba(0,0,0,0.1)",
                },
            });

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20]", referenceIndex: 1 },
            ];
        });

        it("should create canvas with correct ID for HR stacked chart", () => {
            renderLapZoneCharts(container);
            const canvas = container.querySelector("#chartjs-canvas-lap-hr-zones") as HTMLCanvasElement;
            expect(canvas).toBeTruthy();
            expect(canvas.tagName).toBe("CANVAS");
        });

        it("should apply correct styling to HR stacked canvas", () => {
            renderLapZoneCharts(container);
            const canvas = container.querySelector("#chartjs-canvas-lap-hr-zones") as HTMLCanvasElement;
            expect(canvas).toBeTruthy();
            expect(canvas.classList.contains("chart-canvas")).toBe(true);
            expect(canvas.dataset.chartHeight).toBe("400");
            expect(canvas.dataset.chartTitleColor).toBe("#3b82f6");
        });

        it("should create canvas for Power stacked chart", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInPowerZone: "[0,5,15]", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            const canvas = container.querySelector("#chartjs-canvas-lap-power-zones");
            expect(canvas).toBeTruthy();
        });

        it("should create canvas for HR individual chart", () => {
            renderLapZoneCharts(container);
            const canvas = container.querySelector("#chartjs-canvas-single-lap-hr") as HTMLCanvasElement | null;
            expect(canvas).toBeTruthy();
            expect(canvas?.dataset.chartHeight).toBe("360");
        });

        it("should create canvas for Power individual chart", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInPowerZone: "[0,5,15]", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            const canvas = container.querySelector("#chartjs-canvas-single-lap-power") as HTMLCanvasElement | null;
            expect(canvas).toBeTruthy();
            expect(canvas?.dataset.chartHeight).toBe("360");
        });
    });

    describe("Chart Rendering", () => {
        beforeEach(() => {
            (getThemeConfig as any).mockReturnValue({
                name: "test-theme",
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            (renderLapZoneChart as any).mockReturnValue({ id: "mock-chart" });
            (renderSingleHRZoneBar as any).mockReturnValue({ id: "mock-hr-bar" });
            (renderSinglePowerZoneBar as any).mockReturnValue({ id: "mock-power-bar" });

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20]", referenceIndex: 1 },
                { referenceMesg: "lap", timeInPowerZone: "[0,5,15]", referenceIndex: 1 },
            ];
        });

        it("should call renderLapZoneChart for HR stacked chart", () => {
            renderLapZoneCharts(container);

            // Verify renderLapZoneChart was called for HR chart
            const hrCalls = renderLapZoneChart.mock.calls.filter(
                (call) => call[2]?.title === "HR Zone by Lap (Stacked)"
            );
            expect(hrCalls).toHaveLength(1);

            const [canvas, data, options] = hrCalls[0];
            expect(canvas).toBeInstanceOf(window.HTMLCanvasElement);
            expect(canvas.id).toBe("chartjs-canvas-lap-hr-zones");
            expect(Array.isArray(data)).toBe(true);
            expect(options.title).toBe("HR Zone by Lap (Stacked)");
        });

        it("should call renderLapZoneChart for Power stacked chart", () => {
            renderLapZoneCharts(container);
            expect(renderLapZoneChart).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), expect.any(Array), {
                title: "Power Zone by Lap (Stacked)",
            });
        });

        it("should call renderSingleHRZoneBar for HR individual chart", () => {
            renderLapZoneCharts(container);
            expect(renderSingleHRZoneBar).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), expect.any(Array), {
                title: "HR Zone by Lap (Individual)",
            });
        });

        it("should call renderSinglePowerZoneBar for Power individual chart", () => {
            renderLapZoneCharts(container);
            expect(renderSinglePowerZoneBar).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), expect.any(Array), {
                title: "Power Zone by Lap (Individual)",
            });
        });
    });

    describe("Chart Instance Management", () => {
        beforeEach(() => {
            (getThemeConfig as any).mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            (renderLapZoneChart as any).mockReturnValue({ id: "mock-chart" });
            (renderSingleHRZoneBar as any).mockReturnValue({ id: "mock-hr-bar" });

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20]", referenceIndex: 1 },
            ];
        });

        it("should initialize window._chartjsInstances array if not exists", () => {
            delete window._chartjsInstances;
            renderLapZoneCharts(container);
            expect(Array.isArray(window._chartjsInstances)).toBe(true);
        });

        it("should add chart instances to global array", () => {
            window._chartjsInstances = [];
            renderLapZoneCharts(container);
            expect(window._chartjsInstances.length).toBeGreaterThan(0);
            expect(window._chartjsInstances[0]).toEqual({ id: "mock-chart" });
        });

        it("should handle null chart returns", () => {
            (renderLapZoneChart as any).mockReturnValue(null);
            (renderSingleHRZoneBar as any).mockReturnValue(null);

            window._chartjsInstances = [];
            renderLapZoneCharts(container);
            // Should not add null values to the array
            expect(window._chartjsInstances.length).toBe(0);
        });
    });

    describe("Error Handling", () => {
        it("should catch and log errors", () => {
            // Force an error by making getThemeConfig throw
            (getThemeConfig as any).mockImplementation(() => {
                throw new Error("Theme config error");
            });

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20]", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleError).toHaveBeenCalledWith(
                "[ChartJS] Error rendering lap zone charts:",
                expect.any(Error)
            );
        });

        it("should show notification on error", () => {
            (getThemeConfig as any).mockImplementation(() => {
                throw new Error("Test error");
            });

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20]", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockShowNotification).toHaveBeenCalledWith("Failed to render lap zone charts", "error");
        });

        it("should continue execution when showNotification is not available", () => {
            delete window.showNotification;
            (getThemeConfig as any).mockImplementation(() => {
                throw new Error("Test error");
            });

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20]", referenceIndex: 1 },
            ];

            // Should not throw
            expect(() => renderLapZoneCharts(container)).not.toThrow();
        });
    });

    describe("Visibility Settings", () => {
        beforeEach(() => {
            (getThemeConfig as any).mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20]", referenceIndex: 1 },
                { referenceMesg: "lap", timeInPowerZone: "[0,5,15]", referenceIndex: 1 },
            ];
        });

        it("should use default visibility settings when none provided", () => {
            renderLapZoneCharts(container);
            // Should create all 4 canvases by default
            expect(container.querySelectorAll("canvas")).toHaveLength(4);
        });

        it("should respect custom visibility settings", () => {
            const options = {
                visibilitySettings: {
                    hrStackedVisible: true,
                    hrIndividualVisible: false,
                    powerStackedVisible: false,
                    powerIndividualVisible: true,
                },
            };

            renderLapZoneCharts(container, options);
            // Should create only HR stacked and Power individual canvases
            expect(container.querySelectorAll("canvas")).toHaveLength(2);
            expect(container.querySelector("#chartjs-canvas-lap-hr-zones")).toBeTruthy();
            expect(container.querySelector("#chartjs-canvas-single-lap-power")).toBeTruthy();
        });

        it("should skip charts when visibility is false", () => {
            const options = {
                visibilitySettings: {
                    hrStackedVisible: false,
                    hrIndividualVisible: false,
                    powerStackedVisible: false,
                    powerIndividualVisible: false,
                },
            };

            renderLapZoneCharts(container, options);
            expect(container.querySelectorAll("canvas")).toHaveLength(0);
        });

        it("should skip charts when no data available", () => {
            window.globalData.timeInZoneMesgs = [{ referenceMesg: "lap", timeInHrZone: "[0,0,0]", referenceIndex: 1 }];

            renderLapZoneCharts(container);
            // All zones are zero, so no meaningful data - no charts should be created
            expect(container.querySelectorAll("canvas")).toHaveLength(0);
        });
    });

    describe("Theme Integration", () => {
        beforeEach(() => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20]", referenceIndex: 1 },
            ];
        });

        it("should call getThemeConfig", () => {
            (getThemeConfig as any).mockReturnValue({ name: "test-theme" });
            renderLapZoneCharts(container);
            expect(getThemeConfig).toHaveBeenCalled();
        });

        it("should log theme config name when available", () => {
            (getThemeConfig as any).mockReturnValue({ name: "dark-theme" });
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[renderLapZoneCharts] Using theme config:", "dark-theme");
        });

        it("should handle missing theme config gracefully", () => {
            (getThemeConfig as any).mockReturnValue(null);
            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
        });

        it("should handle invalid theme config gracefully", () => {
            (getThemeConfig as any).mockReturnValue("invalid");
            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
        });

        it("should apply theme colors to canvas styling", () => {
            (getThemeConfig as any).mockReturnValue({
                colors: {
                    bgPrimary: "#123456",
                    shadow: "0 4px 8px rgba(0,0,0,0.3)",
                },
            });

            renderLapZoneCharts(container);
            const canvas = container.querySelector("canvas") as HTMLCanvasElement;
            expect(canvas).toBeTruthy();
            expect(canvas.style.background).toBe("rgb(18, 52, 86)");
            expect(canvas.style.boxShadow).toBe("0 4px 8px rgba(0,0,0,0.3)");
        });
    });

    describe("Session Zone Data Handling", () => {
        beforeEach(() => {
            (getThemeConfig as any).mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });
        });

        it("should use window.heartRateZones for HR individual chart when available", () => {
            window.heartRateZones = [
                { label: "Zone 1", value: 100, color: "red" },
                { label: "Zone 2", value: 200, color: "blue" },
            ];

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20]", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] Using session HR zone data:", window.heartRateZones);
        });

        it("should convert time property to value for HR zones", () => {
            window.heartRateZones = [
                { label: "Zone 1", time: 100, color: "red" },
                { label: "Zone 2", time: 200, color: "blue" },
            ];

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,20]", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] HR zone data after value mapping:",
                expect.arrayContaining([
                    expect.objectContaining({ value: 100 }),
                    expect.objectContaining({ value: 200 }),
                ])
            );
        });

        it("should aggregate HR zone data from laps when session data not available", () => {
            delete window.heartRateZones;

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,10,0]", referenceIndex: 1 },
                { referenceMesg: "lap", timeInHrZone: "[0,5,15]", referenceIndex: 2 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] Aggregating HR zone data from laps");
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] Aggregated HR zones:", expect.any(Array));
        });

        it("should use window.powerZones for Power individual chart when available", () => {
            window.powerZones = [
                { label: "Zone 1", value: 50, color: "green" },
                { label: "Zone 2", value: 150, color: "yellow" },
            ];

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInPowerZone: "[0,5,15]", referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] Using session Power zone data:", window.powerZones);
        });

        it("should aggregate Power zone data from laps when session data not available", () => {
            delete window.powerZones;

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInPowerZone: "[0,5,0]", referenceIndex: 1 },
                { referenceMesg: "lap", timeInPowerZone: "[0,3,12]", referenceIndex: 2 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] Aggregating Power zone data from laps");
        });
    });

    describe("Integration Tests", () => {
        it("should render complete lap zone charts with all data types", () => {
            (getThemeConfig as any).mockReturnValue({
                name: "integration-theme",
                colors: { bgPrimary: "#f0f0f0", shadow: "0 2px 4px rgba(0,0,0,0.1)" },
            });

            window.heartRateZones = [
                { label: "HR Zone 1", value: 120, color: "#ff0000" },
                { label: "HR Zone 2", value: 240, color: "#00ff00" },
            ];

            window.powerZones = [
                { label: "Power Zone 1", value: 60, color: "#0000ff" },
                { label: "Power Zone 2", value: 180, color: "#ffff00" },
            ];

            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: "[0,30,45]", timeInPowerZone: "[0,20,35]", referenceIndex: 1 },
                { referenceMesg: "lap", timeInHrZone: "[0,25,50]", timeInPowerZone: "[0,15,40]", referenceIndex: 2 },
            ];

            renderLapZoneCharts(container);

            // Should create all 4 canvases
            expect(container.querySelectorAll("canvas")).toHaveLength(4);

            // Should have called all rendering functions
            expect(renderLapZoneChart).toHaveBeenCalledTimes(2); // HR and Power stacked
            expect(renderSingleHRZoneBar).toHaveBeenCalledTimes(1);
            expect(renderSinglePowerZoneBar).toHaveBeenCalledTimes(1);

            expect(addChartHoverEffectsMock).toHaveBeenCalledWith(container, expect.any(Object));

            // Should have logged success
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] Lap zone charts rendered successfully");
        });

        it("should handle minimal data scenario", () => {
            (getThemeConfig as any).mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            window.globalData.timeInZoneMesgs = [{ referenceMesg: "lap", timeInHrZone: "[0,10]", referenceIndex: 1 }];

            renderLapZoneCharts(container);

            // Should create at least the HR individual chart
            expect(container.querySelectorAll("canvas").length).toBeGreaterThan(0);
            expect(mockConsoleLog).toHaveBeenCalledWith("[ChartJS] Lap zone charts rendered successfully");
            expect(addChartHoverEffectsMock).toHaveBeenCalledWith(container, expect.any(Object));
        });
    });
});
