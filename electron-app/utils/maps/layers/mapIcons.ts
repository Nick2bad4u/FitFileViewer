import type { DivIcon, DivIconOptions } from "leaflet";

type PointTuple = [number, number];
type LeafletMarkerIcon = DivIcon | Record<string, never>;
type LeafletIconFactory = {
    divIcon(options?: DivIconOptions): LeafletMarkerIcon;
};

const ICON_ANCHOR: PointTuple = [14, 37];
const ICON_SIZE: PointTuple = [28, 37];
const POPUP_ANCHOR: PointTuple = [0, -37];

function isLeafletIconFactory(value: unknown): value is LeafletIconFactory {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    return hasFunctionProperty(value, "divIcon");
}

function hasFunctionProperty(value: object, key: "divIcon"): boolean {
    if (!(key in value)) {
        return false;
    }

    return typeof value[key as keyof typeof value] === "function";
}

function getLeaflet(): LeafletIconFactory {
    const leaflet = (globalThis as { L?: unknown }).L;
    if (isLeafletIconFactory(leaflet)) {
        return leaflet;
    }

    return {
        divIcon: () => ({}),
    };
}

function createRouteEndpointIcon(kind: "end" | "start", glyph: string) {
    return getLeaflet().divIcon({
        className: `ffv-map-marker ffv-map-marker--${kind}`,
        html: `<span class="ffv-map-marker__pin" aria-hidden="true"><span class="ffv-map-marker__glyph">${glyph}</span></span>`,
        iconAnchor: ICON_ANCHOR,
        iconSize: ICON_SIZE,
        popupAnchor: POPUP_ANCHOR,
    });
}

/**
 * Creates a Leaflet icon for the end marker.
 */
export function createEndIcon(): LeafletMarkerIcon {
    return createRouteEndpointIcon("end", "E");
}

/**
 * Creates a Leaflet icon for the start marker.
 */
export function createStartIcon(): LeafletMarkerIcon {
    return createRouteEndpointIcon("start", "S");
}
