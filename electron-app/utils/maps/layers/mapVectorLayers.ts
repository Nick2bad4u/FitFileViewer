import {
    resolveMapLibreLayerFactory,
    type LeafletBaseLayer,
    type MapLibreLayerFactory,
} from "./mapLibreLayerRuntime.js";

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
    mapLibreLayerFactory: MapLibreLayerFactory | null = resolveMapLibreLayerFactory()
): Record<OpenFreeMapLayerName, LeafletBaseLayer> {
    return Object.fromEntries(
        Object.entries(openFreeMapStyles).map(([name, style]) => [
            name,
            mapLibreLayerFactory ? mapLibreLayerFactory({ style }) : {},
        ])
    ) as Record<OpenFreeMapLayerName, LeafletBaseLayer>;
}
