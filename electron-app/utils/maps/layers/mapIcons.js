const ASSET_BASE_PATH = "assets/map-icons/";
const ICON_ANCHOR = [16, 32];
const ICON_SIZE = [32, 32];
const POPUP_ANCHOR = [0, -32];
function isLeafletIconFactory(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    return (
        hasFunctionProperty(value, "divIcon") &&
        hasFunctionProperty(value, "icon")
    );
}
function hasFunctionProperty(value, key) {
    if (!(key in value)) {
        return false;
    }
    return typeof value[key] === "function";
}
function getLeaflet() {
    const leaflet = globalThis.L;
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
 */
export function createStartIcon() {
    return LRef.icon({
        iconAnchor: ICON_ANCHOR,
        iconSize: ICON_SIZE,
        iconUrl: `${ASSET_BASE_PATH}start-icon.png`,
        popupAnchor: POPUP_ANCHOR,
    });
}
