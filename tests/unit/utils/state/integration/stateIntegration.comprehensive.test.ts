// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

type StateSubscriber = (newValue?: unknown, oldValue?: unknown) => void;
type StateUnsubscribe = () => void;
type RetiredStateGlobalName =
    | "AppState"
    | "__performanceMonitoringInterval"
    | "__persistenceTimeout"
    | "globalData"
    | "isChartRendered";
type TestGlobalProperty = "localStorage" | "performance";

function getRetiredGlobalDescriptor(
    name: RetiredStateGlobalName | "__state_debug"
): PropertyDescriptor | undefined {
    return Object.getOwnPropertyDescriptor(globalThis, name);
}

const originalGlobalDescriptors = new Map<
    TestGlobalProperty,
    PropertyDescriptor
>();

function getGlobalRestoreDescriptor(
    name: TestGlobalProperty
): PropertyDescriptor {
    return (
        Object.getOwnPropertyDescriptor(globalThis, name) ?? {
            configurable: true,
            value: undefined,
            writable: true,
        }
    );
}

function setTestGlobal(name: TestGlobalProperty, value: unknown): void {
    if (!originalGlobalDescriptors.has(name)) {
        originalGlobalDescriptors.set(name, getGlobalRestoreDescriptor(name));
    }

    Object.defineProperty(globalThis, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreTestGlobals(): void {
    for (const [name, descriptor] of [
        ...originalGlobalDescriptors.entries(),
    ].reverse()) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

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
// Get references to the mocked functions
const mockStateManager = vi.mocked(
    await import("../../../../../electron-app/utils/state/core/stateManager.js")
);
const mockUIStateManager = vi.mocked(
    await import("../../../../../electron-app/utils/state/domain/uiStateManager.js")
).uiStateManager;

import { initializeAppState } from "../../../../../electron-app/utils/state/integration/stateIntegration.js";

const originalLocationDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "location"
);

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
    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();

        // Setup mocks
        setTestGlobal("localStorage", mockLocalStorage);
        setTestGlobal("performance", mockPerformance);

        restoreLocation();
    });

    afterEach(() => {
        // Restore original globals
        restoreTestGlobals();

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
            expect(getRetiredGlobalDescriptor("globalData")).toBeUndefined();
            expect(getRetiredGlobalDescriptor("__state_debug")).toBeUndefined();

            consoleSpy.mockRestore();
        });

        it("should initialize app state without debug globals (smoke)", async () => {
            expect.assertions(3);

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
            expect(getRetiredGlobalDescriptor("__state_debug")).toBeUndefined();

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

            expect(getRetiredGlobalDescriptor("globalData")).toBeUndefined();
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

    describe("performance monitoring", () => {
        it("should set up performance monitoring with memory info (smoke)", async () => {
            expect.assertions(3);

            vi.useFakeTimers();
            setTestGlobal("performance", mockPerformance);

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
            expect(
                Object.hasOwn(globalThis, "__performanceMonitoringInterval")
            ).toBe(false);

            consoleSpy.mockRestore();
            vi.useRealTimers();
        });

        it("should handle missing performance.memory gracefully", async () => {
            expect.assertions(3);

            vi.useFakeTimers();
            setTestGlobal("performance", mockPerformance);

            // Remove memory from performance mock
            delete (globalThis.performance as any).memory;

            const { setupStatePerformanceMonitoring } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            expect(() => setupStatePerformanceMonitoring()).not.toThrow();

            // Fast forward timers
            vi.advanceTimersByTime(60000);

            expect(
                Object.hasOwn(globalThis, "__performanceMonitoringInterval")
            ).toBe(false);
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
            expect(Object.hasOwn(globalThis, "__persistenceTimeout")).toBe(
                false
            );

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
            expect(Object.hasOwn(globalThis, "__persistenceTimeout")).toBe(
                false
            );

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

        it("should initialize localhost without publishing state debug globals", async () => {
            expect.assertions(2);

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

            expect(
                mockStateManager.initializeStateManager
            ).toHaveBeenCalledOnce();
            expect(getRetiredGlobalDescriptor("__state_debug")).toBeUndefined();
        });

        it("should initialize without publishing state debug globals", async () => {
            expect.assertions(2);

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            initializeAppState();

            expect(
                mockStateManager.initializeStateManager
            ).toHaveBeenCalledOnce();
            expect(getRetiredGlobalDescriptor("__state_debug")).toBeUndefined();
        });

        it("should initialize debug param mode without publishing state debug globals", async () => {
            expect.assertions(2);

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

            expect(
                mockStateManager.initializeStateManager
            ).toHaveBeenCalledOnce();
            expect(getRetiredGlobalDescriptor("__state_debug")).toBeUndefined();
        });

        it("should initialize when location access throws", async () => {
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

            // Startup should not depend on browser location access.
            expect(getRetiredGlobalDescriptor("__state_debug")).toBeUndefined();
        });
    });

    describe("retired globals", () => {
        it("should leave removed compatibility globals absent (smoke)", async () => {
            expect.assertions(4);

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            initializeAppState();

            expect(getRetiredGlobalDescriptor("globalData")).toBeUndefined();
            expect(getRetiredGlobalDescriptor("AppState")).toBeUndefined();
            expect(
                getRetiredGlobalDescriptor("isChartRendered")
            ).toBeUndefined();
            expect(mockStateManager.setState).not.toHaveBeenCalledWith(
                "charts.isRendered",
                expect.anything(),
                expect.objectContaining({
                    source: expect.stringContaining("isChartRendered"),
                })
            );
        });
    });

    describe("debug utilities", () => {
        it("should keep state debug globals absent", async () => {
            expect.assertions(3);

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            initializeAppState();

            expect(
                mockStateManager.initializeStateManager
            ).toHaveBeenCalledOnce();
            expect(mockUIStateManager.initialize).toHaveBeenCalledOnce();
            expect(getRetiredGlobalDescriptor("__state_debug")).toBeUndefined();
        });

        it("should not expose global debug utility actions", async () => {
            expect.assertions(4);

            const { initializeAppState } =
                await import("../../../../../electron-app/utils/state/integration/stateIntegration.js");

            mockStateManager.getState.mockReturnValue({ id: 1 });

            initializeAppState();

            expect(
                mockStateManager.initializeStateManager
            ).toHaveBeenCalledOnce();
            expect(mockUIStateManager.initialize).toHaveBeenCalledOnce();
            expect(mockStateManager.getState).not.toHaveBeenCalled();
            expect(getRetiredGlobalDescriptor("__state_debug")).toBeUndefined();
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
