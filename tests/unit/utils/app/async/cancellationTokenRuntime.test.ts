import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getCancellationTokenRuntime,
    type CancellationTokenRuntimeScope,
} from "../../../../../electron-app/utils/app/async/cancellationTokenRuntime.js";

describe("getCancellationTokenRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("125");
        const timer = 31 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();

        vi.stubGlobal("setTimeout", setTimeout);
        vi.stubGlobal("clearTimeout", clearTimeout);

        const runtime = getCancellationTokenRuntime();

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("125");
        const scheduledCalls: { callback: () => void; timeout: number }[] = [];
        const clearedHandles: unknown[] = [];
        const runtime = getCancellationTokenRuntime({
            getClearTimeout: () => (handle) => {
                clearedHandles.push(handle);
            },
            getSetTimeout: () => (scheduledCallback, timeout) => {
                scheduledCalls.push({
                    callback: scheduledCallback,
                    timeout,
                });
                return 31;
            },
        });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(31);
        expect(scheduledCalls).toStrictEqual([
            { callback, timeout: timeoutMs },
        ]);

        runtime.clearTimeout(31);

        expect(clearedHandles).toStrictEqual([31]);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getCancellationTokenRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "cancellationTokenRuntime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "cancellationTokenRuntime requires clearTimeout"
        );
    });

    it("ignores legacy direct timer properties", () => {
        expect.assertions(4);

        const setTimeout = vi.fn(() => 43);
        const clearTimeout = vi.fn();
        const runtime = getCancellationTokenRuntime({
            clearTimeout,
            setTimeout,
        } as unknown as CancellationTokenRuntimeScope);

        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "cancellationTokenRuntime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(43)).toThrow(
            "cancellationTokenRuntime requires clearTimeout"
        );
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
    });
});
