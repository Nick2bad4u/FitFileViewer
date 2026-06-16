import { afterEach, describe, expect, it, vi } from "vitest";

import { getShowNotificationRuntime } from "../../../electron-app/utils/ui/notifications/showNotificationRuntime.js";

describe("showNotificationRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("resolves default browser animation frame wrappers when notification operations run", () => {
        expect.assertions(4);

        const callback = vi.fn();
        const requestAnimationFrame = vi.fn(() => 13);
        const cancelAnimationFrame = vi.fn();
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
        vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

        const runtime = getShowNotificationRuntime();
        const frame = runtime.requestAnimationFrame(callback);
        runtime.cancelAnimationFrame(frame ?? 0);

        expect(frame).toBe(13);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(13);
        expect(callback).not.toHaveBeenCalled();
    });

    it("schedules animation frames through the scoped scheduler", () => {
        expect.assertions(2);

        const callback = vi.fn();
        const scopeRuntime = {
            requestAnimationFrame: vi.fn(() => 23),
        };

        const frame =
            getShowNotificationRuntime(scopeRuntime).requestAnimationFrame(
                callback
            );

        expect(frame).toBe(23);
        expect(scopeRuntime.requestAnimationFrame).toHaveBeenCalledWith(
            callback
        );
    });

    it("runs animation frame callbacks immediately when no scheduler exists", () => {
        expect.assertions(2);

        const callback = vi.fn();

        const frame = getShowNotificationRuntime({}).requestAnimationFrame(
            callback
        );

        expect(frame).toBeNull();
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("cancels animation frames through the scoped frame canceler", () => {
        expect.assertions(2);

        const scopeRuntime = {
            cancelAnimationFrame: vi.fn(),
        };

        getShowNotificationRuntime(scopeRuntime).cancelAnimationFrame(29);

        expect(() =>
            getShowNotificationRuntime({}).cancelAnimationFrame(31)
        ).not.toThrow();
        expect(scopeRuntime.cancelAnimationFrame).toHaveBeenCalledWith(29);
    });

    it("delegates notification timers through the scoped runtime", () => {
        expect.assertions(4);

        const callback = vi.fn();
        const timer = Number("31");
        const duration = Number("300");
        const scopeRuntime = {
            clearTimeout: vi.fn(),
            setTimeout: vi.fn(() => timer),
        };
        const runtime = getShowNotificationRuntime(scopeRuntime);

        const scheduledTimer = runtime.setTimeout(callback, duration);
        runtime.clearTimeout(scheduledTimer);

        expect(scheduledTimer).toBe(timer);
        expect(scopeRuntime.setTimeout).toHaveBeenCalledWith(
            callback,
            duration
        );
        expect(scopeRuntime.clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });

    it("resolves default browser timers when notification operations run", () => {
        expect.assertions(4);

        const callback = vi.fn();
        const duration = Number("500");
        const timer = Number("37");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getShowNotificationRuntime();

        vi.stubGlobal("setTimeout", setTimeout);
        vi.stubGlobal("clearTimeout", clearTimeout);

        const scheduledTimer = runtime.setTimeout(callback, duration);
        runtime.clearTimeout(scheduledTimer);

        expect(scheduledTimer).toBe(timer);
        expect(setTimeout).toHaveBeenCalledWith(callback, duration);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });
});
