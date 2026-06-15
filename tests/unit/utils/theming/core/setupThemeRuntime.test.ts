import { describe, expect, it, vi } from "vitest";

import { getSetupThemeRuntime } from "../../../../../electron-app/utils/theming/core/setupThemeRuntime.js";

describe("getSetupThemeRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("5000");
        const timer = 97 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getSetupThemeRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("schedules and clears timers through provider functions", () => {
        expect.assertions(5);

        const callback = vi.fn<() => void>();
        const delayMs = Number("2500");
        const timer = 53 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const getSetTimeout = vi.fn(() => setTimeout);
        const getClearTimeout = vi.fn(() => clearTimeout);
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getSetupThemeRuntime({
            getClearTimeout,
            getSetTimeout,
        });

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getSetupThemeRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "setupThemeRuntime requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("setupThemeRuntime requires clearTimeout");
    });
});
