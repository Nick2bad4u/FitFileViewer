// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    __resetStateManagerForTests,
    getState,
    setState,
} from "../../../../../utils/state/core/stateManager.js";
import * as stateIntegration from "../../../../../utils/state/integration/stateIntegration.js";

const persistedStateKey = "fitFileViewer_uiState";
const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
);
const originalPerformanceMemoryDescriptor = Object.getOwnPropertyDescriptor(
    globalThis.performance,
    "memory"
);
const hasOriginalPerformanceMemory = Object.hasOwn(
    globalThis.performance,
    "memory"
);

type ChartControlsState = {
    isVisible?: unknown;
};

type PerformanceMemory = {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
};

type RendererUtils = {
    getGlobalData?: () => unknown;
    setGlobalData?: (data: unknown) => unknown;
};

type StateDebugApi = {
    logState: (path?: string) => unknown;
    setState: typeof setState;
    triggerAction: (actionName: string, ...args: unknown[]) => unknown;
    watchState: (path: string) => () => void;
};

type StateIntegrationTestGlobal = typeof globalThis & {
    __DEVELOPMENT__?: boolean;
    __performanceMonitoringInterval?: ReturnType<typeof setInterval>;
    __persistenceTimeout?: ReturnType<typeof setTimeout>;
    __state_debug?: StateDebugApi;
    AppState?: {
        eventListeners: unknown;
        globalData: unknown;
        isChartRendered: unknown;
    };
    chartControlsState?: ChartControlsState;
    rendererUtils?: RendererUtils;
};

type StorageFixture = {
    readonly storage: Storage;
    readonly store: Map<string, string>;
};

function createStorageFixture(initialEntries = {}): StorageFixture {
    const store = new Map(Object.entries(initialEntries));
    const storage = {
        clear: vi.fn<Storage["clear"]>(() => {
            store.clear();
        }),
        getItem: vi.fn<Storage["getItem"]>(
            (key: string) => store.get(key) ?? null
        ),
        key: vi.fn<Storage["key"]>((index: number) => {
            const key = Array.from(store.keys()).at(index);
            return key ?? null;
        }),
        get length() {
            return store.size;
        },
        removeItem: vi.fn<Storage["removeItem"]>((key: string) => {
            store.delete(key);
        }),
        setItem: vi.fn<Storage["setItem"]>((key: string, value: string) => {
            store.set(key, value);
        }),
    };

    return { storage: storage as Storage, store };
}

function deleteIntegrationGlobals(): void {
    const testGlobal = globalThis as StateIntegrationTestGlobal;

    Reflect.deleteProperty(testGlobal, "__DEVELOPMENT__");
    Reflect.deleteProperty(testGlobal, "__performanceMonitoringInterval");
    Reflect.deleteProperty(testGlobal, "__persistenceTimeout");
    Reflect.deleteProperty(testGlobal, "__state_debug");
    Reflect.deleteProperty(testGlobal, "AppState");
    Reflect.deleteProperty(testGlobal, "chartControlsState");
    Reflect.deleteProperty(testGlobal, "globalData");
    Reflect.deleteProperty(testGlobal, "isChartRendered");
    Reflect.deleteProperty(testGlobal, "rendererUtils");
}

function installLocalStorage(storage: Storage): void {
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: storage,
    });
}

function installPerformanceMemory(memory: PerformanceMemory): void {
    Object.defineProperty(globalThis.performance, "memory", {
        configurable: true,
        value: memory,
    });
}

function resetTestEnvironment(): void {
    const testGlobal = globalThis as StateIntegrationTestGlobal;

    if (
        testGlobal.__performanceMonitoringInterval !== undefined &&
        typeof globalThis.clearInterval === "function"
    ) {
        globalThis.clearInterval(testGlobal.__performanceMonitoringInterval);
    }

    if (
        testGlobal.__persistenceTimeout !== undefined &&
        typeof globalThis.clearTimeout === "function"
    ) {
        globalThis.clearTimeout(testGlobal.__persistenceTimeout);
    }

    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    __resetStateManagerForTests();
    deleteIntegrationGlobals();
    restoreGlobalProperty("localStorage", originalLocalStorageDescriptor);
    restorePerformanceMemory();
}

