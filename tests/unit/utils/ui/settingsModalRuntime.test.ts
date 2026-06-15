import { describe, expect, it, vi } from "vitest";

import { getSettingsModalRuntime } from "../../../../electron-app/utils/ui/settingsModalRuntime.js";

describe("getSettingsModalRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 17);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearCloseTimer,
            setTimeout: scheduleCloseTimer,
        } = getSettingsModalRuntime({ clearTimeout, setTimeout });

        expect(scheduleCloseTimer(callback, delayMs)).toBe(17);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);

        clearCloseTimer(17);

        expect(clearTimeout).toHaveBeenCalledWith(17);
        expect(clearTimeout.mock.contexts[0]).toStrictEqual({
            clearTimeout,
            setTimeout,
        });
    });

    it("routes timers and animation frames through provider functions", () => {
        expect.assertions(12);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const delayMs = Number("150");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 42);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 12);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const getSetTimeout = vi.fn(() => setTimeout);
        const getClearTimeout = vi.fn(() => clearTimeout);
        const getRequestAnimationFrame = vi.fn(() => requestAnimationFrame);
        const getCancelAnimationFrame = vi.fn(() => cancelAnimationFrame);
        const utils = getSettingsModalRuntime({
            getCancelAnimationFrame,
            getClearTimeout,
            getRequestAnimationFrame,
            getSetTimeout,
        });

        expect(utils.setTimeout(callback, delayMs)).toBe(42);
        utils.clearTimeout(42);
        expect(utils.requestAnimationFrame(frameCallback)).toBe(12);
        utils.cancelAnimationFrame(12);

        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(getRequestAnimationFrame).toHaveBeenCalledOnce();
        expect(getCancelAnimationFrame).toHaveBeenCalledOnce();
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(42);
        expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(12);
        expect(callback).not.toHaveBeenCalled();
        expect(frameCallback).not.toHaveBeenCalled();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getSettingsModalRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "settingsModalRuntime requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "settingsModalRuntime requires a clearTimeout runtime"
        );
    });

    it("schedules animation frames through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 9);
        const utils = getSettingsModalRuntime({ requestAnimationFrame });

        expect(utils.requestAnimationFrame(callback)).toBe(9);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toStrictEqual({
            requestAnimationFrame,
        });
    });

    it("runs animation frame callbacks immediately when scheduling is unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();

        expect(
            getSettingsModalRuntime({}).requestAnimationFrame(callback)
        ).toBe(null);
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("cancels animation frames through the injected runtime scope", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const utils = getSettingsModalRuntime({ cancelAnimationFrame });

        utils.cancelAnimationFrame(24);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(24);
        expect(cancelAnimationFrame.mock.contexts[0]).toStrictEqual({
            cancelAnimationFrame,
        });
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getSettingsModalRuntime({}).cancelAnimationFrame(4)
        ).not.toThrow();
    });
});
