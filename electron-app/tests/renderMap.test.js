// Mock Leaflet before importing anything that uses it
if (typeof window !== "undefined") {
    window.L = {
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
    };
}

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderMap } from "../utils/renderMap";

describe("renderMap", () => {
    let container;
    beforeEach(() => {
        container = document.createElement("div");
        container.id = "content-map";
        document.body.appendChild(container);
        window.L = {
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
        };
        window.baseLayers = { OpenStreetMap: {} };
        window.globalData = { recordMesgs: [{ positionLat: 1, positionLong: 2 }] };
        window._leafletMapInstance = null;
        window.addSimpleMeasureTool = vi.fn();
        window.addLapSelector = vi.fn();
        window.getLapColor = vi.fn();
        window.formatTooltipData = vi.fn();
        window.getLapNumForIdx = vi.fn();
        window.drawMapForLap = vi.fn();
        window.updateMapTheme = vi.fn();
        window.createStartIcon = vi.fn();
        window.createEndIcon = vi.fn();
        window.createPrintButton = vi.fn(() => document.createElement("button"));
        window.createExportGPXButton = vi.fn(() => document.createElement("button"));
        window.createElevationProfileButton = vi.fn(() => document.createElement("button"));
        window.createMarkerCountSelector = vi.fn(() => document.createElement("div"));
        window.addFullscreenControl = vi.fn();
    });
    afterEach(() => {
        document.body.removeChild(container);
        delete window.L;
        delete window.baseLayers;
        delete window.globalData;
        delete window._leafletMapInstance;
        delete window.addSimpleMeasureTool;
        delete window.addLapSelector;
        delete window.getLapColor;
        delete window.formatTooltipData;
        delete window.getLapNumForIdx;
        delete window.drawMapForLap;
        delete window.updateMapTheme;
        delete window.createStartIcon;
        delete window.createEndIcon;
        delete window.createPrintButton;
        delete window.createExportGPXButton;
        delete window.createElevationProfileButton;
        delete window.createMarkerCountSelector;
        delete window.addFullscreenControl;
    });
    it("should render the map container and controls", () => {
        renderMap();
        expect(container.querySelector("#leaflet-map")).not.toBeNull();
        expect(container.querySelector("#map-controls")).not.toBeNull();
    });
    it("should call updateMapTheme", () => {
        renderMap();
        expect(window.updateMapTheme).toHaveBeenCalled();
    });
});
