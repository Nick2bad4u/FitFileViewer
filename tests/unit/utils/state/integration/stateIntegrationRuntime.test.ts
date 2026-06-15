import { describe, expect, it, vi } from "vitest";

import {
    getStateIntegrationRuntime,
    type StateIntegrationRuntimeScope,
} from "../../../../../electron-app/utils/state/integration/stateIntegrationRuntime.js";

function createRuntimeScope(
    overrides: Partial<StateIntegrationRuntimeScope> = {}
): StateIntegrationRuntimeScope {
    return {
        clearInterval: vi.fn<typeof globalThis.clearInterval>(),
        clearTimeout: vi.fn<typeof globalThis.clearTimeout>(),
        dateNow: vi.fn<() => number>(() => 42),
        setInterval: vi.fn<typeof globalThis.setInterval>(),
        setTimeout: vi.fn<typeof globalThis.setTimeout>(),
        ...overrides,
    };
}

describe("getStateIntegrationRuntime", () => {
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
            clearInterval,
            clearTimeout,
            dateNow,
            localStorage: storage,
            performance: { memory: performanceMemory },
            setInterval,
            setTimeout,
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
            { clearInterval: undefined },
            (scope: StateIntegrationRuntimeScope) =>
                getStateIntegrationRuntime(scope).clearInterval(
                    1 as ReturnType<typeof globalThis.setInterval>
                ),
        ],
        [
            "clearTimeout",
            { clearTimeout: undefined },
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
            { setInterval: undefined },
            (scope: StateIntegrationRuntimeScope) =>
                getStateIntegrationRuntime(scope).setInterval(vi.fn(), 1),
        ],
        [
            "setTimeout",
            { setTimeout: undefined },
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
});
