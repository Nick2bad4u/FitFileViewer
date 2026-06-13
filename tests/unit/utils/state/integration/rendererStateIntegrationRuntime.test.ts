import { describe, expect, it, vi } from "vitest";

import { getRendererStateIntegrationRuntime } from "../../../../../electron-app/utils/state/integration/rendererStateIntegrationRuntime.js";

describe("getRendererStateIntegrationRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("5000");
        const timer = 79 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getRendererStateIntegrationRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });
});
