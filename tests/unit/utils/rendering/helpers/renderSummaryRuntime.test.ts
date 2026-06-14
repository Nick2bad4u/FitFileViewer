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
