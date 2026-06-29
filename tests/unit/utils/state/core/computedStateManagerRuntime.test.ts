import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrowserMatchMedia } from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getComputedStateManagerRuntime,
    type ComputedStateManagerRuntimeScope,
} from "../../../../../electron-app/utils/state/core/computedStateManagerRuntime.js";

const unavailableComputedStateManagerRuntimeScope = {
    getDateNow: () => undefined,
    getMatchMedia: () => undefined,
    getPerformance: () => undefined,
} satisfies ComputedStateManagerRuntimeScope;

describe("computedStateManagerRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("reads date timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getComputedStateManagerRuntime({
            ...unavailableComputedStateManagerRuntimeScope,
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("reads performance timestamps through the injected provider", () => {
        expect.assertions(2);

        const now = vi.fn<() => number>(() => 42);
        const utils = getComputedStateManagerRuntime({
            ...unavailableComputedStateManagerRuntimeScope,
            getPerformance: () => ({ now }),
        });

        expect(utils.nowPerformance()).toBe(42);
        expect(now).toHaveBeenCalledOnce();
    });

    it("reads dark system preference through the scoped media query runtime", () => {
        expect.assertions(2);

        const matchMedia = vi.fn<BrowserMatchMedia>(
                () => ({ matches: true }) as MediaQueryList
            ),
            runtime = getComputedStateManagerRuntime({
                ...unavailableComputedStateManagerRuntimeScope,
                getMatchMedia: () => matchMedia,
            });

        expect(runtime.isDarkSchemePreferred()).toBe(true);
        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("returns false when the system preference is not dark", () => {
        expect.assertions(1);

        const runtime = getComputedStateManagerRuntime({
            ...unavailableComputedStateManagerRuntimeScope,
            getMatchMedia: () =>
                (() =>
                    ({
                        matches: false,
                    }) as MediaQueryList) as BrowserMatchMedia,
        });

        expect(runtime.isDarkSchemePreferred()).toBe(false);
    });

    it("ignores legacy direct matchMedia runtime properties", () => {
        expect.assertions(2);

        const matchMedia = vi.fn<BrowserMatchMedia>(
                () => ({ matches: true }) as MediaQueryList
            ),
            runtime = getComputedStateManagerRuntime({
                ...unavailableComputedStateManagerRuntimeScope,
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
            ...unavailableComputedStateManagerRuntimeScope,
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

    it("uses browser runtime providers for production defaults", () => {
        expect.assertions(8);

        const dateNow = vi.spyOn(Date, "now").mockReturnValue(4321);
        const now = vi.fn(function defaultPerformanceNow(this: Performance) {
            return 56.78;
        });
        const matchMedia = vi.fn<BrowserMatchMedia>(
            (query: string) =>
                ({
                    matches: query === "(prefers-color-scheme: dark)",
                }) as MediaQueryList
        );

        vi.stubGlobal("matchMedia", matchMedia);
        vi.stubGlobal("performance", { now });

        const utils = getComputedStateManagerRuntime();

        expect(utils.dateNow()).toBe(4321);
        expect(utils.nowPerformance()).toBe(56.78);
        expect(utils.isDarkSchemePreferred()).toBe(true);
        expect(dateNow).toHaveBeenCalledOnce();
        expect(now).toHaveBeenCalledOnce();
        expect(now.mock.contexts[0]).toBe(globalThis.performance);
        expect(matchMedia).toHaveBeenCalledOnce();
        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("fails clearly when explicit scopes omit runtime providers", () => {
        expect.assertions(3);

        const utils = getComputedStateManagerRuntime(
            {} as unknown as ComputedStateManagerRuntimeScope
        );

        expect(() => utils.dateNow()).toThrow(
            "computedStateManager requires dateNow provider"
        );
        expect(() => utils.isDarkSchemePreferred()).toThrow(
            "computedStateManager requires matchMedia provider"
        );
        expect(() => utils.nowPerformance()).toThrow(
            "computedStateManager requires performance provider"
        );
    });

    it("returns false when media queries are unavailable", () => {
        expect.assertions(1);

        expect(
            getComputedStateManagerRuntime(
                unavailableComputedStateManagerRuntimeScope
            ).isDarkSchemePreferred()
        ).toBe(false);
    });
});
