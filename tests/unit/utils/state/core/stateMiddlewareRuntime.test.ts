import { describe, expect, it, vi } from "vitest";

import {
    getStateMiddlewareRuntime,
    type StateMiddlewareRuntimeScope,
} from "../../../../../electron-app/utils/state/core/stateMiddlewareRuntime.js";

describe("getStateMiddlewareRuntime", () => {
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

        const runtime = getStateMiddlewareRuntime({});

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
            "stateMiddleware requires dateNow"
        );
        expect(() => runtime.performanceNow()).toThrow(
            "stateMiddleware requires performance.now"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(performanceNow).not.toHaveBeenCalled();
    });
});
