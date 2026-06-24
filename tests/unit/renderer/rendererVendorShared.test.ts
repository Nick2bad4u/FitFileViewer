import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getRendererVendorBundleState,
    isRendererVendorEntryLoaded,
    markRendererVendorEntryLoaded,
    rendererVendorEntryLoadedEventName,
    resetRendererVendorBundleState,
} from "../../../electron-app/renderer/rendererVendorShared.js";
import type { RendererVendorSharedRuntime } from "../../../electron-app/renderer/rendererVendorSharedRuntime.js";

describe("rendererVendorShared", () => {
    afterEach(() => {
        resetRendererVendorBundleState();
    });

    it("marks vendor entries loaded and dispatches readiness through the injected runtime", () => {
        expect.assertions(5);

        const leafletRuntime = { map() {} };
        const vendorSharedRuntime: RendererVendorSharedRuntime = {
            dispatchRendererVendorEntryLoadedEvent: vi.fn(() => true),
        };

        markRendererVendorEntryLoaded(
            "map",
            { map: { leafletRuntime } },
            { runtime: vendorSharedRuntime }
        );

        expect(isRendererVendorEntryLoaded("map")).toBe(true);
        expect(getRendererVendorBundleState()).toStrictEqual({
            loaded: true,
            source: "npm-bundle",
            splitEntries: ["map"],
        });
        expect(
            vendorSharedRuntime.dispatchRendererVendorEntryLoadedEvent
        ).toHaveBeenCalledWith(rendererVendorEntryLoadedEventName, {
            entryName: "map",
            map: { leafletRuntime },
        });
        expect(
            vendorSharedRuntime.dispatchRendererVendorEntryLoadedEvent
        ).toHaveBeenCalledOnce();
        expect(isRendererVendorEntryLoaded("core")).toBe(false);
    });
});
