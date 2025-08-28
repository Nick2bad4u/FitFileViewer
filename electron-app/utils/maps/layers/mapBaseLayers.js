// Leaflet base layers module. Resolves the Leaflet global if present; otherwise
// provides a minimal shim to keep imports safe in non-map/test environments.

/** @typedef {{ addTo?: Function, setZIndex?: Function, on?: Function, remove?: Function }} LeafletLayer */
/** @typedef {{ tileLayer: Function, maplibreGL?: Function }} LeafletMinimal */

/**
 * Resolve the Leaflet global if present, else return a shim with minimal API
 * used in this module so tests can import without errors.
 * @returns {LeafletMinimal}
 */
function getLeaflet() {
    const g = /** @type {any} */ (globalThis);
    if (g && g.L && g.L.tileLayer) return g.L;
    return {
        tileLayer: () => ({}),
        maplibreGL: () => ({}),
    };
}
const LRef = getLeaflet();
/**
 * A collection of base layers for Leaflet maps, providing various map styles and data sources.
 * Each key represents a map style, and its value is a Leaflet layer configuration.
 *
 * Usage:
 * Import this object and use it to add layers to a Leaflet map instance.
 * Example:
 *   import { baseLayers } from './mapBaseLayers';
 *   const map = L.map('map').setView([51.505, -0.09], 13);
 *   baseLayers.OpenStreetMap.addTo(map);
 */
/** @type {Record<string, LeafletLayer>} */
export const baseLayers = {
    OpenStreetMap: LRef.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }),
    Satellite: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener noreferrer">Esri</a>',
        }
    ),
    Topo: LRef.tileLayer("https://tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution:
            'Map data: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a> (CC-BY-SA)',
    }),
    CartoDB_Positron: LRef.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
            '&copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    }),
    CartoDB_DarkMatter: LRef.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
            '&copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    }),
    Esri_Topo: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
        }
    ),
    Esri_WorldStreetMap: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
        }
    ),
    Esri_WorldImagery: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
        }
    ),
    Esri_WorldTerrain: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
        }
    ),
    Esri_WorldPhysical: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
        }
    ),
    Esri_WorldShadedRelief: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
        }
    ),
    Esri_WorldGrayCanvas: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
        }
    ),
    Esri_WorldImagery_Labels: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
        }
    ),
    Esri_WorldStreetMap_Labels: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
        }
    ),
    Esri_WorldTopo_Labels: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
        }
    ),
    Esri_NatGeo: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
        {
            attribution: "Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ",
        }
    ),
    CyclOSM: LRef.tileLayer("https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", {
        attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.cyclosm.org/">CyclOSM</a>',
        subdomains: ["a", "b", "c"],
    }),
    Thunderforest_Cycle: LRef.tileLayer("https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png", {
        attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.thunderforest.com/">Thunderforest</a>',
        subdomains: ["a", "b", "c"],
    }),
    Thunderforest_Transport: LRef.tileLayer("https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png", {
        attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.thunderforest.com/">Thunderforest</a>',
        subdomains: ["a", "b", "c"],
    }),
    OpenRailwayMap: LRef.tileLayer("https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png", {
        attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>',
    }),
    OpenSeaMap: LRef.tileLayer("https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png", {
        attribution: 'Map data &copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors',
    }),
    WaymarkedTrails_Cycling: LRef.tileLayer("https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png", {
        attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://cycling.waymarkedtrails.org/">Waymarked Trails Cycling</a>',
    }),
    WaymarkedTrails_Hiking: LRef.tileLayer("https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png", {
        attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://hiking.waymarkedtrails.org/">Waymarked Trails Hiking</a>',
    }),
    WaymarkedTrails_Slopes: LRef.tileLayer("https://tile.waymarkedtrails.org/slopes/{z}/{x}/{y}.png", {
        attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://slopes.waymarkedtrails.org/">Waymarked Trails Riding</a>',
    }),
    // The OpenFreeMap_* layers use L.maplibreGL for rendering vector tiles with MapLibre GL styles,
    // while other layers use L.tileLayer for raster tile layers.
    OpenFreeMap_Liberty: LRef.maplibreGL
        ? LRef.maplibreGL({
              style: "https://tiles.openfreemap.org/styles/liberty",
          })
        : {},
    OpenFreeMap_Positron: LRef.maplibreGL
        ? LRef.maplibreGL({
              style: "https://tiles.openfreemap.org/styles/positron",
          })
        : {},
    OpenFreeMap_Bright: LRef.maplibreGL
        ? LRef.maplibreGL({
              style: "https://tiles.openfreemap.org/styles/bright",
          })
        : {},
    OpenFreeMap_Dark: LRef.maplibreGL
        ? LRef.maplibreGL({
              style: "https://tiles.openfreemap.org/styles/dark",
          })
        : {},
    OpenFreeMap_Fiord: LRef.maplibreGL
        ? LRef.maplibreGL({
              style: "https://tiles.openfreemap.org/styles/fiord",
          })
        : {},
    Humanitarian: LRef.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution:
            'Tiles &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.openstreetmap.fr/fonds-de-carte/">Humanitarian OSM</a>',
        subdomains: ["a", "b", "c"],
    }),
    OSM_France: LRef.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
        attribution:
            'Tiles &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.openstreetmap.fr/fonds-de-carte/">OSM France</a>',
        subdomains: ["a", "b", "c"],
    }),
};
