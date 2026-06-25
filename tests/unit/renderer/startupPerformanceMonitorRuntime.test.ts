import { describe, expect, it, vi } from "vitest";

import { getStartupPerformanceMonitorRuntime } from "../../../electron-app/renderer/startupPerformanceMonitorRuntime.js";

describe("getStartupPerformanceMonitorRuntime", () => {
    it("reads performance timing through the injected provider", () => {
        expect.assertions(2);

        const now = vi.fn<() => number>(() => 123.45);
        const utils = getStartupPerformanceMonitorRuntime({
            getPerformance: () => ({ now }),
        });

        expect(utils.nowPerformance()).toBe(123.45);
        expect(now).toHaveBeenCalledOnce();
    });

    it("uses the renderer browser runtime provider for production performance defaults", () => {
        expect.assertions(2);

        const originalPerformance = globalThis.performance;
        const now = vi.fn<() => number>(() => 678.9);

        try {
            Object.defineProperty(globalThis, "performance", {
                configurable: true,
                value: { now },
            });

            const utils = getStartupPerformanceMonitorRuntime();

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

        const utils = getStartupPerformanceMonitorRuntime({});

        expect(() => utils.nowPerformance()).toThrow(
            "startupPerformanceMonitorRuntime requires performance.now"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const now = vi.fn<() => number>(() => 123.45);
        const utils = getStartupPerformanceMonitorRuntime({
            performance: { now },
        } as unknown as Parameters<
            typeof getStartupPerformanceMonitorRuntime
        >[0]);

        expect(() => utils.nowPerformance()).toThrow(
            "startupPerformanceMonitorRuntime requires performance.now"
        );
        expect(now).not.toHaveBeenCalled();
    });
});
