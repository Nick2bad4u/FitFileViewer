import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StateManagerModule =
    typeof import("../../../../../electron-app/utils/state/core/stateManager.js");
type ShowNotificationModule =
    typeof import("../../../../../electron-app/utils/ui/notifications/showNotification.js");
type FitFileStateModule =
    typeof import("../../../../../electron-app/utils/state/domain/fitFileState.js");

// Use hoisted container to avoid mock hoisting issues (don't self-reference during factory eval)
const h = vi.hoisted(() => {
    return {
        mockGetState: vi.fn<StateManagerModule["getState"]>(),
        mockSetState: vi.fn<StateManagerModule["setState"]>(),
        mockUpdateState: vi.fn<StateManagerModule["updateState"]>(),
        mockShowNotification:
            vi.fn<ShowNotificationModule["showNotification"]>(),
        mockFitManager: {
            startFileLoading:
                vi.fn<
                    NonNullable<
                        FitFileStateModule["fitFileStateManager"]["startFileLoading"]
                    >
                >(),
            handleFileLoaded:
                vi.fn<
                    NonNullable<
                        FitFileStateModule["fitFileStateManager"]["handleFileLoaded"]
                    >
                >(),
            isLoading: vi.fn<
                NonNullable<
                    FitFileStateModule["fitFileStateManager"]["isLoading"]
                >
            >(() => false),
            clearFileState:
                vi.fn<
                    NonNullable<
                        FitFileStateModule["fitFileStateManager"]["clearFileState"]
                    >
                >(),
        },
        mockGetRawData: vi.fn<() => unknown>(),
    };
});

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: h.mockGetState,
        setState: h.mockSetState,
        updateState: h.mockUpdateState,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: h.mockShowNotification,
    })
);

function getMockRawMessageArray(key: string): unknown[] {
    const rawData = h.mockGetRawData();
    if (rawData === null || typeof rawData !== "object") {
        return [];
    }

    const value = (rawData as Record<string, unknown>)[key];
    return Array.isArray(value) ? value : [];
}

vi.mock(
    import("../../../../../electron-app/utils/state/domain/fitFileState.js"),
    () => ({
        FitFileSelectors: {
            getEventMessages: () => getMockRawMessageArray("eventMesgs"),
            getLapMessages: () => getMockRawMessageArray("lapMesgs"),
            getRawData: h.mockGetRawData,
            getRecordMessages: () => getMockRawMessageArray("recordMesgs"),
            getSessionMessages: () => getMockRawMessageArray("sessionMesgs"),
            getTimeInZoneMessages: () =>
                getMockRawMessageArray("timeInZoneMesgs"),
        },
        fitFileStateManager: h.mockFitManager,
    })
);

// Import after mocks
import {
    AppActions,
    AppSelectors,
} from "../../../../../electron-app/utils/app/lifecycle/appActions.js";

beforeEach(() => {
    vi.setConfig({ expect: { requireAssertions: false } });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    h.mockGetState.mockReset();
    h.mockSetState.mockReset();
    h.mockUpdateState.mockReset();
    h.mockShowNotification.mockReset();
    h.mockFitManager.startFileLoading.mockReset();
    h.mockFitManager.handleFileLoaded.mockReset();
    h.mockFitManager.isLoading.mockReset();
    h.mockFitManager.isLoading.mockReturnValue(false);
    h.mockFitManager.clearFileState.mockReset();
    h.mockGetRawData.mockReset();
});

afterEach(() => {
    vi.useRealTimers();
    vi.resetConfig();
});

