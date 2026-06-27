// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    __resetStateManagerForTests,
    getState,
    setState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";
import * as stateIntegration from "../../../../../electron-app/utils/state/integration/stateIntegration.js";

const persistedStateKey = "fitFileViewer_uiState";
const originalLocalStorageDescriptor =
    getGlobalRestoreDescriptor("localStorage");
const originalPerformanceMemoryDescriptor =
    getPerformanceMemoryRestoreDescriptor();

type PerformanceMemory = {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
};

type StorageFixture = {
    readonly storage: Storage;
    readonly store: Map<string, string>;
};

function getGlobalRestoreDescriptor(
    propertyName: "localStorage"
): PropertyDescriptor {
    return (
        Object.getOwnPropertyDescriptor(globalThis, propertyName) ?? {
            configurable: true,
            value: undefined,
            writable: true,
        }
    );
}

function getPerformanceMemoryRestoreDescriptor(): PropertyDescriptor {
    return (
        Object.getOwnPropertyDescriptor(globalThis.performance, "memory") ?? {
            configurable: true,
            value: undefined,
            writable: true,
        }
    );
}

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
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    __resetStateManagerForTests();
    restoreGlobalProperty("localStorage", originalLocalStorageDescriptor);
    restorePerformanceMemory();
}

function restoreGlobalProperty(
    propertyName: "localStorage",
    descriptor: PropertyDescriptor
): void {
    Object.defineProperty(globalThis, propertyName, descriptor);
}

function restorePerformanceMemory(): void {
    Object.defineProperty(
        globalThis.performance,
        "memory",
        originalPerformanceMemoryDescriptor
    );
}

describe("stateIntegration.js - Essential Coverage", () => {
    it("exports the state integration public API", () => {
        expect.assertions(4);
        resetTestEnvironment();

        expect(stateIntegration.initializeAppState).toBeTypeOf("function");
        expect(stateIntegration.initializeCompleteStateSystem).toBeTypeOf(
            "function"
        );
        expect(stateIntegration.setupStatePerformanceMonitoring).toBeTypeOf(
            "function"
        );
        expect(stateIntegration.setupStatePersistence).toBeTypeOf("function");

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

    it("keeps legacy compatibility globals removed during initialization", () => {
        expect.assertions(8);
        resetTestEnvironment();

        const testGlobal = globalThis;

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
});
