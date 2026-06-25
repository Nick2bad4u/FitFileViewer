import { describe, expect, it, vi } from "vitest";

import { getPerformanceMonitorRuntime } from "../../../electron-app/utils/performance/performanceMonitorRuntime.js";

describe("getPerformanceMonitorRuntime", () => {
    it("reads performance timing through the injected provider", () => {
        expect.assertions(2);

        const now = vi.fn<() => number>(() => 123.45);
        const utils = getPerformanceMonitorRuntime({
            getPerformance: () => ({ now }),
        });

        expect(utils.nowPerformance()).toBe(123.45);
        expect(now).toHaveBeenCalledOnce();
    });

    it("binds default performance.now to globalThis.performance", () => {
        expect.assertions(2);

        const originalPerformance = globalThis.performance;
        const now = vi.fn<() => number>(() => 678.9);

        try {
            Object.defineProperty(globalThis, "performance", {
                configurable: true,
                value: { now },
            });

            const utils = getPerformanceMonitorRuntime();

            expect(utils.nowPerformance()).toBe(678.9);
            expect(now).toHaveBeenCalledOnce();
        } finally {
            Object.defineProperty(globalThis, "performance", {
                configurable: true,
                value: originalPerformance,
            });
        }
    });

    it("fails clearly when performance timing is unavailable", () => {
        expect.assertions(1);

        const utils = getPerformanceMonitorRuntime({});

        expect(() => utils.nowPerformance()).toThrow(
            "performanceMonitorRuntime requires performance.now"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const now = vi.fn<() => number>(() => 123.45);
        const utils = getPerformanceMonitorRuntime({
            performance: { now },
        } as unknown as Parameters<typeof getPerformanceMonitorRuntime>[0]);

        expect(() => utils.nowPerformance()).toThrow(
            "performanceMonitorRuntime requires performance.now"
        );
        expect(now).not.toHaveBeenCalled();
    });
});
