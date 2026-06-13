import { describe, expect, it, vi } from "vitest";

import { getRendererApplicationStartupRuntime } from "../../../electron-app/renderer/applicationStartupRuntime.js";

describe("getRendererApplicationStartupRuntime", () => {
    it("schedules timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const updateCheckDelayMs = Number("5000");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 25);
        const utils = getRendererApplicationStartupRuntime({ setTimeout });

        expect(utils.setTimeout(callback, updateCheckDelayMs)).toBe(25);
        expect(setTimeout).toHaveBeenCalledWith(callback, updateCheckDelayMs);
        expect(setTimeout.mock.contexts[0]).toBeUndefined();
    });

    it("clears timers through the injected runtime scope", () => {
        expect.assertions(2);

        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const utils = getRendererApplicationStartupRuntime({ clearTimeout });

        utils.clearTimeout(25);

        expect(clearTimeout).toHaveBeenCalledWith(25);
        expect(clearTimeout.mock.contexts[0]).toBeUndefined();
    });
});
