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
export const baseLayers: Record<string, LeafletLayer>;
export type LeafletLayer = {
    addTo?: Function;
    setZIndex?: Function;
    on?: Function;
    remove?: Function;
};
export type LeafletMinimal = {
    tileLayer: Function;
    maplibreGL?: Function;
};
