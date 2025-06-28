/* global L */
// Utility to create Leaflet icons for start and end markers
// Defines the size of the marker icons in pixels
const ICON_SIZE = [32, 32];
const ICON_ANCHOR = [16, 32];
const POPUP_ANCHOR = [0, -32];

// Base path for asset URLs
const ASSET_BASE_PATH = "libs/assets/icons".endsWith("/") ? "libs/assets/icons" : "libs/assets/icons/";

/**
 * Creates a Leaflet icon for the start marker.
 *
 * @returns {L.Icon} A Leaflet icon configured for the start marker.
 */

export function createStartIcon() {
    return L.icon({
        iconUrl: `${ASSET_BASE_PATH}start-icon.png`,
        iconSize: ICON_SIZE,
        iconAnchor: ICON_ANCHOR,
        popupAnchor: POPUP_ANCHOR,
    });
}

/**
 * Creates a Leaflet icon for the end marker.
 *
 * @returns {L.Icon} A Leaflet icon configured for the end marker.
 */

export function createEndIcon() {
    return L.icon({
        iconUrl: `${ASSET_BASE_PATH}end-icon.png`,
        iconSize: ICON_SIZE,
        iconAnchor: ICON_ANCHOR,
        popupAnchor: POPUP_ANCHOR,
    });
}
