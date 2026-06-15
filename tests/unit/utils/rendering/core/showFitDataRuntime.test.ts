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

    it("routes browser APIs through provider functions", () => {
        expect.assertions(17);

        const callback = vi.fn<() => void>();
        const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
        const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
        const queueMicrotask = vi.fn<(callback: () => void) => void>();
        const scrollTo = vi.fn<(options: ScrollToOptions) => void>();
        const getCustomEvent = vi.fn(() => CustomEvent);
        const getDispatchEvent = vi.fn(() => dispatchEvent);
        const getMatchMedia = vi.fn(() => matchMedia);
        const getQueueMicrotask = vi.fn(() => queueMicrotask);
        const getScrollTo = vi.fn(() => scrollTo);
        const runtime = getShowFitDataRuntime({
            getCustomEvent,
            getDispatchEvent,
            getMatchMedia,
            getQueueMicrotask,
            getScrollTo,
        });

        expect(runtime.canScrollTo()).toBe(true);
        expect(runtime.prefersReducedMotion()).toBe(true);
        const event = runtime.createCustomEvent("fitfile-loaded", {
            detail: { filePath: "provider.fit" },
        });
        expect(event).toBeInstanceOf(CustomEvent);
        expect(event.detail).toStrictEqual({ filePath: "provider.fit" });
        expect(runtime.dispatchEvent(event)).toBe(true);
        runtime.queueMicrotask(callback);
        runtime.scrollTo({ behavior: "smooth", top: 12 });

        expect(getScrollTo).toHaveBeenCalledTimes(2);
        expect(getMatchMedia).toHaveBeenCalledOnce();
        expect(getCustomEvent).toHaveBeenCalledOnce();
        expect(getDispatchEvent).toHaveBeenCalledOnce();
        expect(getQueueMicrotask).toHaveBeenCalledOnce();
        expect(matchMedia).toHaveBeenCalledWith(
            "(prefers-reduced-motion: reduce)"
        );
        expect(dispatchEvent).toHaveBeenCalledWith(event);
        expect(queueMicrotask).toHaveBeenCalledWith(callback);
        expect(scrollTo).toHaveBeenCalledWith({ behavior: "smooth", top: 12 });
        expect(queueMicrotask.mock.contexts[0]).toMatchObject({
            getQueueMicrotask,
        });
        expect(scrollTo.mock.contexts[0]).toMatchObject({ getScrollTo });
        expect(callback).not.toHaveBeenCalled();
    });

    it("falls back when optional browser APIs are unavailable", () => {
        expect.assertions(2);

        const runtime = getShowFitDataRuntime({});

        expect(runtime.canScrollTo()).toBe(false);
        expect(runtime.prefersReducedMotion()).toBe(false);
    });

    it("creates and dispatches custom events through scoped browser APIs", () => {
        expect.assertions(4);

        const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
        const runtime = getShowFitDataRuntime({
            CustomEvent,
            dispatchEvent,
        });

        const event = runtime.createCustomEvent("fitfile-loaded", {
            detail: { filePath: "activity.fit" },
        });

        expect(event).toBeInstanceOf(CustomEvent);
        expect(event.detail).toStrictEqual({ filePath: "activity.fit" });
        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);
    });

    it("fails clearly when required event APIs are unavailable", () => {
        expect.assertions(2);

        expect(() =>
            getShowFitDataRuntime({
                dispatchEvent: () => true,
            }).createCustomEvent("fitfile-loaded")
        ).toThrow("showFitData requires a CustomEvent runtime");
        expect(() =>
            getShowFitDataRuntime({ CustomEvent }).dispatchEvent(
                new Event("fitfile-loaded")
            )
        ).toThrow("showFitData requires a dispatchEvent runtime");
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
