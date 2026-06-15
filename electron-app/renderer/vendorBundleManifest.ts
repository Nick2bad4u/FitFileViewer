export const rendererVendorBundleEntries = [
    "chart-data",
    "core",
    "map",
] as const;

export type RendererVendorBundleEntry =
    (typeof rendererVendorBundleEntries)[number];

export const rendererVendorBundleFileByEntry = {
    "chart-data": "renderer-vendor-chart-data.js",
    core: "renderer-vendor-core.js",
    map: "renderer-vendor-map.js",
} as const satisfies Record<RendererVendorBundleEntry, string>;

const rendererVendorBundleEntryLookup: ReadonlySet<string> = new Set(
    rendererVendorBundleEntries
);

export function isRendererVendorBundleEntry(
    value: unknown
): value is RendererVendorBundleEntry {
    return typeof value === "string" && rendererVendorBundleEntryLookup.has(value);
}
