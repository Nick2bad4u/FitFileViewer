export type RendererVendorGlobal = typeof globalThis & {
    __FFV_RENDERER_VENDOR_BUNDLE__?: Readonly<{
        loaded: true;
        source: "npm-bundle";
        splitEntries: readonly string[];
    }>;
};

export const vendorGlobal = globalThis as RendererVendorGlobal &
    Record<string, unknown>;

export function defineMissingGlobal(key: string, value: unknown): void {
    if (vendorGlobal[key] === undefined || vendorGlobal[key] === null) {
        Object.defineProperty(vendorGlobal, key, {
            configurable: true,
            value,
            writable: true,
        });
    }
}

export function markRendererVendorEntryLoaded(entryName: string): void {
    const currentBundle = vendorGlobal.__FFV_RENDERER_VENDOR_BUNDLE__;
    const splitEntries = new Set<string>();
    for (const currentEntry of currentBundle?.splitEntries ?? []) {
        splitEntries.add(currentEntry);
    }
    splitEntries.add(entryName);

    vendorGlobal.__FFV_RENDERER_VENDOR_BUNDLE__ = {
        loaded: true,
        source: "npm-bundle",
        splitEntries: [...splitEntries].sort(),
    };
}
