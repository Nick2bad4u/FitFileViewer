import type { Layer } from "leaflet";

type EmptyLeafletLayer = Record<string, never>;
export type LeafletBaseLayer = EmptyLeafletLayer | Layer;
export type MapLibreLayerFactory = (
    options: Record<string, unknown>
) => LeafletBaseLayer;
export type LeafletVectorLayerRuntime = {
    maplibreGL?: MapLibreLayerFactory;
};

export type OpenFreeMapLayerName =
    | "OpenFreeMap_Bright"
    | "OpenFreeMap_Dark"
    | "OpenFreeMap_Fiord"
    | "OpenFreeMap_Liberty"
    | "OpenFreeMap_Positron";

const openFreeMapStyles = {
    OpenFreeMap_Bright: "https://tiles.openfreemap.org/styles/bright",
    OpenFreeMap_Dark: "https://tiles.openfreemap.org/styles/dark",
    OpenFreeMap_Fiord: "https://tiles.openfreemap.org/styles/fiord",
    OpenFreeMap_Liberty: "https://tiles.openfreemap.org/styles/liberty",
    OpenFreeMap_Positron: "https://tiles.openfreemap.org/styles/positron",
} as const satisfies Record<OpenFreeMapLayerName, string>;

export function createOpenFreeMapVectorLayers(
    leaflet: LeafletVectorLayerRuntime
): Record<OpenFreeMapLayerName, LeafletBaseLayer> {
    const createMapLibreLayer =
        typeof leaflet.maplibreGL === "function" ? leaflet.maplibreGL : null;

    return Object.fromEntries(
        Object.entries(openFreeMapStyles).map(([name, style]) => [
            name,
            createMapLibreLayer ? createMapLibreLayer({ style }) : {},
        ])
    ) as Record<OpenFreeMapLayerName, LeafletBaseLayer>;
}
