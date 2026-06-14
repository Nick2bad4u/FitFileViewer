import { describe, expect, it, vi } from "vitest";

import { getPerformanceUtilsRuntime } from "../../../../../electron-app/utils/app/performance/performanceUtilsRuntime.js";

describe("getPerformanceUtilsRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const scheduledCalls: { callback: () => void; timeout?: number }[] = [];
        const clearedHandles: unknown[] = [];
        const timeoutMs = Number("25");
        const runtime = getPerformanceUtilsRuntime({
            clearTimeout: (handle) => {
                clearedHandles.push(handle);
            },
            setTimeout: (scheduledCallback, timeout) => {
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
            cancelIdleCallback: (handle) => {
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
            clearTimeout: (handle) => {
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
            requestIdleCallback: (scheduledCallback, options) => {
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

    it("falls back to a timeout when idle callbacks are unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("75");
        const scheduledCalls: { callback: () => void; timeout?: number }[] = [];
        const runtime = getPerformanceUtilsRuntime({
            setTimeout: (scheduledCallback, timeout) => {
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

        expect(getPerformanceUtilsRuntime({ dateNow: () => 123 }).now()).toBe(
            123
        );
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
});
