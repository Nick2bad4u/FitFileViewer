import { describe, expect, it, vi } from "vitest";

import { getComputedStateManagerRuntime } from "../../../../../electron-app/utils/state/core/computedStateManagerRuntime.js";

describe("computedStateManagerRuntime", () => {
    it("reads date timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getComputedStateManagerRuntime({
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("reads performance timestamps through the injected provider", () => {
        expect.assertions(2);

        const now = vi.fn<() => number>(() => 42);
        const utils = getComputedStateManagerRuntime({
            getPerformance: () => ({ now }),
        });

        expect(utils.nowPerformance()).toBe(42);
        expect(now).toHaveBeenCalledOnce();
    });

    it("reads dark system preference through the scoped media query runtime", () => {
        expect.assertions(2);

        const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList),
            runtime = getComputedStateManagerRuntime({
                getMatchMedia: () => matchMedia,
            });

        expect(runtime.isDarkSchemePreferred()).toBe(true);
        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("returns false when the system preference is not dark", () => {
        expect.assertions(1);

        const runtime = getComputedStateManagerRuntime({
            getMatchMedia: () => () => ({ matches: false }) as MediaQueryList,
        });

        expect(runtime.isDarkSchemePreferred()).toBe(false);
    });

    it("ignores legacy direct matchMedia runtime properties", () => {
        expect.assertions(2);

        const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList),
            runtime = getComputedStateManagerRuntime({
                matchMedia,
            } as unknown as Parameters<
                typeof getComputedStateManagerRuntime
            >[0]);

        expect(runtime.isDarkSchemePreferred()).toBe(false);
        expect(matchMedia).not.toHaveBeenCalled();
    });

    it("ignores legacy direct clock runtime properties", () => {
        expect.assertions(4);

        const dateNow = vi.fn<() => number>(() => 1234);
        const now = vi.fn<() => number>(() => 42);
        const utils = getComputedStateManagerRuntime({
            dateNow,
            performance: { now },
        } as unknown as Parameters<typeof getComputedStateManagerRuntime>[0]);

        expect(() => utils.dateNow()).toThrow(
            "computedStateManager requires dateNow"
        );
        expect(() => utils.nowPerformance()).toThrow(
            "computedStateManager requires performance.now"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(now).not.toHaveBeenCalled();
    });

    it("fails clearly when explicit scopes omit timing providers", () => {
        expect.assertions(2);

        const utils = getComputedStateManagerRuntime({});

        expect(() => utils.dateNow()).toThrow(
            "computedStateManager requires dateNow"
        );
        expect(() => utils.nowPerformance()).toThrow(
            "computedStateManager requires performance.now"
        );
    });

    it("returns false when media queries are unavailable", () => {
        expect.assertions(1);

        expect(getComputedStateManagerRuntime({}).isDarkSchemePreferred()).toBe(
            false
        );
    });
});
