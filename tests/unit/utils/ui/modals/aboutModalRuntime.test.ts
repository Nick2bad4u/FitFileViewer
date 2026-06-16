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

    it("routes timers and animation frames through provider functions", () => {
        expect.assertions(14);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const documentTarget = document.implementation.createHTMLDocument();
        const delayMs = Number("250");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 42);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 12);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const getSetTimeout = vi.fn(() => setTimeout);
        const getClearTimeout = vi.fn(() => clearTimeout);
        const getDocument = vi.fn(() => documentTarget);
        const getRequestAnimationFrame = vi.fn(() => requestAnimationFrame);
        const getCancelAnimationFrame = vi.fn(() => cancelAnimationFrame);
        const runtime = getAboutModalRuntime({
            getCancelAnimationFrame,
            getClearTimeout,
            getDocument,
            getRequestAnimationFrame,
            getSetTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(42);
        runtime.clearTimeout(42);
        expect(runtime.getDocument()).toBe(documentTarget);
        expect(runtime.requestAnimationFrame(frameCallback)).toBe(12);
        runtime.cancelAnimationFrame(12);

        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(getDocument).toHaveBeenCalledOnce();
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
        expect.assertions(3);

        const runtime = getAboutModalRuntime({});

        expect(runtime.getDocument()).toBeUndefined();
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

    it("returns document values from direct runtime scopes", () => {
        expect.assertions(1);

        const documentTarget = document.implementation.createHTMLDocument();

        expect(
            getAboutModalRuntime({ document: documentTarget }).getDocument()
        ).toBe(documentTarget);
    });
});
