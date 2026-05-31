import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
    type Mock,
} from "vitest";
import { renderLapZoneCharts } from "../../../electron-app/utils/charts/rendering/renderLapZoneCharts.js";

// Mock dependencies
vi.mock("../../../electron-app/utils/theming/core/theme.js", () => ({
    getThemeConfig: vi.fn(),
}));

vi.mock(
    "../../../electron-app/utils/charts/rendering/renderLapZoneChart.js",
    () => ({
        renderLapZoneChart: vi.fn(),
    })
);

vi.mock(
    "../../../electron-app/utils/data/zones/renderSingleHRZoneBar.js",
    () => ({
        renderSingleHRZoneBar: vi.fn(),
    })
);

vi.mock(
    "../../../electron-app/utils/data/zones/renderSinglePowerZoneBar.js",
    () => ({
        renderSinglePowerZoneBar: vi.fn(),
    })
);

vi.mock(
    "../../../electron-app/utils/data/zones/chartZoneColorUtils.js",
    () => ({
        getZoneColor: vi.fn(),
    })
);

// Import mocks for manipulation
import { getThemeConfig } from "../../../electron-app/utils/theming/core/theme.js";
import { renderLapZoneChart } from "../../../electron-app/utils/charts/rendering/renderLapZoneChart.js";
import { renderSingleHRZoneBar } from "../../../electron-app/utils/data/zones/renderSingleHRZoneBar.js";
import { renderSinglePowerZoneBar } from "../../../electron-app/utils/data/zones/renderSinglePowerZoneBar.js";
import { getZoneColor } from "../../../electron-app/utils/data/zones/chartZoneColorUtils.js";

type ThemeConfigMock = Mock<() => unknown>;
type GetZoneColorMock = Mock<(type: string, index: number) => string>;
type ChartRenderMock = Mock<
    (
        canvas: HTMLCanvasElement,
        data: readonly unknown[],
        options: { title: string }
    ) => unknown
>;

const getThemeConfigMock = getThemeConfig as unknown as ThemeConfigMock;
const getZoneColorMock = getZoneColor as unknown as GetZoneColorMock;
const renderLapZoneChartMock = renderLapZoneChart as unknown as ChartRenderMock;
const renderSingleHRZoneBarMock =
    renderSingleHRZoneBar as unknown as ChartRenderMock;
const renderSinglePowerZoneBarMock =
    renderSinglePowerZoneBar as unknown as ChartRenderMock;

