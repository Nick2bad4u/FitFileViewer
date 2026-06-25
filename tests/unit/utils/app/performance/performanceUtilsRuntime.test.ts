import { describe, expect, it, vi } from "vitest";

import {
    getPerformanceUtilsRuntime,
    type PerformanceUtilsRuntimeScope,
} from "../../../../../electron-app/utils/app/performance/performanceUtilsRuntime.js";

describe("getPerformanceUtilsRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const scheduledCalls: { callback: () => void; timeout?: number }[] = [];
        const clearedHandles: unknown[] = [];
        const timeoutMs = Number("25");
        const runtime = getPerformanceUtilsRuntime({
            getClearTimeout: () => (handle) => {
                clearedHandles.push(handle);
            },
            getSetTimeout: () => (scheduledCallback, timeout) => {
                scheduledCalls.push({
                    callback: scheduledCallback,
                    timeout,
                });
                return 42;
            },
        });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(42);
        expect(scheduledCalls).toStrictEqual([
            { callback, timeout: timeoutMs },
        ]);

        runtime.clearTimeout(42);

        expect(clearedHandles).toStrictEqual([42]);
    });

    it("cancels native idle callbacks when the handle came from the browser API", () => {
        expect.assertions(1);

        const canceledHandles: number[] = [];
        const runtime = getPerformanceUtilsRuntime({
            getCancelIdleCallback: () => (handle) => {
                canceledHandles.push(handle);
            },
        });

        runtime.cancelIdleCallback(9);

        expect(canceledHandles).toStrictEqual([9]);
    });

    it("falls back to timeout cancellation for timeout-backed idle handles", () => {
        expect.assertions(1);

        const clearedHandles: unknown[] = [];
        const runtime = getPerformanceUtilsRuntime({
            getClearTimeout: () => (handle) => {
                clearedHandles.push(handle);
            },
        });

        runtime.cancelIdleCallback(11);

        expect(clearedHandles).toStrictEqual([11]);
    });

    it("requests native idle callbacks when available", () => {
        expect.assertions(2);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("50");
        const idleRequests: {
            callback: () => void;
            options?: IdleRequestOptions;
        }[] = [];
        const runtime = getPerformanceUtilsRuntime({
            getRequestIdleCallback: () => (scheduledCallback, options) => {
                idleRequests.push({ callback: scheduledCallback, options });
                return 17;
            },
        });

        expect(
            runtime.requestIdleCallback(callback, { timeout: timeoutMs })
        ).toBe(17);
        expect(idleRequests).toStrictEqual([
            { callback, options: { timeout: timeoutMs } },
        ]);
    });

    it("uses default native idle callbacks from the runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("125");
        const requestIdleCallback = vi.fn<
            (callback: () => void, options?: IdleRequestOptions) => number
        >(() => 53);
        const cancelIdleCallback = vi.fn<(handle: number) => void>();

        vi.stubGlobal("requestIdleCallback", requestIdleCallback);
        vi.stubGlobal("cancelIdleCallback", cancelIdleCallback);
        try {
            const runtime = getPerformanceUtilsRuntime();

            expect(
                runtime.requestIdleCallback(callback, { timeout: timeoutMs })
            ).toBe(53);
            runtime.cancelIdleCallback(53);

            expect(requestIdleCallback).toHaveBeenCalledWith(callback, {
                timeout: timeoutMs,
            });
            expect(cancelIdleCallback).toHaveBeenCalledWith(53);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it("falls back to a timeout when idle callbacks are unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("75");
        const scheduledCalls: { callback: () => void; timeout?: number }[] = [];
        const runtime = getPerformanceUtilsRuntime({
            getSetTimeout: () => (scheduledCallback, timeout) => {
                scheduledCalls.push({
                    callback: scheduledCallback,
                    timeout,
                });
                return 28;
            },
        });

        expect(
            runtime.requestIdleCallback(callback, { timeout: timeoutMs })
        ).toBe(28);
        expect(scheduledCalls).toStrictEqual([
            { callback, timeout: timeoutMs },
        ]);
    });

    it("reads time from the injected clock", () => {
        expect.assertions(1);

        expect(
            getPerformanceUtilsRuntime({ getDateNow: () => () => 123 }).now()
        ).toBe(123);
    });

    it("does not borrow ambient timers or clocks for explicit scopes", () => {
        expect.assertions(3);

        const runtime = getPerformanceUtilsRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "performanceUtils requires setTimeout"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "performanceUtils requires clearTimeout"
        );
        expect(() => runtime.now()).toThrow(
            "performanceUtils requires dateNow"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const legacyScope = {
            cancelIdleCallback: vi.fn(),
            clearTimeout: vi.fn(),
            dateNow: vi.fn(() => 123),
            requestIdleCallback: vi.fn(() => 17),
            setTimeout: vi.fn(() => 42),
        } as unknown as PerformanceUtilsRuntimeScope;
        const runtime = getPerformanceUtilsRuntime(legacyScope);

        expect(() => runtime.setTimeout(() => undefined, 1)).toThrow(
            "performanceUtils requires setTimeout"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "performanceUtils requires clearTimeout"
        );
        expect(() => runtime.now()).toThrow(
            "performanceUtils requires dateNow"
        );
        expect(() => runtime.requestIdleCallback(() => undefined)).toThrow(
            "performanceUtils requires setTimeout"
        );
    });
});
