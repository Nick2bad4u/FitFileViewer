export const DEFAULT_MAP_BASE_LAYER = "OpenStreetMap";

export const MAP_BASE_LAYER_KEYS = [
    "CartoDB_DarkMatter",
    "CartoDB_Positron",
    "CartoDB_Voyager",
    "CyclOSM",
    "Esri_NatGeo",
    "Esri_Topo",
    "Esri_WorldGrayCanvas",
    "Esri_WorldImagery",
    "Esri_WorldImagery_Labels",
    "Esri_WorldPhysical",
    "Esri_WorldShadedRelief",
    "Esri_WorldStreetMap",
    "Esri_WorldStreetMap_Labels",
    "Esri_WorldTerrain",
    "Esri_WorldTopo_Labels",
    "Humanitarian",
    "OpenFreeMap_Bright",
    "OpenFreeMap_Dark",
    "OpenFreeMap_Fiord",
    "OpenFreeMap_Liberty",
    "OpenFreeMap_Positron",
    "OpenRailwayMap",
    "OpenSeaMap",
    "OpenStreetMap",
    "OpenTopoMap",
    "OSM_DE",
    "OSM_France",
    "Satellite",
    "Thunderforest_Cycle",
    "Thunderforest_Transport",
    "WaymarkedTrails_Cycling",
    "WaymarkedTrails_Hiking",
    "WaymarkedTrails_Slopes",
] as const;

export type MapBaseLayerKey = (typeof MAP_BASE_LAYER_KEYS)[number];

const MAP_BASE_LAYER_KEY_SET = new Set<string>(MAP_BASE_LAYER_KEYS);

const MAP_BASE_LAYER_ALIASES = new Map<string, MapBaseLayerKey>([
    ["mapnik", "OpenStreetMap"],
    ["openstreetmap", "OpenStreetMap"],
    ["openstreetmap.de", "OSM_DE"],
    ["opentopo", "OpenTopoMap"],
    ["opentopomap", "OpenTopoMap"],
    ["osm", "OpenStreetMap"],
    ["osm_de", "OSM_DE"],
    ["osmde", "OSM_DE"],
    ["satellite", "Esri_WorldImagery"],
    ["topo", "OpenTopoMap"],
    ["worldimagery", "Esri_WorldImagery"],
]);

export function isMapBaseLayerKey(value: unknown): value is MapBaseLayerKey {
    return typeof value === "string" && MAP_BASE_LAYER_KEY_SET.has(value);
}

export function normalizeMapBaseLayer(value: unknown): MapBaseLayerKey {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed) {
        return DEFAULT_MAP_BASE_LAYER;
    }

    if (isMapBaseLayerKey(trimmed)) {
        return trimmed;
    }

    const aliased = MAP_BASE_LAYER_ALIASES.get(trimmed.toLowerCase());
    if (aliased) {
        return aliased;
    }

    return DEFAULT_MAP_BASE_LAYER;
}

export function normalizeMapStateBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    if (!("baseLayer" in value)) {
        return value;
    }

    return {
        ...value,
        baseLayer: normalizeMapBaseLayer(value["baseLayer"]),
    };
}