describe("renderLapZoneCharts", () => {
    let container: HTMLElement;
    let mockConsoleLog: ReturnType<typeof vi.spyOn>;
    let mockConsoleError: ReturnType<typeof vi.spyOn>;
    let mockShowNotification: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Setup DOM
        container = document.createElement("div");
        document.body.appendChild(container);

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
        mockConsoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

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

    const getCanvasIds = (): string[] =>
        [...container.querySelectorAll("canvas")].map((canvas) => canvas.id);

    describe("Parameter Validation", () => {
        it("should handle null container gracefully", () => {
            expect(() => renderLapZoneCharts(null)).not.toThrow();
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] renderLapZoneCharts called"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it("should handle undefined container gracefully", () => {
            expect(() => renderLapZoneCharts(undefined)).not.toThrow();
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] renderLapZoneCharts called"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it("should accept valid container", () => {
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] renderLapZoneCharts called"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should handle empty options object", () => {
            renderLapZoneCharts(container, {});
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] renderLapZoneCharts called"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should handle null options", () => {
            renderLapZoneCharts(container, null);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] renderLapZoneCharts called"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });
    });

    describe("Global Data Validation", () => {
        it("should return early when window.globalData is missing", () => {
            delete window.globalData;
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] No timeInZoneMesgs available for lap zone charts"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should return early when timeInZoneMesgs is missing", () => {
            window.globalData = {};
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] No timeInZoneMesgs available for lap zone charts"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should return early when timeInZoneMesgs is null", () => {
            window.globalData = { timeInZoneMesgs: null };
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] No timeInZoneMesgs available for lap zone charts"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should return early when timeInZoneMesgs is empty array", () => {
            window.globalData = { timeInZoneMesgs: [] };
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Found timeInZoneMesgs:",
                0
            );
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] No lap-specific zone data found"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
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
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Found timeInZoneMesgs:",
                4
            );
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Found lap zone data:",
                expect.any(Array)
            );
            expect(mockConsoleLog).not.toHaveBeenCalledWith(
                "[ChartJS] No lap-specific zone data found"
            );
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-lap-power-zones",
                "chartjs-canvas-single-lap-hr",
                "chartjs-canvas-single-lap-power",
            ]);
        });

        it("should return early when no lap-specific zone data found", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "session", timeInHrZone: "[0,10,20]" },
                { referenceMesg: "activity", timeInHrZone: "[0,8,12]" },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] No lap-specific zone data found"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });
    });

    describe("Safe Array Parsing", () => {
        beforeEach(() => {
            getThemeConfigMock.mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20,30]",
                    referenceIndex: 1,
                },
                {
                    referenceMesg: "lap",
                    timeInPowerZone: "[0,5,15,25]",
                    referenceIndex: 2,
                },
            ];
        });

        it("should parse valid JSON array strings", () => {
            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-lap-power-zones",
                "chartjs-canvas-single-lap-hr",
                "chartjs-canvas-single-lap-power",
            ]);
        });

        it("should handle array inputs directly", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: [
                        0,
                        10,
                        20,
                        30,
                    ],
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should handle null values", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: null, referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should handle invalid JSON strings", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "invalid json",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should handle non-string non-array values", () => {
            window.globalData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: 123, referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });
    });

    describe("Zone Data Processing", () => {
        beforeEach(() => {
            getZoneColorMock.mockImplementation(
                (type: string, index: number) => `${type}-zone-${index}`
            );
        });

        it("should process HR zone data correctly", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20,30]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] HR Zone filtering - meaningfulHRZones:",
                [
                    0,
                    1,
                    2,
                ]
            );
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should process Power zone data correctly", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInPowerZone: "[0,5,15,25]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Power Zone filtering - meaningfulPowerZones:",
                [
                    0,
                    1,
                    2,
                ]
            );
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-power-zones",
                "chartjs-canvas-single-lap-power",
            ]);
        });

        it("should skip zone 0 (rest zone) in processing", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[50,10,20,30]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            // Zone 0 should be skipped, zones 1,2,3 should be processed
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] HR Zone filtering - meaningfulHRZones:",
                [
                    0,
                    1,
                    2,
                ]
            );
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should handle multiple laps", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,0,30]",
                    referenceIndex: 1,
                },
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,5,15,0]",
                    referenceIndex: 2,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] HR Zone filtering - meaningfulHRZones:",
                [
                    0,
                    1,
                    2,
                ]
            );
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });
    });

    describe("Meaningful Zone Filtering", () => {
        it("should filter out zones with zero values across all laps", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,0,0]",
                    referenceIndex: 1,
                },
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,5,0,0]",
                    referenceIndex: 2,
                },
            ];

            renderLapZoneCharts(container);
            // Only zones 1 should be meaningful (zone 0 is rest, zones 2,3 have no data)
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] HR Zone filtering - meaningfulHRZones:",
                [0]
            );
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should include zones with data from any lap", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,0,30]",
                    referenceIndex: 1,
                },
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,0,15,0]",
                    referenceIndex: 2,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] HR Zone filtering - meaningfulHRZones:",
                [
                    0,
                    1,
                    2,
                ]
            );
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should handle empty zone data after filtering", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,0,0,0]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] HR Zone filtering - meaningfulHRZones:",
                []
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });
    });

    describe("Canvas Creation and Styling", () => {
        beforeEach(() => {
            getThemeConfigMock.mockReturnValue({
                name: "test-theme",
                colors: {
                    bgPrimary: "#ffffff",
                    shadow: "0 2px 4px rgba(0,0,0,0.1)",
                },
            });

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];
        });

        it("should create canvas with correct ID for HR stacked chart", () => {
            renderLapZoneCharts(container);
            const canvas = container.querySelector(
                "#chartjs-canvas-lap-hr-zones"
            ) as HTMLCanvasElement;
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.tagName).toBe("CANVAS");
            expect(
                container.querySelector("#missing-lap-zone-canvas")
            ).toBeNull();
        });

        it("should apply correct styling to HR stacked canvas", () => {
            renderLapZoneCharts(container);
            const canvas = container.querySelector(
                "#chartjs-canvas-lap-hr-zones"
            ) as HTMLCanvasElement;
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.style.marginBottom).toBe("20px");
            expect(canvas.style.maxHeight).toBe("400px");
            expect(canvas.style.background).toBe("");
            expect(canvas.style.borderRadius).toBe("8px");
            expect(canvas.style.boxShadow).toBe("0 2px 8px rgba(0,0,0,0.1)");
        });

        it("should create canvas for Power stacked chart", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInPowerZone: "[0,5,15]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            const canvas = container.querySelector(
                "#chartjs-canvas-lap-power-zones"
            );
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-power");
        });

        it("should create canvas for HR individual chart", () => {
            renderLapZoneCharts(container);
            const canvas = container.querySelector(
                "#chartjs-canvas-single-lap-hr"
            );
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(getCanvasIds()).toContain("chartjs-canvas-lap-hr-zones");
        });

        it("should create canvas for Power individual chart", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInPowerZone: "[0,5,15]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            const canvas = container.querySelector(
                "#chartjs-canvas-single-lap-power"
            );
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(getCanvasIds()).toContain("chartjs-canvas-lap-power-zones");
        });
    });

    describe("Chart Rendering", () => {
        beforeEach(() => {
            getThemeConfigMock.mockReturnValue({
                name: "test-theme",
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            renderLapZoneChartMock.mockReturnValue({ id: "mock-chart" });
            renderSingleHRZoneBarMock.mockReturnValue({
                id: "mock-hr-bar",
            });
            renderSinglePowerZoneBarMock.mockReturnValue({
                id: "mock-power-bar",
            });

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
                {
                    referenceMesg: "lap",
                    timeInPowerZone: "[0,5,15]",
                    referenceIndex: 1,
                },
            ];
        });

        it("should call renderLapZoneChart for HR stacked chart", () => {
            renderLapZoneCharts(container);

            // Verify renderLapZoneChart was called for HR chart
            const hrCalls = renderLapZoneChartMock.mock.calls.filter(
                (call) => call[2]?.title === "HR Zone by Lap (Stacked)"
            );
            expect(hrCalls).toHaveLength(1);
            expect(getCanvasIds()).toContain("chartjs-canvas-lap-hr-zones");

            const [
                canvas,
                data,
                options,
            ] = hrCalls[0];
            expect(canvas).toBeInstanceOf(window.HTMLCanvasElement);
            expect(canvas.id).toBe("chartjs-canvas-lap-hr-zones");
            expect(data).toBeInstanceOf(Array);
            expect(options.title).toBe("HR Zone by Lap (Stacked)");
            expect(window._chartjsInstances).toContainEqual({
                id: "mock-chart",
            });
            expect(mockConsoleError).not.toHaveBeenCalled();
        });

        it("should call renderLapZoneChart for Power stacked chart", () => {
            renderLapZoneCharts(container);
            expect(renderLapZoneChart).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expect.any(Array),
                {
                    title: "Power Zone by Lap (Stacked)",
                }
            );
            expect(getCanvasIds()).toContain("chartjs-canvas-lap-power-zones");
        });

        it("should call renderSingleHRZoneBar for HR individual chart", () => {
            renderLapZoneCharts(container);
            expect(renderSingleHRZoneBar).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expect.any(Array),
                {
                    title: "HR Zone by Lap (Individual)",
                }
            );
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-hr");
        });

        it("should call renderSinglePowerZoneBar for Power individual chart", () => {
            renderLapZoneCharts(container);
            expect(renderSinglePowerZoneBar).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expect.any(Array),
                {
                    title: "Power Zone by Lap (Individual)",
                }
            );
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-power");
        });
    });

    describe("Chart Instance Management", () => {
        beforeEach(() => {
            getThemeConfigMock.mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            renderLapZoneChartMock.mockReturnValue({ id: "mock-chart" });
            renderSingleHRZoneBarMock.mockReturnValue({
                id: "mock-hr-bar",
            });

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];
        });

        it("should initialize window._chartjsInstances array if not exists", () => {
            delete window._chartjsInstances;
            renderLapZoneCharts(container);
            expect(window._chartjsInstances).toBeInstanceOf(Array);
            expect(window._chartjsInstances).toEqual([
                { id: "mock-chart" },
                { id: "mock-hr-bar" },
            ]);
        });

        it("should add chart instances to global array", () => {
            window._chartjsInstances = [];
            renderLapZoneCharts(container);
            expect(window._chartjsInstances).toEqual([
                { id: "mock-chart" },
                { id: "mock-hr-bar" },
            ]);
        });

        it("should handle null chart returns", () => {
            renderLapZoneChartMock.mockReturnValue(null);
            renderSingleHRZoneBarMock.mockReturnValue(null);

            window._chartjsInstances = [];
            renderLapZoneCharts(container);
            // Should not add null values to the array
            expect(window._chartjsInstances).toStrictEqual([]);
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
            expect(mockConsoleError).not.toHaveBeenCalled();
        });
    });

    describe("Error Handling", () => {
        it("should catch and log errors", () => {
            // Force an error by making getThemeConfig throw
            getThemeConfigMock.mockImplementation(() => {
                throw new Error("Theme config error");
            });

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleError).toHaveBeenCalledWith(
                "[ChartJS] Error rendering lap zone charts:",
                expect.any(Error)
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should show notification on error", () => {
            getThemeConfigMock.mockImplementation(() => {
                throw new Error("Test error");
            });

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Failed to render lap zone charts",
                "error"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should continue execution when showNotification is not available", () => {
            delete window.showNotification;
            getThemeConfigMock.mockImplementation(() => {
                throw new Error("Test error");
            });

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];

            expect(() => renderLapZoneCharts(container)).not.toThrow();
            expect(mockConsoleError).toHaveBeenCalledWith(
                "[ChartJS] Error rendering lap zone charts:",
                expect.any(Error)
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: window._chartjsInstances ?? [],
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });
    });

    describe("Visibility Settings", () => {
        beforeEach(() => {
            getThemeConfigMock.mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
                {
                    referenceMesg: "lap",
                    timeInPowerZone: "[0,5,15]",
                    referenceIndex: 1,
                },
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
            expect(
                container.querySelector("#chartjs-canvas-lap-hr-zones")
            ).toBeInstanceOf(HTMLCanvasElement);
            expect(
                container.querySelector("#chartjs-canvas-single-lap-power")
            ).toBeInstanceOf(HTMLCanvasElement);
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
            expect(getCanvasIds()).toStrictEqual([]);
            expect(renderLapZoneChart).not.toHaveBeenCalled();
        });

        it("should skip charts when no data available", () => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,0,0]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            // All zones are zero, so no meaningful data - no charts should be created
            expect(getCanvasIds()).toStrictEqual([]);
        });
    });

    describe("Theme Integration", () => {
        beforeEach(() => {
            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];
        });

        it("should call getThemeConfig", () => {
            getThemeConfigMock.mockReturnValue({ name: "test-theme" });
            renderLapZoneCharts(container);
            expect(getThemeConfig).toHaveBeenCalled();
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should log theme config name when available", () => {
            getThemeConfigMock.mockReturnValue({ name: "dark-theme" });
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[renderLapZoneCharts] Using theme config:",
                "dark-theme"
            );
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should handle missing theme config gracefully", () => {
            getThemeConfigMock.mockReturnValue(null);
            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should handle invalid theme config gracefully", () => {
            getThemeConfigMock.mockReturnValue("invalid");
            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should apply theme colors to canvas styling", () => {
            getThemeConfigMock.mockReturnValue({
                colors: {
                    bgPrimary: "#123456",
                    shadow: "0 2px 8px rgba(0,0,0,0.1)",
                },
            });

            renderLapZoneCharts(container);
            const canvas = container.querySelector(
                "canvas"
            ) as HTMLCanvasElement;
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.style.background).toBe("");
            expect(canvas.style.boxShadow).toBe("0 2px 8px rgba(0,0,0,0.1)");
        });
    });

    describe("Session Zone Data Handling", () => {
        beforeEach(() => {
            getThemeConfigMock.mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });
        });

        it("should use window.heartRateZones for HR individual chart when available", () => {
            window.heartRateZones = [
                { label: "Zone 1", value: 100, color: "red" },
                { label: "Zone 2", value: 200, color: "blue" },
            ];

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Using session HR zone data:",
                window.heartRateZones
            );
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-hr");
        });

        it("should convert time property to value for HR zones", () => {
            window.heartRateZones = [
                { label: "Zone 1", time: 100, color: "red" },
                { label: "Zone 2", time: 200, color: "blue" },
            ];

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            const expectedHrZones = [
                { color: "red", label: "Zone 1", time: 100, value: 100 },
                { color: "blue", label: "Zone 2", time: 200, value: 200 },
            ];
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] HR zone data after value mapping:",
                expectedHrZones
            );
            expect(renderSingleHRZoneBar).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expectedHrZones,
                { title: "HR Zone by Lap (Individual)" }
            );
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-hr");
        });

        it("should aggregate HR zone data from laps when session data not available", () => {
            delete window.heartRateZones;
            getZoneColorMock.mockImplementation(
                (type: string, index: number) => `${type}-zone-${index}`
            );

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,0]",
                    referenceIndex: 1,
                },
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,5,15]",
                    referenceIndex: 2,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Aggregating HR zone data from laps"
            );
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Aggregated HR zones:",
                [
                    { color: "hr-zone-0", label: "HR Zone 1", value: 15 },
                    { color: "hr-zone-1", label: "HR Zone 2", value: 15 },
                ]
            );
            expect(renderSingleHRZoneBar).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                [
                    { color: "hr-zone-0", label: "HR Zone 1", value: 15 },
                    { color: "hr-zone-1", label: "HR Zone 2", value: 15 },
                ],
                { title: "HR Zone by Lap (Individual)" }
            );
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-hr");
        });

        it("should use window.powerZones for Power individual chart when available", () => {
            window.powerZones = [
                { label: "Zone 1", value: 50, color: "green" },
                { label: "Zone 2", value: 150, color: "yellow" },
            ];

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInPowerZone: "[0,5,15]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Using session Power zone data:",
                window.powerZones
            );
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-power");
        });

        it("should aggregate Power zone data from laps when session data not available", () => {
            delete window.powerZones;
            getZoneColorMock.mockImplementation(
                (type: string, index: number) => `${type}-zone-${index}`
            );

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInPowerZone: "[0,5,0]",
                    referenceIndex: 1,
                },
                {
                    referenceMesg: "lap",
                    timeInPowerZone: "[0,3,12]",
                    referenceIndex: 2,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Aggregating Power zone data from laps"
            );
            expect(renderSinglePowerZoneBar).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                [
                    {
                        color: "power-zone-0",
                        label: "Power Zone 1",
                        value: 8,
                    },
                    {
                        color: "power-zone-1",
                        label: "Power Zone 2",
                        value: 12,
                    },
                ],
                { title: "Power Zone by Lap (Individual)" }
            );
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-power");
            expect(mockConsoleError).not.toHaveBeenCalled();
        });
    });

    describe("Integration Tests", () => {
        it("should render complete lap zone charts with all data types", () => {
            getThemeConfigMock.mockReturnValue({
                name: "integration-theme",
                colors: {
                    bgPrimary: "#f0f0f0",
                    shadow: "0 2px 4px rgba(0,0,0,0.1)",
                },
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
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,30,45]",
                    timeInPowerZone: "[0,20,35]",
                    referenceIndex: 1,
                },
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,25,50]",
                    timeInPowerZone: "[0,15,40]",
                    referenceIndex: 2,
                },
            ];

            renderLapZoneCharts(container);

            // Should create all 4 canvases
            expect(container.querySelectorAll("canvas")).toHaveLength(4);

            // Should have called all rendering functions
            expect(renderLapZoneChart).toHaveBeenCalledTimes(2); // HR and Power stacked
            expect(renderSingleHRZoneBar).toHaveBeenCalledTimes(1);
            expect(renderSinglePowerZoneBar).toHaveBeenCalledTimes(1);

            // Should have logged success
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Lap zone charts rendered successfully"
            );
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-lap-power-zones",
                "chartjs-canvas-single-lap-hr",
                "chartjs-canvas-single-lap-power",
            ]);
        });

        it("should handle minimal data scenario", () => {
            getThemeConfigMock.mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            window.globalData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);

            // Should create at least the HR individual chart
            expect(container.querySelectorAll("canvas").length).toBeGreaterThan(
                0
            );
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Lap zone charts rendered successfully"
            );
        });
    });
});
