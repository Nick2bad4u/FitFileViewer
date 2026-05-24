/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Type augmentation for globalThis
declare global {
    var globalData: any;
    var isChartRendered: any;
    var AppState: any;
    var chartControlsState: any;
    var rendererUtils: any;
    var __state_debug: any;
    var __persistenceTimeout: any;
    var __performanceMonitoringInterval: any;
    var __DEVELOPMENT__: any;
    var electronAPI: any;
}

// Setup comprehensive mocks
vi.mock("../../../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    initializeStateManager: vi.fn(),
}));
vi.mock("../../../../../utils/state/domain/uiStateManager.js", () => ({
    uiStateManager: { initialize: vi.fn() },
}));
vi.mock("../../../../../utils/app/lifecycle/appActions.js", () => ({
    AppActions: { testAction: vi.fn(), anotherAction: vi.fn() },
}));

// Get references to the mocked functions
const mockStateManager = vi.mocked(
    await import("../../../../../utils/state/core/stateManager.js")
);
const mockUIStateManager = vi.mocked(
    await import("../../../../../utils/state/domain/uiStateManager.js")
).uiStateManager;
const mockAppActions = vi.mocked(
    await import("../../../../../utils/app/lifecycle/appActions.js")
).AppActions;

import { initializeAppState } from "../../../../../utils/state/integration/stateIntegration.js";

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
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
} as any;

// Mock performance.memory with proper type handling
const mockPerformance = {
    memory: {
        jsHeapSizeLimit: 1024 * 1024 * 1024, // 1GB
        totalJSHeapSize: 512 * 1024 * 1024, // 512MB
        usedJSHeapSize: 256 * 1024 * 1024, // 256MB
    },
    now: vi.fn(),
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    getEntries: vi.fn(),
    getEntriesByName: vi.fn(),
    getEntriesByType: vi.fn(),
    timeOrigin: 0,
    toJSON: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
} as any;

