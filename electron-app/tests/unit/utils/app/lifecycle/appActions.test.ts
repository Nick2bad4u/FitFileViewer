import { describe, it, expect, vi } from "vitest";
// Use explicit imports for stability across pools/environments.
// In this suite Vitest intermittently fails to register assertions under forks pool when requireAssertions is enabled.
// Temporarily disable it per-test to avoid false negatives while still performing real assertions below.

// Establish a suite early to avoid rare runner timing issues
describe("appActions smoke suite init", () => {
    it("registers basic test", () => {
        expect(true).toBe(true);
    });
});

// Use hoisted container to avoid mock hoisting issues (don't self-reference during factory eval)
const h = vi.hoisted(() => {
    const subscribeCallbacks: Record<string, Array<() => void>> = {};
    const mockSubscribe = vi.fn((path: string, cb: () => void) => {
        (subscribeCallbacks[path] ||= []).push(cb);
        return () => {
            const arr = subscribeCallbacks[path];
            if (!arr) return;
            const idx = arr.indexOf(cb);
            if (idx >= 0) arr.splice(idx, 1);
        };
    });
    return {
        mockGetState: vi.fn(),
        mockSetState: vi.fn(),
        mockUpdateState: vi.fn(),
        mockSubscribe,
        subscribeCallbacks,
        mockShowNotification: vi.fn(),
        mockFitManager: {
            startFileLoading: vi.fn(),
            handleFileLoaded: vi.fn(),
            isLoading: vi.fn(() => false),
            clearFileState: vi.fn(),
        },
    };
});

vi.mock("../../../../../utils/state/core/stateManager.js", () => ({
    getState: h.mockGetState,
    setState: h.mockSetState,
    updateState: h.mockUpdateState,
    subscribe: h.mockSubscribe,
}));

vi.mock("../../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: h.mockShowNotification,
}));

vi.mock("../../../../../utils/state/domain/fitFileState.js", () => ({
    fitFileStateManager: h.mockFitManager,
}));

// Import after mocks
import {
    AppActions,
    AppSelectors,
    StateMiddleware,
    useComputed,
    useState,
} from "../../../../../utils/app/lifecycle/appActions.js";

// Helper: apply common setup/teardown per test and disable requireAssertions just for this test body
const itHasAssertions = (
    name: string,
    fn: () => any | Promise<any>,
    timeout?: number
) =>
    it(
        name,
        async () => {
            // Some environments fail to register assertions with requireAssertions enabled under forks pool.
            // Disable it for this test only, then restore after.
            vi.setConfig({ expect: { requireAssertions: false } });
            // Standard per-test setup previously done in beforeEach
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
            for (const k of Object.keys(h.subscribeCallbacks))
                delete h.subscribeCallbacks[k];
            try {
                expect.hasAssertions();
                return await fn();
            } finally {
                // Restore timers and global config after test
                vi.useRealTimers();
                vi.resetConfig();
            }
        },
        timeout
    );

// Note: per-test setup/teardown is handled in the wrapper above to avoid top-level hooks that
// can trigger "failed to find the runner" in some isolation/pool modes.

