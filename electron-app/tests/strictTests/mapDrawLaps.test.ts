import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mapDrawLaps } from "../../utils/maps/layers/mapDrawLaps.js";

type BoundsStub = {
    clone: ReturnType<typeof vi.fn<() => BoundsStub>>;
    extend: ReturnType<typeof vi.fn<(bounds: unknown) => BoundsStub>>;
};

type LayerStub = {
    addTo: ReturnType<typeof vi.fn<(target: unknown) => LayerStub>>;
    bindPopup: ReturnType<typeof vi.fn<(content: string) => LayerStub>>;
    bindTooltip: ReturnType<
        typeof vi.fn<(content: string, options?: unknown) => LayerStub>
    >;
    bringToFront: ReturnType<typeof vi.fn<() => LayerStub>>;
    getBounds: ReturnType<typeof vi.fn<() => BoundsStub>>;
    getElement: ReturnType<typeof vi.fn<() => null>>;
    on: ReturnType<
        typeof vi.fn<(eventName: string, listener: () => void) => LayerStub>
    >;
    options: Record<string, unknown>;
    setStyle: ReturnType<typeof vi.fn<(options: unknown) => LayerStub>>;
};

type LeafletStub = {
    circleMarker: ReturnType<
        typeof vi.fn<(latLng: [number, number], options?: unknown) => LayerStub>
    >;
    featureGroup: ReturnType<typeof vi.fn<() => LayerTargetStub>>;
    latLngBounds: ReturnType<typeof vi.fn<(latLngs: unknown) => BoundsStub>>;
    marker: ReturnType<
        typeof vi.fn<(latLng: [number, number], options?: unknown) => LayerStub>
    >;
    polyline: ReturnType<
        typeof vi.fn<
            (latLngs: [number, number][], options?: unknown) => LayerStub
        >
    >;
};

type LayerTargetStub = {
    addTo: ReturnType<typeof vi.fn<(target: unknown) => LayerTargetStub>>;
    clearLayers: ReturnType<typeof vi.fn<() => void>>;
};

type MapDrawWindow = Window &
    typeof globalThis & {
        _ffvActivityLayerGroup?: LayerTargetStub;
        _ffvDataPointMarkers?: LayerStub[];
        _mainPolyline?: LayerStub;
        _mainPolylineOriginalBounds?: BoundsStub;
        globalData?: {
            lapMesgs?: Array<Record<string, unknown>>;
            recordMesgs?: Array<Record<string, unknown>>;
        };
        L?: LeafletStub;
        loadedFitFiles?: unknown[];
        mapMarkerCount?: number;
    };

type MapDrawOptions = Parameters<typeof mapDrawLaps>[1];

function createBounds(): BoundsStub {
    const bounds = {
        clone: vi.fn(() => bounds),
        extend: vi.fn(() => bounds),
    };
    return bounds;
}

function createLayer(bounds = createBounds()): LayerStub {
    const layer = {
        addTo: vi.fn(() => layer),
        bindPopup: vi.fn(() => layer),
        bindTooltip: vi.fn(() => layer),
        bringToFront: vi.fn(() => layer),
        getBounds: vi.fn(() => bounds),
        getElement: vi.fn(() => null),
        on: vi.fn(() => layer),
        options: {},
        setStyle: vi.fn(() => layer),
    };
    return layer;
}

function createLayerTarget(): LayerTargetStub {
    const target = {
        addTo: vi.fn(() => target),
        clearLayers: vi.fn(),
    };
    return target;
}

function createLeafletStub(): LeafletStub {
    return {
        circleMarker: vi.fn(() => createLayer()),
        featureGroup: vi.fn(() => createLayerTarget()),
        latLngBounds: vi.fn(() => createBounds()),
        marker: vi.fn(() => createLayer()),
        polyline: vi.fn(() => createLayer()),
    };
}

function createMapStub() {
    return {
        _container: {
            clientHeight: 480,
            clientWidth: 640,
            offsetParent: {},
        },
        fitBounds: vi.fn(),
        hasLayer: vi.fn(() => false),
        invalidateSize: vi.fn(),
    };
}

