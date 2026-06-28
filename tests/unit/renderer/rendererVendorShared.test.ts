import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getRendererVendorBundleState,
    isRendererVendorEntryLoaded,
    markRendererVendorEntryLoaded,
    recordRendererVendorEntryLoaded,
    rendererVendorEntryLoadedEventName,
    resetRendererVendorBundleState,
} from "../../../electron-app/renderer/rendererVendorShared.js";
import type { RendererVendorSharedRuntime } from "../../../electron-app/renderer/rendererVendorSharedRuntime.js";

describe("rendererVendorShared", () => {
    afterEach(() => {
        resetRendererVendorBundleState();
    });

    it("dispatches payload readiness without recording the loaded marker", () => {
        expect.assertions(5);

        const leafletRuntime = {
            Layer: class Layer {},
            control: {},
            map() {},
            tileLayer() {},
        };
        const vendorSharedRuntime: RendererVendorSharedRuntime = {
            dispatchRendererVendorEntryLoadedEvent: vi.fn(() => true),
        };

        markRendererVendorEntryLoaded(
            "map",
            { map: { leafletRuntime } },
            { runtime: vendorSharedRuntime }
        );

        expect(isRendererVendorEntryLoaded("map")).toBe(false);
        expect(getRendererVendorBundleState()).toStrictEqual({
            loaded: true,
            source: "npm-bundle",
            splitEntries: [],
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

    it("keeps explicit marker-only recording available", () => {
        expect.assertions(2);

        recordRendererVendorEntryLoaded("map");

        expect(isRendererVendorEntryLoaded("map")).toBe(true);
        expect(getRendererVendorBundleState()).toStrictEqual({
            loaded: true,
            source: "npm-bundle",
            splitEntries: ["map"],
        });
    });
});
