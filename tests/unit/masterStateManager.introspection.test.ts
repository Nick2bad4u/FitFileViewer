import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

type MasterStateManager =
    typeof import("../../electron-app/utils/state/core/masterStateManager.js").masterStateManager;
type StateManagerModule =
    typeof import("../../electron-app/utils/state/core/stateManager.js");

interface SubscriptionSnapshot {
    paths: string[];
    subscriptionDetails: Record<
        string,
        { hasListeners: boolean; listenerCount: number } | undefined
    >;
    totalListeners: number;
}

interface InitializationStatusSnapshot {
    systemState: {
        missing?: unknown;
    };
}

interface RootStateSnapshot {
    charts: {
        controlsVisible: boolean;
        isRendered: boolean;
        selectedChart: string;
        zoomLevel: number;
    };
    map: {
        baseLayer: string;
        trackVisible: boolean;
        zoom: number;
    };
    performance: {
        lastLoadTime: null | number;
        memoryUsage: null | number;
    };
    tables: {
        currentPage: number;
        pageSize: number;
        sortDirection: string;
    };
    ui: {
        activeTab: string;
        theme: string;
        unloadButtonVisible: boolean;
    };
}

type UnknownRecord = Record<string, unknown>;

interface StateHistorySnapshot {
    newValue: unknown;
    oldValue: unknown;
    path: string;
    source: string;
    timestamp: number;
}

let masterStateManager: MasterStateManager;
let resetState: StateManagerModule["resetState"];
let setState: StateManagerModule["setState"];
let subscribe: StateManagerModule["subscribe"];

function suppressConsoleOutput(): void {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
}

