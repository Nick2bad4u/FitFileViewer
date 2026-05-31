import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StateManagerModule =
    typeof import("../../../../../electron-app/utils/state/core/stateManager.js");
type ShowNotificationModule =
    typeof import("../../../../../electron-app/utils/ui/notifications/showNotification.js");
type FitFileStateModule =
    typeof import("../../../../../electron-app/utils/state/domain/fitFileState.js");
type StateListener = Parameters<StateManagerModule["subscribe"]>[1];

// Use hoisted container to avoid mock hoisting issues (don't self-reference during factory eval)
const h = vi.hoisted(() => {
    const subscribeCallbacks: Record<string, StateListener[]> = {};
    const mockSubscribe = vi.fn<StateManagerModule["subscribe"]>(
        (path: string, cb: StateListener) => {
            (subscribeCallbacks[path] ||= []).push(cb);
            return () => {
                const arr = subscribeCallbacks[path];
                if (!arr) return;
                const idx = arr.indexOf(cb);
                if (idx >= 0) arr.splice(idx, 1);
            };
        }
    );
    return {
        mockGetState: vi.fn<StateManagerModule["getState"]>(),
        mockSetState: vi.fn<StateManagerModule["setState"]>(),
        mockUpdateState: vi.fn<StateManagerModule["updateState"]>(),
        mockSubscribe,
        subscribeCallbacks,
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
    };
});

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: h.mockGetState,
        setState: h.mockSetState,
        updateState: h.mockUpdateState,
        subscribe: h.mockSubscribe,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: h.mockShowNotification,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/fitFileState.js"),
    () => ({
        fitFileStateManager: h.mockFitManager,
    })
);

// Import after mocks
import {
    AppActions,
    AppSelectors,
    StateMiddleware,
    useComputed,
    useState,
} from "../../../../../electron-app/utils/app/lifecycle/appActions.js";

beforeEach(() => {
    vi.setConfig({ expect: { requireAssertions: false } });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    h.mockGetState.mockReset();
    h.mockSetState.mockReset();
    h.mockUpdateState.mockReset();
    h.mockSubscribe.mockReset();
    h.mockShowNotification.mockReset();
    h.mockFitManager.startFileLoading.mockReset();
    h.mockFitManager.handleFileLoaded.mockReset();
    h.mockFitManager.isLoading.mockReset();
    h.mockFitManager.isLoading.mockReturnValue(false);
    h.mockFitManager.clearFileState.mockReset();
    for (const key of Object.keys(h.subscribeCallbacks)) {
        delete h.subscribeCallbacks[key];
    }
});

afterEach(() => {
    vi.useRealTimers();
    vi.resetConfig();
});

