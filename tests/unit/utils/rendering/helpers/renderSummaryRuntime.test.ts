import { describe, expect, it, vi } from "vitest";

import { getRenderSummaryRuntime } from "../../../../../electron-app/utils/rendering/helpers/renderSummaryRuntime.js";

describe("getRenderSummaryRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
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
            AbortController: TestAbortController,
        });

        expect(createAbortController()).toBeInstanceOf(TestAbortController);
        expect(controllerCount).toBe(1);
    });

    it("routes scheduling dependencies through provider functions", () => {
        expect.assertions(15);

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
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 44);
        const getAbortController = vi.fn(() => TestAbortController);
        const getAddEventListener = vi.fn(() => addEventListener);
        const getCancelAnimationFrame = vi.fn(() => cancelAnimationFrame);
        const getRequestAnimationFrame = vi.fn(() => requestAnimationFrame);
        const utils = getRenderSummaryRuntime({
            getAbortController,
            getAddEventListener,
            getCancelAnimationFrame,
            getRequestAnimationFrame,
        });

        expect(utils.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        utils.addResizeListener(listener, options);
        expect(utils.requestAnimationFrame(frameCallback)).toBe(44);
        utils.cancelAnimationFrame(44);

        expect(getAbortController).toHaveBeenCalledOnce();
        expect(getAddEventListener).toHaveBeenCalledOnce();
        expect(getRequestAnimationFrame).toHaveBeenCalledOnce();
        expect(getCancelAnimationFrame).toHaveBeenCalledOnce();
        expect(controllerCount).toBe(1);
        expect(addEventListener).toHaveBeenCalledWith(
            "resize",
            listener,
            options
        );
        expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(44);
        expect(addEventListener.mock.contexts[0]).toMatchObject({
            getAddEventListener,
        });
        expect(requestAnimationFrame.mock.contexts[0]).toMatchObject({
            getRequestAnimationFrame,
        });
        expect(cancelAnimationFrame.mock.contexts[0]).toMatchObject({
            getCancelAnimationFrame,
        });
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

    it("schedules animation frames through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 42);
        const { requestAnimationFrame: requestFrame } = getRenderSummaryRuntime(
            {
                requestAnimationFrame,
            }
        );

        expect(requestFrame(callback)).toBe(42);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toStrictEqual({
            requestAnimationFrame,
        });
    });

    it("returns null when animation-frame scheduling is unavailable", () => {
        expect.assertions(1);

        expect(getRenderSummaryRuntime({}).requestAnimationFrame(vi.fn())).toBe(
            null
        );
    });

    it("cancels animation frames through the injected runtime scope", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const { cancelAnimationFrame: cancelFrame } = getRenderSummaryRuntime({
            cancelAnimationFrame,
        });

        cancelFrame(21);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(21);
        expect(cancelAnimationFrame.mock.contexts[0]).toStrictEqual({
            cancelAnimationFrame,
        });
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getRenderSummaryRuntime({}).cancelAnimationFrame(7)
        ).not.toThrow();
    });

    it("registers resize listeners through the injected runtime scope", () => {
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
        const { addResizeListener } = getRenderSummaryRuntime({
            addEventListener,
        });

        addResizeListener(listener, options);

        expect(addEventListener).toHaveBeenCalledWith(
            "resize",
            listener,
            options
        );
        expect(addEventListener.mock.contexts[0]).toStrictEqual({
            addEventListener,
        });
    });

    it("ignores resize listeners when the runtime scope cannot listen", () => {
        expect.assertions(1);

        expect(() =>
            getRenderSummaryRuntime({}).addResizeListener(vi.fn())
        ).not.toThrow();
    });
});
