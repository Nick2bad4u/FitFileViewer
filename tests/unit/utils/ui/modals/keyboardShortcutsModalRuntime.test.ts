import { describe, expect, it, vi } from "vitest";

import { getKeyboardShortcutsModalRuntime } from "../../../../../electron-app/utils/ui/modals/keyboardShortcutsModalRuntime.js";

describe("getKeyboardShortcutsModalRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 31);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearModalTimer,
            setTimeout: scheduleModalTimer,
        } = getKeyboardShortcutsModalRuntime({ clearTimeout, setTimeout });

        expect(scheduleModalTimer(callback, delayMs)).toBe(31);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);

        clearModalTimer(31);

        expect(clearTimeout).toHaveBeenCalledWith(31);
        expect(clearTimeout.mock.contexts[0]).toStrictEqual({
            clearTimeout,
            setTimeout,
        });
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getKeyboardShortcutsModalRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "keyboardShortcutsModalRuntime requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "keyboardShortcutsModalRuntime requires a clearTimeout runtime"
        );
    });

    it("schedules animation frames through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 17);
        const { requestAnimationFrame: requestFrame } =
            getKeyboardShortcutsModalRuntime({
                requestAnimationFrame,
            });

        expect(requestFrame(callback)).toBe(17);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toStrictEqual({
            requestAnimationFrame,
        });
    });

    it("returns null when animation-frame scheduling is unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();

        expect(
            getKeyboardShortcutsModalRuntime({}).requestAnimationFrame(callback)
        ).toBe(null);
        expect(callback).not.toHaveBeenCalled();
    });

    it("cancels animation frames through the injected runtime scope", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const { cancelAnimationFrame: cancelFrame } =
            getKeyboardShortcutsModalRuntime({
                cancelAnimationFrame,
            });

        cancelFrame(19);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(19);
        expect(cancelAnimationFrame.mock.contexts[0]).toStrictEqual({
            cancelAnimationFrame,
        });
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getKeyboardShortcutsModalRuntime({}).cancelAnimationFrame(5)
        ).not.toThrow();
    });
});
