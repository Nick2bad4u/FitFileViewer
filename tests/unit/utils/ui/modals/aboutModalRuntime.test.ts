import { describe, expect, it, vi } from "vitest";

import { getAboutModalRuntime } from "../../../../../electron-app/utils/ui/modals/aboutModalRuntime.js";

describe("getAboutModalRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 41);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearModalTimer,
            setTimeout: scheduleModalTimer,
        } = getAboutModalRuntime({ clearTimeout, setTimeout });

        expect(scheduleModalTimer(callback, delayMs)).toBe(41);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);

        clearModalTimer(41);

        expect(clearTimeout).toHaveBeenCalledWith(41);
        expect(clearTimeout.mock.contexts[0]).toStrictEqual({
            clearTimeout,
            setTimeout,
        });
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getAboutModalRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "aboutModalRuntime requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "aboutModalRuntime requires a clearTimeout runtime"
        );
    });

    it("schedules animation frames through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 23);
        const { requestAnimationFrame: requestFrame } = getAboutModalRuntime({
            requestAnimationFrame,
        });

        expect(requestFrame(callback)).toBe(23);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toStrictEqual({
            requestAnimationFrame,
        });
    });

    it("runs animation frame callbacks immediately when scheduling is unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();

        expect(getAboutModalRuntime({}).requestAnimationFrame(callback)).toBe(
            null
        );
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("cancels animation frames through the injected runtime scope", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const { cancelAnimationFrame: cancelFrame } = getAboutModalRuntime({
            cancelAnimationFrame,
        });

        cancelFrame(29);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(29);
        expect(cancelAnimationFrame.mock.contexts[0]).toStrictEqual({
            cancelAnimationFrame,
        });
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getAboutModalRuntime({}).cancelAnimationFrame(11)
        ).not.toThrow();
    });
});
