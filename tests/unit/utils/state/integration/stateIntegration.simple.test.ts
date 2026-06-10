// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    __resetStateManagerForTests,
    getState,
    setState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";
import * as stateIntegration from "../../../../../electron-app/utils/state/integration/stateIntegration.js";

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

type StateIntegrationTestGlobal = typeof globalThis & {
    __DEVELOPMENT__?: boolean;
    chartControlsState?: ChartControlsState;
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
        expect.assertions(6);
        resetTestEnvironment();

        expect(stateIntegration.StateMigrationHelper).toBeTypeOf("function");
        expect(stateIntegration.initializeAppState).toBeTypeOf("function");
        expect(stateIntegration.initializeCompleteStateSystem).toBeTypeOf(
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
        expect.assertions(6);
        resetTestEnvironment();

        const firstMigration = vi.fn<() => void>();
        const failedMigration = vi.fn<() => void>(() => {
            throw new Error("migration failed");
        });
        const finalMigration = vi.fn<() => Promise<void>>(() =>
            Promise.resolve()
        );
        const consoleError = vi
            .spyOn(console, "error")
            .mockReturnValue(undefined);
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

    it("leaves retired legacy chart controls globals untouched", () => {
        expect.assertions(3);
        resetTestEnvironment();

        const testGlobal = globalThis as StateIntegrationTestGlobal;
        setState("charts.controlsVisible", true);
        testGlobal.chartControlsState = { isVisible: true };

        stateIntegration.migrateChartControlsState();

        expect({
            legacyVisible: testGlobal.chartControlsState?.isVisible,
            stateVisible: getState("charts.controlsVisible"),
        }).toStrictEqual({
            legacyVisible: true,
            stateVisible: true,
        });

        testGlobal.chartControlsState = { isVisible: false };
        expect({
            legacyVisible: testGlobal.chartControlsState.isVisible,
            stateVisible: getState("charts.controlsVisible"),
        }).toStrictEqual({
            legacyVisible: false,
            stateVisible: true,
        });
        expect(
            Object.getOwnPropertyDescriptor(testGlobal, "chartControlsState")
        ).toMatchObject({
            configurable: true,
            value: { isVisible: false },
            writable: true,
        });

        resetTestEnvironment();
    });

    it("loads persisted UI state from localStorage", () => {
        expect.assertions(2);
        resetTestEnvironment();

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
        expect({
            selectedChart: getState("charts.selectedChart"),
            sidebarCollapsed: getState("ui.sidebarCollapsed"),
            theme: getState("ui.theme"),
        }).toStrictEqual({
            selectedChart: "pace",
            sidebarCollapsed: true,
            theme: "dark",
        });

        resetTestEnvironment();
    });

    it("persists subscribed UI state changes after the debounce delay", () => {
        expect.assertions(4);
        resetTestEnvironment();

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
        expect.assertions(2);
        resetTestEnvironment();

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

    it("keeps legacy compatibility globals removed in development mode", () => {
        expect.assertions(8);
        resetTestEnvironment();

        const testGlobal = globalThis as StateIntegrationTestGlobal;
        testGlobal.__DEVELOPMENT__ = true;

        stateIntegration.initializeAppState();

        expect({
            chartRenderedState: getState("charts.isRendered"),
            globalDataState: getState("globalData"),
        }).toStrictEqual({
            chartRenderedState: false,
            globalDataState: undefined,
        });
        expect(
            Object.getOwnPropertyDescriptor(testGlobal, "globalData")
        ).toBeUndefined();
        expect(Object.getOwnPropertyDescriptor(testGlobal, "AppState")).toBe(
            undefined
        );
        expect(
            Object.getOwnPropertyDescriptor(testGlobal, "isChartRendered")
        ).toBeUndefined();
        expect(Object.hasOwn(testGlobal, "AppState")).toBe(false);
        expect(Object.hasOwn(testGlobal, "isChartRendered")).toBe(false);
        setState("charts.isRendered", true, {
            source: "stateIntegration.simple.test",
        });
        expect(getState("charts.isRendered")).toBe(true);
        expect(Object.hasOwn(testGlobal, "__state_debug")).toBe(false);

        resetTestEnvironment();
    });

    it("returns without side effects when optional integration globals are missing", () => {
        expect.assertions(1);
        resetTestEnvironment();

        expect(() =>
            stateIntegration.migrateChartControlsState()
        ).not.toThrow();

        resetTestEnvironment();
    });
});
