import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getRenderChartPerformanceMonitorRuntime,
    type RenderChartPerformanceMonitorRuntimeScope,
} from "../../../../../electron-app/utils/charts/core/renderChartPerformanceMonitorRuntime.js";

describe("renderChartPerformanceMonitorRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("reads date timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getRenderChartPerformanceMonitorRuntime({
            getDateNow: () => dateNow,
            getPerformance: () => undefined,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("reads performance timestamps through the injected provider", () => {
        expect.assertions(2);

        const now = vi.fn<() => number>(() => 42);
        const utils = getRenderChartPerformanceMonitorRuntime({
            getDateNow: () => undefined,
            getPerformance: () => ({ now }),
        });

        expect(utils.nowPerformance()).toBe(42);
        expect(now).toHaveBeenCalledOnce();
    });

    it("resolves production clock defaults through browser runtime providers", () => {
        expect.assertions(4);

        const dateNow = vi.spyOn(Date, "now").mockReturnValue(5678);
        const now = vi.fn<() => number>(() => 84);

        vi.stubGlobal("performance", { now });

        const utils = getRenderChartPerformanceMonitorRuntime();

        expect(utils.dateNow()).toBe(5678);
        expect(utils.nowPerformance()).toBe(84);
        expect(dateNow).toHaveBeenCalledOnce();
        expect(now).toHaveBeenCalledOnce();
    });

    it("fails clearly when explicit scopes omit providers", () => {
        expect.assertions(2);

        const runtime = getRenderChartPerformanceMonitorRuntime(
            {} as unknown as RenderChartPerformanceMonitorRuntimeScope
        );

        expect(() => runtime.dateNow()).toThrow(
            "renderChartPerformanceMonitorRuntime requires a dateNow provider"
        );
        expect(() => runtime.nowPerformance()).toThrow(
            "renderChartPerformanceMonitorRuntime requires a performance provider"
        );
    });

    it("fails clearly when explicit providers return unavailable clocks", () => {
        expect.assertions(2);

        const runtime = getRenderChartPerformanceMonitorRuntime({
            getDateNow: () => undefined,
            getPerformance: () => undefined,
        });

        expect(() => runtime.dateNow()).toThrow(
            "renderChartPerformanceMonitorRuntime requires dateNow"
        );
        expect(() => runtime.nowPerformance()).toThrow(
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
            "renderChartPerformanceMonitorRuntime requires a dateNow provider"
        );
        expect(() => utils.nowPerformance()).toThrow(
            "renderChartPerformanceMonitorRuntime requires a performance provider"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(now).not.toHaveBeenCalled();
    });
});
