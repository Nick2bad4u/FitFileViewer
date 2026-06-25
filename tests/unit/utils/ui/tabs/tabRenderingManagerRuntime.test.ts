import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getTabRenderingManagerRuntime,
    type TabRenderingManagerRuntimeScope,
} from "../../../../../electron-app/utils/ui/tabs/tabRenderingManagerRuntime.js";

describe("tabRenderingManagerRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("reads Date.now through the injected runtime scope", () => {
        expect.assertions(2);

        const dateNow = vi.fn(() => 12_345);
        const utils = getTabRenderingManagerRuntime({
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(12_345);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("reads performance.now through the injected runtime scope", () => {
        expect.assertions(2);

        const performanceNow = vi.fn(() => 67.89);
        const utils = getTabRenderingManagerRuntime({
            getPerformanceNow: () => performanceNow,
        });

        expect(utils.performanceNow()).toBe(67.89);
        expect(performanceNow).toHaveBeenCalledOnce();
    });

    it("reads production timing defaults through browser runtime providers", () => {
        expect.assertions(2);

        const utils = getTabRenderingManagerRuntime();

        expect(utils.dateNow()).toBeGreaterThan(0);
        expect(utils.performanceNow()).toBeGreaterThanOrEqual(0);
    });

    it("binds default performance.now to globalThis.performance", () => {
        expect.assertions(3);

        const now = vi.fn(function defaultPerformanceNow(this: Performance) {
            return 23.45;
        });
        vi.stubGlobal("performance", { now });
        const utils = getTabRenderingManagerRuntime();

        expect(utils.performanceNow()).toBe(23.45);
        expect(now).toHaveBeenCalledOnce();
        expect(now.mock.contexts[0]).toBe(globalThis.performance);
    });

    it("does not borrow ambient clocks for explicit scopes", () => {
        expect.assertions(2);

        const utils = getTabRenderingManagerRuntime({});

        expect(() => utils.dateNow()).toThrow(
            "tabRenderingManager requires dateNow"
        );
        expect(() => utils.performanceNow()).toThrow(
            "tabRenderingManager requires performance.now"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const utils = getTabRenderingManagerRuntime({
            dateNow: vi.fn(() => 12_345),
            performance: { now: vi.fn(() => 67.89) },
        } as unknown as TabRenderingManagerRuntimeScope);

        expect(() => utils.dateNow()).toThrow(
            "tabRenderingManager requires dateNow"
        );
        expect(() => utils.performanceNow()).toThrow(
            "tabRenderingManager requires performance.now"
        );
    });
});
