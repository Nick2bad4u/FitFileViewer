// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Type augmentation for globalThis
declare global {
    var globalData: any;
    var isChartRendered: any;
    var AppState: any;
    var chartControlsState: any;
    var __state_debug: any;
    var __persistenceTimeout: any;
    var __performanceMonitoringInterval: any;
    var __DEVELOPMENT__: any;
    var electronAPI: any;
}

type StateSubscriber = (newValue?: unknown, oldValue?: unknown) => void;
type StateUnsubscribe = () => void;

// Setup comprehensive mocks
vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: vi.fn<(path: string) => unknown>(),
        setState:
            vi.fn<(path: string, value: unknown, options?: unknown) => void>(),
        subscribe: vi.fn<
            (path: string, callback: StateSubscriber) => StateUnsubscribe
        >(() => () => {}),
        initializeStateManager: vi.fn<() => void>(),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/state/domain/uiStateManager.js"),
    () => ({
        uiStateManager: { initialize: vi.fn<() => void>() },
    })
);
vi.mock(
    import("../../../../../electron-app/utils/app/lifecycle/appActions.js"),
    () => ({
        AppActions: {
            testAction: vi.fn<(...args: unknown[]) => unknown>(),
            anotherAction: vi.fn<(...args: unknown[]) => unknown>(),
        },
    })
);

// Get references to the mocked functions
const mockStateManager = vi.mocked(
    await import("../../../../../electron-app/utils/state/core/stateManager.js")
);
const mockUIStateManager = vi.mocked(
    await import("../../../../../electron-app/utils/state/domain/uiStateManager.js")
).uiStateManager;
const mockAppActions = vi.mocked(
    await import("../../../../../electron-app/utils/app/lifecycle/appActions.js")
).AppActions;

import { initializeAppState } from "../../../../../electron-app/utils/state/integration/stateIntegration.js";

const originalLocationDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "location"
);

const expectedDebugKeys = [
    "AppActions",
    "getState",
    "logState",
    "setState",
    "triggerAction",
    "uiStateManager",
    "watchState",
];

function expectDebugUtilitiesConfigured(): void {
    expect(Object.keys(globalThis.__state_debug).sort()).toEqual(
        expectedDebugKeys
    );
    expect(globalThis.__state_debug).toMatchObject({
        AppActions: mockAppActions,
        getState: mockStateManager.getState,
        setState: mockStateManager.setState,
        uiStateManager: mockUIStateManager,
    });
}

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn<(key: string) => null | string>(),
    setItem: vi.fn<(key: string, value: string) => void>(),
    removeItem: vi.fn<(key: string) => void>(),
    clear: vi.fn<() => void>(),
    length: 0,
    key: vi.fn<(index: number) => null | string>(),
} as any;

// Mock performance.memory with proper type handling
const mockPerformance = {
    memory: {
        jsHeapSizeLimit: 1024 * 1024 * 1024, // 1GB
        totalJSHeapSize: 512 * 1024 * 1024, // 512MB
        usedJSHeapSize: 256 * 1024 * 1024, // 256MB
    },
    now: vi.fn<() => number>(),
    mark: vi.fn<(markName: string) => void>(),
    measure: vi.fn<(measureName: string) => void>(),
    clearMarks: vi.fn<(markName?: string) => void>(),
    clearMeasures: vi.fn<(measureName?: string) => void>(),
    getEntries: vi.fn<() => PerformanceEntry[]>(),
    getEntriesByName: vi.fn<(name: string) => PerformanceEntry[]>(),
    getEntriesByType: vi.fn<(type: string) => PerformanceEntry[]>(),
    timeOrigin: 0,
    toJSON: vi.fn<() => unknown>(),
    addEventListener: vi.fn<(type: string, listener: EventListener) => void>(),
    removeEventListener:
        vi.fn<(type: string, listener: EventListener) => void>(),
    dispatchEvent: vi.fn<(event: Event) => boolean>(),
} as any;

