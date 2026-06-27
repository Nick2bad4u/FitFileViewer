import type { RendererVendorBundleEntry } from "./vendorBundleManifest.js";
import {
    getRendererVendorSharedRuntime,
    type RendererVendorSharedRuntime,
} from "./rendererVendorSharedRuntime.js";
import type { DomPurifyRuntime } from "../utils/dom/domPurifyRuntime.js";
import type { ExportZipConstructor } from "../utils/files/export/exportZipRuntime.js";
import type { ArqueroRuntime } from "../utils/rendering/helpers/arqueroRuntime.js";
import type { ScreenfullRuntime } from "../utils/ui/controls/screenfullRuntime.js";

export type { RendererVendorBundleEntry } from "./vendorBundleManifest.js";

export type RendererVendorBundleState = Readonly<{
    loaded: true;
    source: "npm-bundle";
    splitEntries: readonly RendererVendorBundleEntry[];
}>;

export type RendererVendorEntryLoadedEventDetail = Readonly<{
    chartData?: RendererVendorChartDataRuntimePayload;
    core?: RendererVendorCoreRuntimePayload;
    entryName: RendererVendorBundleEntry;
    map?: RendererVendorMapRuntimePayload;
}>;

export type RendererVendorChartDataRuntimePayload = Readonly<{
    chartRuntime: unknown;
    chartZoomPlugin: unknown;
    dataTableRuntime: unknown;
}>;

export type RendererVendorRuntimePayload = Readonly<{
    chartData?: RendererVendorChartDataRuntimePayload;
    core?: RendererVendorCoreRuntimePayload;
    map?: RendererVendorMapRuntimePayload;
}>;

export type RendererVendorCoreRuntimePayload = Readonly<{
    arqueroRuntime: ArqueroRuntime;
    domPurifyRuntime: DomPurifyRuntime;
    exportZipRuntime: ExportZipConstructor;
    screenfullRuntime: ScreenfullRuntime;
}>;

export type RendererVendorMapRuntimePayload = Readonly<{
    leafletRuntime: unknown;
}>;

export const rendererVendorEntryLoadedEventName =
    "ffv-renderer-vendor-entry-loaded";

const loadedVendorEntries = new Set<RendererVendorBundleEntry>();

export type RendererVendorSharedOptions = Readonly<{
    readonly runtime?: RendererVendorSharedRuntime | undefined;
}>;

function dispatchRendererVendorEntryLoadedEvent(
    entryName: RendererVendorBundleEntry,
    runtimePayload: RendererVendorRuntimePayload = {},
    runtime: RendererVendorSharedRuntime = getRendererVendorSharedRuntime()
): void {
    runtime.dispatchRendererVendorEntryLoadedEvent(
        rendererVendorEntryLoadedEventName,
        {
            ...runtimePayload,
            entryName,
        } satisfies RendererVendorEntryLoadedEventDetail
    );
}

export function getRendererVendorBundleState(): RendererVendorBundleState {
    return {
        loaded: true,
        source: "npm-bundle",
        splitEntries: [...loadedVendorEntries].sort(),
    };
}

export function isRendererVendorEntryLoaded(
    entryName: RendererVendorBundleEntry
): boolean {
    return loadedVendorEntries.has(entryName);
}

export function markRendererVendorEntryLoaded(
    entryName: RendererVendorBundleEntry,
    runtimePayload: RendererVendorRuntimePayload = {},
    options: RendererVendorSharedOptions = {}
): void {
    recordRendererVendorEntryLoaded(entryName);
    dispatchRendererVendorEntryLoadedEvent(
        entryName,
        runtimePayload,
        options.runtime
    );
}

export function recordRendererVendorEntryLoaded(
    entryName: RendererVendorBundleEntry
): void {
    loadedVendorEntries.add(entryName);
}

export function resetRendererVendorBundleState(): void {
    loadedVendorEntries.clear();
}
