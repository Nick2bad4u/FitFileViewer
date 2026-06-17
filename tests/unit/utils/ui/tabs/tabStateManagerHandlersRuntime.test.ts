import { describe, expect, it, vi } from "vitest";

import {
    getTabStateManagerHandlersRuntime,
    type TabStateManagerHandlersRuntimeScope,
} from "../../../../../electron-app/utils/ui/tabs/tabStateManagerHandlersRuntime.js";

describe("getTabStateManagerHandlersRuntime", () => {
    it("schedules animation frames through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 31);
        const runtime = getTabStateManagerHandlersRuntime({
            getRequestAnimationFrame: () => requestAnimationFrame,
        });

        expect(runtime.requestAnimationFrame(callback)).toBe(31);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toBeUndefined();
    });

    it("returns undefined when animation-frame scheduling is unavailable", () => {
        expect.assertions(1);

        expect(
            getTabStateManagerHandlersRuntime({}).requestAnimationFrame(vi.fn())
        ).toBeUndefined();
    });

    it("cancels animation frames through the injected runtime scope", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const runtime = getTabStateManagerHandlersRuntime({
            getCancelAnimationFrame: () => cancelAnimationFrame,
        });

        runtime.cancelAnimationFrame(19);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(19);
        expect(cancelAnimationFrame.mock.contexts[0]).toBeUndefined();
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getTabStateManagerHandlersRuntime({}).cancelAnimationFrame(19)
        ).not.toThrow();
    });

    it("schedules and clears fallback timers through the injected runtime scope", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const fallbackDelayMs = Number("75");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 47);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getTabStateManagerHandlersRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.setTimeout(callback, fallbackDelayMs)).toBe(47);
        expect(setTimeout).toHaveBeenCalledWith(callback, fallbackDelayMs);

        runtime.clearTimeout(47);

        expect(clearTimeout).toHaveBeenCalledWith(47);
        expect(clearTimeout.mock.contexts[0]).toBeUndefined();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getTabStateManagerHandlersRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "tabStateManagerHandlers requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "tabStateManagerHandlers requires a clearTimeout runtime"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(8);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 41);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 53);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getTabStateManagerHandlersRuntime({
            cancelAnimationFrame,
            clearTimeout,
            requestAnimationFrame,
            setTimeout,
        } as unknown as TabStateManagerHandlersRuntimeScope);

        expect(runtime.requestAnimationFrame(callback)).toBeUndefined();
        expect(() => runtime.cancelAnimationFrame(41)).not.toThrow();
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "tabStateManagerHandlers requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(53)).toThrow(
            "tabStateManagerHandlers requires a clearTimeout runtime"
        );
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
    });
});
