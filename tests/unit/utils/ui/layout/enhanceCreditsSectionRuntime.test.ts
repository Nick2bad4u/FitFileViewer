import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getCreditsMarqueeRuntime,
    type CreditsMarqueeRuntimeScope,
} from "../../../../../electron-app/utils/ui/layout/enhanceCreditsSectionRuntime.js";

describe("getCreditsMarqueeRuntime", () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getCreditsMarqueeRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getCreditsMarqueeRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production DOM, observer, listener, and animation defaults", () => {
        expect.assertions(14);

        const animationFrameHandle = Number("31");
        const animationFrameCallback = vi.fn<FrameRequestCallback>();
        const resizeListener = vi.fn<EventListener>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => animationFrameHandle);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const resizeObserverConstructor =
            vi.fn<(callback: ResizeObserverCallback) => void>();
        const mutationObserverConstructor =
            vi.fn<(callback: MutationCallback) => void>();

        class ResizeObserverMock implements ResizeObserver {
            constructor(callback: ResizeObserverCallback) {
                resizeObserverConstructor(callback);
            }

            disconnect(): void {}
            observe(): void {}
            unobserve(): void {}
        }

        class MutationObserverMock implements MutationObserver {
            constructor(callback: MutationCallback) {
                mutationObserverConstructor(callback);
            }

            disconnect(): void {}
            observe(): void {}
            takeRecords(): MutationRecord[] {
                return [];
            }
        }

        vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
        vi.stubGlobal("MutationObserver", MutationObserverMock);
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
        vi.stubGlobal("ResizeObserver", ResizeObserverMock);

        const section = document.createElement("div");
        section.className = "credits-section";
        document.body.append(section);

        const resizeCallback = vi.fn<ResizeObserverCallback>();
        const mutationCallback = vi.fn<MutationCallback>();
        const runtime = getCreditsMarqueeRuntime();

        runtime.addResizeListener(resizeListener, { passive: true });
        globalThis.dispatchEvent(new Event("resize"));
        runtime.removeResizeListener(resizeListener);
        globalThis.dispatchEvent(new Event("resize"));
        runtime.cancelAnimationFrame(animationFrameHandle);

        expect(runtime.queryCreditsSections(".credits-section")).toStrictEqual([
            section,
        ]);
        expect(runtime.isHTMLElement(section)).toBe(true);
        expect(resizeListener).toHaveBeenCalledOnce();
        expect(runtime.requestAnimationFrame(animationFrameCallback)).toBe(
            animationFrameHandle
        );
        expect(requestAnimationFrame).toHaveBeenCalledWith(
            animationFrameCallback
        );
        expect(cancelAnimationFrame).toHaveBeenCalledWith(animationFrameHandle);
        expect(animationFrameCallback).not.toHaveBeenCalled();
        expect(runtime.createResizeObserver(resizeCallback)).toBeInstanceOf(
            ResizeObserverMock
        );
        expect(runtime.createMutationObserver(mutationCallback)).toBeInstanceOf(
            MutationObserverMock
        );
        expect(resizeObserverConstructor).toHaveBeenCalledWith(resizeCallback);
        expect(mutationObserverConstructor).toHaveBeenCalledWith(
            mutationCallback
        );
        expect(requestAnimationFrame).toHaveBeenCalledOnce();
        expect(cancelAnimationFrame).toHaveBeenCalledOnce();
        expect(resizeObserverConstructor).toHaveBeenCalledOnce();
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getCreditsMarqueeRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "credits marquee requires an AbortController runtime"
        );
    });

    it("queries credits sections through the injected document", () => {
        expect.assertions(2);

        try {
            const section = document.createElement("div");
            section.className = "credits-section";
            document.body.append(section);

            const runtime = getCreditsMarqueeRuntime({
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
            });

            expect(
                runtime.queryCreditsSections("body > .credits-section")
            ).toStrictEqual([section]);
            expect(runtime.isHTMLElement(section)).toBe(true);
        } finally {
            document.body.replaceChildren();
        }
    });

    it("wraps resize listener registration and removal", () => {
        expect.assertions(1);

        const eventTarget = new EventTarget();
        let resizeCount = 0;
        const listener = (): void => {
            resizeCount += 1;
        };
        const runtime = getCreditsMarqueeRuntime({
            getEventTarget: () => eventTarget,
        });

        runtime.addResizeListener(listener, { passive: true });
        eventTarget.dispatchEvent(new Event("resize"));
        runtime.removeResizeListener(listener);
        eventTarget.dispatchEvent(new Event("resize"));

        expect(resizeCount).toBe(1);
    });

    it("creates resize and mutation observers through injected constructors", () => {
        expect.assertions(4);

        const resizeObserverConstructor =
            vi.fn<(callback: ResizeObserverCallback) => void>();
        const mutationObserverConstructor =
            vi.fn<(callback: MutationCallback) => void>();

        class ResizeObserverMock implements ResizeObserver {
            constructor(callback: ResizeObserverCallback) {
                resizeObserverConstructor(callback);
            }

            disconnect(): void {}
            observe(): void {}
            unobserve(): void {}
        }

        class MutationObserverMock implements MutationObserver {
            constructor(callback: MutationCallback) {
                mutationObserverConstructor(callback);
            }

            disconnect(): void {}
            observe(): void {}
            takeRecords(): MutationRecord[] {
                return [];
            }
        }

        const resizeCallback = vi.fn<ResizeObserverCallback>();
        const mutationCallback = vi.fn<MutationCallback>();
        const runtime = getCreditsMarqueeRuntime({
            getMutationObserver: () => MutationObserverMock,
            getResizeObserver: () => ResizeObserverMock,
        });

        expect(runtime.createResizeObserver(resizeCallback)).toBeInstanceOf(
            ResizeObserverMock
        );
        expect(runtime.createMutationObserver(mutationCallback)).toBeInstanceOf(
            MutationObserverMock
        );
        expect(resizeObserverConstructor).toHaveBeenCalledWith(resizeCallback);
        expect(mutationObserverConstructor).toHaveBeenCalledWith(
            mutationCallback
        );
    });

    it("returns undefined when resize observers are unavailable", () => {
        expect.assertions(1);

        expect(
            getCreditsMarqueeRuntime({}).createResizeObserver(() => {})
        ).toBeUndefined();
    });

    it("wraps animation frame scheduling and cancellation", () => {
        expect.assertions(4);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 21);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const runtime = getCreditsMarqueeRuntime({
            getCancelAnimationFrame: () => cancelAnimationFrame,
            getRequestAnimationFrame: () => requestAnimationFrame,
        });

        expect(runtime.requestAnimationFrame(callback)).toBe(21);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);

        runtime.cancelAnimationFrame(21);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(21);
        expect(callback).not.toHaveBeenCalled();
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(7);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const eventTarget = new EventTarget();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 21);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const legacyScope = {
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            cancelAnimationFrame,
            document,
            eventTarget,
            HTMLElement,
            MutationObserver: "MutationObserver",
            requestAnimationFrame,
            ResizeObserver: "ResizeObserver",
        } as unknown as CreditsMarqueeRuntimeScope;
        const runtime = getCreditsMarqueeRuntime(legacyScope);

        expect(() => runtime.createAbortController()).toThrow(
            "credits marquee requires an AbortController runtime"
        );
        expect(() => runtime.queryCreditsSections(".credits-section")).toThrow(
            "credits marquee requires a document-like runtime"
        );
        expect(() => runtime.addResizeListener(() => {}, {})).toThrow(
            "credits marquee requires an event target runtime"
        );
        expect(() => runtime.createMutationObserver(() => {})).toThrow(
            "credits marquee requires a MutationObserver runtime"
        );
        expect(runtime.isHTMLElement(document.body)).toBe(false);
        expect(runtime.requestAnimationFrame(() => {})).toBeUndefined();
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
    });
});
