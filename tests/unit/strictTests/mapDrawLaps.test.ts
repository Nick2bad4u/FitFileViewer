import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mapDrawLaps } from "../../../electron-app/utils/maps/layers/mapDrawLaps.js";

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
type FormatTooltipDataFn = (
    pointIndex: number,
    row: unknown,
    lapNumber: number
) => string;
type GetLapColorFn = () => string;
type GetLapNumForIdxFn = (pointIndex: number) => number;

function createBounds(): BoundsStub {
    const bounds = {
        clone: vi.fn<() => BoundsStub>(() => bounds),
        extend: vi.fn<(bounds: unknown) => BoundsStub>(() => bounds),
    };
    return bounds;
}

function createLayer(bounds = createBounds()): LayerStub {
    const layer = {
        addTo: vi.fn<(target: unknown) => LayerStub>(() => layer),
        bindPopup: vi.fn<(content: string) => LayerStub>(() => layer),
        bindTooltip: vi.fn<(content: string, options?: unknown) => LayerStub>(
            () => layer
        ),
        bringToFront: vi.fn<() => LayerStub>(() => layer),
        getBounds: vi.fn<() => BoundsStub>(() => bounds),
        getElement: vi.fn<() => null>(() => null),
        on: vi.fn<(eventName: string, listener: () => void) => LayerStub>(
            () => layer
        ),
        options: {},
        setStyle: vi.fn<(options: unknown) => LayerStub>(() => layer),
    };
    return layer;
}

function createLayerTarget(): LayerTargetStub {
    const target = {
        addTo: vi.fn<(target: unknown) => LayerTargetStub>(() => target),
        clearLayers: vi.fn<() => void>(),
    };
    return target;
}

function createLeafletStub(): LeafletStub {
    return {
        circleMarker: vi.fn<
            (latLng: [number, number], options?: unknown) => LayerStub
        >(() => createLayer()),
        featureGroup: vi.fn<() => LayerTargetStub>(() => createLayerTarget()),
        latLngBounds: vi.fn<(latLngs: unknown) => BoundsStub>(() =>
            createBounds()
        ),
        marker: vi.fn<
            (latLng: [number, number], options?: unknown) => LayerStub
        >(() => createLayer()),
        polyline: vi.fn<
            (latLngs: [number, number][], options?: unknown) => LayerStub
        >(() => createLayer()),
    };
}

function createMapStub() {
    return {
        _container: {
            clientHeight: 480,
            clientWidth: 640,
            offsetParent: {},
        },
        fitBounds: vi.fn<(bounds: unknown, options?: unknown) => void>(),
        hasLayer: vi.fn<(layer: unknown) => boolean>(() => false),
        invalidateSize: vi.fn<() => void>(),
    };
}

function createOptions(
    map: ReturnType<typeof createMapStub>,
    mapContainer: HTMLElement
): MapDrawOptions {
    return {
        formatTooltipData: vi.fn<FormatTooltipDataFn>(
            (pointIndex: number, _row: unknown, lapNumber: number) =>
                `point ${pointIndex} lap ${lapNumber}`
        ),
        getLapColor: vi.fn<GetLapColorFn>(() => "#00aaff"),
        getLapNumForIdx: vi.fn<GetLapNumForIdxFn>((pointIndex: number) =>
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

describe(mapDrawLaps, () => {
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
        expect.assertions(6);

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
        expect(mapContainer).toBeInstanceOf(HTMLElement);
        const mapContainerElement = mapContainer as HTMLElement;

        mapDrawLaps("all", createOptions(map, mapContainerElement));

        const [polylineLatLngs, polylineOptions] =
            leaflet.polyline.mock.calls[0] ?? [];
        const stablePolylineOptions =
            polylineOptions && typeof polylineOptions === "object"
                ? (polylineOptions as Record<string, unknown>)
                : {};
        expect({
            latLngs: polylineLatLngs,
            options: {
                color: stablePolylineOptions["color"],
                dashArray: stablePolylineOptions["dashArray"],
                smoothFactor: stablePolylineOptions["smoothFactor"],
            },
        }).toStrictEqual({
            latLngs: [
                [90, -90],
                [45, 45],
            ],
            options: {
                color: "#00aaff",
                dashArray: "6, 8",
                smoothFactor: 0,
            },
        });
        const fitBoundsCalls = map.fitBounds.mock.calls.map(
            ([bounds, options]) => ({
                clone: typeof (bounds as BoundsStub).clone,
                extend: typeof (bounds as BoundsStub).extend,
                options,
            })
        );
        expect(fitBoundsCalls).toContainEqual({
            clone: "function",
            extend: "function",
            options: { padding: [20, 20] },
        });
        expect(leaflet.circleMarker).toHaveBeenCalledTimes(2);
        expect(mapWindow._ffvDataPointMarkers).toHaveLength(2);
        expect(mapWindow._mainPolyline).toBe(
            leaflet.polyline.mock.results[0]?.value
        );
    });

    it("renders a no-location message and skips drawing when records lack coordinates", () => {
        expect.assertions(5);

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
        expect(mapContainer).toBeInstanceOf(HTMLElement);
        const mapContainerElement = mapContainer as HTMLElement;

        mapDrawLaps("all", createOptions(map, mapContainerElement));

        expect(mapContainerElement.textContent).toContain(
            "No location data available to display map."
        );
        expect(mapContainerElement.textContent).toContain("recordMesgs: 2");
        expect(leaflet.polyline).not.toHaveBeenCalled();
        expect(map.fitBounds).not.toHaveBeenCalled();
    });
});
