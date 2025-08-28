// Utility helpers to create Leaflet icons for start and end markers.
// The global Leaflet object (L) is provided via a script include; minimal typing provided via global.d.ts.

/**
 * @typedef {readonly [number, number]} PointTuple
 * A fixed two-number tuple used for icon size/anchor specification.
 */

/** @type {PointTuple} */
const ICON_SIZE = [32, 32];
/** @type {PointTuple} */
const ICON_ANCHOR = [16, 32];
/** @type {PointTuple} */
const POPUP_ANCHOR = [0, -32];

// Base path for asset URLs (ensure single trailing slash)
const ASSET_BASE_PATH = "libs/assets/icons/";

/**
 * Safely obtain the Leaflet global. If unavailable (e.g. during test without DOM), returns a no-op shim.
 * @returns {any}
 */
function getLeaflet() {
    // Access via index signature to avoid TS error when no ambient L property declared with richer type.
    const leaflet = /** @type {any} */ (/** @type {any} */ (globalThis)?.L);
    if (!leaflet) {
        return {
            icon: () => ({}),
        };
    }
    return leaflet;
}

/** @type {any} */
const LRef = getLeaflet();

/**
 * Creates a Leaflet icon for the start marker.
 * @returns {any} A Leaflet icon configured for the start marker.
 */
export function createStartIcon() {
    return LRef.icon({
        iconUrl: `${ASSET_BASE_PATH}start-icon.png`,
        iconSize: ICON_SIZE,
        iconAnchor: ICON_ANCHOR,
        popupAnchor: POPUP_ANCHOR,
    });
}

/**
 * Creates a Leaflet icon for the end marker.
 * @returns {any} A Leaflet icon configured for the end marker.
 */
export function createEndIcon() {
    return LRef.icon({
        iconUrl: `${ASSET_BASE_PATH}end-icon.png`,
        iconSize: ICON_SIZE,
        iconAnchor: ICON_ANCHOR,
        popupAnchor: POPUP_ANCHOR,
    });
}
