import { describe, expect, it, vi } from "vitest";

import {
    getAppActionsRuntime,
    type AppActionsRuntimeScope,
} from "../../../../../electron-app/utils/app/lifecycle/appActionsRuntime.js";

describe("getAppActionsRuntime", () => {
    it("reads performance time through injected providers", () => {
        expect.assertions(2);

        const performanceNow = vi.fn<() => number>(() => 456);
        const performance = { now: performanceNow };
        const runtime = getAppActionsRuntime({
            getPerformance: () => performance,
        });

        expect(runtime.performanceNow()).toBe(456);
        expect(performanceNow).toHaveBeenCalledOnce();
    });

    it("reads production timing defaults through browser runtime providers", () => {
        expect.assertions(1);

        const runtime = getAppActionsRuntime();

        expect(runtime.performanceNow()).toBeGreaterThanOrEqual(0);
    });

    it("fails clearly when explicit scopes omit performance", () => {
        expect.assertions(1);

        const runtime = getAppActionsRuntime({});

        expect(() => runtime.performanceNow()).toThrow(
            "AppActions requires performance.now"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(3);

        const dateNow = vi.fn<() => number>(() => 123);
        const performanceNow = vi.fn<() => number>(() => 456);
        const legacyScope = {
            dateNow,
            performance: { now: performanceNow },
        } as unknown as AppActionsRuntimeScope;
        const runtime = getAppActionsRuntime(legacyScope);

        expect(() => runtime.performanceNow()).toThrow(
            "AppActions requires performance.now"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(performanceNow).not.toHaveBeenCalled();
    });
});
