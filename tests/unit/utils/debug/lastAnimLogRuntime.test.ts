import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getLastAnimLogRuntime,
    type LastAnimLogRuntimeScope,
} from "../../../../electron-app/utils/debug/lastAnimLogRuntime.js";

const unavailableLastAnimLogRuntimeScope = {
    getDateNow: () => undefined,
    getPerformance: () => undefined,
    getPerformanceNow: () => undefined,
} satisfies LastAnimLogRuntimeScope;

describe("getLastAnimLogRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("resolves Date.now through the injected runtime scope", () => {
        expect.assertions(2);

        const dateNow = vi.fn(() => 1234);
        const utils = getLastAnimLogRuntime({
            ...unavailableLastAnimLogRuntimeScope,
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("resolves performance.now through the injected runtime scope", () => {
        expect.assertions(2);

        const now = vi.fn(() => 56.78);
        const utils = getLastAnimLogRuntime({
            ...unavailableLastAnimLogRuntimeScope,
            getPerformanceNow: () => now,
        });

        expect(utils.performanceNow()).toBe(56.78);
        expect(now).toHaveBeenCalledOnce();
    });

    it("resolves performance.now through the injected performance provider", () => {
        expect.assertions(3);

        const performanceRef = {
            now: vi.fn(function scopedPerformanceNow(
                this: Pick<Performance, "now">
            ) {
                return 78.9;
            }),
        };
        const utils = getLastAnimLogRuntime({
            ...unavailableLastAnimLogRuntimeScope,
            getPerformance: () => performanceRef,
        });

        expect(utils.performanceNow()).toBe(78.9);
        expect(performanceRef.now).toHaveBeenCalledOnce();
        expect(performanceRef.now.mock.contexts[0]).toBe(performanceRef);
    });

    it("uses browser runtime providers for production clock defaults", () => {
        expect.assertions(5);

        const dateNow = vi.spyOn(Date, "now").mockReturnValue(4321);
        const now = vi.fn(function defaultPerformanceNow(this: Performance) {
            return 12.34;
        });
        vi.stubGlobal("performance", { now });
        const utils = getLastAnimLogRuntime();

        expect(utils.dateNow()).toBe(4321);
        expect(utils.performanceNow()).toBe(12.34);
        expect(dateNow).toHaveBeenCalledOnce();
        expect(now).toHaveBeenCalledOnce();
        expect(now.mock.contexts[0]).toBe(globalThis.performance);
    });

    it("does not borrow ambient clocks for explicit scopes", () => {
        expect.assertions(2);

        const utils = getLastAnimLogRuntime(unavailableLastAnimLogRuntimeScope);

        expect(() => utils.dateNow()).toThrow(
            "lastAnimLogRuntime requires dateNow"
        );
        expect(() => utils.performanceNow()).toThrow(
            "lastAnimLogRuntime requires performance.now"
        );
    });

    it("fails clearly when runtime providers are omitted", () => {
        expect.assertions(3);

        const utils = getLastAnimLogRuntime(
            {} as unknown as LastAnimLogRuntimeScope
        );

        expect(() => utils.dateNow()).toThrow(
            "lastAnimLogRuntime requires dateNow provider"
        );
        expect(() => utils.performanceNow()).toThrow(
            "lastAnimLogRuntime requires performance.now provider"
        );
        expect(() =>
            getLastAnimLogRuntime({
                ...unavailableLastAnimLogRuntimeScope,
                getPerformance: undefined,
            } as unknown as LastAnimLogRuntimeScope).performanceNow()
        ).toThrow("lastAnimLogRuntime requires performance provider");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const legacyScope = {
            ...unavailableLastAnimLogRuntimeScope,
            dateNow: vi.fn(() => 1234),
            performance: { now: vi.fn(() => 56.78) },
        } as unknown as LastAnimLogRuntimeScope;
        const utils = getLastAnimLogRuntime(legacyScope);

        expect(() => utils.dateNow()).toThrow(
            "lastAnimLogRuntime requires dateNow"
        );
        expect(() => utils.performanceNow()).toThrow(
            "lastAnimLogRuntime requires performance.now"
        );
    });
});
