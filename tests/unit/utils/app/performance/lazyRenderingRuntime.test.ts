import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getLazyRenderingRuntime,
    type LazyRenderingRuntimeScope,
} from "../../../../../electron-app/utils/app/performance/lazyRenderingRuntime.js";

class FakeIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = "0px";
    readonly thresholds: readonly number[] = [0];

    disconnect = vi.fn<() => void>();
    observe = vi.fn<(target: Element) => void>();
    takeRecords = vi.fn<() => IntersectionObserverEntry[]>(() => []);
    unobserve = vi.fn<(target: Element) => void>();
}

function createLazyRenderingRuntimeScope(
    overrides: Partial<LazyRenderingRuntimeScope> = {}
): LazyRenderingRuntimeScope {
    return {
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
        getIntersectionObserver: () => undefined,
        getRequestAnimationFrame: () => undefined,
        getRequestIdleCallback: () => undefined,
        getSetTimeout: () => undefined,
        getViewport: () => undefined,
        ...overrides,
    };
}

describe("getLazyRenderingRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("schedules animation frames when available", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 12);
        const utils = getLazyRenderingRuntime(
            createLazyRenderingRuntimeScope({
                getRequestAnimationFrame: () => requestAnimationFrame,
            })
        );

        expect(utils.requestAnimationFrame(callback)).toBe(12);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
    });

    it("returns undefined when animation frames are unavailable", () => {
        expect.assertions(1);

        expect(
            getLazyRenderingRuntime(
                createLazyRenderingRuntimeScope()
            ).requestAnimationFrame(() => {})
        ).toBeUndefined();
    });

    it("creates intersection observers when available", () => {
        expect.assertions(1);

        const utils = getLazyRenderingRuntime(
            createLazyRenderingRuntimeScope({
                getIntersectionObserver: () =>
                    FakeIntersectionObserver as unknown as typeof IntersectionObserver,
            })
        );

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
            getLazyRenderingRuntime(
                createLazyRenderingRuntimeScope()
            ).createIntersectionObserver(() => {}, {})
        ).toBeUndefined();
    });

    it("reads viewport dimensions from the viewport provider before document fallbacks", () => {
        expect.assertions(1);

        expect(
            getLazyRenderingRuntime(
                createLazyRenderingRuntimeScope({
                    getDocument: () => ({
                        documentElement: {
                            clientHeight: 720,
                            clientWidth: 960,
                        },
                    }),
                    getViewport: () => ({ height: 800, width: 1200 }),
                })
            ).getViewport()
        ).toStrictEqual({ height: 800, width: 1200 });
    });

    it("falls back to document viewport dimensions", () => {
        expect.assertions(1);

        expect(
            getLazyRenderingRuntime(
                createLazyRenderingRuntimeScope({
                    getDocument: () => ({
                        documentElement: {
                            clientHeight: 720,
                            clientWidth: 960,
                        },
                    }),
                })
            ).getViewport()
        ).toStrictEqual({ height: 720, width: 960 });
    });

    it("checks HTMLElement instances through the runtime scope", () => {
        expect.assertions(2);

        const element = document.createElement("div");

        expect(
            getLazyRenderingRuntime(
                createLazyRenderingRuntimeScope({
                    getHTMLElement: () => HTMLElement,
                })
            ).isHTMLElement(element)
        ).toBe(true);
        expect(
            getLazyRenderingRuntime(
                createLazyRenderingRuntimeScope()
            ).isHTMLElement(element)
        ).toBe(false);
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
        const utils = getLazyRenderingRuntime(
            createLazyRenderingRuntimeScope({
                getRequestIdleCallback: () => requestIdleCallback,
            })
        );

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
        const utils = getLazyRenderingRuntime(
            createLazyRenderingRuntimeScope({
                getSetTimeout: () => setTimeout,
            })
        );

        expect(utils.setTimeout(callback)).toBe(9);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
        expect(callback).toHaveBeenCalledOnce();
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(11);

        const animationCallback = vi.fn<FrameRequestCallback>();
        const idleCallback = vi.fn<IdleRequestCallback>();
        const timeoutCallback = vi.fn<() => void>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 12);
        const requestIdleCallback = vi.fn<
            (
                callback: IdleRequestCallback,
                options?: IdleRequestOptions
            ) => number
        >(() => 44);
        const setTimeout = vi.fn<
            (callback: () => void, timeout?: number) => number
        >((scheduledCallback) => {
            scheduledCallback();
            return 9;
        });
        const element = document.createElement("div");
        const utils = getLazyRenderingRuntime();

        vi.stubGlobal("document", document);
        vi.stubGlobal("HTMLElement", HTMLElement);
        vi.stubGlobal("innerHeight", 800);
        vi.stubGlobal("innerWidth", 1200);
        vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
        vi.stubGlobal("requestIdleCallback", requestIdleCallback);
        vi.stubGlobal("setTimeout", setTimeout);

        expect(utils.createIntersectionObserver(() => {}, {})).toBeInstanceOf(
            FakeIntersectionObserver
        );
        expect(utils.getViewport()).toStrictEqual({
            height: 800,
            width: 1200,
        });
        expect(utils.isHTMLElement(element)).toBe(true);
        expect(utils.requestAnimationFrame(animationCallback)).toBe(12);
        expect(utils.requestIdleCallback(idleCallback, { timeout: 50 })).toBe(
            44
        );
        expect(utils.setTimeout(timeoutCallback)).toBe(9);
        expect(requestAnimationFrame).toHaveBeenCalledWith(animationCallback);
        expect(requestAnimationFrame.mock.contexts[0]).toBe(globalThis);
        expect(requestIdleCallback).toHaveBeenCalledWith(idleCallback, {
            timeout: 50,
        });
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
        expect(timeoutCallback).toHaveBeenCalledOnce();
    });

    it("does not borrow the ambient timeout fallback for explicit scopes", () => {
        expect.assertions(1);

        expect(() =>
            getLazyRenderingRuntime(
                createLazyRenderingRuntimeScope()
            ).setTimeout(() => {})
        ).toThrow("lazyRenderingRuntime requires setTimeout");
    });

    it("fails clearly when explicit runtime provider slots are omitted", () => {
        expect.assertions(7);

        const {
            createIntersectionObserver,
            getViewport,
            isHTMLElement,
            requestAnimationFrame,
            requestIdleCallback,
            setTimeout: setLazyRenderingTimeout,
        } = getLazyRenderingRuntime({} as unknown as LazyRenderingRuntimeScope);

        expect(() => createIntersectionObserver(() => {}, {})).toThrow(
            "lazyRenderingRuntime requires IntersectionObserver provider"
        );
        expect(() => getViewport()).toThrow(
            "lazyRenderingRuntime requires document provider"
        );
        expect(() => isHTMLElement(document.createElement("div"))).toThrow(
            "lazyRenderingRuntime requires HTMLElement provider"
        );
        expect(() => requestAnimationFrame(() => {})).toThrow(
            "lazyRenderingRuntime requires requestAnimationFrame provider"
        );
        expect(() => requestIdleCallback(() => {}, { timeout: 50 })).toThrow(
            "lazyRenderingRuntime requires requestIdleCallback provider"
        );
        expect(() => setLazyRenderingTimeout(() => {})).toThrow(
            "lazyRenderingRuntime requires setTimeout provider"
        );
        expect(() =>
            getLazyRenderingRuntime(
                createLazyRenderingRuntimeScope({
                    getDocument: () => undefined,
                    getViewport: undefined,
                })
            ).getViewport()
        ).toThrow("lazyRenderingRuntime requires viewport provider");
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(9);

        const animationCallback = vi.fn<FrameRequestCallback>();
        const idleCallback = vi.fn<IdleRequestCallback>();
        const timeoutCallback = vi.fn<() => void>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 12);
        const requestIdleCallback = vi.fn<
            (
                callback: IdleRequestCallback,
                options?: IdleRequestOptions
            ) => number
        >(() => 44);
        const setTimeout = vi.fn<
            (callback: () => void, timeout?: number) => number
        >(() => 9);
        const legacyScope = {
            HTMLElement,
            IntersectionObserver:
                FakeIntersectionObserver as unknown as typeof IntersectionObserver,
            document: {
                documentElement: {
                    clientHeight: 720,
                    clientWidth: 960,
                },
            },
            innerHeight: 800,
            innerWidth: 1200,
            requestAnimationFrame,
            requestIdleCallback,
            setTimeout,
        } as unknown as LazyRenderingRuntimeScope;
        const utils = getLazyRenderingRuntime(legacyScope);

        expect(() => utils.createIntersectionObserver(() => {}, {})).toThrow(
            "lazyRenderingRuntime requires IntersectionObserver provider"
        );
        expect(() => utils.getViewport()).toThrow(
            "lazyRenderingRuntime requires document provider"
        );
        expect(() =>
            utils.isHTMLElement(document.createElement("div"))
        ).toThrow("lazyRenderingRuntime requires HTMLElement provider");
        expect(() => utils.requestAnimationFrame(animationCallback)).toThrow(
            "lazyRenderingRuntime requires requestAnimationFrame provider"
        );
        expect(() =>
            utils.requestIdleCallback(idleCallback, { timeout: 50 })
        ).toThrow("lazyRenderingRuntime requires requestIdleCallback provider");
        expect(() => utils.setTimeout(timeoutCallback)).toThrow(
            "lazyRenderingRuntime requires setTimeout provider"
        );
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(requestIdleCallback).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
    });
});
