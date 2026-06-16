import { describe, expect, it, vi } from "vitest";

import { getKeyboardShortcutsModalRuntime } from "../../../../../electron-app/utils/ui/modals/keyboardShortcutsModalRuntime.js";

describe("getKeyboardShortcutsModalRuntime", () => {
    it("schedules and clears timers through the injected runtime providers", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 31);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const scope = {
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        };
        const {
            clearTimeout: clearModalTimer,
            setTimeout: scheduleModalTimer,
        } = getKeyboardShortcutsModalRuntime(scope);

        expect(scheduleModalTimer(callback, delayMs)).toBe(31);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);

        clearModalTimer(31);

        expect(clearTimeout).toHaveBeenCalledWith(31);
        expect(clearTimeout.mock.contexts[0]).toBe(scope);
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

    it("schedules animation frames through the injected runtime provider", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 17);
        const scope = {
            getRequestAnimationFrame: () => requestAnimationFrame,
        };
        const { requestAnimationFrame: requestFrame } =
            getKeyboardShortcutsModalRuntime(scope);

        expect(requestFrame(callback)).toBe(17);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("returns null when animation-frame scheduling is unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();

        expect(
            getKeyboardShortcutsModalRuntime({}).requestAnimationFrame(callback)
        ).toBe(null);
        expect(callback).not.toHaveBeenCalled();
    });

    it("cancels animation frames through the injected runtime provider", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const scope = {
            getCancelAnimationFrame: () => cancelAnimationFrame,
        };
        const { cancelAnimationFrame: cancelFrame } =
            getKeyboardShortcutsModalRuntime(scope);

        cancelFrame(19);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(19);
        expect(cancelAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("ignores legacy direct timing runtime properties", () => {
        expect.assertions(9);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 37);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 41);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const runtime = getKeyboardShortcutsModalRuntime({
            cancelAnimationFrame,
            clearTimeout,
            requestAnimationFrame,
            setTimeout,
        } as unknown as Parameters<typeof getKeyboardShortcutsModalRuntime>[0]);

        expect(() => runtime.setTimeout(callback, 0)).toThrow(
            "keyboardShortcutsModalRuntime requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(37)).toThrow(
            "keyboardShortcutsModalRuntime requires a clearTimeout runtime"
        );
        expect(runtime.requestAnimationFrame(frameCallback)).toBe(null);
        runtime.cancelAnimationFrame(41);

        expect(frameCallback).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getKeyboardShortcutsModalRuntime({}).cancelAnimationFrame(5)
        ).not.toThrow();
    });
});
