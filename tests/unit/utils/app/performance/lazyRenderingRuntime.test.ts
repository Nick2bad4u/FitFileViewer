import { describe, expect, it, vi } from "vitest";

import { getLazyRenderingRuntime } from "../../../../../electron-app/utils/app/performance/lazyRenderingRuntime.js";

class FakeIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = "0px";
    readonly thresholds: readonly number[] = [0];

    disconnect = vi.fn<() => void>();
    observe = vi.fn<(target: Element) => void>();
    takeRecords = vi.fn<() => IntersectionObserverEntry[]>(() => []);
    unobserve = vi.fn<(target: Element) => void>();
}

describe("getLazyRenderingRuntime", () => {
    it("schedules animation frames when available", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 12);
        const utils = getLazyRenderingRuntime({ requestAnimationFrame });

        expect(utils.requestAnimationFrame(callback)).toBe(12);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
    });

    it("returns undefined when animation frames are unavailable", () => {
        expect.assertions(1);

        expect(
            getLazyRenderingRuntime({}).requestAnimationFrame(() => {})
        ).toBeUndefined();
    });

    it("creates intersection observers when available", () => {
        expect.assertions(1);

        const utils = getLazyRenderingRuntime({
            IntersectionObserver:
                FakeIntersectionObserver as unknown as typeof IntersectionObserver,
        });

        expect(
            utils.createIntersectionObserver(() => {}, {
                rootMargin: "4px",
                threshold: 0.2,
            })
        ).toBeInstanceOf(FakeIntersectionObserver);
    });

    it("returns undefined when intersection observers are unavailable", () => {
        expect.assertions(1);

        expect(
            getLazyRenderingRuntime({}).createIntersectionObserver(() => {}, {})
        ).toBeUndefined();
    });

    it("reads viewport dimensions from window values before document fallbacks", () => {
        expect.assertions(1);

        expect(
            getLazyRenderingRuntime({
                document: {
                    documentElement: {
                        clientHeight: 720,
                        clientWidth: 960,
                    },
                },
                innerHeight: 800,
                innerWidth: 1200,
            }).getViewport()
        ).toStrictEqual({ height: 800, width: 1200 });
    });

    it("falls back to document viewport dimensions", () => {
        expect.assertions(1);

        expect(
            getLazyRenderingRuntime({
                document: {
                    documentElement: {
                        clientHeight: 720,
                        clientWidth: 960,
                    },
                },
            }).getViewport()
        ).toStrictEqual({ height: 720, width: 960 });
    });

    it("checks HTMLElement instances through the runtime scope", () => {
        expect.assertions(2);

        const element = document.createElement("div");

        expect(
            getLazyRenderingRuntime({ HTMLElement }).isHTMLElement(element)
        ).toBe(true);
        expect(getLazyRenderingRuntime({}).isHTMLElement(element)).toBe(false);
    });

    it("requests idle callbacks when available", () => {
        expect.assertions(2);

        const callback = vi.fn<IdleRequestCallback>();
        const requestIdleCallback = vi.fn<
            (
                callback: IdleRequestCallback,
                options?: IdleRequestOptions
            ) => number
        >(() => 44);
        const utils = getLazyRenderingRuntime({ requestIdleCallback });

        expect(utils.requestIdleCallback(callback, { timeout: 50 })).toBe(44);
        expect(requestIdleCallback).toHaveBeenCalledWith(callback, {
            timeout: 50,
        });
    });

    it("uses the injected timeout fallback", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const setTimeout = vi.fn<
            (callback: () => void, timeout?: number) => number
        >((scheduledCallback) => {
            scheduledCallback();
            return 9;
        });
        const utils = getLazyRenderingRuntime({ setTimeout });

        expect(utils.setTimeout(callback)).toBe(9);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
        expect(callback).toHaveBeenCalledOnce();
    });

    it("does not borrow the ambient timeout fallback for explicit scopes", () => {
        expect.assertions(1);

        expect(() => getLazyRenderingRuntime({}).setTimeout(() => {})).toThrow(
            "lazyRenderingRuntime requires setTimeout"
        );
    });
});