describe("appActions", () => {
    it("clearData should reset core slices and notify", () => {
        expect.assertions(9);
        expect(Date.now()).toBe(1_704_067_200_000);

        expect(AppActions.clearData()).toBeUndefined();

        // Expect multiple setState calls for clearing data
        const keys = [
            "fitFile.rawData",
            "fitFile.currentFile",
            "charts.isRendered",
            "map.isRendered",
            "tables.isRendered",
        ];
        for (const k of keys) {
            expect(h.mockSetState).toHaveBeenCalledWith(
                k,
                k.includes("isRendered") ? false : null,
                expect.any(Object)
            );
        }
        expect(h.mockFitManager.clearFileState).toHaveBeenCalledOnce();
        expect(h.mockShowNotification).toHaveBeenCalledWith(
            "Data cleared",
            "info"
        );
    });

    it("loadFile delegates to fitFileStateManager when available", async () => {
        expect.assertions(7);
        expect(Date.now()).toBe(1_704_067_200_000);

        await expect(
            AppActions.loadFile({ foo: "bar" }, "path/fit.fit")
        ).resolves.toBeUndefined();

        expect(h.mockFitManager.startFileLoading).toHaveBeenCalledWith(
            "path/fit.fit"
        );
        expect(h.mockFitManager.isLoading).toHaveBeenCalledWith();
        expect(h.mockFitManager.handleFileLoaded).toHaveBeenCalledWith(
            { foo: "bar" },
            expect.objectContaining({
                filePath: "path/fit.fit",
                source: "AppActions.loadFile",
            })
        );
        expect(h.mockShowNotification).not.toHaveBeenCalled();
        expect(h.mockSetState).not.toHaveBeenCalled();
    });

    it("loadFile fails clearly when the domain manager is unavailable", async () => {
        expect.assertions(5);
        expect(Date.now()).toBe(1_704_067_200_000);

        const originalHandle = h.mockFitManager.handleFileLoaded;
        const originalStart = h.mockFitManager.startFileLoading;
        const originalIsLoading = h.mockFitManager.isLoading;
        const mutableManager = h.mockFitManager as {
            handleFileLoaded?:
                | typeof h.mockFitManager.handleFileLoaded
                | undefined;
            isLoading?: typeof h.mockFitManager.isLoading | undefined;
            startFileLoading?:
                | typeof h.mockFitManager.startFileLoading
                | undefined;
        };

        mutableManager.handleFileLoaded = undefined;
        mutableManager.startFileLoading = undefined;
        mutableManager.isLoading = undefined;

        await expect(
            AppActions.loadFile({ foo: "bar" }, "path/fit.fit")
        ).rejects.toThrow("FIT file state manager is unavailable");

        expect(h.mockSetState.mock.calls.map(([path]) => path)).toStrictEqual([
            "isLoading",
        ]);
        expect(h.mockSetState).toHaveBeenCalledWith(
            "isLoading",
            false,
            expect.any(Object)
        );
        expect(h.mockShowNotification).toHaveBeenCalledWith(
            "Failed to load file",
            "error"
        );

        mutableManager.handleFileLoaded = originalHandle;
        mutableManager.startFileLoading = originalStart;
        mutableManager.isLoading = originalIsLoading;
    });

    it("loadFile surfaces delegated errors and clears loading", async () => {
        expect.assertions(4);
        expect(Date.now()).toBe(1_704_067_200_000);

        h.mockFitManager.handleFileLoaded.mockImplementation(() => {
            throw new Error("boom");
        });

        await expect(AppActions.loadFile({} as any, "x")).rejects.toThrow(
            "boom"
        );
        expect(h.mockSetState).toHaveBeenCalledWith(
            "isLoading",
            false,
            expect.any(Object)
        );
        expect(h.mockShowNotification).toHaveBeenCalledWith(
            "Failed to load file",
            "error"
        );
    });

    it("renderChart should update charts slice and performance", () => {
        expect.assertions(4);
        expect(Date.now()).toBe(1_704_067_200_000);

        expect(
            AppActions.renderChart({ datasets: [] }, {
                responsive: true,
            } as any)
        ).toBeUndefined();
        expect(h.mockUpdateState).toHaveBeenCalledWith(
            "charts",
            expect.objectContaining({
                isRendered: true,
                chartData: { datasets: [] },
                chartOptions: { responsive: true },
            }),
            expect.any(Object)
        );
        expect(h.mockUpdateState).toHaveBeenCalledWith(
            "performance.renderTimes",
            expect.objectContaining({ chart: expect.any(Number) }),
            expect.any(Object)
        );
    });

    it("renderMap should update map slice and performance", () => {
        expect.assertions(4);

        expect(Date.now()).toBe(1_704_067_200_000);

        expect(AppActions.renderMap([10, 20], 15)).toBeUndefined();
        expect(h.mockUpdateState).toHaveBeenCalledWith(
            "map",
            expect.objectContaining({
                isRendered: true,
                center: [10, 20],
                zoom: 15,
            }),
            expect.any(Object)
        );
        expect(h.mockUpdateState).toHaveBeenCalledWith(
            "performance.renderTimes",
            expect.objectContaining({ map: expect.any(Number) }),
            expect.any(Object)
        );
    });

    it("renderTable should update tables slice and performance", () => {
        expect.assertions(4);
        expect(Date.now()).toBe(1_704_067_200_000);

        expect(
            AppActions.renderTable({ columns: ["a"] } as any)
        ).toBeUndefined();
        expect(h.mockUpdateState).toHaveBeenCalledWith(
            "tables",
            expect.objectContaining({ isRendered: true, columns: ["a"] }),
            expect.any(Object)
        );
        expect(h.mockUpdateState).toHaveBeenCalledWith(
            "performance.renderTimes",
            expect.objectContaining({ table: expect.any(Number) }),
            expect.any(Object)
        );
    });

    it("selectLap, setFileOpening, setInitialized, updateWindowState call set/update state", () => {
        expect.assertions(9);
        expect(Date.now()).toBe(1_704_067_200_000);

        expect(AppActions.selectLap(3)).toBeUndefined();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "map.selectedLap",
            3,
            expect.any(Object)
        );

        expect(AppActions.setFileOpening(true)).toBeUndefined();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "app.isOpeningFile",
            true,
            expect.any(Object)
        );

        expect(AppActions.setInitialized(true)).toBeUndefined();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "app.initialized",
            true,
            expect.any(Object)
        );

        expect(AppActions.updateWindowState({ w: 1 } as any)).toBeUndefined();
        expect(h.mockUpdateState).toHaveBeenCalledWith(
            "ui.windowState",
            { w: 1 },
            expect.any(Object)
        );
    });

    it("switchTab validates known renderer tab names and sets state when valid", () => {
        expect.assertions(12);
        expect(Date.now()).toBe(1_704_067_200_000);

        for (const tabName of [
            "altfit",
            "browser",
            "chart",
            "chartjs",
            "data",
            "map",
            "summary",
            "zwift",
        ]) {
            expect(AppActions.switchTab(tabName)).toBeUndefined();
        }
        expect(
            h.mockSetState.mock.calls.map(([path, tabName]) => [path, tabName])
        ).toStrictEqual([
            ["ui.activeTab", "altfit"],
            ["ui.activeTab", "browser"],
            ["ui.activeTab", "chart"],
            ["ui.activeTab", "chartjs"],
            ["ui.activeTab", "data"],
            ["ui.activeTab", "map"],
            ["ui.activeTab", "summary"],
            ["ui.activeTab", "zwift"],
        ]);
        h.mockSetState.mockClear();
        expect(AppActions.switchTab("not-a-tab")).toBeUndefined();
        expect(h.mockSetState).not.toHaveBeenCalled();
    });

    it("switchTheme validates values and sets state when valid", () => {
        expect.assertions(5);
        expect(Date.now()).toBe(1_704_067_200_000);

        expect(AppActions.switchTheme("dark")).toBeUndefined();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "ui.theme",
            "dark",
            expect.any(Object)
        );
        h.mockSetState.mockClear();
        expect(AppActions.switchTheme("purple")).toBeUndefined();
        expect(h.mockSetState).not.toHaveBeenCalled();
    });

    it("toggleChartControls and toggleMeasurementMode invert current value", () => {
        expect.assertions(5);
        expect(Date.now()).toBe(1_704_067_200_000);

        h.mockGetState.mockImplementation((path: string) => {
            if (path === "charts.controlsVisible") return false;
            if (path === "map.measurementMode") return true;
        });
        expect(AppActions.toggleChartControls()).toBeUndefined();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "charts.controlsVisible",
            true,
            expect.any(Object)
        );
        expect(AppActions.toggleMeasurementMode()).toBeUndefined();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "map.measurementMode",
            false,
            expect.any(Object)
        );
    });
});

