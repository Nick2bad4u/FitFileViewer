import { describe, expect, it, vi } from "vitest";

import { getChartHoverEffectsRuntime } from "../../../electron-app/utils/charts/plugins/addChartHoverEffectsRuntime.js";

describe("getChartHoverEffectsRuntime", () => {
    it("schedules animation frames through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 19);
        const runtime = getChartHoverEffectsRuntime({
            requestAnimationFrame,
        });

        expect(runtime.requestAnimationFrame(callback)).toBe(19);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toStrictEqual({
            requestAnimationFrame,
        });
    });

    it("runs animation frame callbacks immediately when frames are unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        const runtime = getChartHoverEffectsRuntime({});

        expect(runtime.requestAnimationFrame(callback)).toBeNull();
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("schedules timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("600");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 23);
        const runtime = getChartHoverEffectsRuntime({ setTimeout });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(23);
        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(setTimeout.mock.contexts[0]).toStrictEqual({ setTimeout });
    });

    it("waits for the next animation frame when frames are available", async () => {
        expect.assertions(3);

        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >((callback) => {
            callback(Number("125"));
            return 29;
        });
        const setTimeout = vi.fn<typeof globalThis.setTimeout>();
        const runtime = getChartHoverEffectsRuntime({
            requestAnimationFrame,
            setTimeout,
        });

        await runtime.waitForAnimationFrame();

        expect(requestAnimationFrame).toHaveBeenCalledOnce();
        expect(typeof requestAnimationFrame.mock.calls[0]?.[0]).toBe(
            "function"
        );
        expect(setTimeout).not.toHaveBeenCalled();
    });

    it("falls back to the timer runtime when waiting without animation frames", async () => {
        expect.assertions(3);

        const setTimeout = vi.fn<typeof globalThis.setTimeout>(
            (callback) => {
                callback();
                return 31;
            }
        );
        const runtime = getChartHoverEffectsRuntime({ setTimeout });

        await runtime.waitForAnimationFrame();

        expect(setTimeout).toHaveBeenCalledOnce();
        expect(typeof setTimeout.mock.calls[0]?.[0]).toBe("function");
        expect(setTimeout.mock.calls[0]?.[1]).toBe(0);
    });
});
