import type * as Leaflet from "leaflet";

export type LeafletPluginControlHandle = {
    _miniMap?: { invalidateSize?: () => void };
    _measurementRunningTotal?: number;
    addTo?: (map: Leaflet.Map) => unknown;
    remove?: () => void;
};

export type LeafletDrawPluginControlHandle = LeafletPluginControlHandle &
    Leaflet.Control & {
        _toolbars?: {
            draw?: {
                _activeMode?: {
                    handler?: unknown;
                };
            };
        };
    };

export type LeafletDrawnItemsLayerGroup = Leaflet.FeatureGroup & {
    getLayers: () => Leaflet.Layer[];
};

type LeafletControlFactory = (...args: unknown[]) => LeafletPluginControlHandle;
type LeafletDrawCreatedEvent = {
    readonly layer?: unknown;
};

export type LeafletPluginControlRuntime = {
    Control?: {
        Draw?: new (...args: unknown[]) => LeafletDrawPluginControlHandle;
        MiniMap?: new (...args: unknown[]) => LeafletPluginControlHandle;
    };
    Draw?: { Event?: { CREATED?: string } };
    FeatureGroup?: typeof Leaflet.FeatureGroup;
    control: {
        fullscreen?: LeafletControlFactory;
        locate?: LeafletControlFactory;
        measure?: LeafletControlFactory;
    };
    tileLayer?: typeof Leaflet.tileLayer;
};

export function addLeafletFullscreenPluginControl(
    leaflet: LeafletPluginControlRuntime,
    map: Leaflet.Map
): void {
    leaflet.control.fullscreen?.({ position: "topleft" }).addTo?.(map);
}

export function addLeafletLocatePluginControl(
    leaflet: LeafletPluginControlRuntime,
    map: Leaflet.Map
): void {
    leaflet.control
        .locate?.({
            flyTo: true,
            keepCurrentZoomLevel: true,
            position: "topleft",
        })
        .addTo?.(map);
}

export function hasLeafletMeasurePluginControl(
    leaflet: LeafletPluginControlRuntime
): boolean {
    return typeof leaflet.control.measure === "function";
}

function isLeafletDrawCreatedEvent(
    event: unknown
): event is LeafletDrawCreatedEvent {
    return (
        event !== null &&
        (typeof event === "object" || typeof event === "function") &&
        "layer" in event
    );
}

export function addLeafletMeasurePluginControl(
    leaflet: LeafletPluginControlRuntime,
    map: Leaflet.Map
): LeafletPluginControlHandle | null {
    const measureFactory = leaflet.control.measure;
    if (typeof measureFactory !== "function") {
        return null;
    }

    const measureControl = measureFactory({
        activeColor: "#ff7800",
        captureZIndex: 10_000,
        clearMeasurementsOnStop: false,
        completedColor: "#1976d2",
        decPoint: ".",
        popupOptions: {
            autoPanPadding: [10, 10],
            className: "leaflet-measure-resultpopup",
        },
        position: "topleft",
        primaryAreaUnit: "sqmeters",
        primaryLengthUnit: "meters",
        secondaryAreaUnit: "acres",
        secondaryLengthUnit: "miles",
        thousandsSep: ",",
    });
    measureControl.addTo?.(map);

    map.on("measurestart", () => {
        if (measureControl._measurementRunningTotal) {
            measureControl._measurementRunningTotal = 0;
        }
    });

    return measureControl;
}

export function addLeafletMiniMapPluginControl(
    leaflet: LeafletPluginControlRuntime,
    map: Leaflet.Map,
    scheduleTimeout: (callback: () => void, delayMs: number) => unknown
): LeafletPluginControlHandle | null {
    const miniMapConstructor = leaflet.Control?.MiniMap;
    const tileLayerFactory = leaflet.tileLayer;
    if (
        typeof miniMapConstructor !== "function" ||
        typeof tileLayerFactory !== "function"
    ) {
        return null;
    }

    const miniMapLayer = tileLayerFactory(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "",
            maxZoom: 18,
            minZoom: 0,
        }
    );
    const miniMap = new miniMapConstructor(miniMapLayer, {
        aimingRectOptions: {
            clickable: false,
            color: "#ff7800",
            fillColor: "#ff7800",
            fillOpacity: 0.1,
            opacity: 1,
            weight: 2,
        },
        autoToggleDisplay: false,
        centerFixed: false,
        height: 150,
        mapOptions: {
            attributionControl: false,
            zoomControl: false,
        },
        minimized: false,
        position: "bottomright",
        shadowRectOptions: {
            clickable: true,
            color: "#000000",
            fillColor: "#000000",
            fillOpacity: 0.2,
            opacity: 0.4,
            weight: 1,
        },
        toggleDisplay: true,
        width: 150,
        zoomAnimation: false,
        zoomLevelFixed: false,
        zoomLevelOffset: -5,
    });
    miniMap.addTo?.(map);

    const invalidateMiniMapSize = (): void => {
        miniMap._miniMap?.invalidateSize?.();
    };
    scheduleTimeout(invalidateMiniMapSize, 100);
    map.on("moveend", invalidateMiniMapSize);
    map.on("zoomend", invalidateMiniMapSize);

    return miniMap;
}

export function addLeafletDrawPluginControl({
    leaflet,
    map,
    onLayerCreated,
}: {
    leaflet: LeafletPluginControlRuntime;
    map: Leaflet.Map;
    onLayerCreated: (
        layer: unknown,
        drawnItems: LeafletDrawnItemsLayerGroup
    ) => void;
}): {
    drawControl: LeafletDrawPluginControlHandle;
    drawnItems: LeafletDrawnItemsLayerGroup;
} | null {
    const drawConstructor = leaflet.Control?.Draw;
    const featureGroupConstructor = leaflet.FeatureGroup;
    if (
        typeof drawConstructor !== "function" ||
        typeof featureGroupConstructor !== "function"
    ) {
        return null;
    }

    const drawnItems =
        new featureGroupConstructor() as LeafletDrawnItemsLayerGroup;
    map.addLayer(drawnItems);
    const drawControl = new drawConstructor({
        draw: {
            circle: {
                shapeOptions: {
                    clickable: true,
                    color: "#1976d2",
                },
            },
            marker: true,
            polygon: {
                allowIntersection: false,
                feet: true,
                metric: false,
                shapeOptions: {
                    clickable: true,
                    color: "#1976d2",
                },
            },
            polyline: {
                feet: true,
                metric: false,
                shapeOptions: {
                    clickable: true,
                    color: "#1976d2",
                },
            },
            rectangle: {
                shapeOptions: {
                    clickable: true,
                    color: "#1976d2",
                },
            },
        },
        edit: {
            edit: {},
            featureGroup: drawnItems,
            remove: {},
        },
    });
    map.addControl(drawControl);

    const createdEventName =
        typeof leaflet.Draw?.Event?.CREATED === "string"
            ? leaflet.Draw.Event.CREATED
            : "draw:created";
    map.on(createdEventName, (event) => {
        if (isLeafletDrawCreatedEvent(event) && event.layer) {
            onLayerCreated(event.layer, drawnItems);
        }
    });

    return { drawControl, drawnItems };
}
