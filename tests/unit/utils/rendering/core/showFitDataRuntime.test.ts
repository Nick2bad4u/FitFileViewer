import { describe, expect, it, vi } from "vitest";

import { getShowFitDataRuntime } from "../../../../../electron-app/utils/rendering/core/showFitDataRuntime.js";

describe("showFitDataRuntime", () => {
    it("resolves scroll support and reduced-motion preference through scoped browser APIs", () => {
        expect.assertions(4);

        const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList),
            scrollTo = vi.fn(),
            runtime = getShowFitDataRuntime({
                matchMedia,
                scrollTo,
            });

        expect(runtime.canScrollTo()).toBe(true);
        expect(runtime.prefersReducedMotion()).toBe(true);
        runtime.scrollTo({ behavior: "auto", top: 0 });

        expect(matchMedia).toHaveBeenCalledWith(
            "(prefers-reduced-motion: reduce)"
        );
        expect(scrollTo).toHaveBeenCalledWith({ behavior: "auto", top: 0 });
    });

    it("falls back when optional browser APIs are unavailable", () => {
        expect.assertions(2);

        const runtime = getShowFitDataRuntime({});

        expect(runtime.canScrollTo()).toBe(false);
        expect(runtime.prefersReducedMotion()).toBe(false);
    });

    it("queues microtasks through the scoped runtime", () => {
        expect.assertions(3);

        let queuedCallback: (() => void) | undefined;
        let ran = false;
        const callback = vi.fn(() => {
                ran = true;
            }),
            queueMicrotask = vi.fn((callback: () => void) => {
                queuedCallback = callback;
            }),
            runtime = getShowFitDataRuntime({ queueMicrotask });

        runtime.queueMicrotask(callback);
        queuedCallback?.();

        expect(queueMicrotask).toHaveBeenCalledWith(callback);
        expect(callback).toHaveBeenCalledWith();
        expect(ran).toBe(true);
    });

    it("uses a promise microtask fallback when queueMicrotask is unavailable", async () => {
        expect.assertions(2);

        let ran = false;
        const callback = vi.fn(() => {
                ran = true;
            }),
            runtime = getShowFitDataRuntime({});

        runtime.queueMicrotask(callback);
        await Promise.resolve();

        expect(callback).toHaveBeenCalledWith();
        expect(ran).toBe(true);
    });
});