describe("appActions", () => {
    it("clearData should reset core slices and notify", () => {
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        expect(() => AppActions.clearData()).not.toThrow();

        // Expect multiple setState calls for clearing data
        const keys = [
            "globalData",
            "currentFile",
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
        expect.hasAssertions();
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

    it("loadFile falls back to legacy flow when domain manager is unavailable", async () => {
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        const originalHandle = h.mockFitManager.handleFileLoaded;
        const originalStart = h.mockFitManager.startFileLoading;
        const originalIsLoading = h.mockFitManager.isLoading;

        // Simulate unavailable manager by clearing capabilities
        // @ts-expect-error test override
        h.mockFitManager.handleFileLoaded = undefined;
        // @ts-expect-error test override
        h.mockFitManager.startFileLoading = undefined;
        // @ts-expect-error test override
        h.mockFitManager.isLoading = undefined;

        await expect(
            AppActions.loadFile({ foo: "bar" }, "path/fit.fit")
        ).resolves.toBeUndefined();

        expect(h.mockSetState).toHaveBeenCalledWith(
            "isLoading",
            true,
            expect.any(Object)
        );
        expect(h.mockSetState).toHaveBeenCalledWith(
            "globalData",
            { foo: "bar" },
            expect.any(Object)
        );
        expect(h.mockSetState).toHaveBeenCalledWith(
            "currentFile",
            "path/fit.fit",
            expect.any(Object)
        );
        expect(h.mockSetState).toHaveBeenCalledWith(
            "charts.isRendered",
            false,
            expect.any(Object)
        );
        expect(h.mockSetState).toHaveBeenCalledWith(
            "map.isRendered",
            false,
            expect.any(Object)
        );
        expect(h.mockSetState).toHaveBeenCalledWith(
            "tables.isRendered",
            false,
            expect.any(Object)
        );
        expect(h.mockSetState).toHaveBeenCalledWith(
            "performance.lastLoadTime",
            expect.any(Number),
            expect.any(Object)
        );
        expect(h.mockSetState).toHaveBeenCalledWith(
            "isLoading",
            false,
            expect.any(Object)
        );
        expect(h.mockShowNotification).toHaveBeenCalledWith(
            "File loaded successfully",
            "success"
        );

        // Restore mocks for subsequent tests
        h.mockFitManager.handleFileLoaded = originalHandle;
        h.mockFitManager.startFileLoading = originalStart;
        h.mockFitManager.isLoading = originalIsLoading;
    });

    it("loadFile surfaces delegated errors and clears loading", async () => {
        expect.hasAssertions();
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
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        expect(() =>
            AppActions.renderChart({ datasets: [] }, {
                responsive: true,
            } as any)
        ).not.toThrow();
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
        expect.hasAssertions();

        expect(Date.now()).toBe(1_704_067_200_000);

        expect(() => AppActions.renderMap([10, 20], 15)).not.toThrow();
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
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        expect(() =>
            AppActions.renderTable({ columns: ["a"] } as any)
        ).not.toThrow();
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
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        expect(() => AppActions.selectLap(3)).not.toThrow();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "map.selectedLap",
            3,
            expect.any(Object)
        );

        expect(() => AppActions.setFileOpening(true)).not.toThrow();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "app.isOpeningFile",
            true,
            expect.any(Object)
        );

        expect(() => AppActions.setInitialized(true)).not.toThrow();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "app.initialized",
            true,
            expect.any(Object)
        );

        expect(() =>
            AppActions.updateWindowState({ w: 1 } as any)
        ).not.toThrow();
        expect(h.mockUpdateState).toHaveBeenCalledWith(
            "ui.windowState",
            { w: 1 },
            expect.any(Object)
        );
    });

    it("switchTab validates values and sets state when valid", () => {
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        expect(() => AppActions.switchTab("chart")).not.toThrow();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "ui.activeTab",
            "chart",
            expect.any(Object)
        );
        h.mockSetState.mockClear();
        expect(() => AppActions.switchTab("not-a-tab")).not.toThrow();
        expect(h.mockSetState).not.toHaveBeenCalled();
    });

    it("switchTheme validates values and sets state when valid", () => {
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        expect(() => AppActions.switchTheme("dark")).not.toThrow();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "ui.theme",
            "dark",
            expect.any(Object)
        );
        h.mockSetState.mockClear();
        expect(() => AppActions.switchTheme("purple")).not.toThrow();
        expect(h.mockSetState).not.toHaveBeenCalled();
    });

    it("toggleChartControls and toggleMeasurementMode invert current value", () => {
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        h.mockGetState.mockImplementation((path: string) => {
            if (path === "charts.controlsVisible") return false;
            if (path === "map.measurementMode") return true;
        });
        expect(() => AppActions.toggleChartControls()).not.toThrow();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "charts.controlsVisible",
            true,
            expect.any(Object)
        );
        expect(() => AppActions.toggleMeasurementMode()).not.toThrow();
        expect(h.mockSetState).toHaveBeenCalledWith(
            "map.measurementMode",
            false,
            expect.any(Object)
        );
    });
});

