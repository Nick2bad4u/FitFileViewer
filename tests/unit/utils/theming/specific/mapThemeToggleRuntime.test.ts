import { describe, expect, it, vi } from "vitest";

import { getMapThemeToggleRuntime } from "../../../../../electron-app/utils/theming/specific/mapThemeToggleRuntime.js";

describe("getMapThemeToggleRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("50");
        const timer = 19 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getMapThemeToggleRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });
});
