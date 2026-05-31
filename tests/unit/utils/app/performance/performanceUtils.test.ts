import { describe, expect, it, vi } from "vitest";

import {
    batchOperations,
    cancelIdleCallback,
    debounce,
    memoize,
    optimizeEventHandler,
    requestIdleCallback,
    throttle,
} from "../../../../../electron-app/utils/app/performance/performanceUtils.js";

describe("performanceUtils", () => {
    it("batches queued items by max item count", () => {
        expect.assertions(3);

        vi.useFakeTimers();
        const processedBatches: number[][] = [];
        const addItem = batchOperations(
            (items: number[]) => {
                processedBatches.push(items);
            },
            {
                maxItems: 3,
                maxWait: 100,
            }
        );

        try {
            addItem(1);
            addItem(2);

            expect(processedBatches).toStrictEqual([]);

            addItem(3);

            expect(processedBatches).toStrictEqual([
                [
                    1,
                    2,
                    3,
                ],
            ]);
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });

    it("batches queued items after max wait", () => {
        expect.assertions(2);

        vi.useFakeTimers();
        const processedBatches: string[][] = [];
        const addItem = batchOperations(
            (items: string[]) => {
                processedBatches.push(items);
            },
            { maxWait: 25 }
        );

        try {
            addItem("a");
            addItem("b");
            vi.advanceTimersByTime(24);

            expect(processedBatches).toStrictEqual([]);

            vi.advanceTimersByTime(1);

            expect(processedBatches).toStrictEqual([["a", "b"]]);
        } finally {
            vi.useRealTimers();
        }
    });

    it("debounces trailing calls and supports flush and cancel", () => {
        expect.assertions(5);

        vi.useFakeTimers();
        const values: string[] = [];
        const debounced = debounce((value: string) => {
            values.push(value);
            return value.toUpperCase();
        }, 50);

        try {
            debounced("a");
            debounced("b");

            expect(values).toStrictEqual([]);

            expect(debounced.flush()).toBe("B");
            expect(values).toStrictEqual(["b"]);

            debounced("c");
            debounced.cancel();
            vi.advanceTimersByTime(50);

            expect(vi.getTimerCount()).toBe(0);
            expect(values).not.toContain("c");
        } finally {
            vi.useRealTimers();
        }
    });

    it("supports leading debounce calls", () => {
        expect.assertions(3);

        vi.useFakeTimers();
        const values: number[] = [];
        const debounced = debounce(
            (value: number) => {
                values.push(value);
                return value * 2;
            },
            20,
            {
                leading: true,
                trailing: false,
            }
        );

        try {
            expect(debounced(4)).toBe(8);
            expect(debounced(5)).toBe(8);

            vi.advanceTimersByTime(20);

            expect(values).toStrictEqual([4]);
        } finally {
            vi.useRealTimers();
        }
    });

    it("memoizes by generated keys and exposes clearable cache", () => {
        expect.assertions(6);

        const invokedCounts: number[] = [];
        const memoized = memoize(
            (value: { count: number; id: string }) => {
                invokedCounts.push(value.count);
                return value.count.toString();
            },
            (value) => value.id
        );

        expect(memoized({ id: "same", count: 1 })).toBe("1");
        expect(memoized({ id: "same", count: 2 })).toBe("1");
        expect(invokedCounts).toStrictEqual([1]);
        expect(memoized.cache.size).toBe(1);

        memoized.clear();

        expect(memoized({ id: "same", count: 3 })).toBe("3");
        expect(invokedCounts).toStrictEqual([1, 3]);
    });

    it("marks optimized event handlers with passive metadata", () => {
        expect.assertions(3);

        vi.useFakeTimers();
        const events: Event[] = [];
        const optimized = optimizeEventHandler(
            (event: Event) => {
                events.push(event);
            },
            {
                debounce: 30,
                passive: false,
            }
        );
        const event = new Event("click");

        try {
            expect({ passive: optimized._passive }).toStrictEqual({
                passive: false,
            });

            optimized(event);

            expect(events).toStrictEqual([]);

            vi.advanceTimersByTime(30);

            expect(events).toStrictEqual([event]);
        } finally {
            vi.useRealTimers();
        }
    });

    it("throttles calls on the leading edge and replays the trailing value", () => {
        expect.assertions(3);

        vi.useFakeTimers();
        const values: string[] = [];
        const throttled = throttle((value: string) => {
            values.push(value);
            return value;
        }, 40);

        try {
            expect(throttled("first")).toBe("first");

            throttled("second");
            throttled("third");

            expect(values).toStrictEqual(["first"]);

            vi.advanceTimersByTime(40);

            expect(values).toStrictEqual(["first", "third"]);
        } finally {
            vi.useRealTimers();
        }
    });

    it("uses native idle callbacks when available", () => {
        expect.assertions(3);

        const nativeCancel = vi.fn<(id: number) => void>();
        const nativeRequest = vi.fn<
            (callback: () => void, options?: IdleRequestOptions) => number
        >((_callback, _options) => 42);
        vi.stubGlobal("requestIdleCallback", nativeRequest);
        vi.stubGlobal("cancelIdleCallback", nativeCancel);

        try {
            const callback = () => {
                throw new Error(
                    "Native requestIdleCallback should schedule callback execution"
                );
            };
            const id = requestIdleCallback(callback, { timeout: 100 });
            cancelIdleCallback(id);

            expect(id).toBe(42);
            expect(nativeRequest).toHaveBeenCalledWith(callback, {
                timeout: 100,
            });
            expect(nativeCancel).toHaveBeenCalledWith(42);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it("falls back to timers for idle callbacks", () => {
        expect.assertions(3);

        vi.useFakeTimers();
        vi.stubGlobal("requestIdleCallback", undefined);
        vi.stubGlobal("cancelIdleCallback", undefined);
        let runCount = 0;

        try {
            const id = requestIdleCallback(
                () => {
                    runCount += 1;
                },
                { timeout: 10 }
            );
            vi.advanceTimersByTime(9);

            expect(vi.getTimerCount()).toBe(1);

            cancelIdleCallback(id);
            vi.advanceTimersByTime(1);

            expect(runCount).toBe(0);
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.unstubAllGlobals();
            vi.useRealTimers();
        }
    });
});