describe("appSelectors", () => {
    it("provides defaults for missing state", () => {
        expect.assertions(3);
        expect(Date.now()).toBe(1_704_067_200_000);

        h.mockGetState.mockReturnValueOnce(undefined); // activeTab
        h.mockGetState.mockReturnValueOnce(undefined); // charts.isRendered
        h.mockGetState.mockReturnValueOnce(undefined); // tables.isRendered
        h.mockGetState.mockReturnValueOnce(undefined); // ui.theme
        h.mockGetState.mockReturnValueOnce(undefined); // charts
        h.mockGetState.mockReturnValueOnce(null); // currentFile
        h.mockGetState.mockReturnValueOnce(undefined); // map
        h.mockGetState.mockReturnValueOnce(undefined); // performance
        h.mockGetRawData.mockReturnValueOnce(null);
        h.mockGetState.mockReturnValueOnce(undefined); // isLoading
        h.mockGetState.mockReturnValueOnce(undefined); // map.isRendered
        expect({
            activeTab: AppSelectors.activeTab(),
            areChartsRendered: AppSelectors.areChartsRendered(),
            areTablesRendered: AppSelectors.areTablesRendered(),
            currentTheme: AppSelectors.currentTheme(),
            chartConfig: AppSelectors.getChartConfig(),
            currentFile: AppSelectors.getCurrentFile(),
            mapConfig: AppSelectors.getMapConfig(),
            performanceMetrics: AppSelectors.getPerformanceMetrics(),
            hasData: AppSelectors.hasData(),
            isLoading: AppSelectors.isLoading(),
            isMapRendered: AppSelectors.isMapRendered(),
        }).toStrictEqual({
            activeTab: "summary",
            areChartsRendered: false,
            areTablesRendered: false,
            currentTheme: "system",
            chartConfig: {},
            currentFile: null,
            mapConfig: {},
            performanceMetrics: {},
            hasData: false,
            isLoading: false,
            isMapRendered: false,
        });
        expect(h.mockGetState.mock.calls.map(([path]) => path)).toStrictEqual([
            "ui.activeTab",
            "charts.isRendered",
            "tables.isRendered",
            "ui.theme",
            "charts",
            "fitFile.currentFile",
            "map",
            "performance",
            "isLoading",
            "map.isRendered",
        ]);
    });

    it("isTabActive compares to activeTab", () => {
        expect.assertions(3);

        expect(Date.now()).toBe(1_704_067_200_000);

        h.mockGetState.mockImplementation((path: string) =>
            path === "ui.activeTab" ? "map" : undefined
        );
        expect({
            chart: AppSelectors.isTabActive("chart"),
            map: AppSelectors.isTabActive("map"),
        }).toStrictEqual({
            chart: false,
            map: true,
        });
        expect(h.mockGetState.mock.calls.map(([path]) => path)).toStrictEqual([
            "ui.activeTab",
            "ui.activeTab",
        ]);
    });
});
