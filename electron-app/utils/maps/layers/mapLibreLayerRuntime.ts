import type { Layer } from "leaflet";

type EmptyLeafletLayer = Record<string, never>;
export type LeafletBaseLayer = EmptyLeafletLayer | Layer;
export type MapLibreLayerFactory = (
    options: Record<string, unknown>
) => LeafletBaseLayer;

type MapLibreLayerRuntimeRegistry = {
    factory: MapLibreLayerFactory | undefined;
};
type MapLibreLayerFactoryCandidate = {
    readonly maplibreGL?: unknown;
};

const mapLibreLayerRuntimeRegistry: MapLibreLayerRuntimeRegistry = {
    factory: undefined,
};

export function setMapLibreLayerFactory(
    factory: MapLibreLayerFactory | undefined
): void {
    mapLibreLayerRuntimeRegistry.factory = factory;
}

export function clearMapLibreLayerFactoryForTests(): void {
    mapLibreLayerRuntimeRegistry.factory = undefined;
}

export function resolveMapLibreLayerFactory(): MapLibreLayerFactory | null {
    return mapLibreLayerRuntimeRegistry.factory ?? null;
}

export function resolveMapLibreLayerFactoryFromCandidate(
    value: unknown
): MapLibreLayerFactory | undefined {
    if (typeof value !== "object" || value === null) {
        return undefined;
    }

    const candidate = value as MapLibreLayerFactoryCandidate;
    return typeof candidate.maplibreGL === "function"
        ? (candidate.maplibreGL as MapLibreLayerFactory)
        : undefined;
}
