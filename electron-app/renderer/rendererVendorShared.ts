import type { RendererVendorBundleEntry } from "./vendorBundleManifest.js";
import { getRendererVendorSharedRuntime } from "./rendererVendorSharedRuntime.js";

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
    arqueroRuntime: unknown;
    domPurifyRuntime: unknown;
    exportZipRuntime: unknown;
    screenfullRuntime: unknown;
}>;

export type RendererVendorMapRuntimePayload = Readonly<{
    leafletRuntime: unknown;
}>;

export const rendererVendorEntryLoadedEventName =
    "ffv-renderer-vendor-entry-loaded";

const loadedVendorEntries = new Set<RendererVendorBundleEntry>();
const rendererVendorSharedRuntime = getRendererVendorSharedRuntime();

function dispatchRendererVendorEntryLoadedEvent(
    entryName: RendererVendorBundleEntry,
    runtimePayload: RendererVendorRuntimePayload = {}
): void {
    rendererVendorSharedRuntime.dispatchRendererVendorEntryLoadedEvent(
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
    runtimePayload: RendererVendorRuntimePayload = {}
): void {
    recordRendererVendorEntryLoaded(entryName);
    dispatchRendererVendorEntryLoadedEvent(entryName, runtimePayload);
}

export function recordRendererVendorEntryLoaded(
    entryName: RendererVendorBundleEntry
): void {
    loadedVendorEntries.add(entryName);
}

export function resetRendererVendorBundleState(): void {
    loadedVendorEntries.clear();
}
