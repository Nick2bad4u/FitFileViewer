import { describe, expect, it, vi } from "vitest";

import { getGetCurrentSettingsRuntime } from "../../../../../electron-app/utils/app/initialization/getCurrentSettingsRuntime.js";

describe("getGetCurrentSettingsRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("150");
        const timer = 83 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getGetCurrentSettingsRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getGetCurrentSettingsRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "getCurrentSettingsRuntime requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("getCurrentSettingsRuntime requires clearTimeout");
    });
});
