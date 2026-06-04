import { vendorGlobal } from "./vendorGlobalsCore";
/* eslint-disable import-x/no-unassigned-import -- Vendor plugin modules patch Leaflet globals for legacy renderer code. */
import "leaflet-draw";
import "leaflet-minimap";
import "leaflet.markercluster";
import "@maplibre/maplibre-gl-leaflet";
import "./leafletMeasureLite.js";
/* eslint-enable import-x/no-unassigned-import */

vendorGlobal.__FFV_RENDERER_VENDOR_BUNDLE__ = {
    loaded: true,
    source: "npm-bundle",
};
