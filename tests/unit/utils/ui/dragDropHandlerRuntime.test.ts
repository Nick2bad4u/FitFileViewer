import { afterEach, describe, expect, it, vi } from "vitest";

import { getDragDropHandlerRuntime } from "../../../../electron-app/utils/ui/dragDropHandlerRuntime.js";

describe("getDragDropHandlerRuntime", () => {
    afterEach(() => {
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
        const runtime = getDragDropHandlerRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getDragDropHandlerRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "dragDropHandler requires an AbortController runtime"
        );
    });

    it("schedules animation frames through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 42);
        const runtime = getDragDropHandlerRuntime({ requestAnimationFrame });

        expect(runtime.requestAnimationFrame(callback)).toBe(42);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toStrictEqual({
            requestAnimationFrame,
        });
    });

    it("runs animation frame callbacks immediately when scheduling is unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        const runtime = getDragDropHandlerRuntime({});

        expect(runtime.requestAnimationFrame(callback)).toBe(null);
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("cancels animation frames through the injected runtime scope", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const runtime = getDragDropHandlerRuntime({ cancelAnimationFrame });

        runtime.cancelAnimationFrame(17);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(17);
        expect(cancelAnimationFrame.mock.contexts[0]).toStrictEqual({
            cancelAnimationFrame,
        });
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getDragDropHandlerRuntime({}).cancelAnimationFrame(17)
        ).not.toThrow();
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(5);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 41);
        const callback = vi.fn<FrameRequestCallback>();
        const runtime = getDragDropHandlerRuntime();

        vi.stubGlobal("AbortController", AbortControllerConstructor);
        vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);

        expect(runtime.createAbortController()).toBe(controller);
        expect(runtime.requestAnimationFrame(callback)).toBe(41);
        runtime.cancelAnimationFrame(41);

        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(41);
    });
});
