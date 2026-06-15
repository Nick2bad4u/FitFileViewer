import { describe, expect, it, vi } from "vitest";

import { getRenderMapRuntime } from "../../../../../electron-app/utils/maps/core/renderMapRuntime.js";

describe("getRenderMapRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const utils = getRenderMapRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(utils.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime({});

        expect(() => utils.createAbortController()).toThrow(
            "renderMap requires an AbortController runtime"
        );
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = () => undefined;
        const delayMs = Number("240");
        const timer = 101 as ReturnType<typeof globalThis.setTimeout>;
        let scheduledCallback: unknown;
        let scheduledDelay: unknown;
        let clearedTimer: unknown;
        const setTimeout = ((handler: TimerHandler, timeout?: number) => {
            scheduledCallback = handler;
            scheduledDelay = timeout;
            return timer;
        }) as typeof globalThis.setTimeout;
        const clearTimeout: typeof globalThis.clearTimeout = (handle) => {
            clearedTimer = handle;
        };
        const utils = getRenderMapRuntime({ clearTimeout, setTimeout });

        expect(utils.setTimeout(callback, delayMs)).toBe(timer);
        utils.clearTimeout(timer);

        expect({ scheduledCallback, scheduledDelay }).toStrictEqual({
            scheduledCallback: callback,
            scheduledDelay: delayMs,
        });
        expect(clearedTimer).toBe(timer);
    });

    it("throws when timer cleanup is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime({});

        expect(() =>
            utils.clearTimeout(101 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("renderMap requires a clearTimeout runtime");
    });

    it("throws when timer scheduling is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime({});

        expect(() => utils.setTimeout(vi.fn(), 1)).toThrow(
            "renderMap requires a setTimeout runtime"
        );
    });

    it("schedules animation frames through the injected runtime scope", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        let scheduledFrameCallback: unknown;
        const requestAnimationFrame: typeof globalThis.requestAnimationFrame = (
            frameCallback
        ) => {
            scheduledFrameCallback = frameCallback;
            return 13;
        };
        const utils = getRenderMapRuntime({ requestAnimationFrame });

        utils.requestAnimationFrame(callback);

        expect(scheduledFrameCallback).toBe(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it("falls back to a zero-delay timer when animation frames are unavailable", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        let fallbackDelay: unknown;
        const setTimeout = ((handler: TimerHandler, delay?: number) => {
            fallbackDelay = delay;
            if (typeof handler === "function") {
                handler();
            }
            return 9 as ReturnType<typeof globalThis.setTimeout>;
        }) as typeof globalThis.setTimeout;
        const utils = getRenderMapRuntime({ setTimeout });

        utils.requestAnimationFrame(callback);

        expect(fallbackDelay).toBe(0);
        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("requires a timer runtime when animation frames are unavailable", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime({});

        expect(() => utils.requestAnimationFrame(vi.fn())).toThrow(
            "renderMap requires a setTimeout runtime"
        );
    });
});
