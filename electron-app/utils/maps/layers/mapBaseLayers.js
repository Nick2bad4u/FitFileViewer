// Leaflet base layers module. Resolves the Leaflet global if present; otherwise
// Provides a minimal shim to keep imports safe in non-map/test environments.

/** @typedef {{
 *     addTo?: Function;
 *     setZIndex?: Function;
 *     on?: Function;
 *     remove?: Function;
 * }} LeafletLayer */
/** @typedef {{ tileLayer: Function; maplibreGL?: Function }} LeafletMinimal */

/**
 * Resolve the Leaflet global if present, else return a shim with minimal API
 * used in this module so tests can import without errors.
 *
 * @returns {LeafletMinimal}
 */
function getLeaflet() {
    const g = /** @type {any} */ (globalThis);
    if (g && g.L && g.L.tileLayer) {
        return g.L;
    }
    return {
        maplibreGL: () => ({}),
        tileLayer: () => ({}),
    };
}
const LRef = getLeaflet();
/**
 * A collection of base layers for Leaflet maps, providing various map styles
 * and data sources. Each key represents a map style, and its value is a Leaflet
 * layer configuration.
 *
 * Usage: Import this object and use it to add layers to a Leaflet map instance.
 * Example: import { baseLayers } from './mapBaseLayers'; const map =
 * L.map('map').setView([51.505, -0.09], 13);
 * baseLayers.OpenStreetMap.addTo(map);
 */
/** @type {Record<string, LeafletLayer>} */
export const baseLayers = {
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
    Esri_WorldImagery: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
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
    Esri_WorldStreetMap: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
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
    Esri_WorldTerrain: LRef.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
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
    // The OpenFreeMap_* layers use L.maplibreGL for rendering vector tiles with MapLibre GL styles,
    // While other layers use L.tileLayer for raster tile layers.
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
