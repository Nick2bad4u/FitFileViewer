import { describe, expect, it, vi } from "vitest";

import { getRenderSummaryRuntime } from "../../../../../electron-app/utils/rendering/helpers/renderSummaryRuntime.js";

describe("getRenderSummaryRuntime", () => {
    it("creates abort controllers through the injected runtime provider", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("render-summary-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const { createAbortController } = getRenderSummaryRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(createAbortController()).toBeInstanceOf(TestAbortController);
        expect(controllerCount).toBe(1);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getRenderSummaryRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("routes scheduling dependencies through provider functions", () => {
        expect.assertions(25);

        let controllerCount = 0;
        class TestAbortController implements AbortController {
            public readonly signal = Symbol(
                "render-summary-provider-signal"
            ) as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const listener = vi.fn<EventListener>();
        const options: AddEventListenerOptions = { once: true };
        const frameCallback = vi.fn<FrameRequestCallback>();
        const addEventListener =
            vi.fn<
                (
                    type: string,
                    listener: EventListener,
                    options?: AddEventListenerOptions
                ) => void
            >();
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const documentRef =
            document.implementation.createHTMLDocument("render summary");
        const summaryContainer = documentRef.createElement("section");
        summaryContainer.id = "content-summary";
        documentRef.body.append(summaryContainer);
        const createElement = vi.spyOn(documentRef, "createElement");
        const createDocumentFragment = vi.spyOn(
            documentRef,
            "createDocumentFragment"
        );
        const createElementNS = vi.spyOn(documentRef, "createElementNS");
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 44);
        const getAbortController = vi.fn(() => TestAbortController);
        const getAddEventListener = vi.fn(() => addEventListener);
        const getCancelAnimationFrame = vi.fn(() => cancelAnimationFrame);
        const getDocument = vi.fn(() => documentRef);
        const getRequestAnimationFrame = vi.fn(() => requestAnimationFrame);
        const scope = {
            getAbortController,
            getAddEventListener,
            getCancelAnimationFrame,
            getDocument,
            getRequestAnimationFrame,
        };
        const utils = getRenderSummaryRuntime(scope);

        expect(utils.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(utils.createElement("button")).toBeInstanceOf(HTMLButtonElement);
        expect(utils.createDocumentFragment()).toBeInstanceOf(DocumentFragment);
        const svg = utils.createSvgElement("svg");
        expect(svg.nodeName).toBe("svg");
        expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(utils.getSummaryContainer()).toBe(summaryContainer);
        utils.addResizeListener(listener, options);
        expect(utils.requestAnimationFrame(frameCallback)).toBe(44);
        utils.cancelAnimationFrame(44);

        expect(getAbortController).toHaveBeenCalledOnce();
        expect(getAddEventListener).toHaveBeenCalledOnce();
        expect(getDocument).toHaveBeenCalledTimes(4);
        expect(getRequestAnimationFrame).toHaveBeenCalledOnce();
        expect(getCancelAnimationFrame).toHaveBeenCalledOnce();
        expect(controllerCount).toBe(1);
        expect(createElement).toHaveBeenCalledWith("button");
        expect(createDocumentFragment).toHaveBeenCalledOnce();
        expect(createDocumentFragment.mock.contexts[0]).toBe(documentRef);
        expect(createElementNS).toHaveBeenCalledWith(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        expect(addEventListener).toHaveBeenCalledWith(
            "resize",
            listener,
            options
        );
        expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(44);
        expect(addEventListener.mock.contexts[0]).toBe(scope);
        expect(requestAnimationFrame.mock.contexts[0]).toBe(scope);
        expect(cancelAnimationFrame.mock.contexts[0]).toBe(scope);
        expect(listener).not.toHaveBeenCalled();
        expect(frameCallback).not.toHaveBeenCalled();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const { createAbortController } = getRenderSummaryRuntime({});

        expect(() => {
            createAbortController();
        }).toThrow("renderSummary requires an AbortController runtime");
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(4);

        const utils = getRenderSummaryRuntime({});

        expect(() => utils.createElement("button")).toThrow(
            "renderSummary requires a document runtime"
        );
        expect(() => utils.createDocumentFragment()).toThrow(
            "renderSummary requires a document runtime"
        );
        expect(() => utils.createSvgElement("svg")).toThrow(
            "renderSummary requires a document runtime"
        );
        expect(() => utils.getSummaryContainer()).toThrow(
            "renderSummary requires a document runtime"
        );
    });

    it("schedules animation frames through the injected runtime provider", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 42);
        const scope = {
            getRequestAnimationFrame: () => requestAnimationFrame,
        };
        const { requestAnimationFrame: requestFrame } =
            getRenderSummaryRuntime(scope);

        expect(requestFrame(callback)).toBe(42);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("returns null when animation-frame scheduling is unavailable", () => {
        expect.assertions(1);

        expect(getRenderSummaryRuntime({}).requestAnimationFrame(vi.fn())).toBe(
            null
        );
    });

    it("cancels animation frames through the injected runtime provider", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const scope = {
            getCancelAnimationFrame: () => cancelAnimationFrame,
        };
        const { cancelAnimationFrame: cancelFrame } =
            getRenderSummaryRuntime(scope);

        cancelFrame(21);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(21);
        expect(cancelAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getRenderSummaryRuntime({}).cancelAnimationFrame(7)
        ).not.toThrow();
    });

    it("registers resize listeners through the injected runtime provider", () => {
        expect.assertions(2);

        const addEventListener =
            vi.fn<
                (
                    type: string,
                    listener: EventListener,
                    options?: AddEventListenerOptions
                ) => void
            >();
        const listener = vi.fn<EventListener>();
        const options: AddEventListenerOptions = { once: true };
        const scope = {
            getAddEventListener: () => addEventListener,
        };
        const { addResizeListener } = getRenderSummaryRuntime(scope);

        addResizeListener(listener, options);

        expect(addEventListener).toHaveBeenCalledWith(
            "resize",
            listener,
            options
        );
        expect(addEventListener.mock.contexts[0]).toBe(scope);
    });

    it("ignores resize listeners when the runtime scope cannot listen", () => {
        expect.assertions(1);

        expect(() =>
            getRenderSummaryRuntime({}).addResizeListener(vi.fn())
        ).not.toThrow();
    });

    it("ignores legacy direct scheduling runtime properties", () => {
        expect.assertions(15);

        let controllerCount = 0;
        class TestAbortController implements AbortController {
            public readonly signal = Symbol(
                "render-summary-legacy-signal"
            ) as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const listener = vi.fn<EventListener>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const addEventListener = vi.fn<typeof globalThis.addEventListener>();
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 51);
        const utils = getRenderSummaryRuntime({
            AbortController: TestAbortController,
            addEventListener,
            cancelAnimationFrame,
            document,
            requestAnimationFrame,
        } as unknown as Parameters<typeof getRenderSummaryRuntime>[0]);

        expect(() => utils.createAbortController()).toThrow(
            "renderSummary requires an AbortController runtime"
        );
        expect(() => utils.createElement("button")).toThrow(
            "renderSummary requires a document runtime"
        );
        expect(() => utils.createDocumentFragment()).toThrow(
            "renderSummary requires a document runtime"
        );
        expect(() => utils.createSvgElement("svg")).toThrow(
            "renderSummary requires a document runtime"
        );
        expect(() => utils.getSummaryContainer()).toThrow(
            "renderSummary requires a document runtime"
        );
        utils.addResizeListener(listener);
        expect(utils.requestAnimationFrame(frameCallback)).toBe(null);
        utils.cancelAnimationFrame(51);

        expect(controllerCount).toBe(0);
        expect(addEventListener).not.toHaveBeenCalled();
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();
        expect(frameCallback).not.toHaveBeenCalled();
        expect(() => utils.addResizeListener(listener)).not.toThrow();
        expect(utils.requestAnimationFrame(frameCallback)).toBe(null);
        expect(frameCallback).not.toHaveBeenCalled();
    });
});
