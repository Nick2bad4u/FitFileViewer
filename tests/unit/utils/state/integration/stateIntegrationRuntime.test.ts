import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getStateIntegrationRuntime,
    type StateIntegrationRuntimeScope,
} from "../../../../../electron-app/utils/state/integration/stateIntegrationRuntime.js";

function createRuntimeScope(
    overrides: Partial<StateIntegrationRuntimeScope> = {}
): StateIntegrationRuntimeScope {
    return {
        dateNow: vi.fn<() => number>(() => 42),
        getClearInterval: () => vi.fn<typeof globalThis.clearInterval>(),
        getClearTimeout: () => vi.fn<typeof globalThis.clearTimeout>(),
        getSetInterval: () => vi.fn<typeof globalThis.setInterval>(),
        getSetTimeout: () => vi.fn<typeof globalThis.setTimeout>(),
        ...overrides,
    };
}

describe("getStateIntegrationRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("routes timers, clock, storage, and performance memory through the injected scope", () => {
        expect.assertions(9);

        const intervalCallback = vi.fn<() => void>();
        const timeoutCallback = vi.fn<() => void>();
        const interval = 11 as ReturnType<typeof globalThis.setInterval>;
        const timeout = 13 as ReturnType<typeof globalThis.setTimeout>;
        const storage = {} as Storage;
        const performanceMemory = {
            jsHeapSizeLimit: 3,
            totalJSHeapSize: 2,
            usedJSHeapSize: 1,
        };
        const setInterval = vi.fn<typeof globalThis.setInterval>(
            () => interval
        );
        const clearInterval = vi.fn<typeof globalThis.clearInterval>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timeout);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
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
            dateNow,
            getClearInterval: () => clearInterval,
            getClearTimeout: () => clearTimeout,
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
                    1 as ReturnType<typeof globalThis.setInterval>
                ),
        ],
        [
            "clearTimeout",
            { getClearTimeout: () => undefined },
            (scope: StateIntegrationRuntimeScope) =>
                getStateIntegrationRuntime(scope).clearTimeout(
                    1 as ReturnType<typeof globalThis.setTimeout>
                ),
        ],
        [
            "dateNow",
            { dateNow: undefined },
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

    it("ignores legacy direct timer, storage, and performance runtime properties", () => {
        expect.assertions(12);

        const intervalCallback = vi.fn<() => void>();
        const timeoutCallback = vi.fn<() => void>();
        const interval = 11 as ReturnType<typeof globalThis.setInterval>;
        const timeout = 13 as ReturnType<typeof globalThis.setTimeout>;
        const storage = {} as Storage;
        const performanceMemory = {
            jsHeapSizeLimit: 3,
            totalJSHeapSize: 2,
            usedJSHeapSize: 1,
        };
        const clearInterval = vi.fn<typeof globalThis.clearInterval>();
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const setInterval = vi.fn<typeof globalThis.setInterval>(
            () => interval
        );
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timeout);
        const runtime = getStateIntegrationRuntime({
            clearInterval,
            clearTimeout,
            dateNow: vi.fn<() => number>(() => 42),
            localStorage: storage,
            performance: { memory: performanceMemory },
            setInterval,
            setTimeout,
        } as unknown as StateIntegrationRuntimeScope);

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
        expect(runtime.dateNow()).toBe(42);
        expect(runtime.getStorage()).toBeUndefined();
        expect(runtime.getPerformanceMemory()).toBeUndefined();
        expect(setInterval).not.toHaveBeenCalled();
        expect(clearInterval).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(intervalCallback).not.toHaveBeenCalled();
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(8);

        const intervalCallback = vi.fn<() => void>();
        const timeoutCallback = vi.fn<() => void>();
        const intervalDelayMs = Number("30000");
        const timeoutDelayMs = Number("500");
        const interval = 11 as ReturnType<typeof globalThis.setInterval>;
        const timeout = 13 as ReturnType<typeof globalThis.setTimeout>;
        const storage = {} as Storage;
        const performanceMemory = {
            jsHeapSizeLimit: 3,
            totalJSHeapSize: 2,
            usedJSHeapSize: 1,
        };
        const clearInterval = vi.fn<typeof globalThis.clearInterval>();
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const setInterval = vi.fn<typeof globalThis.setInterval>(
            () => interval
        );
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timeout);
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
        expect(runtime.getStorage()).toBe(storage);
        expect(runtime.getPerformanceMemory()).toBe(performanceMemory);
    });
});
