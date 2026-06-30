import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
    type Mock,
} from "vitest";
import {
    clearChartInstanceRegistryForTests,
    getRegisteredChartInstances,
} from "../../../electron-app/utils/charts/core/chartInstanceRegistry.js";
import { renderLapZoneCharts } from "../../../electron-app/utils/charts/rendering/renderLapZoneCharts.js";
import { setActiveFitRawData } from "../../../electron-app/utils/state/domain/activeFitRawDataState.js";
import { __resetStateManagerForTests } from "../../../electron-app/utils/state/core/stateManager.js";
import {
    clearZoneDataState,
    setZoneDataByType,
} from "../../../electron-app/utils/data/zones/zoneDataState.js";

const notificationMocks = vi.hoisted(() => ({
    showNotification: vi.fn<(message: string, type?: string) => void>(),
}));

// Mock dependencies
vi.mock(import("../../../electron-app/utils/theming/core/theme.js"), () => ({
    getThemeConfig: vi.fn<() => unknown>(),
}));
vi.mock(
    import("../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: notificationMocks.showNotification,
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/rendering/renderLapZoneChart.js"),
    () => ({
        renderLapZoneChart: vi.fn<ChartRenderFunction>(),
    })
);

vi.mock(
    import("../../../electron-app/utils/data/zones/renderSingleHRZoneBar.js"),
    () => ({
        renderSingleHRZoneBar: vi.fn<ChartRenderFunction>(),
    })
);

vi.mock(
    import("../../../electron-app/utils/data/zones/renderSinglePowerZoneBar.js"),
    () => ({
        renderSinglePowerZoneBar: vi.fn<ChartRenderFunction>(),
    })
);

vi.mock(
    import("../../../electron-app/utils/data/zones/chartZoneColorUtils.js"),
    () => ({
        getZoneColor: vi.fn<(type: string, index: number) => string>(),
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
type ChartRenderFunction = (
    canvas: HTMLCanvasElement,
    data: readonly unknown[],
    options: { title: string }
) => unknown;
type ChartRenderMock = Mock<ChartRenderFunction>;
type LapZoneActiveFitData = {
    timeInZoneMesgs?: unknown[] | null;
};

const getThemeConfigMock = getThemeConfig as unknown as ThemeConfigMock;
const getZoneColorMock = getZoneColor as unknown as GetZoneColorMock;
const renderLapZoneChartMock = renderLapZoneChart as unknown as ChartRenderMock;
const renderSingleHRZoneBarMock =
    renderSingleHRZoneBar as unknown as ChartRenderMock;
const renderSinglePowerZoneBarMock =
    renderSinglePowerZoneBar as unknown as ChartRenderMock;

describe(renderLapZoneCharts, () => {
    let container: HTMLElement;
    let lapZoneActiveFitData: LapZoneActiveFitData;
    let mockConsoleLog: ReturnType<typeof vi.spyOn>;
    let mockConsoleError: ReturnType<typeof vi.spyOn>;
    let mockShowNotification: Mock<(message: string, type: string) => void>;

    beforeEach(() => {
        __resetStateManagerForTests();
        // Setup DOM
        container = document.createElement("div");
        document.body.appendChild(container);

        // Setup active FIT data
        lapZoneActiveFitData = { timeInZoneMesgs: [] };
        setActiveFitRawData(lapZoneActiveFitData, { source: "test" });

        clearZoneDataState();
        clearChartInstanceRegistryForTests();

        // Mock console methods
        mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
        mockConsoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Mock notification
        mockShowNotification = notificationMocks.showNotification;

        // Reset mocks
        vi.clearAllMocks();
        notificationMocks.showNotification.mockReset();

        getZoneColorMock.mockImplementation(
            (type: string, index: number) => `${type}-zone-${index}`
        );
        renderLapZoneChartMock.mockReturnValue({ id: "mock-chart" });
        renderSingleHRZoneBarMock.mockReturnValue({ id: "mock-hr-bar" });
        renderSinglePowerZoneBarMock.mockReturnValue({
            id: "mock-power-bar",
        });
    });

    afterEach(() => {
        __resetStateManagerForTests();
        clearChartInstanceRegistryForTests();
        document.body.removeChild(container);
        vi.restoreAllMocks();
    });

    const setLapZoneActiveFitData = (
        data: LapZoneActiveFitData | null
    ): void => {
        lapZoneActiveFitData = data ?? {};
        setActiveFitRawData(data, { source: "test" });
    };

    const getCanvasIds = (): string[] =>
        [...container.querySelectorAll("canvas")].map((canvas) => canvas.id);

    const getChartInstances = (): object[] => getRegisteredChartInstances();

    const getLatestChartRenderCall = (
        renderMock: ChartRenderMock
    ): Parameters<ChartRenderFunction> => {
        const call = renderMock.mock.calls.at(-1);

        if (!call) {
            throw new Error("Expected chart render mock to be called");
        }

        return call;
    };

    describe("parameter validation", () => {
        it("should handle null container gracefully", () => {
            expect.assertions(3);

            renderLapZoneCharts(null);

            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] renderLapZoneCharts called"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it("should handle undefined container gracefully", () => {
            expect.assertions(3);

            renderLapZoneCharts(undefined);

            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] renderLapZoneCharts called"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it("should accept valid container", () => {
            expect.assertions(2);

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] renderLapZoneCharts called"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should handle empty options object", () => {
            expect.assertions(2);

            renderLapZoneCharts(container, {});
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] renderLapZoneCharts called"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should handle null options", () => {
            expect.assertions(2);

            renderLapZoneCharts(container, null);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] renderLapZoneCharts called"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });
    });

    describe("active FIT data validation", () => {
        it("should return early when active FIT data is missing", () => {
            expect.assertions(2);

            setLapZoneActiveFitData(null);
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] No timeInZoneMesgs available for lap zone charts"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should return early when timeInZoneMesgs is missing", () => {
            expect.assertions(2);

            setLapZoneActiveFitData({});
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] No timeInZoneMesgs available for lap zone charts"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should return early when timeInZoneMesgs is null", () => {
            expect.assertions(2);

            setLapZoneActiveFitData({ timeInZoneMesgs: null });
            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] No timeInZoneMesgs available for lap zone charts"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should return early when timeInZoneMesgs is empty array", () => {
            expect.assertions(3);

            setLapZoneActiveFitData({ timeInZoneMesgs: [] });
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
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });
    });

    describe("lap zone filtering", () => {
        it("should filter messages with referenceMesg === 'lap'", () => {
            expect.assertions(4);

            const expectedLapZoneData = [
                { referenceMesg: "lap", timeInHrZone: "[0,15,25]" },
                { referenceMesg: "lap", timeInPowerZone: "[0,5,15]" },
            ];
            lapZoneActiveFitData.timeInZoneMesgs = [
                { referenceMesg: "session", timeInHrZone: "[0,10,20]" },
                ...expectedLapZoneData,
                { referenceMesg: "activity", timeInHrZone: "[0,8,12]" },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Found timeInZoneMesgs:",
                4
            );
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Found lap zone data:",
                expectedLapZoneData
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
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
                { referenceMesg: "session", timeInHrZone: "[0,10,20]" },
                { referenceMesg: "activity", timeInHrZone: "[0,8,12]" },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] No lap-specific zone data found"
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });
    });

    describe("safe array parsing", () => {
        beforeEach(() => {
            getThemeConfigMock.mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect.assertions(2);

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
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: null, referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should handle invalid JSON strings", () => {
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
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
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should handle non-string non-array values", () => {
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
                { referenceMesg: "lap", timeInHrZone: 123, referenceIndex: 1 },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });
    });

    describe("zone data processing", () => {
        beforeEach(() => {
            getZoneColorMock.mockImplementation(
                (type: string, index: number) => `${type}-zone-${index}`
            );
        });

        it("should process HR zone data correctly", () => {
            expect.assertions(3);

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
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

    describe("meaningful zone filtering", () => {
        it("should filter out zones with zero values across all laps", () => {
            expect.assertions(3);

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
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
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });
    });

    describe("canvas creation and styling", () => {
        beforeEach(() => {
            getThemeConfigMock.mockReturnValue({
                name: "test-theme",
                colors: {
                    bgPrimary: "#ffffff",
                    shadow: "0 2px 4px rgba(0,0,0,0.1)",
                },
            });

            lapZoneActiveFitData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];
        });

        it("should create canvas with correct ID for HR stacked chart", () => {
            expect.assertions(3);

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
            expect.assertions(6);

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
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect.assertions(2);

            renderLapZoneCharts(container);
            const canvas = container.querySelector(
                "#chartjs-canvas-single-lap-hr"
            );
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(getCanvasIds()).toContain("chartjs-canvas-lap-hr-zones");
        });

        it("should create canvas for Power individual chart", () => {
            expect.assertions(2);

            lapZoneActiveFitData.timeInZoneMesgs = [
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

    describe("chart rendering", () => {
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

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect.assertions(8);

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
            expect(getChartInstances()).toStrictEqual([
                { id: "mock-chart" },
                { id: "mock-chart" },
                { id: "mock-hr-bar" },
                { id: "mock-power-bar" },
            ]);
            expect(mockConsoleError).not.toHaveBeenCalled();
        });

        it("should call renderLapZoneChart for Power stacked chart", () => {
            expect.assertions(6);

            renderLapZoneCharts(container);
            const powerCalls = renderLapZoneChartMock.mock.calls.filter(
                (call) => call[2]?.title === "Power Zone by Lap (Stacked)"
            );

            expect(powerCalls).toHaveLength(1);

            const [
                canvas,
                data,
                options,
            ] = powerCalls[0];

            expect(canvas).toBeInstanceOf(window.HTMLCanvasElement);
            expect(canvas.id).toBe("chartjs-canvas-lap-power-zones");
            expect(data).toHaveLength(1);
            expect(options).toStrictEqual({
                title: "Power Zone by Lap (Stacked)",
            });
            expect(getCanvasIds()).toContain("chartjs-canvas-lap-power-zones");
        });

        it("should call renderSingleHRZoneBar for HR individual chart", () => {
            expect.assertions(6);

            renderLapZoneCharts(container);

            expect(renderSingleHRZoneBarMock).toHaveBeenCalledOnce();

            const [
                canvas,
                data,
                options,
            ] = renderSingleHRZoneBarMock.mock.calls[0];

            expect(canvas).toBeInstanceOf(window.HTMLCanvasElement);
            expect(canvas.id).toBe("chartjs-canvas-single-lap-hr");
            expect(data).toHaveLength(2);
            expect(options).toStrictEqual({
                title: "HR Zone by Lap (Individual)",
            });
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-hr");
        });

        it("should call renderSinglePowerZoneBar for Power individual chart", () => {
            expect.assertions(6);

            renderLapZoneCharts(container);

            expect(renderSinglePowerZoneBarMock).toHaveBeenCalledOnce();

            const [
                canvas,
                data,
                options,
            ] = renderSinglePowerZoneBarMock.mock.calls[0];

            expect(canvas).toBeInstanceOf(window.HTMLCanvasElement);
            expect(canvas.id).toBe("chartjs-canvas-single-lap-power");
            expect(data).toHaveLength(2);
            expect(options).toStrictEqual({
                title: "Power Zone by Lap (Individual)",
            });
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-power");
        });
    });

    describe("chart instance management", () => {
        beforeEach(() => {
            getThemeConfigMock.mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            renderLapZoneChartMock.mockReturnValue({ id: "mock-chart" });
            renderSingleHRZoneBarMock.mockReturnValue({
                id: "mock-hr-bar",
            });

            lapZoneActiveFitData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];
        });

        it("should register chart instances when the registry starts empty", () => {
            expect.assertions(2);

            clearChartInstanceRegistryForTests();
            renderLapZoneCharts(container);
            expect(getChartInstances()).toBeInstanceOf(Array);
            expect(getChartInstances()).toEqual([
                { id: "mock-chart" },
                { id: "mock-hr-bar" },
            ]);
        });

        it("should add chart instances to global array", () => {
            expect.assertions(1);

            clearChartInstanceRegistryForTests();
            renderLapZoneCharts(container);
            expect(getChartInstances()).toEqual([
                { id: "mock-chart" },
                { id: "mock-hr-bar" },
            ]);
        });

        it("should handle null chart returns", () => {
            expect.assertions(3);

            renderLapZoneChartMock.mockReturnValue(null);
            renderSingleHRZoneBarMock.mockReturnValue(null);

            clearChartInstanceRegistryForTests();
            renderLapZoneCharts(container);
            // Should not add null values to the array
            expect(getChartInstances()).toStrictEqual([]);
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
            expect(mockConsoleError).not.toHaveBeenCalled();
        });
    });

    describe("error handling", () => {
        it("should catch and log errors", () => {
            expect.assertions(2);

            // Force an error by making getThemeConfig throw
            const themeConfigError = new Error("Theme config error");
            getThemeConfigMock.mockImplementation(() => {
                throw themeConfigError;
            });

            lapZoneActiveFitData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleError).toHaveBeenCalledWith(
                "[ChartJS] Error rendering lap zone charts:",
                themeConfigError
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("should show notification on error", () => {
            expect.assertions(2);

            getThemeConfigMock.mockImplementation(() => {
                throw new Error("Test error");
            });

            lapZoneActiveFitData.timeInZoneMesgs = [
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
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });

        it("uses the imported notification helper without the global bridge", () => {
            expect.assertions(3);

            const testError = new Error("Test error");
            getThemeConfigMock.mockImplementation(() => {
                throw testError;
            });

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect(mockConsoleError).toHaveBeenCalledWith(
                "[ChartJS] Error rendering lap zone charts:",
                testError
            );
            expect({
                canvasIds: getCanvasIds(),
                chartInstances: getChartInstances(),
            }).toStrictEqual({
                canvasIds: [],
                chartInstances: [],
            });
        });
    });

    describe("visibility settings", () => {
        beforeEach(() => {
            getThemeConfigMock.mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect.assertions(1);

            renderLapZoneCharts(container);
            // Should create all 4 canvases by default
            expect(container.querySelectorAll("canvas")).toHaveLength(4);
        });

        it("should respect custom visibility settings", () => {
            expect.assertions(3);

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
            expect.assertions(2);

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
            expect.assertions(1);

            lapZoneActiveFitData.timeInZoneMesgs = [
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

    describe("theme integration", () => {
        beforeEach(() => {
            lapZoneActiveFitData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];
        });

        it("should call getThemeConfig", () => {
            expect.assertions(2);

            getThemeConfigMock.mockReturnValue({ name: "test-theme" });
            renderLapZoneCharts(container);
            expect(getThemeConfig).toHaveBeenCalledWith();
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should log theme config name when available", () => {
            expect.assertions(2);

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
            expect.assertions(2);

            getThemeConfigMock.mockReturnValue(null);
            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should handle invalid theme config gracefully", () => {
            expect.assertions(2);

            getThemeConfigMock.mockReturnValue("invalid");
            renderLapZoneCharts(container);
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect(getCanvasIds()).toEqual([
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-single-lap-hr",
            ]);
        });

        it("should apply theme colors to canvas styling", () => {
            expect.assertions(3);

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

    describe("session zone data handling", () => {
        beforeEach(() => {
            getThemeConfigMock.mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });
        });

        it("should use stored heart-rate zones for HR individual chart when available", () => {
            expect.assertions(2);

            const heartRateZones = [
                { label: "Zone 1", value: 100, color: "red" },
                { label: "Zone 2", value: 200, color: "blue" },
            ];
            setZoneDataByType("hr", heartRateZones);

            lapZoneActiveFitData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInHrZone: "[0,10,20]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Using session HR zone data:",
                heartRateZones
            );
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-hr");
        });

        it("should convert time property to value for HR zones", () => {
            expect.assertions(3);

            setZoneDataByType("hr", [
                { label: "Zone 1", time: 100, color: "red" },
                { label: "Zone 2", time: 200, color: "blue" },
            ]);

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            const [
                canvas,
                zones,
                options,
            ] = getLatestChartRenderCall(renderSingleHRZoneBarMock);
            expect({ canvasId: canvas.id, options, zones }).toStrictEqual({
                canvasId: "chartjs-canvas-single-lap-hr",
                options: { title: "HR Zone by Lap (Individual)" },
                zones: expectedHrZones,
            });
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-hr");
        });

        it("should aggregate HR zone data from laps when session data not available", () => {
            expect.assertions(4);

            setZoneDataByType("hr", []);
            getZoneColorMock.mockImplementation(
                (type: string, index: number) => `${type}-zone-${index}`
            );

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            const [
                canvas,
                zones,
                options,
            ] = getLatestChartRenderCall(renderSingleHRZoneBarMock);
            expect({ canvasId: canvas.id, options, zones }).toStrictEqual({
                canvasId: "chartjs-canvas-single-lap-hr",
                options: { title: "HR Zone by Lap (Individual)" },
                zones: [
                    { color: "hr-zone-0", label: "HR Zone 1", value: 15 },
                    { color: "hr-zone-1", label: "HR Zone 2", value: 15 },
                ],
            });
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-hr");
        });

        it("should use stored power zones for Power individual chart when available", () => {
            expect.assertions(2);

            const powerZones = [
                { label: "Zone 1", value: 50, color: "green" },
                { label: "Zone 2", value: 150, color: "yellow" },
            ];
            setZoneDataByType("power", powerZones);

            lapZoneActiveFitData.timeInZoneMesgs = [
                {
                    referenceMesg: "lap",
                    timeInPowerZone: "[0,5,15]",
                    referenceIndex: 1,
                },
            ];

            renderLapZoneCharts(container);
            expect(mockConsoleLog).toHaveBeenCalledWith(
                "[ChartJS] Using session Power zone data:",
                powerZones
            );
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-power");
        });

        it("should aggregate Power zone data from laps when session data not available", () => {
            expect.assertions(4);

            setZoneDataByType("power", []);
            getZoneColorMock.mockImplementation(
                (type: string, index: number) => `${type}-zone-${index}`
            );

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            const [
                canvas,
                zones,
                options,
            ] = getLatestChartRenderCall(renderSinglePowerZoneBarMock);
            expect({ canvasId: canvas.id, options, zones }).toStrictEqual({
                canvasId: "chartjs-canvas-single-lap-power",
                options: { title: "Power Zone by Lap (Individual)" },
                zones: [
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
            });
            expect(getCanvasIds()).toContain("chartjs-canvas-single-lap-power");
            expect(mockConsoleError).not.toHaveBeenCalled();
        });
    });

    describe("integration tests", () => {
        it("should render complete lap zone charts with all data types", () => {
            expect.assertions(7);

            getThemeConfigMock.mockReturnValue({
                name: "integration-theme",
                colors: {
                    bgPrimary: "#f0f0f0",
                    shadow: "0 2px 4px rgba(0,0,0,0.1)",
                },
            });

            setZoneDataByType("hr", [
                { label: "HR Zone 1", value: 120, color: "#ff0000" },
                { label: "HR Zone 2", value: 240, color: "#00ff00" },
            ]);

            setZoneDataByType("power", [
                { label: "Power Zone 1", value: 60, color: "#0000ff" },
                { label: "Power Zone 2", value: 180, color: "#ffff00" },
            ]);

            lapZoneActiveFitData.timeInZoneMesgs = [
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
            expect(renderSingleHRZoneBar).toHaveBeenCalledOnce();
            expect(renderSinglePowerZoneBar).toHaveBeenCalledOnce();

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
            expect.assertions(2);

            getThemeConfigMock.mockReturnValue({
                colors: { bgPrimary: "#ffffff", shadow: "none" },
            });

            lapZoneActiveFitData.timeInZoneMesgs = [
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
