import { describe, expect, it, vi } from "vitest";

import { getShowNotificationRuntime } from "../../../electron-app/utils/ui/notifications/showNotificationRuntime.js";

describe("showNotificationRuntime", () => {
    it("schedules animation frames through the scoped window when available", () => {
        expect.assertions(3);

        const callback = vi.fn();
        const windowRuntime = {
            requestAnimationFrame: vi.fn(() => 13),
        };
        const scopeRuntime = {
            requestAnimationFrame: vi.fn(() => 17),
            window: windowRuntime,
        };

        const frame = getShowNotificationRuntime(
            scopeRuntime
        ).requestAnimationFrame(callback);

        expect(frame).toBe(13);
        expect(windowRuntime.requestAnimationFrame).toHaveBeenCalledWith(
            callback
        );
        expect(scopeRuntime.requestAnimationFrame).not.toHaveBeenCalled();
    });

    it("falls back to the scoped animation frame scheduler", () => {
        expect.assertions(2);

        const callback = vi.fn();
        const scopeRuntime = {
            requestAnimationFrame: vi.fn(() => 23),
        };

        const frame = getShowNotificationRuntime(
            scopeRuntime
        ).requestAnimationFrame(callback);

        expect(frame).toBe(23);
        expect(scopeRuntime.requestAnimationFrame).toHaveBeenCalledWith(
            callback
        );
    });

    it("runs animation frame callbacks immediately when no scheduler exists", () => {
        expect.assertions(2);

        const callback = vi.fn();

        const frame = getShowNotificationRuntime(
            {}
        ).requestAnimationFrame(callback);

        expect(frame).toBeNull();
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("cancels animation frames through the scoped window when available", () => {
        expect.assertions(3);

        const windowRuntime = {
            cancelAnimationFrame: vi.fn(),
        };
        const scopeRuntime = {
            cancelAnimationFrame: vi.fn(),
            window: windowRuntime,
        };

        getShowNotificationRuntime(scopeRuntime).cancelAnimationFrame(29);

        expect(() =>
            getShowNotificationRuntime({}).cancelAnimationFrame(31)
        ).not.toThrow();
        expect(windowRuntime.cancelAnimationFrame).toHaveBeenCalledWith(29);
        expect(scopeRuntime.cancelAnimationFrame).not.toHaveBeenCalled();
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
});