describe("stateIntegration.js - Comprehensive Coverage", () => {
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
        delete globalThis.rendererUtils;
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
        delete globalThis.rendererUtils;
        delete globalThis.__state_debug;
        delete globalThis.__persistenceTimeout;
        delete globalThis.__performanceMonitoringInterval;
        delete globalThis.__DEVELOPMENT__;
        restoreLocation();

        // Clear any timers
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    describe("StateMigrationHelper class", () => {
        it("should create instance and manage migrations correctly", async () => {
            const { StateMigrationHelper } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            const helper = new StateMigrationHelper();

            // Test initial state
            expect(helper.migrations).toEqual([]);

            // Test adding migrations
            const migration1 = vi.fn();
            const migration2 = vi.fn();

            helper.addMigration(migration1);
            helper.addMigration(migration2);

            expect(helper.migrations).toHaveLength(2);
            expect(helper.migrations).toContain(migration1);
            expect(helper.migrations).toContain(migration2);
        });

        it("should run all migrations successfully", async () => {
            const { StateMigrationHelper } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            const helper = new StateMigrationHelper();
            const migrationEvents: string[] = [];
            const migration1 = vi.fn(async () => {
                migrationEvents.push("first");
            });
            const migration2 = vi.fn(async () => {
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
            const { StateMigrationHelper } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const helper = new StateMigrationHelper();
            const migrationEvents: string[] = [];
            const failingMigration = vi
                .fn()
                .mockRejectedValue(new Error("Migration failed"));
            const successMigration = vi.fn(async () => {
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

    describe("Main initialization functions", () => {
        it("should initialize app state in production mode (smoke)", async () => {
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
            // Set development mode
            globalThis.__DEVELOPMENT__ = true;

            const { initializeAppState } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

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
            const { initializeCompleteStateSystem } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

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

    describe("Integration functions", () => {
        it("should integrate with rendererUtils when available (smoke)", async () => {
            const { integrateWithRendererUtils } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            const mockSetGlobalData = vi.fn();
            const mockGetGlobalData = vi.fn().mockReturnValue({ test: "data" });

            globalThis.rendererUtils = {
                setGlobalData: mockSetGlobalData,
                getGlobalData: mockGetGlobalData,
            };

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            integrateWithRendererUtils();

            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateIntegration] Integrating with rendererUtils..."
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                "[StateIntegration] rendererUtils integration completed"
            );

            // Test wrapped setGlobalData
            const testData = { test: "value" };
            globalThis.rendererUtils.setGlobalData(testData);

            expect(mockStateManager.setState).toHaveBeenCalledWith(
                "globalData",
                testData,
                {
                    source: "rendererUtils.setGlobalData",
                }
            );
            expect(mockSetGlobalData).toHaveBeenCalledWith(testData);

            // Test wrapped getGlobalData
            mockStateManager.getState.mockReturnValue({ test: "fromState" });
            const result = globalThis.rendererUtils.getGlobalData();

            expect(mockStateManager.getState).toHaveBeenCalledWith(
                "globalData"
            );
            expect(result).toEqual({ test: "fromState" });

            consoleSpy.mockRestore();
        });

        it("should handle missing rendererUtils gracefully", async () => {
            const { integrateWithRendererUtils } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            expect(() => integrateWithRendererUtils()).not.toThrow();

            expect(globalThis.rendererUtils).toBeUndefined();
            expect(mockStateManager.setState).not.toHaveBeenCalled();
        });

        it("should migrate chartControlsState when available (smoke)", async () => {
            const { migrateChartControlsState } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

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
            expect(globalThis.chartControlsState.isVisible).toBe(false);

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
            const { migrateChartControlsState } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            expect(() => migrateChartControlsState()).not.toThrow();

            expect(globalThis.chartControlsState).toBeUndefined();
            expect(mockStateManager.setState).not.toHaveBeenCalled();
        });
    });

    describe("Performance monitoring", () => {
        it("should set up performance monitoring with memory info (smoke)", async () => {
            vi.useFakeTimers();
            (globalThis as any).performance = mockPerformance;

            const { setupStatePerformanceMonitoring } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});
            let subscribeCallback: any;

            mockStateManager.subscribe.mockImplementation((path, callback) => {
                subscribeCallback = callback;
                return vi.fn(); // unsubscribe function
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
            vi.useFakeTimers();
            (globalThis as any).performance = mockPerformance;

            // Remove memory from performance mock
            delete (globalThis.performance as any).memory;

            const { setupStatePerformanceMonitoring } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

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

    describe("State persistence", () => {
        it("should set up state persistence and load existing state (smoke)", async () => {
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
                await import("../../../../../utils/state/integration/stateIntegration.js");

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
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error("localStorage not available");
            });

            const { setupStatePersistence } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

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
            mockLocalStorage.getItem.mockReturnValue("invalid json");

            const { setupStatePersistence } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

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

    describe("Utility functions", () => {
        it("should handle nested value operations correctly", async () => {
            vi.useFakeTimers();

            const { setupStatePersistence } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

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
                await import("../../../../../utils/state/integration/stateIntegration.js");

            initializeAppState();

            expect(Object.keys(globalThis.__state_debug).sort()).toEqual(
                expectedDebugKeys
            );
            expectDebugUtilitiesConfigured();
        });

        it("should detect development mode correctly - dev flag", async () => {
            globalThis.__DEVELOPMENT__ = true;

            const { initializeAppState } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            initializeAppState();

            expect(Object.keys(globalThis.__state_debug).sort()).toEqual(
                expectedDebugKeys
            );
            expectDebugUtilitiesConfigured();
        });

        it("should detect development mode correctly - debug param", async () => {
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
                await import("../../../../../utils/state/integration/stateIntegration.js");

            initializeAppState();

            expect(Object.keys(globalThis.__state_debug).sort()).toEqual(
                expectedDebugKeys
            );
            expectDebugUtilitiesConfigured();
        });

        it("should handle development mode detection errors", async () => {
            // Create a location object that throws on property access
            Object.defineProperty(globalThis, "location", {
                get() {
                    throw new Error("Location access error");
                },
                configurable: true,
            });

            const { initializeAppState } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            initializeAppState();

            // Should not crash and should not set up debugging
            expect(globalThis.__state_debug).toBeUndefined();
        });
    });

    describe("Backward compatibility", () => {
        it("should set up globalData property correctly (smoke)", async () => {
            const { initializeAppState } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

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
            const { initializeAppState } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            initializeAppState();

            // Test isChartRendered getter
            mockStateManager.getState.mockReturnValue(true);
            expect(globalThis.isChartRendered).toBe(true);

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
            const { initializeAppState } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

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
            // Set existing properties
            globalThis.globalData = { existing: "data" };
            globalThis.AppState = { existing: "appstate" };

            const { initializeAppState } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            initializeAppState();

            // Should not override existing globalData
            expect(globalThis.globalData).toEqual({ existing: "data" });
            expect(globalThis.AppState).toEqual({ existing: "appstate" });
        });
    });

    describe("Debug utilities", () => {
        it("should set up debug utilities in development mode", async () => {
            globalThis.__DEVELOPMENT__ = true;

            const { initializeAppState } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            initializeAppState();

            expect(Object.keys(globalThis.__state_debug).sort()).toEqual(
                expectedDebugKeys
            );
            expectDebugUtilitiesConfigured();
        });

        it("should expose debug utility functions and reject unknown actions", async () => {
            globalThis.__DEVELOPMENT__ = true;

            const { initializeAppState } =
                await import("../../../../../utils/state/integration/stateIntegration.js");

            const logSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const unsubscribe = vi.fn();
            let watchCallback: any;

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
