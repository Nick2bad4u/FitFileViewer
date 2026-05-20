import type { DivIcon, DivIconOptions, Icon, IconOptions } from "leaflet";

type PointTuple = [number, number];
type LeafletMarkerIcon = DivIcon | Icon | Record<string, never>;
type LeafletIconFactory = {
    divIcon(options?: DivIconOptions): LeafletMarkerIcon;
    icon(options: IconOptions): LeafletMarkerIcon;
};

const ASSET_BASE_PATH = "assets/map-icons/";
const ICON_ANCHOR: PointTuple = [16, 32];
const ICON_SIZE: PointTuple = [32, 32];
const POPUP_ANCHOR: PointTuple = [0, -32];

function isLeafletIconFactory(value: unknown): value is LeafletIconFactory {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate["divIcon"] === "function" &&
        typeof candidate["icon"] === "function"
    );
}

function getLeaflet(): LeafletIconFactory {
    const leaflet = (globalThis as { L?: unknown }).L;
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
export function createEndIcon(): LeafletMarkerIcon {
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
export function createStartIcon(): LeafletMarkerIcon {
    return LRef.icon({
        iconAnchor: ICON_ANCHOR,
        iconSize: ICON_SIZE,
        iconUrl: `${ASSET_BASE_PATH}start-icon.png`,
        popupAnchor: POPUP_ANCHOR,
    });
}
