export const rendererVendorBundleEntries = [
    "chart-data",
    "core",
    "map",
] as const;

export type RendererVendorBundleEntry =
    (typeof rendererVendorBundleEntries)[number];

export const rendererVendorBundleFileByEntry = {
    "chart-data": "vendor-globals-chart-data.js",
    core: "vendor-globals-core.js",
    map: "vendor-globals-map.js",
} as const satisfies Record<RendererVendorBundleEntry, string>;

const rendererVendorBundleEntryLookup: ReadonlySet<string> = new Set(
    rendererVendorBundleEntries
);

export function isRendererVendorBundleEntry(
    value: unknown
): value is RendererVendorBundleEntry {
    return typeof value === "string" && rendererVendorBundleEntryLookup.has(value);
}