function restoreGlobalProperty(
    propertyName: "localStorage",
    descriptor: PropertyDescriptor | undefined
): void {
    if (descriptor) {
        Object.defineProperty(globalThis, propertyName, descriptor);
        return;
    }

    Reflect.deleteProperty(globalThis, propertyName);
}

function restorePerformanceMemory(): void {
    if (hasOriginalPerformanceMemory && originalPerformanceMemoryDescriptor) {
        Object.defineProperty(
            globalThis.performance,
            "memory",
            originalPerformanceMemoryDescriptor
        );
        return;
    }

    Reflect.deleteProperty(globalThis.performance, "memory");
}

describe("stateIntegration.js - Essential Coverage", () => {
    it("exports the state integration public API", () => {
        resetTestEnvironment();
        expect.assertions(7);

        expect(stateIntegration.StateMigrationHelper).toBeTypeOf("function");
        expect(stateIntegration.initializeAppState).toBeTypeOf("function");
        expect(stateIntegration.initializeCompleteStateSystem).toBeTypeOf(
            "function"
        );
        expect(stateIntegration.integrateWithRendererUtils).toBeTypeOf(
            "function"
        );
        expect(stateIntegration.migrateChartControlsState).toBeTypeOf(
            "function"
        );
        expect(stateIntegration.setupStatePerformanceMonitoring).toBeTypeOf(
            "function"
        );
        expect(stateIntegration.setupStatePersistence).toBeTypeOf("function");

        resetTestEnvironment();
    });

    it("runs every migration and logs failures without aborting later migrations", async () => {
        resetTestEnvironment();
        expect.assertions(6);

        const firstMigration = vi.fn<() => void>();
        const failedMigration = vi.fn<() => void>(() => {
            throw new Error("migration failed");
        });
        const finalMigration = vi.fn<() => Promise<void>>(() =>
            Promise.resolve()
        );
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        const helper = new stateIntegration.StateMigrationHelper();

        helper.addMigration(firstMigration);
        helper.addMigration(failedMigration);
        helper.addMigration(finalMigration);

        await expect(helper.runMigrations()).resolves.toBeUndefined();

        expect(firstMigration).toHaveBeenCalledOnce();
        expect(failedMigration).toHaveBeenCalledOnce();
        expect(finalMigration).toHaveBeenCalledOnce();
        expect(consoleError).toHaveBeenCalledWith(
            "[StateMigration] Migration failed:",
            expect.any(Error)
        );
        expect(firstMigration).toHaveBeenCalledBefore(finalMigration);

        resetTestEnvironment();
    });

    it("migrates legacy chart controls to reactive state accessors", () => {
        resetTestEnvironment();
        expect.assertions(4);

        const testGlobal = globalThis as StateIntegrationTestGlobal;
        testGlobal.chartControlsState = { isVisible: true };

        stateIntegration.migrateChartControlsState();

        expect(getState("charts.controlsVisible")).toBe(true);
        expect(testGlobal.chartControlsState?.isVisible).toBe(true);

        testGlobal.chartControlsState = testGlobal.chartControlsState ?? {};
        testGlobal.chartControlsState.isVisible = false;
        expect(getState("charts.controlsVisible")).toBe(false);

        setState("charts.controlsVisible", true);
        expect(testGlobal.chartControlsState.isVisible).toBe(true);

        resetTestEnvironment();
    });

    it("wraps rendererUtils global-data access through the state manager", () => {
        resetTestEnvironment();
        expect.assertions(4);

        const originalSetGlobalData = vi.fn<(data: unknown) => string>(
            () => "stored"
        );
        const testGlobal = globalThis as StateIntegrationTestGlobal;
        testGlobal.rendererUtils = {
            getGlobalData: vi.fn<() => unknown>(() => ({ stale: true })),
            setGlobalData: originalSetGlobalData,
        };

        stateIntegration.integrateWithRendererUtils();

        const firstData = { activityId: "activity-1" };
        expect(testGlobal.rendererUtils.setGlobalData?.(firstData)).toBe(
            "stored"
        );
        expect(originalSetGlobalData).toHaveBeenCalledWith(firstData);
        expect(getState("globalData")).toEqual(firstData);

        const secondData = { activityId: "activity-2" };
        setState("globalData", secondData);
        expect(testGlobal.rendererUtils.getGlobalData?.()).toEqual(secondData);

        resetTestEnvironment();
    });

    it("loads persisted UI state from localStorage", () => {
        resetTestEnvironment();
        expect.assertions(4);

        const storageFixture = createStorageFixture({
            [persistedStateKey]: JSON.stringify({
                charts: { controlsVisible: false, selectedChart: "pace" },
                ui: { sidebarCollapsed: true, theme: "dark" },
            }),
        });
        installLocalStorage(storageFixture.storage);

        stateIntegration.setupStatePersistence();

        expect(storageFixture.storage.getItem).toHaveBeenCalledWith(
            persistedStateKey
        );
        expect(getState("ui.theme")).toBe("dark");
        expect(getState("ui.sidebarCollapsed")).toBe(true);
        expect(getState("charts.selectedChart")).toBe("pace");

        resetTestEnvironment();
    });

    it("persists subscribed UI state changes after the debounce delay", () => {
        resetTestEnvironment();
        expect.assertions(4);

        vi.useFakeTimers();
        const storageFixture = createStorageFixture();
        installLocalStorage(storageFixture.storage);

        stateIntegration.setupStatePersistence();
        setState("ui.theme", "dark");
        vi.advanceTimersByTime(500);

        const savedState = storageFixture.store.get(persistedStateKey);
        expect(storageFixture.storage.setItem).toHaveBeenCalledWith(
            persistedStateKey,
            expect.any(String)
        );
        expect(savedState).toBeTypeOf("string");

        const parsedState = JSON.parse(savedState ?? "{}") as {
            ui?: { theme?: string };
        };
        expect(parsedState.ui?.theme).toBe("dark");
        expect(parsedState.ui?.theme).not.toBe("light");

        resetTestEnvironment();
    });

    it("publishes memory usage while performance monitoring is enabled", () => {
        resetTestEnvironment();
        expect.assertions(2);

        vi.useFakeTimers();
        installPerformanceMemory({
            jsHeapSizeLimit: 1024 * 1024 * 1024,
            totalJSHeapSize: 512 * 1024 * 1024,
            usedJSHeapSize: 256 * 1024 * 1024,
        });

        stateIntegration.setupStatePerformanceMonitoring();
        vi.advanceTimersByTime(30_000);

        expect(getState("performance.memoryUsage")).toEqual({
            limit: 1024,
            total: 512,
            used: 256,
        });
        expect(getState("performance.memoryUsage")).not.toEqual({
            limit: 0,
            total: 0,
            used: 0,
        });

        resetTestEnvironment();
    });

    it("initializes compatibility globals and development debug utilities", () => {
        resetTestEnvironment();
        expect.assertions(8);

        const testGlobal = globalThis as StateIntegrationTestGlobal;
        testGlobal.__DEVELOPMENT__ = true;

        stateIntegration.initializeAppState();

        testGlobal.globalData = { loaded: true };
        testGlobal.isChartRendered = true;

        expect(getState("globalData")).toEqual({ loaded: true });
        expect(getState("charts.isRendered")).toBe(true);
        expect(testGlobal.AppState?.globalData).toEqual({ loaded: true });
        expect(testGlobal.AppState?.isChartRendered).toBe(true);
        expect(testGlobal.__state_debug?.logState).toBeTypeOf("function");
        expect(testGlobal.__state_debug?.setState).toBe(setState);
        expect(testGlobal.__state_debug?.triggerAction("missingAction")).toBe(
            undefined
        );
        expect(testGlobal.__state_debug?.watchState("ui.theme")).toBeTypeOf(
            "function"
        );

        resetTestEnvironment();
    });

    it("returns without side effects when optional integration globals are missing", () => {
        resetTestEnvironment();
        expect.assertions(3);

        expect(() =>
            stateIntegration.integrateWithRendererUtils()
        ).not.toThrow();
        expect(() =>
            stateIntegration.migrateChartControlsState()
        ).not.toThrow();
        expect((globalThis as StateIntegrationTestGlobal).rendererUtils).toBe(
            undefined
        );

        resetTestEnvironment();
    });
});
