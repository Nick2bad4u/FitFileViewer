import { describe, expect, it, vi } from "vitest";

import {
    getLastAnimLogRuntime,
    type LastAnimLogRuntimeScope,
} from "../../../../electron-app/utils/debug/lastAnimLogRuntime.js";

describe("getLastAnimLogRuntime", () => {
    it("resolves Date.now through the injected runtime scope", () => {
        expect.assertions(2);

        const dateNow = vi.fn(() => 1234);
        const utils = getLastAnimLogRuntime({ getDateNow: () => dateNow });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("resolves performance.now through the injected runtime scope", () => {
        expect.assertions(2);

        const now = vi.fn(() => 56.78);
        const utils = getLastAnimLogRuntime({
            getPerformanceNow: () => now,
        });

        expect(utils.performanceNow()).toBe(56.78);
        expect(now).toHaveBeenCalledOnce();
    });

    it("does not borrow ambient clocks for explicit scopes", () => {
        expect.assertions(2);

        const utils = getLastAnimLogRuntime({});

        expect(() => utils.dateNow()).toThrow(
            "lastAnimLogRuntime requires dateNow"
        );
        expect(() => utils.performanceNow()).toThrow(
            "lastAnimLogRuntime requires performance.now"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const legacyScope = {
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
