import { describe, expect, it, vi } from "vitest";

import {
    getPerformanceMonitorRuntime,
    type PerformanceMonitorRuntimeScope,
} from "../../../electron-app/utils/performance/performanceMonitorRuntime.js";

const unavailablePerformanceMonitorRuntimeScope = {
    getIsDevelopmentEnvironment: () => undefined,
    getPerformance: () => undefined,
    getProcessEnvironmentValue: () => undefined,
} satisfies PerformanceMonitorRuntimeScope;

describe("getPerformanceMonitorRuntime", () => {
    it("reads performance timing through the injected provider", () => {
        expect.assertions(2);

        const now = vi.fn<() => number>(() => 123.45);
        const utils = getPerformanceMonitorRuntime({
            ...unavailablePerformanceMonitorRuntimeScope,
            getPerformance: () => ({ now }),
        });

        expect(utils.nowPerformance()).toBe(123.45);
        expect(now).toHaveBeenCalledOnce();
    });

    it("binds default performance.now to globalThis.performance", () => {
        expect.assertions(4);

        const originalPerformance = globalThis.performance;
        const now = vi.fn<() => number>(() => 678.9);

        try {
            Object.defineProperty(globalThis, "performance", {
                configurable: true,
                value: { now },
            });

            const utils = getPerformanceMonitorRuntime();

            expect(utils.isDevelopmentEnvironment()).toBe(false);
            expect(utils.getProcessEnvironmentValue("__MISSING__")).toBe(
                undefined
            );
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

        const utils = getPerformanceMonitorRuntime({
            ...unavailablePerformanceMonitorRuntimeScope,
            getPerformance: () => undefined,
        });

        expect(() => utils.nowPerformance()).toThrow(
            "performanceMonitorRuntime requires performance.now"
        );
    });

    it("reads environment providers through the injected runtime scope", () => {
        expect.assertions(4);

        const utils = getPerformanceMonitorRuntime({
            ...unavailablePerformanceMonitorRuntimeScope,
            getIsDevelopmentEnvironment: () => true,
            getProcessEnvironmentValue: (name) =>
                name === "PERFORMANCE_MONITORING" ? "true" : undefined,
        });
        const disabledUtils = getPerformanceMonitorRuntime({
            ...unavailablePerformanceMonitorRuntimeScope,
            getIsDevelopmentEnvironment: () => undefined,
        });

        expect(utils.isDevelopmentEnvironment()).toBe(true);
        expect(utils.getProcessEnvironmentValue("PERFORMANCE_MONITORING")).toBe(
            "true"
        );
        expect(utils.getProcessEnvironmentValue("OTHER")).toBe(undefined);
        expect(disabledUtils.isDevelopmentEnvironment()).toBe(false);
    });

    it("fails clearly when explicit scopes omit required providers", () => {
        expect.assertions(3);

        expect(() =>
            getPerformanceMonitorRuntime(
                {} as unknown as PerformanceMonitorRuntimeScope
            )
        ).toThrow(
            "performanceMonitorRuntime requires a processEnvironmentValue provider"
        );
        expect(() =>
            getPerformanceMonitorRuntime({
                ...unavailablePerformanceMonitorRuntimeScope,
                getIsDevelopmentEnvironment: undefined,
            })
        ).toThrow(
            "performanceMonitorRuntime requires a isDevelopmentEnvironment provider"
        );
        expect(() =>
            getPerformanceMonitorRuntime({
                ...unavailablePerformanceMonitorRuntimeScope,
                getProcessEnvironmentValue: undefined,
            })
        ).toThrow(
            "performanceMonitorRuntime requires a processEnvironmentValue provider"
        );
    });

    it("fails clearly when the performance provider slot is undefined", () => {
        expect.assertions(1);

        expect(() =>
            getPerformanceMonitorRuntime({
                ...unavailablePerformanceMonitorRuntimeScope,
                getPerformance: undefined,
            })
        ).toThrow("performanceMonitorRuntime requires a performance provider");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const now = vi.fn<() => number>(() => 123.45);

        expect(() =>
            getPerformanceMonitorRuntime({
                ...unavailablePerformanceMonitorRuntimeScope,
                getPerformance: undefined,
                isDevelopmentEnvironment: vi.fn(() => true),
                performance: { now },
                processEnvironmentValue: vi.fn(() => "true"),
            } as unknown as PerformanceMonitorRuntimeScope)
        ).toThrow("performanceMonitorRuntime requires a performance provider");
        expect(now).not.toHaveBeenCalled();
    });
});
