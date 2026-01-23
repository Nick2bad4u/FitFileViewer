// Utility helpers to create Leaflet icons for start and end markers.
// The global Leaflet object (L) is provided via a script include; minimal typing provided via global.d.ts.

/**
 * @typedef {readonly [number, number]} PointTuple
 * A fixed two-number tuple used for icon size/anchor specification.
 */

/** @type {PointTuple} */
const // Base path for asset URLs (ensure single trailing slash)
    ASSET_BASE_PATH = "assets/map-icons/",
    /** @type {PointTuple} */
    ICON_ANCHOR = [16, 32],
    ICON_SIZE = [32, 32],
    /** @type {PointTuple} */
    POPUP_ANCHOR = [0, -32];

/**
 * Safely obtain the Leaflet global. If unavailable (e.g. during test without DOM), returns a no-op shim.
 * @returns {any}
 */
function getLeaflet() {
    // Access via index signature to avoid TS error when no ambient L property declared with richer type.
    const leaflet = /** @type {any} */ (/** @type {any} */ (globalThis)?.L);
    if (!leaflet) {
        return {
            divIcon: () => ({}),
            icon: () => ({}),
        };
    }
    return leaflet;
}

/** @type {any} */
const LRef = getLeaflet();

/**
 * Creates a Leaflet icon for the end marker.
 * @returns {any} A Leaflet icon configured for the end marker.
 */
export function createEndIcon() {
    // Prefer a themeable divIcon; fall back to PNG if divIcon is not available.
    if (typeof LRef.divIcon === "function") {
        return LRef.divIcon({
            className: "ffv-map-marker ffv-map-marker--end",
            html: '<div class="ffv-map-marker__pin" aria-hidden="true"><span class="ffv-map-marker__glyph">E</span></div>',
            iconAnchor: [16, 28],
            iconSize: [32, 32],
            popupAnchor: [0, -28],
        });
    }

    return LRef.icon({
        iconAnchor: ICON_ANCHOR,
        iconSize: ICON_SIZE,
        iconUrl: `${ASSET_BASE_PATH}end-icon.png`,
        popupAnchor: POPUP_ANCHOR,
    });
}

/**
 * Creates a Leaflet icon for the start marker.
 * @returns {any} A Leaflet icon configured for the start marker.
 */
export function createStartIcon() {
    // Prefer a themeable divIcon; fall back to PNG if divIcon is not available.
    if (typeof LRef.divIcon === "function") {
        return LRef.divIcon({
            className: "ffv-map-marker ffv-map-marker--start",
            html: '<div class="ffv-map-marker__pin" aria-hidden="true"><span class="ffv-map-marker__glyph">S</span></div>',
            iconAnchor: [16, 28],
            iconSize: [32, 32],
            popupAnchor: [0, -28],
        });
    }

    return LRef.icon({
        iconAnchor: ICON_ANCHOR,
        iconSize: ICON_SIZE,
        iconUrl: `${ASSET_BASE_PATH}start-icon.png`,
        popupAnchor: POPUP_ANCHOR,
    });
}
