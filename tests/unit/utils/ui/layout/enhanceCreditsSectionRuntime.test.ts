import { describe, expect, it, vi } from "vitest";

import { getCreditsMarqueeRuntime } from "../../../../../electron-app/utils/ui/layout/enhanceCreditsSectionRuntime.js";

describe("getCreditsMarqueeRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getCreditsMarqueeRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
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
                document,
                HTMLElement,
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
        const runtime = getCreditsMarqueeRuntime({ eventTarget });

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
            MutationObserver: MutationObserverMock,
            ResizeObserver: ResizeObserverMock,
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
            cancelAnimationFrame,
            requestAnimationFrame,
        });

        expect(runtime.requestAnimationFrame(callback)).toBe(21);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);

        runtime.cancelAnimationFrame(21);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(21);
        expect(callback).not.toHaveBeenCalled();
    });
});
