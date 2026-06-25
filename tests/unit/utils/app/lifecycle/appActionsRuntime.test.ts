import { describe, expect, it, vi } from "vitest";

import {
    getAppActionsRuntime,
    type AppActionsRuntimeScope,
} from "../../../../../electron-app/utils/app/lifecycle/appActionsRuntime.js";

describe("getAppActionsRuntime", () => {
    it("reads wall-clock and performance time through injected providers", () => {
        expect.assertions(4);

        const dateNow = vi.fn<() => number>(() => 123);
        const performanceNow = vi.fn<() => number>(() => 456);
        const performance = { now: performanceNow };
        const runtime = getAppActionsRuntime({
            getDateNow: () => dateNow,
            getPerformance: () => performance,
        });

        expect(runtime.dateNow()).toBe(123);
        expect(runtime.performanceNow()).toBe(456);
        expect(dateNow).toHaveBeenCalledOnce();
        expect(performanceNow).toHaveBeenCalledOnce();
    });

    it("reads production timing defaults through browser runtime providers", () => {
        expect.assertions(2);

        const runtime = getAppActionsRuntime();

        expect(runtime.dateNow()).toBeGreaterThan(0);
        expect(runtime.performanceNow()).toBeGreaterThanOrEqual(0);
    });

    it("fails clearly when explicit scopes omit clocks", () => {
        expect.assertions(2);

        const runtime = getAppActionsRuntime({});

        expect(() => runtime.dateNow()).toThrow(
            "AppActions requires dateNow"
        );
        expect(() => runtime.performanceNow()).toThrow(
            "AppActions requires performance.now"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const dateNow = vi.fn<() => number>(() => 123);
        const performanceNow = vi.fn<() => number>(() => 456);
        const legacyScope = {
            dateNow,
            performance: { now: performanceNow },
        } as unknown as AppActionsRuntimeScope;
        const runtime = getAppActionsRuntime(legacyScope);

        expect(() => runtime.dateNow()).toThrow(
            "AppActions requires dateNow"
        );
        expect(() => runtime.performanceNow()).toThrow(
            "AppActions requires performance.now"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(performanceNow).not.toHaveBeenCalled();
    });
});
