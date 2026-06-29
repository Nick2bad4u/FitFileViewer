import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getStateMiddlewareRuntime,
    type StateMiddlewareRuntimeScope,
} from "../../../../../electron-app/utils/state/core/stateMiddlewareRuntime.js";

describe("getStateMiddlewareRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    const stateMiddlewareRuntimeScope = {
        getDateNow: () => Date.now,
        getPerformance: () => performance,
    } satisfies StateMiddlewareRuntimeScope;

    it("reads wall-clock and performance time through injected providers", () => {
        expect.assertions(4);

        const dateNow = vi.fn<() => number>(() => 123);
        const performanceNow = vi.fn<() => number>(() => 456);
        const performance = { now: performanceNow };
        const runtime = getStateMiddlewareRuntime({
            getDateNow: () => dateNow,
            getPerformance: () => performance,
        });

        expect(runtime.dateNow()).toBe(123);
        expect(runtime.performanceNow()).toBe(456);
        expect(dateNow).toHaveBeenCalledOnce();
        expect(performanceNow).toHaveBeenCalledOnce();
    });

    it("fails clearly when explicit scopes omit clocks", () => {
        expect.assertions(2);

        const runtime = getStateMiddlewareRuntime(
            {} as unknown as StateMiddlewareRuntimeScope
        );

        expect(() => runtime.dateNow()).toThrow(
            "stateMiddleware requires a dateNow provider"
        );
        expect(() => runtime.performanceNow()).toThrow(
            "stateMiddleware requires a performance provider"
        );
    });

    it("fails clearly when individual provider slots are omitted", () => {
        expect.assertions(2);

        expect(() =>
            getStateMiddlewareRuntime({
                ...stateMiddlewareRuntimeScope,
                getDateNow: undefined,
            }).dateNow()
        ).toThrow("stateMiddleware requires a dateNow provider");
        expect(() =>
            getStateMiddlewareRuntime({
                ...stateMiddlewareRuntimeScope,
                getPerformance: undefined,
            }).performanceNow()
        ).toThrow("stateMiddleware requires a performance provider");
    });

    it("fails clearly when explicit providers return unavailable clocks", () => {
        expect.assertions(2);

        const runtime = getStateMiddlewareRuntime({
            getDateNow: () => undefined,
            getPerformance: () => undefined,
        });

        expect(() => runtime.dateNow()).toThrow(
            "stateMiddleware requires dateNow"
        );
        expect(() => runtime.performanceNow()).toThrow(
            "stateMiddleware requires performance.now"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const dateNow = vi.fn<() => number>(() => 123);
        const performanceNow = vi.fn<() => number>(() => 456);
        const legacyScope = {
            dateNow,
            performance: { now: performanceNow },
        } as unknown as StateMiddlewareRuntimeScope;
        const runtime = getStateMiddlewareRuntime(legacyScope);

        expect(() => runtime.dateNow()).toThrow(
            "stateMiddleware requires a dateNow provider"
        );
        expect(() => runtime.performanceNow()).toThrow(
            "stateMiddleware requires a performance provider"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(performanceNow).not.toHaveBeenCalled();
    });

    it("uses browser runtime providers for production defaults", () => {
        expect.assertions(5);

        const dateNow = vi.spyOn(Date, "now").mockReturnValue(1234);
        const now = vi.fn(function defaultPerformanceNow(this: Performance) {
            return 567.8;
        });

        vi.stubGlobal("performance", { now });

        const runtime = getStateMiddlewareRuntime();

        expect(runtime.dateNow()).toBe(1234);
        expect(runtime.performanceNow()).toBe(567.8);
        expect(dateNow).toHaveBeenCalledOnce();
        expect(now).toHaveBeenCalledOnce();
        expect(now.mock.contexts[0]).toBe(globalThis.performance);
    });
});