describe("stateIntegration comprehensive coverage", () => {
    let originalLocalStorage: any;
    let originalPerformance: any;

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();

        // Save original globals
        originalLocalStorage = globalThis.localStorage;
        originalPerformance = globalThis.performance;

        // Setup mocks
        globalThis.localStorage = mockLocalStorage;
        (globalThis as any).performance = mockPerformance;

        // Clean up global state
        delete globalThis.globalData;
        delete globalThis.isChartRendered;
        delete globalThis.AppState;
        delete globalThis.chartControlsState;
        delete globalThis.__state_debug;
        delete globalThis.__persistenceTimeout;
        delete globalThis.__performanceMonitoringInterval;
        delete globalThis.__DEVELOPMENT__;
        restoreLocation();
    });

    afterEach(() => {
        // Restore original globals
        globalThis.localStorage = originalLocalStorage;
        (globalThis as any).performance = originalPerformance;

        // Clean up test globals
        delete globalThis.globalData;
        delete globalThis.isChartRendered;
        delete globalThis.AppState;
        delete globalThis.chartControlsState;
        delete globalThis.__state_debug;
        delete globalThis.__persistenceTimeout;
        delete globalThis.__performanceMonitoringInterval;
        delete globalThis.__DEVELOPMENT__;
        restoreLocation();

        // Clear any timers
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    describe("stateMigrationHelper class", () => {
        it("should create instance and manage migrations correctly", async () => {
            expect.assertions(4);

            const { StateMigrationHelper } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            const helper = new StateMigrationHelper();

            // Test initial state
            expect(helper.migrations).toEqual([]);

            // Test adding migrations
            const migration1 = vi.fn<() => void>();
            const migration2 = vi.fn<() => void>();

            helper.addMigration(migration1);
            helper.addMigration(migration2);

            expect(helper.migrations).toHaveLength(2);
            expect(helper.migrations).toContain(migration1);
            expect(helper.migrations).toContain(migration2);
        });

        it("should run all migrations successfully", async () => {
            expect.assertions(4);

            const { StateMigrationHelper } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            const helper = new StateMigrationHelper();
            const migrationEvents: string[] = [];
            const migration1 = vi.fn<() => Promise<void>>(async () => {
                migrationEvents.push("first");
            });
            const migration2 = vi.fn<() => Promise<void>>(async () => {
                migrationEvents.push("second");
            });

            helper.addMigration(migration1);
            helper.addMigration(migration2);

            await expect(helper.runMigrations()).resolves.toBeUndefined();

            expect(migrationEvents).toEqual(["first", "second"]);
            expect(migration1).toHaveBeenCalledOnce();
            expect(migration2).toHaveBeenCalledOnce();
        });

        it("should continue after migration errors without throwing", async () => {
            expect.assertions(5);

            const { StateMigrationHelper } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const helper = new StateMigrationHelper();
            const migrationEvents: string[] = [];
            const failingMigration = vi
                .fn<() => Promise<void>>()
                .mockRejectedValue(new Error("Migration failed"));
            const successMigration = vi.fn<() => Promise<void>>(async () => {
                migrationEvents.push("success");
            });

            helper.addMigration(failingMigration);
            helper.addMigration(successMigration);

            await expect(helper.runMigrations()).resolves.toBeUndefined();

            expect(migrationEvents).toEqual(["success"]);
            expect(failingMigration).toHaveBeenCalledOnce();
            expect(successMigration).toHaveBeenCalledOnce();
            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateMigration] Migration failed:",
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe("main initialization functions", () => {
        it("should initialize app state in production mode (smoke)", async () => {
            expect.assertions(6);

            setTestLocation({
                hash: "",
                hostname: "example.com",
                href: "https://example.com/",
                protocol: "https:",
                search: "",
            });

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            initializeAppState();

            expect(
                mockStateManager.initializeStateManager
            ).toHaveBeenCalledOnce();
            expect(mockUIStateManager.initialize).toHaveBeenCalledOnce();
            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateIntegration] Initializing application state management..."
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateIntegration] Application state management initialized"
            );
            expect(
                Object.getOwnPropertyDescriptor(globalThis, "globalData")
            ).toMatchObject({
                configurable: true,
                get: expect.any(Function),
                set: expect.any(Function),
            });
            expect(globalThis.__state_debug).toBeUndefined();

            consoleSpy.mockRestore();
        });

        it("should initialize app state in development mode (smoke)", async () => {
            expect.assertions(5);

            // Set development mode
            globalThis.__DEVELOPMENT__ = true;

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            initializeAppState();

            expect(
                mockStateManager.initializeStateManager
            ).toHaveBeenCalledOnce();
            expect(mockUIStateManager.initialize).toHaveBeenCalledOnce();

            expect(Object.keys(globalThis.__state_debug).sort()).toEqual(
                expectedDebugKeys
            );
            expectDebugUtilitiesConfigured();

            consoleSpy.mockRestore();
        });

        it("should initialize complete state system (smoke)", async () => {
            expect.assertions(3);

            const { initializeCompleteStateSystem } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            initializeCompleteStateSystem();

            expect(
                Object.getOwnPropertyDescriptor(globalThis, "globalData")
            ).toMatchObject({
                configurable: true,
                get: expect.any(Function),
                set: expect.any(Function),
            });
            expect(mockStateManager.subscribe).toHaveBeenCalledWith(
                "",
                expect.any(Function)
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateIntegration] Complete state system initialized"
            );

            consoleSpy.mockRestore();
        });
    });

    describe("integration functions", () => {
        it("should migrate chartControlsState when available (smoke)", async () => {
            expect.assertions(5);

            const { migrateChartControlsState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            globalThis.chartControlsState = { isVisible: true };

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            migrateChartControlsState();

            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateMigration] Migrating chartControlsState..."
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateMigration] chartControlsState migrated"
            );

            expect(mockStateManager.setState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                true,
                {
                    source: "migration",
                }
            );

            // Test getter/setter functionality
            mockStateManager.getState.mockReturnValue(false);
            expect({
                chartControlsVisible: globalThis.chartControlsState.isVisible,
            }).toStrictEqual({ chartControlsVisible: false });

            globalThis.chartControlsState.isVisible = true;
            expect(mockStateManager.setState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                true,
                {
                    source: "chartControlsState",
                }
            );

            consoleSpy.mockRestore();
        });

        it("should handle missing chartControlsState gracefully", async () => {
            expect.assertions(3);

            const { migrateChartControlsState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            expect(() => migrateChartControlsState()).not.toThrow();

            expect(globalThis.chartControlsState).toBeUndefined();
            expect(mockStateManager.setState).not.toHaveBeenCalled();
        });
    });

    describe("performance monitoring", () => {
        it("should set up performance monitoring with memory info (smoke)", async () => {
            expect.assertions(3);

            vi.useFakeTimers();
            (globalThis as any).performance = mockPerformance;

            const { setupStatePerformanceMonitoring } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});
            let subscribeCallback: StateSubscriber | undefined;

            mockStateManager.subscribe.mockImplementation((path, callback) => {
                subscribeCallback = callback;
                return vi.fn<StateUnsubscribe>(); // unsubscribe function
            });

            setupStatePerformanceMonitoring();
            expect(mockStateManager.subscribe).toHaveBeenCalledWith(
                "",
                expect.any(Function)
            );

            // Simulate state changes
            subscribeCallback?.();
            subscribeCallback?.();
            subscribeCallback?.();

            // Force one more callback to cross the minute threshold without relying on timers
            subscribeCallback?.();

            vi.advanceTimersByTime(30000);

            expect(mockStateManager.setState).toHaveBeenCalledWith(
                "performance.memoryUsage",
                {
                    limit: 1024,
                    total: 512,
                    used: 256,
                },
                {
                    silent: true,
                    source: "performanceMonitoring",
                }
            );
            expect(globalThis.__performanceMonitoringInterval).toBeTypeOf(
                "object"
            );

            consoleSpy.mockRestore();
            vi.useRealTimers();
        });

        it("should handle missing performance.memory gracefully", async () => {
            expect.assertions(3);

            vi.useFakeTimers();
            (globalThis as any).performance = mockPerformance;

            // Remove memory from performance mock
            delete (globalThis.performance as any).memory;

            const { setupStatePerformanceMonitoring } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            expect(() => setupStatePerformanceMonitoring()).not.toThrow();

            // Fast forward timers
            vi.advanceTimersByTime(60000);

            expect(globalThis.__performanceMonitoringInterval).toBeUndefined();
            expect(mockStateManager.setState).not.toHaveBeenCalledWith(
                "performance.memoryUsage",
                expect.anything(),
                expect.anything()
            );

            vi.useRealTimers();
        });
    });

    describe("state persistence", () => {
        it("should set up state persistence and load existing state (smoke)", async () => {
            expect.assertions(6);

            vi.useFakeTimers();

            const savedState = {
                ui: { theme: "dark", sidebarCollapsed: true },
                charts: { controlsVisible: false, selectedChart: "test" },
                map: { baseLayer: "osm", showElevationProfile: true },
                tables: { pageSize: 50 },
            };

            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(savedState)
            );
            mockStateManager.getState.mockImplementation((path) => {
                if (path === "ui.theme") return "dark";
                if (path === "charts.controlsVisible") return false;
                return undefined;
            });

            const { setupStatePersistence } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            setupStatePersistence();

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
                "fitFileViewer_uiState"
            );
            expect(mockStateManager.setState).toHaveBeenCalledWith(
                "ui.theme",
                "dark",
                {
                    silent: true,
                    source: "localStorage",
                }
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateIntegration] UI state loaded from localStorage"
            );

            // Test persistence on state change
            const subscribeCallback =
                mockStateManager.subscribe.mock.calls.find(
                    (call: any) => call[0] === "ui.theme"
                )?.[1];
            subscribeCallback?.();

            // Fast forward to trigger debounced persistence
            vi.advanceTimersByTime(600);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                "fitFileViewer_uiState",
                expect.any(String)
            );
            expect(
                JSON.parse(mockLocalStorage.setItem.mock.calls.at(-1)?.[1])
            ).toEqual({
                charts: { controlsVisible: false },
                ui: { theme: "dark" },
            });
            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateIntegration] UI state persisted to localStorage"
            );

            consoleSpy.mockRestore();
            vi.useRealTimers();
        });

        it("should handle localStorage errors gracefully", async () => {
            expect.assertions(3);

            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error("localStorage not available");
            });

            const { setupStatePersistence } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            expect(() => setupStatePersistence()).not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateIntegration] Failed to load persisted state:",
                expect.any(Error)
            );
            expect(globalThis.__persistenceTimeout).toBeUndefined();

            consoleSpy.mockRestore();
        });

        it("should handle JSON parsing errors gracefully", async () => {
            expect.assertions(3);

            mockLocalStorage.getItem.mockReturnValue("invalid json");

            const { setupStatePersistence } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            expect(() => setupStatePersistence()).not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateIntegration] Failed to load persisted state:",
                expect.any(Error)
            );
            expect(globalThis.__persistenceTimeout).toBeUndefined();

            consoleSpy.mockRestore();
        });
    });

    describe("utility functions", () => {
        it("should handle nested value operations correctly", async () => {
            expect.assertions(1);

            vi.useFakeTimers();

            const { setupStatePersistence } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            // Test setting nested values (through persistence)
            mockLocalStorage.getItem.mockReturnValue(null);
            mockStateManager.getState.mockImplementation((path) => {
                if (path === "ui.theme") return "light";
                if (path === "charts.controlsVisible") return true;
                return undefined;
            });

            setupStatePersistence();

            const subscribeCallback =
                mockStateManager.subscribe.mock.calls.find(
                    (call: any) => call[0] === "charts.controlsVisible"
                )?.[1];
            subscribeCallback?.();
            vi.advanceTimersByTime(600);

            expect(
                JSON.parse(mockLocalStorage.setItem.mock.calls.at(-1)?.[1])
            ).toEqual({
                charts: { controlsVisible: true },
                ui: { theme: "light" },
            });
        });

        it("should detect development mode correctly - localhost", async () => {
            expect.assertions(3);

            // Mock window.location for localhost
            Object.defineProperty(globalThis, "location", {
                value: {
                    hostname: "localhost",
                    search: "",
                    hash: "",
                    protocol: "http:",
                    href: "http://localhost:3000",
                },
                configurable: true,
            });

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            initializeAppState();

            expect(Object.keys(globalThis.__state_debug).sort()).toEqual(
                expectedDebugKeys
            );
            expectDebugUtilitiesConfigured();
        });

        it("should detect development mode correctly - dev flag", async () => {
            expect.assertions(3);

            globalThis.__DEVELOPMENT__ = true;

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            initializeAppState();

            expect(Object.keys(globalThis.__state_debug).sort()).toEqual(
                expectedDebugKeys
            );
            expectDebugUtilitiesConfigured();
        });

        it("should detect development mode correctly - debug param", async () => {
            expect.assertions(3);

            Object.defineProperty(globalThis, "location", {
                value: {
                    hostname: "example.com",
                    search: "?debug=true",
                    hash: "",
                    protocol: "https:",
                    href: "https://example.com?debug=true",
                },
                configurable: true,
            });

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            initializeAppState();

            expect(Object.keys(globalThis.__state_debug).sort()).toEqual(
                expectedDebugKeys
            );
            expectDebugUtilitiesConfigured();
        });

        it("should handle development mode detection errors", async () => {
            expect.assertions(1);

            // Create a location object that throws on property access
            Object.defineProperty(globalThis, "location", {
                get() {
                    throw new Error("Location access error");
                },
                configurable: true,
            });

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            initializeAppState();

            // Should not crash and should not set up debugging
            expect(globalThis.__state_debug).toBeUndefined();
        });
    });

    describe("backward compatibility", () => {
        it("should set up globalData property correctly (smoke)", async () => {
            expect.assertions(2);

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            initializeAppState();

            // Test globalData getter
            mockStateManager.getState.mockReturnValue({ test: "data" });
            expect(globalThis.globalData).toEqual({ test: "data" });

            // Test globalData setter
            globalThis.globalData = { new: "data" };
            expect(mockStateManager.setState).toHaveBeenCalledWith(
                "globalData",
                { new: "data" },
                { source: "window.globalData" }
            );
        });

        it("should set up isChartRendered property correctly (smoke)", async () => {
            expect.assertions(2);

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            initializeAppState();

            // Test isChartRendered getter
            mockStateManager.getState.mockReturnValue(true);
            expect({
                isChartRendered: globalThis.isChartRendered,
            }).toStrictEqual({
                isChartRendered: true,
            });

            // Test isChartRendered setter
            globalThis.isChartRendered = false;
            expect(mockStateManager.setState).toHaveBeenCalledWith(
                "charts.isRendered",
                false,
                {
                    source: "window.isChartRendered",
                }
            );
        });

        it("should set up AppState compatibility layer (smoke)", async () => {
            expect.assertions(6);

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            // Set mock before calling initializeAppState
            mockStateManager.getState.mockImplementation((path) => {
                if (path === "globalData") {
                    return { test: "appstate" };
                }
                return undefined;
            });

            initializeAppState();

            expect(Object.keys(globalThis.AppState).sort()).toEqual([
                "eventListeners",
                "globalData",
                "isChartRendered",
            ]);

            // Check if globalData is a getter
            const descriptor = Object.getOwnPropertyDescriptor(
                globalThis.AppState,
                "globalData"
            );
            expect(descriptor).toMatchObject({
                get: expect.any(Function),
                set: expect.any(Function),
            });

            expect(globalThis.AppState.globalData).toEqual({
                test: "appstate",
            });

            // Test AppState.globalData setter
            globalThis.AppState.globalData = { appstate: "test" };
            expect(mockStateManager.setState).toHaveBeenCalledWith(
                "globalData",
                { appstate: "test" },
                { source: "AppState.globalData" }
            );

            // Test AppState.eventListeners
            const mockMap = new Map();
            mockStateManager.getState.mockReturnValue(mockMap);
            expect(globalThis.AppState.eventListeners).toBe(mockMap);

            globalThis.AppState.eventListeners = new Map();
            expect(mockStateManager.setState).toHaveBeenCalledWith(
                "eventListeners",
                expect.any(Map),
                {
                    source: "AppState.eventListeners",
                }
            );
        });

        it("should not override existing properties", async () => {
            expect.assertions(2);

            // Set existing properties
            globalThis.globalData = { existing: "data" };
            globalThis.AppState = { existing: "appstate" };

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            initializeAppState();

            // Should not override existing globalData
            expect(globalThis.globalData).toEqual({ existing: "data" });
            expect(globalThis.AppState).toEqual({ existing: "appstate" });
        });
    });

    describe("debug utilities", () => {
        it("should set up debug utilities in development mode", async () => {
            expect.assertions(3);

            globalThis.__DEVELOPMENT__ = true;

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            initializeAppState();

            expect(Object.keys(globalThis.__state_debug).sort()).toEqual(
                expectedDebugKeys
            );
            expectDebugUtilitiesConfigured();
        });

        it("should expose debug utility functions and reject unknown actions", async () => {
            expect.assertions(6);

            globalThis.__DEVELOPMENT__ = true;

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            const logSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const unsubscribe = vi.fn<StateUnsubscribe>();
            let watchCallback: StateSubscriber | undefined;

            mockStateManager.getState.mockReturnValue({ id: 1 });
            mockStateManager.subscribe.mockImplementation((path, callback) => {
                watchCallback = callback;
                return unsubscribe;
            });
            mockAppActions.testAction.mockReturnValue("action-result");

            initializeAppState();

            expect(globalThis.__state_debug.logState("ui.theme")).toEqual({
                id: 1,
            });
            expect(
                globalThis.__state_debug.triggerAction("testAction", 42)
            ).toBe("action-result");
            expect(
                globalThis.__state_debug.triggerAction("missingAction")
            ).toBeUndefined();
            expect(warnSpy).toHaveBeenCalledWith(
                "[StateDebug] Unknown action: missingAction"
            );

            expect(globalThis.__state_debug.watchState("ui.theme")).toBe(
                unsubscribe
            );
            watchCallback?.("dark", "light");
            expect(logSpy).toHaveBeenCalledWith(
                "[StateDebug] ui.theme changed:",
                {
                    newValue: "dark",
                    oldValue: "light",
                }
            );

            logSpy.mockRestore();
            warnSpy.mockRestore();
        });
    });
});

function restoreLocation(): void {
    if (originalLocationDescriptor) {
        Object.defineProperty(
            globalThis,
            "location",
            originalLocationDescriptor
        );
    }
}

function setTestLocation(location: LocationInit): void {
    Object.defineProperty(globalThis, "location", {
        configurable: true,
        value: location,
    });
}

type LocationInit = Pick<
    Location,
    "hash" | "hostname" | "href" | "protocol" | "search"
>;
