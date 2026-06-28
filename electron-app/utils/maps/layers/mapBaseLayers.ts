import type { TileLayerOptions } from "leaflet";
import { resolveLeafletRuntime } from "../core/leafletRuntime.js";
import { type LeafletBaseLayer } from "./mapLibreLayerRuntime.js";
import { createOpenFreeMapVectorLayers } from "./mapVectorLayers.js";

// Leaflet base layers module. Resolves the registered Leaflet runtime when
// present; otherwise provides a minimal shim to keep imports safe in
// non-map/test environments.

type LeafletTileLayerOptions = TileLayerOptions & Record<string, unknown>;
type LeafletTileLayerFactory = (
    urlTemplate: string,
    options?: LeafletTileLayerOptions
) => LeafletBaseLayer;
type LeafletMinimal = {
    tileLayer: LeafletTileLayerFactory;
};

/**
 * Checks whether a value exposes the minimal Leaflet API used here.
 */
function isLeafletMinimal(value: unknown): value is LeafletMinimal {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    return hasFunctionProperty(value, "tileLayer");
}

function hasFunctionProperty(value: object, key: "tileLayer"): boolean {
    if (!(key in value)) {
        return false;
    }

    return typeof value[key as keyof typeof value] === "function";
}

/**
 * Resolve the registered Leaflet runtime if present, else return a shim with
 * the minimal API used in this module so tests can import without errors.
 */
function getLeaflet(): LeafletMinimal {
    return (
        resolveLeafletRuntime(isLeafletMinimal) ?? {
            tileLayer: () => ({}),
        }
    );
}
/**
 * Leaflet base-layer instances keyed by map style name.
 */
export function createBaseLayers(
    leaflet: LeafletMinimal = getLeaflet()
): Record<string, LeafletBaseLayer> {
    const LRef = leaflet;
    const openFreeMapLayers = createOpenFreeMapVectorLayers();

    return {
        CartoDB_DarkMatter: LRef.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
                attribution:
                    '&copy; <a href="https://carto.com/attributions" data-external-link="true" rel="noopener noreferrer">CARTO</a>',
            }
        ),
        CartoDB_Positron: LRef.tileLayer(
            "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            {
                attribution:
                    '&copy; <a href="https://carto.com/attributions" data-external-link="true" rel="noopener noreferrer">CARTO</a>',
            }
        ),
        CartoDB_Voyager: LRef.tileLayer(
            "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
            {
                attribution:
                    '&copy; <a href="https://carto.com/attributions" data-external-link="true" rel="noopener noreferrer">CARTO</a>',
            }
        ),
        CyclOSM: LRef.tileLayer(
            "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
            {
                attribution:
                    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.cyclosm.org/">CyclOSM</a>',
                subdomains: [
                    "a",
                    "b",
                    "c",
                ],
            }
        ),
        Esri_NatGeo: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ",
            }
        ),
        Esri_Topo: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, IPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
            }
        ),
        Esri_WorldGrayCanvas: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, IPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
            }
        ),
        Esri_WorldImagery: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, IPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
            }
        ),
        Esri_WorldImagery_Labels: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, IPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
            }
        ),
        Esri_WorldPhysical: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, IPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
            }
        ),
        Esri_WorldShadedRelief: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, IPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
            }
        ),
        Esri_WorldStreetMap: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, IPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
            }
        ),
        Esri_WorldStreetMap_Labels: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, IPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
            }
        ),
        Esri_WorldTerrain: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, IPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
            }
        ),
        Esri_WorldTopo_Labels: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, IPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
            }
        ),
        Humanitarian: LRef.tileLayer(
            "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
            {
                attribution:
                    'Tiles &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.openstreetmap.fr/fonds-de-carte/">Humanitarian OSM</a>',
                subdomains: [
                    "a",
                    "b",
                    "c",
                ],
            }
        ),
        ...openFreeMapLayers,
        OpenRailwayMap: LRef.tileLayer(
            "https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png",
            {
                attribution:
                    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>',
            }
        ),
        OpenSeaMap: LRef.tileLayer(
            "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
            {
                attribution:
                    'Map data &copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors',
            }
        ),
        OpenStreetMap: LRef.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright" data-external-link="true" rel="noopener noreferrer">OpenStreetMap</a> contributors',
            }
        ),
        OSM_DE: LRef.tileLayer(
            "https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png",
            {
                attribution:
                    'Tiles &copy; <a href="https://www.openstreetmap.org/copyright" data-external-link="true" rel="noopener noreferrer">OpenStreetMap</a> contributors',
                subdomains: [
                    "a",
                    "b",
                    "c",
                ],
            }
        ),
        OSM_France: LRef.tileLayer(
            "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
            {
                attribution:
                    'Tiles &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.openstreetmap.fr/fonds-de-carte/">OSM France</a>',
                subdomains: [
                    "a",
                    "b",
                    "c",
                ],
            }
        ),
        Satellite: LRef.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    'Tiles &copy; <a href="https://www.esri.com" data-external-link="true" rel="noopener noreferrer">Esri</a>',
            }
        ),
        Thunderforest_Cycle: LRef.tileLayer(
            "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png",
            {
                attribution:
                    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.thunderforest.com/">Thunderforest</a>',
                subdomains: [
                    "a",
                    "b",
                    "c",
                ],
            }
        ),
        Thunderforest_Transport: LRef.tileLayer(
            "https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png",
            {
                attribution:
                    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.thunderforest.com/">Thunderforest</a>',
                subdomains: [
                    "a",
                    "b",
                    "c",
                ],
            }
        ),
        OpenTopoMap: LRef.tileLayer(
            "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org" data-external-link="true" rel="noopener noreferrer">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
                subdomains: [
                    "a",
                    "b",
                    "c",
                ],
            }
        ),
        WaymarkedTrails_Cycling: LRef.tileLayer(
            "https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png",
            {
                attribution:
                    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://cycling.waymarkedtrails.org/">Waymarked Trails Cycling</a>',
            }
        ),
        WaymarkedTrails_Hiking: LRef.tileLayer(
            "https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png",
            {
                attribution:
                    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://hiking.waymarkedtrails.org/">Waymarked Trails Hiking</a>',
            }
        ),
        WaymarkedTrails_Slopes: LRef.tileLayer(
            "https://tile.waymarkedtrails.org/slopes/{z}/{x}/{y}.png",
            {
                attribution:
                    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://slopes.waymarkedtrails.org/">Waymarked Trails Riding</a>',
            }
        ),
    };
}

export const baseLayers: Record<string, LeafletBaseLayer> = createBaseLayers();
