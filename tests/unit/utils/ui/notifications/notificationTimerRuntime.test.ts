import { describe, expect, it, vi } from "vitest";

import { getNotificationTimerRuntime } from "../../../../../electron-app/utils/ui/notifications/notificationTimerRuntime.js";

describe("notificationTimerRuntime", () => {
    it("delegates timer scheduling and clearing through the scoped runtime", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const timer = Number("43");
        const delay = Number("250");
        const clearTimeout = vi.fn();
        const setTimeout = vi.fn(() => timer);
        const runtime = getNotificationTimerRuntime({
            clearTimeout,
            setTimeout,
        });

        const scheduledTimer = runtime.setTimeout(callback, delay);
        runtime.clearTimeout(scheduledTimer);

        expect(scheduledTimer).toBe(timer);
        expect(setTimeout).toHaveBeenCalledWith(callback, delay);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });

    it("fails fast when timer APIs are unavailable", () => {
        expect.assertions(2);

        const runtime = getNotificationTimerRuntime({});

        expect(() => runtime.setTimeout(() => undefined, 0)).toThrow(
            "notification timers require setTimeout"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "notification timers require clearTimeout"
        );
    });
});
