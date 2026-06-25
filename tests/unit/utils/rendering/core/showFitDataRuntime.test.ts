import { describe, expect, it, vi } from "vitest";

import { getShowFitDataRuntime } from "../../../../../electron-app/utils/rendering/core/showFitDataRuntime.js";

describe("showFitDataRuntime", () => {
    it("uses browser runtime providers for production defaults", async () => {
        expect.assertions(6);

        const runtime = getShowFitDataRuntime();
        const mapContainer = document.createElement("div");
        const listener = vi.fn();

        mapContainer.id = "leaflet-map";
        document.body.append(mapContainer);
        globalThis.addEventListener("fitfile-loaded", listener);

        try {
            const event = runtime.createCustomEvent("fitfile-loaded", {
                detail: { filePath: "activity.fit" },
            });
            let microtaskRan = false;

            expect(event).toBeInstanceOf(CustomEvent);
            expect(event.detail).toStrictEqual({ filePath: "activity.fit" });
            expect(runtime.dispatchEvent(event)).toBe(true);
            expect(listener).toHaveBeenCalledWith(event);
            expect(runtime.hasRenderedMapContainer()).toBe(true);

            runtime.queueMicrotask(() => {
                microtaskRan = true;
            });
            await Promise.resolve();

            expect(microtaskRan).toBe(true);
        } finally {
            globalThis.removeEventListener("fitfile-loaded", listener);
            mapContainer.remove();
        }
    });

    it("resolves scroll support and reduced-motion preference through scoped browser APIs", () => {
        expect.assertions(4);

        const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList),
            scrollTo = vi.fn(),
            runtime = getShowFitDataRuntime({
                getMatchMedia: () => matchMedia,
                getScrollTo: () => scrollTo,
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
        expect.assertions(21);

        const callback = vi.fn<() => void>();
        const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
        const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
        const queueMicrotask = vi.fn<(callback: () => void) => void>();
        const querySelector = vi.fn<ParentNode["querySelector"]>(() =>
            document.createElement("div")
        );
        const scrollTo = vi.fn<(options: ScrollToOptions) => void>();
        const getCustomEvent = vi.fn(() => CustomEvent);
        const getDocument = vi.fn(() => ({ querySelector }));
        const getDispatchEvent = vi.fn(() => dispatchEvent);
        const getMatchMedia = vi.fn(() => matchMedia);
        const getQueueMicrotask = vi.fn(() => queueMicrotask);
        const getScrollTo = vi.fn(() => scrollTo);
        const runtime = getShowFitDataRuntime({
            getCustomEvent,
            getDocument,
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
        expect(runtime.hasRenderedMapContainer()).toBe(true);
        runtime.queueMicrotask(callback);
        runtime.scrollTo({ behavior: "smooth", top: 12 });

        expect(getScrollTo).toHaveBeenCalledTimes(2);
        expect(getMatchMedia).toHaveBeenCalledOnce();
        expect(getCustomEvent).toHaveBeenCalledOnce();
        expect(getDocument).toHaveBeenCalledOnce();
        expect(getDispatchEvent).toHaveBeenCalledOnce();
        expect(getQueueMicrotask).toHaveBeenCalledOnce();
        expect(querySelector).toHaveBeenCalledWith("#leaflet-map");
        expect(matchMedia).toHaveBeenCalledWith(
            "(prefers-reduced-motion: reduce)"
        );
        expect(dispatchEvent).toHaveBeenCalledWith(event);
        expect(queueMicrotask).toHaveBeenCalledWith(callback);
        expect(scrollTo).toHaveBeenCalledWith({ behavior: "smooth", top: 12 });
        expect(queueMicrotask.mock.contexts[0]).toMatchObject({
            getQueueMicrotask,
        });
        expect(querySelector.mock.contexts[0]).toMatchObject({
            querySelector,
        });
        expect(scrollTo.mock.contexts[0]).toMatchObject({ getScrollTo });
        expect(callback).not.toHaveBeenCalled();
    });

    it("falls back when optional browser APIs are unavailable", () => {
        expect.assertions(3);

        const runtime = getShowFitDataRuntime({});

        expect(runtime.canScrollTo()).toBe(false);
        expect(runtime.hasRenderedMapContainer()).toBe(false);
        expect(runtime.prefersReducedMotion()).toBe(false);
    });

    it("creates and dispatches custom events through scoped browser APIs", () => {
        expect.assertions(4);

        const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
        const runtime = getShowFitDataRuntime({
            getCustomEvent: () => CustomEvent,
            getDispatchEvent: () => dispatchEvent,
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
                getDispatchEvent: () => () => true,
            }).createCustomEvent("fitfile-loaded")
        ).toThrow("showFitData requires a CustomEvent runtime");
        expect(() =>
            getShowFitDataRuntime({
                getCustomEvent: () => CustomEvent,
            }).dispatchEvent(new Event("fitfile-loaded"))
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
            runtime = getShowFitDataRuntime({
                getQueueMicrotask: () => queueMicrotask,
            });

        runtime.queueMicrotask(callback);
        queuedCallback?.();

        expect(queueMicrotask).toHaveBeenCalledWith(callback);
        expect(callback).toHaveBeenCalledWith();
        expect(ran).toBe(true);
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(11);

        const callback = vi.fn<() => void>();
        const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
        const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
        const queueMicrotask = vi.fn<(callback: () => void) => void>();
        const querySelector = vi.fn<ParentNode["querySelector"]>(() =>
            document.createElement("div")
        );
        const scrollTo = vi.fn<(options: ScrollToOptions) => void>();
        const runtime = getShowFitDataRuntime({
            CustomEvent,
            document: { querySelector },
            dispatchEvent,
            matchMedia,
            queueMicrotask,
            scrollTo,
        } as unknown as Parameters<typeof getShowFitDataRuntime>[0]);

        expect(runtime.canScrollTo()).toBe(false);
        expect(runtime.hasRenderedMapContainer()).toBe(false);
        expect(runtime.prefersReducedMotion()).toBe(false);
        expect(() => runtime.createCustomEvent("fitfile-loaded")).toThrow(
            "showFitData requires a CustomEvent runtime"
        );
        expect(() =>
            runtime.dispatchEvent(new Event("fitfile-loaded"))
        ).toThrow("showFitData requires a dispatchEvent runtime");
        runtime.queueMicrotask(callback);
        runtime.scrollTo({ behavior: "auto", top: 0 });

        expect(dispatchEvent).not.toHaveBeenCalled();
        expect(matchMedia).not.toHaveBeenCalled();
        expect(queueMicrotask).not.toHaveBeenCalled();
        expect(querySelector).not.toHaveBeenCalled();
        expect(scrollTo).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
    });

    it("detects the rendered map container through the scoped document provider", () => {
        expect.assertions(3);

        const querySelector = vi.fn<ParentNode["querySelector"]>((selector) =>
            selector === "#leaflet-map" ? document.createElement("div") : null
        );
        const runtime = getShowFitDataRuntime({
            getDocument: () => ({ querySelector }),
        });

        expect(runtime.hasRenderedMapContainer()).toBe(true);
        expect(querySelector).toHaveBeenCalledExactlyOnceWith("#leaflet-map");
        expect(querySelector.mock.contexts[0]).toMatchObject({
            querySelector,
        });
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
