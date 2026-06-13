import { afterEach, describe, expect, it, vi } from "vitest";

import {
    ensureRendererVendorBundle,
    type RendererVendorBundleEntry,
} from "../../../electron-app/renderer/vendorBundleLoader.js";
import {
    isRendererVendorBundleEntry,
    rendererVendorBundleEntries,
    rendererVendorBundleFileByEntry,
} from "../../../electron-app/renderer/vendorBundleManifest.js";
import {
    markRendererVendorEntryLoaded,
    resetRendererVendorBundleState,
} from "../../../electron-app/renderer/rendererVendorShared.js";
import {
    clearChartRuntimeForTests,
    resolveChartRuntime,
    resolveChartZoomPlugin,
} from "../../../electron-app/utils/charts/core/chartRuntime.js";
import {
    clearDomPurifyRuntimeForTests,
    resolveDomPurifyRuntime,
} from "../../../electron-app/utils/dom/domPurifyRuntime.js";
import {
    clearExportZipRuntimeForTests,
    resolveExportZipRuntime,
} from "../../../electron-app/utils/files/export/exportZipRuntime.js";
import {
    clearLeafletRuntimeForTests,
    resolveLeafletRuntime,
} from "../../../electron-app/utils/maps/core/leafletRuntime.js";
import {
    clearArqueroRuntimeForTests,
    resolveArqueroRuntime,
} from "../../../electron-app/utils/rendering/helpers/arqueroRuntime.js";
import {
    clearDataTableRuntimeForTests,
    resolveDataTableRuntime,
} from "../../../electron-app/utils/rendering/core/dataTableRuntime.js";
import {
    clearScreenfullRuntimeForTests,
    resolveScreenfullRuntime,
} from "../../../electron-app/utils/ui/controls/screenfullRuntime.js";

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
        clearChartRuntimeForTests();
        clearArqueroRuntimeForTests();
        clearDomPurifyRuntimeForTests();
        clearExportZipRuntimeForTests();
        clearLeafletRuntimeForTests();
        clearDataTableRuntimeForTests();
        clearScreenfullRuntimeForTests();
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

    it("keeps the split vendor manifest explicit", () => {
        expect.assertions(4);

        expect(rendererVendorBundleEntries).toStrictEqual([
            "chart-data",
            "core",
            "map",
        ]);
        expect(rendererVendorBundleFileByEntry).toStrictEqual({
            "chart-data": "renderer-vendor-chart-data.js",
            core: "renderer-vendor-core.js",
            map: "renderer-vendor-map.js",
        });
        expect(isRendererVendorBundleEntry("map")).toBe(true);
        expect(isRendererVendorBundleEntry("summary")).toBe(false);
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
        expect(script.src).toMatch(/\/renderer-vendor-map\.js$/u);
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

    it("ignores malformed readiness events while waiting for the matching entry", async () => {
        expect.assertions(1);

        vi.useFakeTimers();
        try {
            const vendorReadiness = [ensureVendorBundle("map")];
            const script = getVendorScript("map");

            script.dispatchEvent(new Event("load"));
            globalThis.dispatchEvent(
                new CustomEvent("ffv-renderer-vendor-entry-loaded", {
                    detail: { entryName: "summary" },
                })
            );
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

    it("registers Chart.js and DataTables payloads from the split vendor event", async () => {
        expect.assertions(4);

        const chartRuntime = { register() {} };
        const chartZoomPlugin = { id: "zoom" };
        const dataTableRuntime = Object.assign(function DataTableRuntime() {}, {
            isDataTable() {},
        });
        const vendorReadiness = [ensureVendorBundle("chart-data")];
        const script = getVendorScript("chart-data");

        markRendererVendorEntryLoaded("chart-data", {
            chartData: {
                chartRuntime,
                chartZoomPlugin,
                dataTableRuntime,
            },
        });
        script.dispatchEvent(new Event("load"));

        await expect(vendorReadiness[0]).resolves.toBeUndefined();
        expect(
            resolveChartRuntime(
                (value): value is typeof chartRuntime => value === chartRuntime
            )
        ).toBe(chartRuntime);
        expect(resolveChartZoomPlugin()).toBe(chartZoomPlugin);
        expect(
            resolveDataTableRuntime(
                (value): value is typeof dataTableRuntime =>
                    value === dataTableRuntime
            )
        ).toBe(dataTableRuntime);
    });

    it("registers core runtime payloads from the split core vendor event", async () => {
        expect.assertions(5);

        const arqueroRuntime = { from() {} };
        const domPurifyRuntime = {
            sanitize: vi.fn<(value: string) => string>(),
        };
        class ExportZipRuntime {}
        const screenfullRuntime = {
            isEnabled: true,
            isFullscreen: false,
            on() {},
        };
        const vendorReadiness = [ensureVendorBundle("core")];
        const script = getVendorScript("core");

        markRendererVendorEntryLoaded("core", {
            core: {
                arqueroRuntime,
                domPurifyRuntime,
                exportZipRuntime: ExportZipRuntime,
                screenfullRuntime,
            },
        });
        script.dispatchEvent(new Event("load"));

        await expect(vendorReadiness[0]).resolves.toBeUndefined();
        expect(resolveArqueroRuntime()).toBe(arqueroRuntime);
        expect(resolveDomPurifyRuntime()).toBe(domPurifyRuntime);
        expect(resolveExportZipRuntime()).toBe(ExportZipRuntime);
        expect(resolveScreenfullRuntime()).toBe(screenfullRuntime);
    });

    it("registers the Leaflet payload from the split map vendor event", async () => {
        expect.assertions(2);

        const leafletRuntime = { divIcon() {} };
        const vendorReadiness = [ensureVendorBundle("map")];
        const script = getVendorScript("map");

        markRendererVendorEntryLoaded("map", {
            map: { leafletRuntime },
        });
        script.dispatchEvent(new Event("load"));

        await expect(vendorReadiness[0]).resolves.toBeUndefined();
        expect(
            resolveLeafletRuntime(
                (value): value is typeof leafletRuntime =>
                    value === leafletRuntime
            )
        ).toBe(leafletRuntime);
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
            "Failed to load renderer vendor bundle: renderer-vendor-chart-data.js"
        );
    });
});