describe("AppActions", () => {
    itHasAssertions("clearData should reset core slices and notify", () => {
        AppActions.clearData();

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
        expect(h.mockFitManager.clearFileState).toHaveBeenCalledTimes(1);
        expect(h.mockShowNotification).toHaveBeenCalledWith(
            "Data cleared",
            "info"
        );
    });

    itHasAssertions(
        "loadFile delegates to fitFileStateManager when available",
        async () => {
            await AppActions.loadFile({ foo: "bar" }, "path/fit.fit");

            expect(h.mockFitManager.startFileLoading).toHaveBeenCalledWith(
                "path/fit.fit"
            );
            expect(h.mockFitManager.isLoading).toHaveBeenCalled();
            expect(h.mockFitManager.handleFileLoaded).toHaveBeenCalledWith(
                { foo: "bar" },
                expect.objectContaining({
                    filePath: "path/fit.fit",
                    source: "AppActions.loadFile",
                })
            );
            expect(h.mockShowNotification).not.toHaveBeenCalled();
            expect(h.mockSetState).not.toHaveBeenCalled();
        }
    );

    itHasAssertions(
        "loadFile falls back to legacy flow when domain manager is unavailable",
        async () => {
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

            await AppActions.loadFile({ foo: "bar" }, "path/fit.fit");

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
        }
    );

    itHasAssertions(
        "loadFile surfaces delegated errors and clears loading",
        async () => {
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
        }
    );

    itHasAssertions(
        "renderChart should update charts slice and performance",
        () => {
            AppActions.renderChart({ datasets: [] }, {
                responsive: true,
            } as any);
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
        }
    );

    itHasAssertions("renderMap should update map slice and performance", () => {
        AppActions.renderMap([10, 20], 15);
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

    itHasAssertions(
        "renderTable should update tables slice and performance",
        () => {
            AppActions.renderTable({ columns: ["a"] } as any);
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
        }
    );

    itHasAssertions(
        "selectLap, setFileOpening, setInitialized, updateWindowState call set/update state",
        () => {
            AppActions.selectLap(3);
            expect(h.mockSetState).toHaveBeenCalledWith(
                "map.selectedLap",
                3,
                expect.any(Object)
            );

            AppActions.setFileOpening(true);
            expect(h.mockSetState).toHaveBeenCalledWith(
                "app.isOpeningFile",
                true,
                expect.any(Object)
            );

            AppActions.setInitialized(true);
            expect(h.mockSetState).toHaveBeenCalledWith(
                "app.initialized",
                true,
                expect.any(Object)
            );

            AppActions.updateWindowState({ w: 1 } as any);
            expect(h.mockUpdateState).toHaveBeenCalledWith(
                "ui.windowState",
                { w: 1 },
                expect.any(Object)
            );
        }
    );

    itHasAssertions(
        "switchTab validates values and sets state when valid",
        () => {
            AppActions.switchTab("chart");
            expect(h.mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "chart",
                expect.any(Object)
            );
            h.mockSetState.mockClear();
            AppActions.switchTab("not-a-tab");
            expect(h.mockSetState).not.toHaveBeenCalled();
        }
    );

    itHasAssertions(
        "switchTheme validates values and sets state when valid",
        () => {
            AppActions.switchTheme("dark");
            expect(h.mockSetState).toHaveBeenCalledWith(
                "ui.theme",
                "dark",
                expect.any(Object)
            );
            h.mockSetState.mockClear();
            AppActions.switchTheme("purple");
            expect(h.mockSetState).not.toHaveBeenCalled();
        }
    );

    itHasAssertions(
        "toggleChartControls and toggleMeasurementMode invert current value",
        () => {
            h.mockGetState.mockImplementation((path: string) => {
                if (path === "charts.controlsVisible") return false;
                if (path === "map.measurementMode") return true;
            });
            AppActions.toggleChartControls();
            expect(h.mockSetState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                true,
                expect.any(Object)
            );
            AppActions.toggleMeasurementMode();
            expect(h.mockSetState).toHaveBeenCalledWith(
                "map.measurementMode",
                false,
                expect.any(Object)
            );
        }
    );
});

describe("AppSelectors", () => {
    itHasAssertions("provides defaults for missing state", () => {
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

    itHasAssertions("isTabActive compares to activeTab", () => {
        h.mockGetState.mockImplementation((path: string) =>
            path === "ui.activeTab" ? "map" : undefined
        );
        expect(AppSelectors.isTabActive("map")).toBe(true);
        expect(AppSelectors.isTabActive("chart")).toBe(false);
    });
});

describe("StateMiddleware", () => {
    itHasAssertions(
        "apply should pass through value when middleware returns undefined",
        () => {
            const mw = new StateMiddleware();
            mw.use((_p, v) => {
                // no return
            });
            expect(mw.apply("x", 10, 0, {})).toBe(10);
        }
    );

    itHasAssertions(
        "apply should use modified value when middleware returns value",
        () => {
            const mw = new StateMiddleware();
            mw.use((_p, v) => (typeof v === "number" ? v + 1 : v));
            mw.use((_p, v) => (typeof v === "number" ? v * 2 : v));
            expect(mw.apply("y", 10, 0, {})).toBe(22);
        }
    );

    itHasAssertions("apply should catch middleware errors and continue", () => {
        const mw = new StateMiddleware();
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        mw.use(() => {
            throw new Error("bad");
        });
        mw.use((_p, v) => "ok");
        expect(mw.apply("z", "in", "old", {})).toBe("ok");
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});

describe("useComputed and useState", () => {
    itHasAssertions(
        "useComputed should cache until dependencies invalidate",
        () => {
            let calls = 0;
            const compute = vi.fn(() => {
                calls += 1;
                return calls;
            });
            const getter = useComputed(compute, ["a", "b"]);

            // First call computes
            expect(getter()).toBe(1);
            expect(getter()).toBe(1); // cached
            expect(compute).toHaveBeenCalledTimes(1);

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
        }
    );

    itHasAssertions(
        "useState should provide default and setter that writes back",
        () => {
            h.mockGetState.mockReturnValueOnce(undefined);
            const [value, setValue] = useState("path.to.value", 42);
            expect(value).toBe(42);
            setValue(99);
            expect(h.mockSetState).toHaveBeenCalledWith(
                "path.to.value",
                99,
                expect.any(Object)
            );
        }
    );
});
