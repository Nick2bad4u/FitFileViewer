import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getNotificationTimerRuntime,
    type NotificationTimerRuntimeScope,
} from "../../../../../electron-app/utils/ui/notifications/notificationTimerRuntime.js";

describe("notificationTimerRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("uses browser runtime providers for production clock and timer defaults", () => {
        expect.assertions(5);

        const callback = vi.fn<() => void>();
        const timestamp = Number("1700");
        const timer = 43 as ReturnType<typeof globalThis.setTimeout>;
        const delay = Number("250");
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);

        vi.spyOn(Date, "now").mockReturnValue(timestamp);
        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("setTimeout", setTimeout);

        const runtime = getNotificationTimerRuntime();
        const scheduledTimer = runtime.setTimeout(callback, delay);

        expect(runtime.dateNow()).toBe(timestamp);
        expect(scheduledTimer).toBe(timer);
        runtime.clearTimeout(scheduledTimer);
        expect(setTimeout).toHaveBeenCalledWith(callback, delay);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });

    it("delegates clock, timer scheduling, and clearing through the scoped runtime", () => {
        expect.assertions(6);

        const callback = vi.fn<() => void>();
        const timestamp = Number("1700");
        const timer = Number("43");
        const delay = Number("250");
        const clearTimeout = vi.fn();
        const dateNow = vi.fn<() => number>(() => timestamp);
        const setTimeout = vi.fn(() => timer);
        const runtime = getNotificationTimerRuntime({
            getClearTimeout: () => clearTimeout,
            getDateNow: () => dateNow,
            getSetTimeout: () => setTimeout,
        });

        const currentTimestamp = runtime.dateNow();
        const scheduledTimer = runtime.setTimeout(callback, delay);
        runtime.clearTimeout(scheduledTimer);

        expect(currentTimestamp).toBe(timestamp);
        expect(dateNow).toHaveBeenCalledTimes(1);
        expect(scheduledTimer).toBe(timer);
        expect(setTimeout).toHaveBeenCalledWith(callback, delay);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });

    it("fails fast when timer APIs are unavailable", () => {
        expect.assertions(3);

        const runtime = getNotificationTimerRuntime({});

        expect(() => runtime.dateNow()).toThrow(
            "notification timers require dateNow"
        );
        expect(() => runtime.setTimeout(() => undefined, 0)).toThrow(
            "notification timers require setTimeout"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "notification timers require clearTimeout"
        );
    });

    it("ignores legacy direct timer and clock scope properties", () => {
        expect.assertions(3);

        const runtime = getNotificationTimerRuntime({
            clearTimeout() {
                throw new Error("legacy clearTimeout should not run");
            },
            dateNow() {
                throw new Error("legacy dateNow should not run");
            },
            setTimeout() {
                throw new Error("legacy setTimeout should not run");
            },
        } as unknown as NotificationTimerRuntimeScope);

        expect(() => runtime.dateNow()).toThrow(
            "notification timers require dateNow"
        );
        expect(() => runtime.setTimeout(() => undefined, 0)).toThrow(
            "notification timers require setTimeout"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "notification timers require clearTimeout"
        );
    });
});