describe("masterStateManager introspection", () => {
    beforeAll(async () => {
        suppressConsoleOutput();

        const [masterStateManagerModule, stateManagerModule] =
            await Promise.all([
                import("../../electron-app/utils/state/core/masterStateManager.js"),
                import("../../electron-app/utils/state/core/stateManager.js"),
            ]);

        masterStateManager = masterStateManagerModule.masterStateManager;
        resetState = stateManagerModule.resetState;
        setState = stateManagerModule.setState;
        subscribe = stateManagerModule.subscribe;
    });

    beforeEach(() => {
        suppressConsoleOutput();
        resetState();
    });

    afterEach(() => {
        resetState();
        vi.restoreAllMocks();
    });

    describe("introspection methods", () => {
        it("should provide getState method", () => {
            expect.assertions(7);

            // Test basic state access
            const initialState =
                masterStateManager.getState() as RootStateSnapshot;
            expect({
                controlsVisible: initialState.charts.controlsVisible,
                isRendered: initialState.charts.isRendered,
                selectedChart: initialState.charts.selectedChart,
                zoomLevel: initialState.charts.zoomLevel,
            }).toStrictEqual({
                controlsVisible: true,
                isRendered: false,
                selectedChart: "elevation",
                zoomLevel: 1,
            });
            expect({
                baseLayer: initialState.map.baseLayer,
                trackVisible: initialState.map.trackVisible,
                zoom: initialState.map.zoom,
            }).toStrictEqual({
                baseLayer: "OpenStreetMap",
                trackVisible: true,
                zoom: 13,
            });
            expect({
                lastLoadTime: initialState.performance.lastLoadTime,
                memoryUsage: initialState.performance.memoryUsage,
            }).toStrictEqual({
                lastLoadTime: null,
                memoryUsage: null,
            });
            expect({
                currentPage: initialState.tables.currentPage,
                pageSize: initialState.tables.pageSize,
                sortDirection: initialState.tables.sortDirection,
            }).toStrictEqual({
                currentPage: 1,
                pageSize: 50,
                sortDirection: "asc",
            });
            expect({
                activeTab: initialState.ui.activeTab,
                theme: initialState.ui.theme,
                unloadButtonVisible: initialState.ui.unloadButtonVisible,
            }).toStrictEqual({
                activeTab: "summary",
                theme: "system",
                unloadButtonVisible: false,
            });
            expect(initialState as unknown as UnknownRecord).not.toHaveProperty(
                "missing"
            );
            expect({
                hasMissingRoot: Object.hasOwn(
                    initialState as unknown as UnknownRecord,
                    "missing"
                ),
                missingBranch: masterStateManager.getState("missing.branch"),
            }).toStrictEqual({
                hasMissingRoot: false,
                missingBranch: undefined,
            });
        });

        it("should provide getHistory method", () => {
            expect.assertions(1);

            // Test history access
            const history = masterStateManager.getHistory();
            expect({
                entries: history,
            }).toStrictEqual({
                entries: [],
            });
        });

        it("should provide getSubscriptions method", () => {
            expect.assertions(1);

            // Test subscriptions access
            const subscriptions = masterStateManager.getSubscriptions();
            expect(subscriptions).toEqual({
                paths: [],
                subscriptionDetails: {},
                totalListeners: 0,
            });
        });
    });

    describe("state management integration", () => {
        it("should get state changes through masterStateManager", () => {
            expect.assertions(2);

            // Set a test value using direct stateManager
            setState("test.value", "hello world");

            // Get it back through masterStateManager
            const testState = masterStateManager.getState(
                "test"
            ) as UnknownRecord;
            expect(testState).not.toHaveProperty("missing");
            expect({
                missingValue: masterStateManager.getState("test.missing"),
                value: masterStateManager.getState("test.value"),
            }).toStrictEqual({
                missingValue: undefined,
                value: "hello world",
            });
        });

        it("should track state history through masterStateManager", () => {
            expect.assertions(2);

            const initialHistoryLength = masterStateManager.getHistory().length;

            // Make some state changes using direct stateManager
            setState("test.counter", 1);
            setState("test.counter", 2);
            setState("test.counter", 3);

            // Check history through masterStateManager
            const newHistory = masterStateManager
                .getHistory()
                .slice(initialHistoryLength) as StateHistorySnapshot[];
            const historyWithoutTimestamps = newHistory.map(
                ({ newValue, oldValue, path, source }) => ({
                    newValue,
                    oldValue,
                    path,
                    source,
                })
            );
            expect(historyWithoutTimestamps).toStrictEqual([
                {
                    newValue: 1,
                    oldValue: undefined,
                    path: "test.counter",
                    source: "unknown",
                },
                {
                    newValue: 2,
                    oldValue: 1,
                    path: "test.counter",
                    source: "unknown",
                },
                {
                    newValue: 3,
                    oldValue: 2,
                    path: "test.counter",
                    source: "unknown",
                },
            ]);
            expect(
                newHistory.map(({ path, timestamp }) => ({
                    hasTimestamp: timestamp > 0,
                    path,
                }))
            ).toStrictEqual(
                historyWithoutTimestamps.map(({ path }) => ({
                    hasTimestamp: true,
                    path,
                }))
            );
        });

        it("should access subscriptions through masterStateManager", () => {
            expect.assertions(5);

            let callCount = 0;

            // Subscribe using direct stateManager
            const unsubscribe = subscribe("test.subscription", () => {
                callCount++;
            });

            // Make a change using direct stateManager
            setState("test.subscription", "triggered");

            // Check subscription was called
            expect({ callCount }).toStrictEqual({ callCount: 1 });

            // Check subscriptions list through masterStateManager
            const subscriptions =
                masterStateManager.getSubscriptions() as SubscriptionSnapshot;
            expect(
                subscriptions.subscriptionDetails["test.subscription"]
            ).toEqual({
                hasListeners: true,
                listenerCount: 1,
            });
            expect(subscriptions.paths).toContain("test.subscription");
            expect({
                totalListeners: subscriptions.totalListeners,
            }).toStrictEqual({
                totalListeners: 1,
            });

            // Clean up
            unsubscribe();
            const subscriptionsAfterCleanup =
                masterStateManager.getSubscriptions() as SubscriptionSnapshot;
            expect({
                hasSubscriptionDetail: Object.hasOwn(
                    subscriptionsAfterCleanup.subscriptionDetails,
                    "test.subscription"
                ),
                paths: subscriptionsAfterCleanup.paths,
                totalListeners: subscriptionsAfterCleanup.totalListeners,
            }).toStrictEqual({
                hasSubscriptionDetail: false,
                paths: [],
                totalListeners: 0,
            });
        });
    });

    describe("initialization status", () => {
        it("should provide initialization status", () => {
            expect.assertions(2);

            const status = masterStateManager.getInitializationStatus();
            expect(status).toEqual({
                components: {},
                isInitialized: false,
                systemState: {
                    initialized: undefined,
                    mode: undefined,
                    startupTime: undefined,
                    version: undefined,
                },
            });
            expect(
                (status as InitializationStatusSnapshot).systemState
            ).not.toHaveProperty("missing");
        });
    });
});