function createOptions(
    map: ReturnType<typeof createMapStub>,
    mapContainer: HTMLElement
): MapDrawOptions {
    return {
        formatTooltipData: vi.fn(
            (pointIndex: number, _row: unknown, lapNumber: number) =>
                `point ${pointIndex} lap ${lapNumber}`
        ),
        getLapColor: vi.fn(() => "#00aaff"),
        getLapNumForIdx: vi.fn((pointIndex: number) =>
            pointIndex === 0 ? 1 : 2
        ),
        map: map as unknown as MapDrawOptions["map"],
        mapContainer,
    };
}

function setWindowData(
    partial: Pick<MapDrawWindow, "globalData" | "mapMarkerCount">
): MapDrawWindow {
    const mapWindow = window as MapDrawWindow;
    mapWindow._ffvActivityLayerGroup = undefined;
    mapWindow._ffvDataPointMarkers = undefined;
    mapWindow._mainPolyline = undefined;
    mapWindow._mainPolylineOriginalBounds = undefined;
    mapWindow.globalData = partial.globalData;
    mapWindow.loadedFitFiles = [];
    mapWindow.mapMarkerCount = partial.mapMarkerCount;
    return mapWindow;
}

describe("mapDrawLaps", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        const mapContainer = document.createElement("div");
        mapContainer.id = "map-container";
        document.body.replaceChildren(mapContainer);
    });

    afterEach(() => {
        vi.useRealTimers();
        delete (globalThis as typeof globalThis & { L?: LeafletStub }).L;
        delete (window as MapDrawWindow).L;
    });

    it("draws all valid coordinate records and registers point markers", () => {
        const leaflet = createLeafletStub();
        (globalThis as typeof globalThis & { L?: LeafletStub }).L = leaflet;
        (window as MapDrawWindow).L = leaflet;
        const mapWindow = setWindowData({
            globalData: {
                lapMesgs: [{ end_index: 0, start_index: 0 }],
                recordMesgs: [
                    {
                        altitude: 101,
                        positionLat: 2 ** 30,
                        positionLong: -(2 ** 30),
                        timestamp: 1000,
                    },
                    {
                        altitude: 102,
                        positionLat: 2 ** 29,
                        positionLong: 2 ** 29,
                        timestamp: 2000,
                    },
                ],
            },
            mapMarkerCount: 0,
        });
        const map = createMapStub();
        const mapContainer = document.getElementById("map-container");
        if (!mapContainer) {
            throw new Error("Expected map container fixture");
        }

        mapDrawLaps("all", createOptions(map, mapContainer));

        expect(leaflet.polyline).toHaveBeenCalledWith(
            [
                [90, -90],
                [45, 45],
            ],
            expect.objectContaining({
                color: "#00aaff",
                dashArray: "6, 8",
                smoothFactor: 0,
            })
        );
        expect(map.fitBounds).toHaveBeenCalledWith(
            expect.objectContaining({
                clone: expect.any(Function),
                extend: expect.any(Function),
            }),
            { padding: [20, 20] }
        );
        expect(leaflet.circleMarker).toHaveBeenCalledTimes(2);
        expect(mapWindow._ffvDataPointMarkers).toHaveLength(2);
        expect(mapWindow._mainPolyline).toBe(
            leaflet.polyline.mock.results[0]?.value
        );
    });

    it("renders a no-location message and skips drawing when records lack coordinates", () => {
        const leaflet = createLeafletStub();
        (globalThis as typeof globalThis & { L?: LeafletStub }).L = leaflet;
        (window as MapDrawWindow).L = leaflet;
        setWindowData({
            globalData: {
                lapMesgs: [{ end_index: 0, start_index: 0 }],
                recordMesgs: [{ altitude: 101 }, { positionLat: "invalid" }],
            },
            mapMarkerCount: 0,
        });
        const map = createMapStub();
        const mapContainer = document.getElementById("map-container");
        if (!mapContainer) {
            throw new Error("Expected map container fixture");
        }

        mapDrawLaps("all", createOptions(map, mapContainer));

        expect(mapContainer.textContent).toContain(
            "No location data available to display map."
        );
        expect(mapContainer.textContent).toContain("recordMesgs: 2");
        expect(leaflet.polyline).not.toHaveBeenCalled();
        expect(map.fitBounds).not.toHaveBeenCalled();
    });
});
