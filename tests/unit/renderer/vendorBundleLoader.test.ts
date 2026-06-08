import { afterEach, describe, expect, it, vi } from "vitest";

import {
    ensureRendererVendorBundle,
    type RendererVendorBundleEntry,
} from "../../../electron-app/renderer/vendorBundleLoader.js";
import {
    markRendererVendorEntryLoaded,
    resetRendererVendorBundleState,
} from "../../../electron-app/renderer/vendorGlobalsShared.js";

function markEntryLoaded(entryName: RendererVendorBundleEntry): void {
    markRendererVendorEntryLoaded(entryName);
}

function ensureVendorBundle(
    entryName: RendererVendorBundleEntry
): Promise<void> {
    return ensureRendererVendorBundle(entryName);
}

function getVendorScript(
    entryName: RendererVendorBundleEntry
): HTMLScriptElement {
    const script = document.querySelector(
        `script[data-ffv-renderer-vendor-entry="${entryName}"]`
    );

    if (!(script instanceof HTMLScriptElement)) {
        throw new Error(`Expected ${entryName} vendor script`);
    }

    return script;
}

describe("renderer vendor bundle loader", () => {
    afterEach(() => {
        resetRendererVendorBundleState();
        document
            .querySelectorAll("script[data-ffv-renderer-vendor-entry]")
            .forEach((script) => script.remove());
    });

    it("resolves immediately when the requested split entry is already loaded", async () => {
        expect.assertions(1);

        markEntryLoaded("chart-data");

        await expect(
            ensureRendererVendorBundle("chart-data")
        ).resolves.toBeUndefined();
    });

    it("injects one module script and resolves after the bundle marks itself loaded", async () => {
        expect.assertions(5);

        const vendorReadiness = {
            initial: ensureVendorBundle("map"),
            duplicate: ensureVendorBundle("map"),
        };
        const script = getVendorScript("map");

        expect(script.type).toBe("module");
        expect(script.defer).toBe(true);
        expect(script.src).toMatch(/\/vendor-globals-map\.js$/u);
        expect(
            document.querySelectorAll(
                'script[data-ffv-renderer-vendor-entry="map"]'
            )
        ).toHaveLength(1);

        markEntryLoaded("map");
        script.dispatchEvent(new Event("load"));

        await expect(
            Promise.all([vendorReadiness.initial, vendorReadiness.duplicate])
        ).resolves.toStrictEqual([undefined, undefined]);
    });

    it("waits for the split entry marker after the script load event", async () => {
        expect.assertions(1);

        vi.useFakeTimers();
        try {
            const vendorReadiness = [ensureVendorBundle("map")];
            const script = getVendorScript("map");

            script.dispatchEvent(new Event("load"));
            await vi.advanceTimersByTimeAsync(20);

            markEntryLoaded("map");
            await vi.advanceTimersByTimeAsync(20);

            await expect(vendorReadiness[0]).resolves.toBeUndefined();
        } finally {
            vi.useRealTimers();
        }
    });

    it("resolves when the module marks readiness before the script load event", async () => {
        expect.assertions(1);

        const vendorReadiness = [ensureVendorBundle("map")];
        const script = getVendorScript("map");

        markEntryLoaded("map");
        script.dispatchEvent(new Event("load"));

        await expect(vendorReadiness[0]).resolves.toBeUndefined();
    });

    it("waits for the split entry marker when a script tag already exists", async () => {
        expect.assertions(2);

        const existingScript = document.createElement("script");
        existingScript.dataset["ffvRendererVendorEntry"] = "map";
        document.head.append(existingScript);

        vi.useFakeTimers();
        try {
            const vendorReadiness = [ensureVendorBundle("map")];

            expect(
                document.querySelectorAll(
                    'script[data-ffv-renderer-vendor-entry="map"]'
                )
            ).toHaveLength(1);

            await vi.advanceTimersByTimeAsync(20);
            markEntryLoaded("map");
            await vi.advanceTimersByTimeAsync(20);

            await expect(vendorReadiness[0]).resolves.toBeUndefined();
        } finally {
            vi.useRealTimers();
        }
    });

    it("rejects when the split script fails to load", async () => {
        expect.assertions(1);

        const vendorReadiness = [ensureVendorBundle("chart-data")];
        const script = getVendorScript("chart-data");
        script.dispatchEvent(new Event("error"));

        await expect(vendorReadiness[0]).rejects.toThrow(
            "Failed to load renderer vendor bundle: vendor-globals-chart-data.js"
        );
    });
});