describe("appSelectors", () => {
    it("provides defaults for missing state", () => {
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        h.mockGetState.mockReturnValueOnce(undefined); // activeTab
        expect(AppSelectors.activeTab()).toBe("summary");

        h.mockGetState.mockReturnValueOnce(undefined); // charts.isRendered
        expect(AppSelectors.areChartsRendered()).toBe(false);

        h.mockGetState.mockReturnValueOnce(undefined); // tables.isRendered
        expect(AppSelectors.areTablesRendered()).toBe(false);

        h.mockGetState.mockReturnValueOnce(undefined); // ui.theme
        expect(AppSelectors.currentTheme()).toBe("system");

        h.mockGetState.mockReturnValueOnce(undefined); // charts
        expect(AppSelectors.getChartConfig()).toEqual({});

        h.mockGetState.mockReturnValueOnce(null); // currentFile
        expect(AppSelectors.getCurrentFile()).toBeNull();

        h.mockGetState.mockReturnValueOnce(undefined); // map
        expect(AppSelectors.getMapConfig()).toEqual({});

        h.mockGetState.mockReturnValueOnce(undefined); // performance
        expect(AppSelectors.getPerformanceMetrics()).toEqual({});

        h.mockGetState.mockReturnValueOnce(null); // globalData
        expect(AppSelectors.hasData()).toBe(false);

        h.mockGetState.mockReturnValueOnce(undefined); // isLoading
        expect(AppSelectors.isLoading()).toBe(false);

        h.mockGetState.mockReturnValueOnce(undefined); // map.isRendered
        expect(AppSelectors.isMapRendered()).toBe(false);
    });

    it("isTabActive compares to activeTab", () => {
        expect.hasAssertions();

        expect(Date.now()).toBe(1_704_067_200_000);

        h.mockGetState.mockImplementation((path: string) =>
            path === "ui.activeTab" ? "map" : undefined
        );
        expect(AppSelectors.isTabActive("map")).toBe(true);
        expect(AppSelectors.isTabActive("chart")).toBe(false);
    });
});

describe(StateMiddleware, () => {
    it("apply should pass through value when middleware returns undefined", () => {
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        const mw = new StateMiddleware();
        mw.use((_p, v) => {
            // no return
        });
        expect(() => mw.apply("x", 10, 0, {})).not.toThrow();
        expect(mw.apply("x", 10, 0, {})).toBe(10);
    });

    it("apply should use modified value when middleware returns value", () => {
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        const mw = new StateMiddleware();
        mw.use((_p, v) => (typeof v === "number" ? v + 1 : v));
        mw.use((_p, v) => (typeof v === "number" ? v * 2 : v));
        expect(mw.apply("y", 10, 0, {})).toBe(22);
    });

    it("apply should catch middleware errors and continue", () => {
        expect.hasAssertions();

        expect(Date.now()).toBe(1_704_067_200_000);

        const mw = new StateMiddleware();
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        mw.use(() => {
            throw new Error("bad");
        });
        mw.use((_p, v) => "ok");
        expect(mw.apply("z", "in", "old", {})).toBe("ok");
        expect(spy).toHaveBeenCalledWith(
            "[StateMiddleware] Error in middleware:",
            expect.any(Error)
        );
        spy.mockRestore();
    });
});

describe("useComputed and useState", () => {
    it("useComputed should cache until dependencies invalidate", () => {
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        let calls = 0;
        const compute = vi.fn<() => number>(() => {
            calls += 1;
            return calls;
        });
        const getter = useComputed(compute, ["a", "b"]);

        // First call computes
        const firstValue = getter();
        expect(firstValue).toBe(1);
        expect(getter()).toBe(firstValue); // cached
        expect(compute).toHaveBeenCalledOnce();

        // Invalidate via subscribed callback
        const aCallbacks = h.subscribeCallbacks["a"];
        expect(aCallbacks?.length).toBeGreaterThan(0);
        aCallbacks![0]!();

        expect(getter()).toBe(2);
        expect(compute).toHaveBeenCalledTimes(2);

        // Cleanup unsubscribes
        const before = h.subscribeCallbacks["a"]?.length ?? 0;
        getter.cleanup();
        const after = h.subscribeCallbacks["a"]?.length ?? 0;
        expect(after).toBeLessThan(before);
    });

    it("useState should provide default and setter that writes back", () => {
        expect.hasAssertions();
        expect(Date.now()).toBe(1_704_067_200_000);

        h.mockGetState.mockReturnValueOnce(undefined);
        const [value, setValue] = useState("path.to.value", 42);
        expect(value).toBe(42);
        expect(h.mockSetState).not.toHaveBeenCalled();
        setValue(99);
        expect(h.mockSetState).toHaveBeenCalledWith(
            "path.to.value",
            99,
            expect.any(Object)
        );
    });
});
