export type RendererVendorBundleEntry = "chart-data" | "core" | "map";

export type RendererVendorBundleState = Readonly<{
    loaded: true;
    source: "npm-bundle";
    splitEntries: readonly RendererVendorBundleEntry[];
}>;

export type RendererVendorEntryLoadedEventDetail = Readonly<{
    entryName: RendererVendorBundleEntry;
}>;

export const rendererVendorEntryLoadedEventName =
    "ffv-renderer-vendor-entry-loaded";

const rendererVendorEntryRegistryKey = Symbol.for(
    "fitfileviewer.rendererVendorEntries"
);

type RendererVendorEntryRegistryGlobal = typeof globalThis &
    Record<symbol, Set<RendererVendorBundleEntry> | undefined>;

function getLoadedVendorEntries(): Set<RendererVendorBundleEntry> {
    const vendorGlobal = globalThis as RendererVendorEntryRegistryGlobal;
    const existingEntries = vendorGlobal[rendererVendorEntryRegistryKey];

    if (existingEntries instanceof Set) {
        return existingEntries;
    }

    const loadedVendorEntries = new Set<RendererVendorBundleEntry>();
    Object.defineProperty(vendorGlobal, rendererVendorEntryRegistryKey, {
        configurable: true,
        enumerable: false,
        value: loadedVendorEntries,
        writable: false,
    });

    return loadedVendorEntries;
}

function dispatchRendererVendorEntryLoadedEvent(
    entryName: RendererVendorBundleEntry
): void {
    const eventTarget = globalThis.window ?? globalThis;

    if (
        typeof eventTarget.dispatchEvent !== "function" ||
        typeof CustomEvent !== "function"
    ) {
        return;
    }

    eventTarget.dispatchEvent(
        new CustomEvent<RendererVendorEntryLoadedEventDetail>(
            rendererVendorEntryLoadedEventName,
            {
                detail: { entryName },
            }
        )
    );
}

export function getRendererVendorBundleState(): RendererVendorBundleState {
    return {
        loaded: true,
        source: "npm-bundle",
        splitEntries: [...getLoadedVendorEntries()].sort(),
    };
}

export function isRendererVendorEntryLoaded(
    entryName: RendererVendorBundleEntry
): boolean {
    return getLoadedVendorEntries().has(entryName);
}

export function markRendererVendorEntryLoaded(
    entryName: RendererVendorBundleEntry
): void {
    getLoadedVendorEntries().add(entryName);
    dispatchRendererVendorEntryLoadedEvent(entryName);
}

export function resetRendererVendorBundleState(): void {
    getLoadedVendorEntries().clear();
}
