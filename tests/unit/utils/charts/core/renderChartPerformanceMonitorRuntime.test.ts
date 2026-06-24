import { describe, expect, it, vi } from "vitest";

import {
    getRenderChartPerformanceMonitorRuntime,
    type RenderChartPerformanceMonitorRuntimeScope,
} from "../../../../../electron-app/utils/charts/core/renderChartPerformanceMonitorRuntime.js";

describe("renderChartPerformanceMonitorRuntime", () => {
    it("reads date timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getRenderChartPerformanceMonitorRuntime({
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("reads performance timestamps through the injected provider", () => {
        expect.assertions(2);

        const now = vi.fn<() => number>(() => 42);
        const utils = getRenderChartPerformanceMonitorRuntime({
            getPerformance: () => ({ now }),
        });

        expect(utils.nowPerformance()).toBe(42);
        expect(now).toHaveBeenCalledOnce();
    });

    it("fails clearly when explicit scopes omit the date clock", () => {
        expect.assertions(1);

        expect(() =>
            getRenderChartPerformanceMonitorRuntime({}).dateNow()
        ).toThrow("renderChartPerformanceMonitorRuntime requires dateNow");
    });

    it("fails clearly when explicit scopes omit performance timing", () => {
        expect.assertions(1);

        expect(() =>
            getRenderChartPerformanceMonitorRuntime({}).nowPerformance()
        ).toThrow(
            "renderChartPerformanceMonitorRuntime requires performance.now"
        );
    });

    it("ignores legacy direct date and performance scope properties", () => {
        expect.assertions(4);

        const dateNow = vi.fn<() => number>(() => 1234);
        const now = vi.fn<() => number>(() => 42);
        const utils = getRenderChartPerformanceMonitorRuntime({
            dateNow,
            performance: { now },
        } as unknown as RenderChartPerformanceMonitorRuntimeScope);

        expect(() => utils.dateNow()).toThrow(
            "renderChartPerformanceMonitorRuntime requires dateNow"
        );
        expect(() => utils.nowPerformance()).toThrow(
            "renderChartPerformanceMonitorRuntime requires performance.now"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(now).not.toHaveBeenCalled();
    });
});
