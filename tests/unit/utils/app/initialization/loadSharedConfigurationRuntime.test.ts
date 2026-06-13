import { describe, expect, it, vi } from "vitest";

import { getLoadSharedConfigurationRuntime } from "../../../../../electron-app/utils/app/initialization/loadSharedConfigurationRuntime.js";

describe("getLoadSharedConfigurationRuntime", () => {
    it("reads the current location search from an injected runtime scope", () => {
        expect.assertions(1);

        const runtime = getLoadSharedConfigurationRuntime({
            location: {
                search: "?chartConfig=abc",
            },
        });

        expect(runtime.locationSearch).toBe("?chartConfig=abc");
    });

    it("uses an empty search string when no location is available", () => {
        expect.assertions(1);

        expect(getLoadSharedConfigurationRuntime({}).locationSearch).toBe("");
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("100");
        const timer = 23 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getLoadSharedConfigurationRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getLoadSharedConfigurationRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "loadSharedConfigurationRuntime requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("loadSharedConfigurationRuntime requires clearTimeout");
    });
});
