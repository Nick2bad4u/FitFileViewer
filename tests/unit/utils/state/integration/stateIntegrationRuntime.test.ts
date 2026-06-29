import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserClearInterval,
    BrowserClearTimeout,
    BrowserIntervalHandle,
    BrowserSetInterval,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getStateIntegrationRuntime,
    type StateIntegrationInterval,
    type StateIntegrationRuntimeScope,
    type StateIntegrationTimeout,
} from "../../../../../electron-app/utils/state/integration/stateIntegrationRuntime.js";

function createRuntimeScope(
    overrides: Partial<StateIntegrationRuntimeScope> = {}
): StateIntegrationRuntimeScope {
    return {
        getClearInterval: () => vi.fn<BrowserClearInterval>(),
        getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
        getDateNow: () => vi.fn<() => number>(() => 42),
        getLocalStorage: () => undefined,
        getPerformance: () => undefined,
        getSetInterval: () => vi.fn<BrowserSetInterval>(),
        getSetTimeout: () => vi.fn<BrowserSetTimeout>(),
        ...overrides,
    };
}

describe("getStateIntegrationRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("routes timers, clock, storage, and performance memory through the injected scope", () => {
        expect.assertions(9);

        const intervalCallback = vi.fn<() => void>();
        const timeoutCallback = vi.fn<() => void>();
        const interval = 11 as StateIntegrationInterval;
        const timeout = 13 as StateIntegrationTimeout;
        const storage = {} as Storage;
        const performanceMemory = {
            jsHeapSizeLimit: 3,
            totalJSHeapSize: 2,
            usedJSHeapSize: 1,
        };
        const setInterval = vi.fn<BrowserSetInterval>(() => interval);
        const clearInterval = vi.fn<BrowserClearInterval>();
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timeout);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const dateNow = vi.fn<() => number>(() => 42);
        const {
            clearInterval: clearScheduledInterval,
            clearTimeout: clearScheduledTimeout,
            dateNow: readDateNow,
            getPerformanceMemory,
            getStorage,
            setInterval: scheduleInterval,
            setTimeout: scheduleTimeout,
        } = getStateIntegrationRuntime({
            getClearInterval: () => clearInterval,
            getClearTimeout: () => clearTimeout,
            getDateNow: () => dateNow,
            getLocalStorage: () => storage,
            getPerformance: () => ({ memory: performanceMemory }),
            getSetInterval: () => setInterval,
            getSetTimeout: () => setTimeout,
        });

        expect(scheduleInterval(intervalCallback, 30_000)).toBe(interval);
        clearScheduledInterval(interval);
        expect(scheduleTimeout(timeoutCallback, 500)).toBe(timeout);
        clearScheduledTimeout(timeout);

        expect(setInterval).toHaveBeenCalledWith(intervalCallback, 30_000);
        expect(clearInterval).toHaveBeenCalledWith(interval);
        expect(setTimeout).toHaveBeenCalledWith(timeoutCallback, 500);
        expect(clearTimeout).toHaveBeenCalledWith(timeout);
        expect(readDateNow()).toBe(42);
        expect(getStorage()).toBe(storage);
        expect(getPerformanceMemory()).toBe(performanceMemory);
    });

    it.each([
        [
            "clearInterval",
            { getClearInterval: () => undefined },
            (scope: StateIntegrationRuntimeScope) =>
                getStateIntegrationRuntime(scope).clearInterval(
                    1 as BrowserIntervalHandle
                ),
        ],
        [
            "clearTimeout",
            { getClearTimeout: () => undefined },
            (scope: StateIntegrationRuntimeScope) =>
                getStateIntegrationRuntime(scope).clearTimeout(
                    1 as BrowserTimerHandle
                ),
        ],
        [
            "dateNow",
            { getDateNow: () => undefined },
            (scope: StateIntegrationRuntimeScope) =>
                getStateIntegrationRuntime(scope).dateNow(),
        ],
        [
            "setInterval",
            { getSetInterval: () => undefined },
            (scope: StateIntegrationRuntimeScope) =>
                getStateIntegrationRuntime(scope).setInterval(vi.fn(), 1),
        ],
        [
            "setTimeout",
            { getSetTimeout: () => undefined },
            (scope: StateIntegrationRuntimeScope) =>
                getStateIntegrationRuntime(scope).setTimeout(vi.fn(), 1),
        ],
    ] satisfies [
        string,
        Partial<StateIntegrationRuntimeScope>,
        (scope: StateIntegrationRuntimeScope) => unknown,
    ][])(
        "requires an explicit %s runtime",
        (runtimeName, overrides, useRuntime) => {
            expect.assertions(1);

            expect(() => useRuntime(createRuntimeScope(overrides))).toThrow(
                `stateIntegrationRuntime requires ${runtimeName}`
            );
        }
    );

    it("requires explicit provider slots", () => {
        expect.assertions(7);

        const missingProviders = {} as unknown as StateIntegrationRuntimeScope;
        const runtime = getStateIntegrationRuntime(missingProviders);

        expect(() => runtime.clearInterval(1 as BrowserIntervalHandle)).toThrow(
            "stateIntegrationRuntime requires clearInterval provider"
        );
        expect(() => runtime.clearTimeout(1 as BrowserTimerHandle)).toThrow(
            "stateIntegrationRuntime requires clearTimeout provider"
        );
        expect(() => runtime.dateNow()).toThrow(
            "stateIntegrationRuntime requires dateNow provider"
        );
        expect(() => runtime.getPerformanceMemory()).toThrow(
            "stateIntegrationRuntime requires performance provider"
        );
        expect(() => runtime.getStorage()).toThrow(
            "stateIntegrationRuntime requires localStorage provider"
        );
        expect(() => runtime.setInterval(vi.fn(), 1)).toThrow(
            "stateIntegrationRuntime requires setInterval provider"
        );
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "stateIntegrationRuntime requires setTimeout provider"
        );
    });

    it("ignores legacy direct timer, storage, and performance runtime properties", () => {
        expect.assertions(13);

        const intervalCallback = vi.fn<() => void>();
        const timeoutCallback = vi.fn<() => void>();
        const interval = 11 as BrowserIntervalHandle;
        const timeout = 13 as BrowserTimerHandle;
        const storage = {} as Storage;
        const performanceMemory = {
            jsHeapSizeLimit: 3,
            totalJSHeapSize: 2,
            usedJSHeapSize: 1,
        };
        const clearInterval = vi.fn<BrowserClearInterval>();
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const setInterval = vi.fn<BrowserSetInterval>(() => interval);
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timeout);
        const legacyScope = {
            clearInterval,
            clearTimeout,
            dateNow: vi.fn<() => number>(() => 42),
            localStorage: storage,
            performance: { memory: performanceMemory },
            setInterval,
            setTimeout,
        } as unknown as StateIntegrationRuntimeScope;
        const runtime = getStateIntegrationRuntime({
            ...legacyScope,
            getClearInterval: () => undefined,
            getClearTimeout: () => undefined,
            getDateNow: () => undefined,
            getLocalStorage: () => undefined,
            getPerformance: () => undefined,
            getSetInterval: () => undefined,
            getSetTimeout: () => undefined,
        });

        expect(() =>
            getStateIntegrationRuntime(legacyScope).setInterval(
                intervalCallback,
                30_000
            )
        ).toThrow("stateIntegrationRuntime requires setInterval provider");

        expect(() => runtime.setInterval(intervalCallback, 30_000)).toThrow(
            "stateIntegrationRuntime requires setInterval"
        );
        expect(() => runtime.clearInterval(interval)).toThrow(
            "stateIntegrationRuntime requires clearInterval"
        );
        expect(() => runtime.setTimeout(timeoutCallback, 500)).toThrow(
            "stateIntegrationRuntime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(timeout)).toThrow(
            "stateIntegrationRuntime requires clearTimeout"
        );
        expect(() => runtime.dateNow()).toThrow(
            "stateIntegrationRuntime requires dateNow"
        );
        expect(runtime.getStorage()).toBeUndefined();
        expect(runtime.getPerformanceMemory()).toBeUndefined();
        expect(setInterval).not.toHaveBeenCalled();
        expect(clearInterval).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(intervalCallback).not.toHaveBeenCalled();
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(10);

        const intervalCallback = vi.fn<() => void>();
        const timeoutCallback = vi.fn<() => void>();
        const intervalDelayMs = Number("30000");
        const timeoutDelayMs = Number("500");
        const interval = 11 as BrowserIntervalHandle;
        const timeout = 13 as BrowserTimerHandle;
        const storage = {} as Storage;
        const performanceMemory = {
            jsHeapSizeLimit: 3,
            totalJSHeapSize: 2,
            usedJSHeapSize: 1,
        };
        const clearInterval = vi.fn<BrowserClearInterval>();
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const dateNow = vi.spyOn(Date, "now").mockReturnValue(1234);
        const setInterval = vi.fn<BrowserSetInterval>(() => interval);
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timeout);
        const runtime = getStateIntegrationRuntime();

        vi.stubGlobal("clearInterval", clearInterval);
        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("localStorage", storage);
        vi.stubGlobal("performance", { memory: performanceMemory });
        vi.stubGlobal("setInterval", setInterval);
        vi.stubGlobal("setTimeout", setTimeout);

        expect(runtime.setInterval(intervalCallback, intervalDelayMs)).toBe(
            interval
        );
        runtime.clearInterval(interval);
        expect(runtime.setTimeout(timeoutCallback, timeoutDelayMs)).toBe(
            timeout
        );
        runtime.clearTimeout(timeout);

        expect(setInterval).toHaveBeenCalledWith(
            intervalCallback,
            intervalDelayMs
        );
        expect(clearInterval).toHaveBeenCalledWith(interval);
        expect(setTimeout).toHaveBeenCalledWith(
            timeoutCallback,
            timeoutDelayMs
        );
        expect(clearTimeout).toHaveBeenCalledWith(timeout);
        expect(runtime.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
        expect(runtime.getStorage()).toBe(storage);
        expect(runtime.getPerformanceMemory()).toBe(performanceMemory);
    });
});
