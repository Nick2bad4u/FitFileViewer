import { describe, expect, it, vi } from "vitest";

import { getLastAnimLogRuntime } from "../../../../electron-app/utils/debug/lastAnimLogRuntime.js";

describe("getLastAnimLogRuntime", () => {
    it("resolves Date.now through the injected runtime scope", () => {
        expect.assertions(2);

        const dateNow = vi.fn(() => 1234);
        const utils = getLastAnimLogRuntime({ dateNow });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("resolves performance.now through the injected runtime scope", () => {
        expect.assertions(2);

        const now = vi.fn(() => 56.78);
        const utils = getLastAnimLogRuntime({
            performance: { now },
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
});
