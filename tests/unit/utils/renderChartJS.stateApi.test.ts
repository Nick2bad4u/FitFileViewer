/**
 * Tests exported chart render state helpers and compatibility APIs from
 * renderChartJS.js.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

type ChartStateValue = unknown;
type ChartStateSubscriber = (value?: unknown, previousValue?: unknown) => void;
type ChartStateUnsubscribe = () => void;

// Create persistent storage for mock data
const globalMockState = {
    data: new Map<string, ChartStateValue>(),
    subscriptions: new Map<string, ChartStateSubscriber[]>(),
};

function getMockStateValue(path: string): ChartStateValue {
    if (globalMockState.data.has(path)) {
        return globalMockState.data.get(path);
    }

    if (path === "charts.isRendered") return false;
    if (path === "charts.isRendering") return false;
    if (path === "charts.controlsVisible") return true;
    if (path === "charts.selectedChart") return "elevation";
    if (path === "charts.renderTime") return null;
    if (path === "charts.renderedCount") return 0;
    if (path === "charts.chartData") return null;
    if (path === "charts.chartOptions") return null;
    if (path === "fitFile.rawData") return null;
    if (path === "performance.chartHistory") return [];
    if (path === "charts.visibleFields") return [];
    if (path && path.startsWith("performance.tracking.")) {
        return {
            operation: "test",
            startTime: Date.now(),
            status: "running",
        };
    }

    return null;
}

function setMockStateValue(path: string, value: ChartStateValue): void {
    globalMockState.data.set(path, value);
}

function updateMockStateValue(path: string, value: ChartStateValue): void {
    const existing = globalMockState.data.get(path);
    const nextValue =
        existing &&
        typeof existing === "object" &&
        !Array.isArray(existing) &&
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
            ? { ...existing, ...value }
            : value;

    globalMockState.data.set(path, nextValue);

    if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [key, entryValue] of Object.entries(value)) {
            globalMockState.data.set(`${path}.${key}`, entryValue);
        }
    }
}

// Define a simple mock version of stateManager instead of using complex globalMockState reference
vi.mock(
    import("../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getStateHistory: vi.fn<() => unknown[]>(() => []),
        getState: vi.fn<(path: string) => ChartStateValue>((path: string) =>
            getMockStateValue(path)
        ),
        setState: vi.fn<(path: string, value: ChartStateValue) => void>(
            (path: string, value: ChartStateValue) =>
                setMockStateValue(path, value)
        ),
        updateState: vi.fn<(path: string, value: ChartStateValue) => void>(
            (path: string, value: ChartStateValue) =>
                updateMockStateValue(path, value)
        ),
        subscribe: vi.fn<
            (
                path: string,
                callback: ChartStateSubscriber
            ) => ChartStateUnsubscribe
        >(() => () => {}),
    })
);

// Mock all the complex dependencies to isolate renderChartJS functions
vi.mock(
    import("../../../electron-app/utils/app/lifecycle/appActions.js"),
    () => ({
        AppActions: {
            notifyChartRenderComplete: vi.fn<(count: number) => void>(),
            setInitialized: vi.fn<(initialized: boolean) => void>(),
            setFileOpening: vi.fn<(isOpening: boolean) => void>(),
            loadFile: vi.fn<(...args: unknown[]) => void>(),
            switchTab: vi.fn<(tab: string) => void>(),
            clearData: vi.fn<(...args: unknown[]) => void>(),
        },
    })
);

vi.mock(
    import("../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: vi.fn<(...args: unknown[]) => void>(),
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/theming/chartThemeUtils.js"),
    () => ({
        detectCurrentTheme: vi.fn<() => string>(() => "light"),
    })
);

// Import the functions we want to test
import {
    hexToRgba,
    updatePreviousChartState,
    resetChartNotificationState,
    refreshChartsIfNeeded,
    getChartStatus,
    previousChartState,
    chartState,
    chartActions,
} from "../../../electron-app/utils/charts/core/renderChartJS.js";

function getRenderingStatusSnapshot() {
    const { isRendered, isRendering, performance, renderedCount } =
        getChartStatus();

    return {
        isRendered,
        isRendering,
        performance,
        renderedCount,
    };
}

describe("renderChartJS.js state API", () => {
    beforeEach(() => {
        // Reset all mocks and state before each test
        vi.clearAllMocks();
        globalMockState.data.clear();
        globalMockState.subscriptions.clear();

        // Reset the previousChartState object
        previousChartState.chartCount = 0;
        previousChartState.fieldsRendered = [];
        previousChartState.lastRenderTimestamp = 0;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("hexToRgba function - Color Conversion Utility", () => {
        it("should convert hex color to rgba format", () => {
            expect.assertions(2);

            const result = hexToRgba("#ff0000", 0.5);
            expect(result).toBe("rgba(255, 0, 0, 0.5)");
            expect(result).not.toBe("#ff0000");
        });

        it("should handle different hex color values", () => {
            expect.assertions(3);

            expect(hexToRgba("#000000", 1.0)).toBe("rgba(0, 0, 0, 1)");
            expect(hexToRgba("#ffffff", 0.0)).toBe("rgba(255, 255, 255, 0)");
            expect(hexToRgba("#123456", 0.75)).toBe("rgba(18, 52, 86, 0.75)");
        });

        it("should handle edge case alpha values", () => {
            expect.assertions(2);

            expect(hexToRgba("#ff0000", 0)).toBe("rgba(255, 0, 0, 0)");
            expect(hexToRgba("#ff0000", 1)).toBe("rgba(255, 0, 0, 1)");
        });

        it("should parse hex colors correctly regardless of case", () => {
            expect.assertions(2);

            expect(hexToRgba("#ABCDEF", 0.5)).toBe("rgba(171, 205, 239, 0.5)");
            expect(hexToRgba("#abcdef", 0.5)).toBe("rgba(171, 205, 239, 0.5)");
        });
    });

    describe("updatePreviousChartState function - State Tracking", () => {
        it("should update previousChartState object correctly", () => {
            expect.assertions(4);

            const chartCount = 5;
            const visibleFields = 3;
            const timestamp = Date.now();

            updatePreviousChartState(chartCount, visibleFields, timestamp);

            expect(previousChartState.chartCount).toBe(chartCount);
            expect(previousChartState.fieldsRendered).toHaveLength(
                visibleFields
            );
            expect(previousChartState.fieldsRendered).not.toContain(false);
            expect(previousChartState.lastRenderTimestamp).toBe(timestamp);
        });

        it("should call updateState with correct parameters", async () => {
            expect.assertions(4);

            const { updateState } =
                await import("../../../electron-app/utils/state/core/stateManager.js");

            const chartCount = 10;
            const visibleFields = 7;
            const timestamp = 1234567890;

            updatePreviousChartState(chartCount, visibleFields, timestamp);

            expect(previousChartState.chartCount).toBe(chartCount);
            expect(previousChartState.fieldsRendered).toHaveLength(
                visibleFields
            );
            expect(previousChartState.lastRenderTimestamp).toBe(timestamp);
            expect(updateState).toHaveBeenCalledWith(
                "charts.previousState",
                {
                    chartCount: 10,
                    visibleFields: 7,
                    timestamp: 1234567890,
                },
                { silent: false, source: "updatePreviousChartState" }
            );
        });

        it("should handle zero values correctly", () => {
            expect.assertions(1);

            updatePreviousChartState(0, 0, 0);

            expect(previousChartState).toStrictEqual({
                chartCount: 0,
                fieldsRendered: [],
                lastRenderTimestamp: 0,
            });
        });

        it("should handle large values correctly", () => {
            expect.assertions(3);

            const largeCount = 999999;
            const largeFields = 100;
            const largeTimestamp = Date.now() + 999999999;

            updatePreviousChartState(largeCount, largeFields, largeTimestamp);

            expect(previousChartState.chartCount).toBe(largeCount);
            expect(previousChartState.fieldsRendered).toHaveLength(largeFields);
            expect(previousChartState.lastRenderTimestamp).toBe(largeTimestamp);
        });
    });

    describe("resetChartNotificationState function - State Reset", () => {
        it("should reset all chart state values to defaults", () => {
            expect.assertions(2);

            // First set some values
            previousChartState.chartCount = 10;
            previousChartState.fieldsRendered = [
                true,
                true,
                true,
            ];
            previousChartState.lastRenderTimestamp = Date.now();

            // Reset the state
            resetChartNotificationState();

            expect(previousChartState).toStrictEqual({
                chartCount: 0,
                fieldsRendered: [],
                lastRenderTimestamp: 0,
            });
            expect(previousChartState.fieldsRendered).not.toContain(true);
        });

        it("should work correctly when called multiple times", () => {
            expect.assertions(1);

            resetChartNotificationState();
            resetChartNotificationState();
            resetChartNotificationState();

            expect(previousChartState).toStrictEqual({
                chartCount: 0,
                fieldsRendered: [],
                lastRenderTimestamp: 0,
            });
        });

        it("should work when state is already reset", () => {
            expect.assertions(1);

            resetChartNotificationState();

            expect(previousChartState).toStrictEqual({
                chartCount: 0,
                fieldsRendered: [],
                lastRenderTimestamp: 0,
            });
        });
    });

    describe("refreshChartsIfNeeded function - Conditional Refresh Logic", () => {
        it("should return false when no valid data exists", () => {
            expect.assertions(2);

            // Mock state to have no data
            globalMockState.data.set("fitFile.rawData", null);
            globalMockState.data.set("charts.isRendering", false);

            const mockRequestRerender = vi.fn<() => void>();
            chartActions.requestRerender = mockRequestRerender;

            const result = refreshChartsIfNeeded();

            expect(result).toStrictEqual(false);
            expect(mockRequestRerender).not.toHaveBeenCalled();
        });

        it("should return false when currently rendering", () => {
            expect.assertions(2);

            // Mock state to have data but currently rendering
            globalMockState.data.set("fitFile.rawData", {
                recordMesgs: [
                    1,
                    2,
                    3,
                ],
            });
            globalMockState.data.set("charts.isRendering", true);

            const mockRequestRerender = vi.fn<() => void>();
            chartActions.requestRerender = mockRequestRerender;

            const result = refreshChartsIfNeeded();

            expect(result).toStrictEqual(false);
            expect(mockRequestRerender).not.toHaveBeenCalled();
        });

        it("should handle empty recordMesgs array", () => {
            expect.assertions(1);

            globalMockState.data.set("fitFile.rawData", {
                recordMesgs: [], // Empty array
            });
            globalMockState.data.set("charts.isRendering", false);

            const result = refreshChartsIfNeeded();

            expect(result).toStrictEqual(false);
        });
    });

    describe("getChartStatus function - Status Information Retrieval", () => {
        it("should return chart status object", () => {
            expect.assertions(1);

            globalMockState.data.set("charts.isRendered", true);
            globalMockState.data.set("charts.isRendering", false);
            globalMockState.data.set("charts.controlsVisible", true);
            globalMockState.data.set("charts.selectedChart", "power");
            globalMockState.data.set("charts.renderedCount", 8);
            globalMockState.data.set("charts.lastRenderTime", 1234567890);
            globalMockState.data.set("performance.renderTimes.chart", 150);
            globalMockState.data.set("fitFile.rawData", { recordMesgs: [] });

            const status = getChartStatus();

            expect(status).toEqual({
                isRendered: true,
                isRendering: false,
                hasData: false,
                controlsVisible: true,
                selectedChart: "power",
                renderedCount: 8,
                lastRenderTime: 1234567890,
                performance: 150,
                renderableFields: [],
                chartOptions: null,
            });
        });

        it("should return default values when state is empty", () => {
            expect.assertions(1);

            // Clear all state
            globalMockState.data.clear();

            const status = getChartStatus();

            expect(status).toEqual({
                isRendered: false,
                isRendering: false,
                hasData: null,
                controlsVisible: true, // Default to true
                selectedChart: "elevation", // Default value
                renderedCount: 0,
                lastRenderTime: null,
                performance: null,
                renderableFields: [],
                chartOptions: null,
            });
        });

        it("should correctly detect hasData with various data states", () => {
            expect.assertions(2);

            const emptyStatus = getChartStatus();
            expect(emptyStatus.hasData).not.toBe(true);

            globalMockState.data.set("fitFile.rawData", { recordMesgs: [{}] });
            const populatedStatus = getChartStatus();

            expect({
                empty: {
                    hasData: emptyStatus.hasData,
                    isRendered: emptyStatus.isRendered,
                    renderedCount: emptyStatus.renderedCount,
                    selectedChart: emptyStatus.selectedChart,
                },
                populated: {
                    hasData: populatedStatus.hasData,
                    isRendered: populatedStatus.isRendered,
                    renderedCount: populatedStatus.renderedCount,
                    selectedChart: populatedStatus.selectedChart,
                },
            }).toStrictEqual({
                empty: {
                    hasData: null,
                    isRendered: false,
                    renderedCount: 0,
                    selectedChart: "elevation",
                },
                populated: {
                    hasData: true,
                    isRendered: false,
                    renderedCount: 0,
                    selectedChart: "elevation",
                },
            });
        });
    });

    describe("chartState object - State Getters", () => {
        it("should correctly get isRendered state", () => {
            expect.assertions(1);

            // Our mock always returns false for isRendered
            expect(chartState.isRendered).toStrictEqual(false);
        });

        it("should correctly get isRendering state", () => {
            expect.assertions(1);

            // Our mock always returns false for isRendering
            expect(chartState.isRendering).toStrictEqual(false);
        });

        it("should correctly get controlsVisible with default true", () => {
            expect.assertions(1);

            // Our mock always returns true for controlsVisible
            expect(chartState.controlsVisible).toStrictEqual(true);
        });

        it("should correctly get selectedChart with default", () => {
            expect.assertions(2);

            // Our mock always returns 'elevation' for selectedChart
            expect(chartState.selectedChart).toBe("elevation");
            globalMockState.data.set("charts.selectedChart", undefined);
            expect(chartState.selectedChart).not.toBe("power");
        });
    });

    it("should correctly detect hasValidData", () => {
        expect.assertions(1);

        // The mock defaults active raw FIT data to null, so hasValidData is null.
        expect(chartState.hasValidData).toBeNull();
    });
});

describe("chartActions object - State Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalMockState.data.clear();
        globalMockState.subscriptions.clear();
    });

    it("should correctly start rendering process", async () => {
        expect.assertions(2);

        const { setState } =
            await import("../../../electron-app/utils/state/core/stateManager.js");

        chartActions.startRendering();

        expect(getRenderingStatusSnapshot()).toStrictEqual({
            isRendered: false,
            isRendering: true,
            performance: null,
            renderedCount: 0,
        });
        expect(vi.mocked(setState).mock.calls).toStrictEqual([
            [
                "charts.isRendering",
                true,
                {
                    silent: false,
                    source: "chartActions.startRendering",
                },
            ],
            [
                "isLoading",
                true,
                {
                    silent: false,
                    source: "chartActions.startRendering",
                },
            ],
        ]);
    });

    it("should correctly complete rendering process on success", async () => {
        expect.assertions(5);

        const { updateState, setState } =
            await import("../../../electron-app/utils/state/core/stateManager.js");
        const { AppActions } =
            await import("../../../electron-app/utils/app/lifecycle/appActions.js");
        const renderCompletedAt = 1_717_249_600_000;
        vi.spyOn(Date, "now").mockReturnValue(renderCompletedAt);

        chartActions.completeRendering(true, 5, 250);

        expect(getRenderingStatusSnapshot()).toStrictEqual({
            isRendered: true,
            isRendering: false,
            performance: 250,
            renderedCount: 5,
        });
        expect(updateState).toHaveBeenCalledWith(
            "charts",
            {
                isRendered: true,
                isRendering: false,
                lastRenderTime: renderCompletedAt,
                renderedCount: 5,
            },
            { silent: false, source: "chartActions.completeRendering" }
        );

        expect(setState).toHaveBeenCalledWith("isLoading", false, {
            silent: false,
            source: "chartActions.completeRendering",
        });

        expect(updateState).toHaveBeenCalledWith(
            "performance.renderTimes",
            { chart: 250 },
            { silent: false, source: "chartActions.completeRendering" }
        );

        expect(
            (AppActions as any).notifyChartRenderComplete
        ).toHaveBeenCalledWith(5);
    });

    it("should correctly complete rendering process on failure", async () => {
        expect.assertions(4);

        const { updateState, setState } =
            await import("../../../electron-app/utils/state/core/stateManager.js");
        const { AppActions } =
            await import("../../../electron-app/utils/app/lifecycle/appActions.js");

        chartActions.completeRendering(false, 0, 100);

        expect(getRenderingStatusSnapshot()).toStrictEqual({
            isRendered: false,
            isRendering: false,
            performance: null,
            renderedCount: 0,
        });
        expect(updateState).toHaveBeenCalledWith(
            "charts",
            {
                isRendered: false,
                isRendering: false,
            },
            { silent: false, source: "chartActions.completeRendering" }
        );

        expect(setState).toHaveBeenCalledWith("isLoading", false, {
            silent: false,
            source: "chartActions.completeRendering",
        });

        // Should not update performance or notify on failure
        expect(
            (AppActions as any).notifyChartRenderComplete
        ).not.toHaveBeenCalled();
    });
});

describe("integration and error handling", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalMockState.data.clear();
        globalMockState.subscriptions.clear();
    });

    it("should read chart status without throwing when state is undefined", async () => {
        expect.assertions(1);

        expect(getChartStatus()).toEqual({
            chartOptions: null,
            controlsVisible: true,
            hasData: null,
            isRendered: false,
            isRendering: false,
            lastRenderTime: null,
            performance: null,
            renderableFields: [],
            renderedCount: 0,
            selectedChart: "elevation",
        });
    });

    it("should work with undefined state values", () => {
        expect.assertions(5);

        // Default values from our mock
        expect(chartState.isRendered).toStrictEqual(false);
        expect(chartState.isRendering).toStrictEqual(false);
        expect(chartState.controlsVisible).toStrictEqual(true);
        expect(chartState.selectedChart).toBe("elevation");
        expect(chartState.hasValidData).toBeNull();
    });
});
