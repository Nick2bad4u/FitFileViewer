declare module "*.css";
declare module "*.svg";

declare module "maplibre-gl/dist/maplibre-gl-worker.mjs?raw" {
    const source: string;
    export default source;
}

declare module "@maplibre/maplibre-gl-leaflet";
declare module "fitfileviewer:leaflet-draw-runtime";
declare module "leaflet-draw";
declare module "leaflet-minimap";
