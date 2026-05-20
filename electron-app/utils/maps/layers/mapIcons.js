// Utility helpers to create Leaflet icons for start and end markers.
// The global Leaflet object (L) is provided via a script include; minimal typing provided via global.d.ts.

/**
 * @typedef {readonly [number, number]} PointTuple A fixed two-number tuple used
 *   for icon size/anchor specification.
 */
/** @typedef {import("leaflet").Icon | import("leaflet").DivIcon | Record<string, never>} LeafletMarkerIcon */
/**
 * @typedef {object} LeafletIconFactory
 * @property {(options: import("leaflet").IconOptions) => LeafletMarkerIcon} icon
 * @property {(options?: import("leaflet").DivIconOptions) => LeafletMarkerIcon} divIcon
 */

// Base path for asset URLs (ensure single trailing slash).
const ASSET_BASE_PATH = "assets/map-icons/";
/** @type {PointTuple} */
const ICON_ANCHOR = [16, 32];
/** @type {PointTuple} */
const ICON_SIZE = [32, 32];
/** @type {PointTuple} */
const POPUP_ANCHOR = [0, -32];

/**
 * @param {unknown} value
 * @returns {value is LeafletIconFactory}
 */
function isLeafletIconFactory(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = /** @type {Record<string, unknown>} */ (value);
    return (
        typeof candidate.divIcon === "function" &&
        typeof candidate.icon === "function"
    );
}

/**
 * Safely obtain the Leaflet global. If unavailable (e.g. during test without
 * DOM), returns a no-op shim.
 *
 * @returns {LeafletIconFactory}
 */
function getLeaflet() {
    const leaflet = /** @type {{ L?: unknown }} */ (globalThis).L;
    if (isLeafletIconFactory(leaflet)) {
        return leaflet;
    }

    return {
        divIcon: () => ({}),
        icon: () => ({}),
    };
}

const LRef = getLeaflet();

/**
 * Creates a Leaflet icon for the end marker.
 *
 * @returns {LeafletMarkerIcon} A Leaflet icon configured for the end marker.
 */
export function createEndIcon() {
    return LRef.icon({
        iconAnchor: ICON_ANCHOR,
        iconSize: ICON_SIZE,
        iconUrl: `${ASSET_BASE_PATH}end-icon.png`,
        popupAnchor: POPUP_ANCHOR,
    });
}

/**
 * Creates a Leaflet icon for the start marker.
 *
 * @returns {LeafletMarkerIcon} A Leaflet icon configured for the start marker.
 */
export function createStartIcon() {
    return LRef.icon({
        iconAnchor: ICON_ANCHOR,
        iconSize: ICON_SIZE,
        iconUrl: `${ASSET_BASE_PATH}start-icon.png`,
        popupAnchor: POPUP_ANCHOR,
    });
}
