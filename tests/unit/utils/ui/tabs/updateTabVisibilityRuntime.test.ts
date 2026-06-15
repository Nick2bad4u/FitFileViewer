import { describe, expect, it, vi } from "vitest";

import { getUpdateTabVisibilityRuntime } from "../../../../../electron-app/utils/ui/tabs/updateTabVisibilityRuntime.js";

describe("getUpdateTabVisibilityRuntime", () => {
    it("returns the injected document", () => {
        expect.assertions(1);

        expect(getUpdateTabVisibilityRuntime({ document }).getDocument()).toBe(
            document
        );
    });

    it("returns undefined when no document is available", () => {
        expect.assertions(1);

        expect(getUpdateTabVisibilityRuntime({}).getDocument()).toBeUndefined();
    });

    it("wraps animation-frame scheduling", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 4);
        const utils = getUpdateTabVisibilityRuntime({ requestAnimationFrame });

        expect(utils.requestAnimationFrame(callback)).toBe(4);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
    });

    it("returns undefined when animation frames are unavailable", () => {
        expect.assertions(1);

        expect(
            getUpdateTabVisibilityRuntime({}).requestAnimationFrame(() => {})
        ).toBeUndefined();
    });

    it("wraps timer scheduling and cleanup", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const setTimeout = vi.fn<
            (callback: () => void, timeout?: number) => number
        >(() => 8);
        const clearTimeout = vi.fn<(handle: number) => void>();
        const utils = getUpdateTabVisibilityRuntime({
            clearTimeout,
            setTimeout,
        });
        const timeoutMs = Number.parseInt("180", 10);

        expect(utils.setTimeout(callback, timeoutMs)).toBe(8);
        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);

        utils.clearTimeout(8);

        expect(clearTimeout).toHaveBeenCalledWith(8);
        expect(callback).not.toHaveBeenCalled();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getUpdateTabVisibilityRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "updateTabVisibility requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "updateTabVisibility requires a clearTimeout runtime"
        );
    });
});
