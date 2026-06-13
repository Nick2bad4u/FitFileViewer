import { describe, expect, it, vi } from "vitest";

import { getRendererVendorBundleLoaderRuntime } from "../../../electron-app/renderer/vendorBundleLoaderRuntime.js";

describe("getRendererVendorBundleLoaderRuntime", () => {
    it("registers and removes event listeners through the injected runtime scope", () => {
        expect.assertions(4);

        const addEventListener = vi.fn<typeof globalThis.addEventListener>();
        const removeEventListener =
            vi.fn<typeof globalThis.removeEventListener>();
        const listener = vi.fn<EventListener>();
        const options: AddEventListenerOptions = { once: true };
        const utils = getRendererVendorBundleLoaderRuntime({
            addEventListener,
            removeEventListener,
        });

        utils.addEventListener("ready", listener, options);
        utils.removeEventListener("ready", listener);

        expect(addEventListener).toHaveBeenCalledWith(
            "ready",
            listener,
            options
        );
        expect(addEventListener.mock.contexts[0]).toStrictEqual({
            addEventListener,
            removeEventListener,
        });
        expect(removeEventListener).toHaveBeenCalledWith("ready", listener);
        expect(removeEventListener.mock.contexts[0]).toStrictEqual({
            addEventListener,
            removeEventListener,
        });
    });

    it("schedules and clears polling timers through the injected runtime scope", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const pollDelayMs = Number("20");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 29);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const utils = getRendererVendorBundleLoaderRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(utils.setTimeout(callback, pollDelayMs)).toBe(29);
        expect(setTimeout).toHaveBeenCalledWith(callback, pollDelayMs);

        utils.clearTimeout(29);

        expect(clearTimeout).toHaveBeenCalledWith(29);
        expect(clearTimeout.mock.contexts[0]).toBeUndefined();
    });
});
