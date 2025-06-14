// Mock Leaflet global L for all Vitest tests
import { vi } from "vitest";

const leafletMock = {
    tileLayer: vi.fn(() => ({
        addTo: vi.fn(),
        setZIndex: vi.fn(),
        on: vi.fn(),
        remove: vi.fn(),
    })),
    map: vi.fn(() => ({
        setView: vi.fn(),
        addLayer: vi.fn(),
        on: vi.fn(),
        remove: vi.fn(),
        getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
        getZoom: vi.fn(() => 13),
        fitBounds: vi.fn(),
        invalidateSize: vi.fn(),
        addControl: vi.fn(),
        removeControl: vi.fn(),
        eachLayer: vi.fn(),
    })),
    control: {
        layers: vi.fn(() => ({ addTo: vi.fn() })),
        scale: vi.fn(() => ({ addTo: vi.fn() })),
        fullscreen: vi.fn(() => ({ addTo: vi.fn() })),
        locate: vi.fn(() => ({ addTo: vi.fn() })),
        measure: vi.fn(() => ({ addTo: vi.fn() })),
        Draw: { Event: { CREATED: "created" } },
    },
    markerClusterGroup: vi.fn(() => ({ addLayer: vi.fn() })),
    marker: vi.fn(() => ({ addTo: vi.fn(() => ({ getElement: vi.fn(() => null) })) })),
    polyline: vi.fn(() => ({ addTo: vi.fn() })),
    latLng: vi.fn((lat, lng) => ({ lat, lng })),
    divIcon: vi.fn(() => ({})),
    FeatureGroup: vi.fn(() => ({ addLayer: vi.fn() })),
    Control: { MiniMap: vi.fn(() => ({ addTo: vi.fn() })), Draw: vi.fn(() => ({ addTo: vi.fn() })) },
    maplibreGL: vi.fn(() => ({
        addTo: vi.fn(),
        setZIndex: vi.fn(),
        on: vi.fn(),
        remove: vi.fn(),
    })),
};

global.L = leafletMock;
if (typeof window !== "undefined") {
    window.L = leafletMock;
}
