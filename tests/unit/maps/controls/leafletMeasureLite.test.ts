// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet plugin tests use a deliberately small runtime mock. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installLeafletMeasureLite } from "../../../../electron-app/renderer/leafletMeasureLite.js";

type LayerGroupMock = {
    addLayer: (layer: any) => LayerGroupMock;
    addTo: (target: { addLayer: (layer: any) => unknown }) => LayerGroupMock;
    clearLayers: () => void;
    eachLayer: (callback: (layer: any) => void) => void;
    layers: any[];
    removeLayer: (layer: any) => LayerGroupMock;
};

type PopupMock = {
    content?: HTMLElement;
    remove: ReturnType<typeof vi.fn<() => void>>;
    setContent: (content: HTMLElement) => PopupMock;
};

type MapMock = {
    addLayer: ReturnType<typeof vi.fn<(layer: any) => MapMock>>;
    closePopup: ReturnType<typeof vi.fn<(popup: PopupMock) => MapMock>>;
    distance: ReturnType<typeof vi.fn<(a: any, b: any) => number>>;
    fire: ReturnType<typeof vi.fn<() => void>>;
    getContainer: () => HTMLElement;
    off: ReturnType<typeof vi.fn<() => void>>;
    on: ReturnType<typeof vi.fn<() => void>>;
    removeLayer: ReturnType<typeof vi.fn<(layer: any) => MapMock>>;
};

function createLayerGroup(): LayerGroupMock {
    const group: LayerGroupMock = {
        layers: [],
        addLayer(layer) {
            group.layers.push(layer);
            return group;
        },
        addTo(target) {
            target.addLayer(group);
            return group;
        },
        clearLayers() {
            group.layers = [];
        },
        eachLayer(callback) {
            for (const layer of group.layers) {
                callback(layer);
            }
        },
        removeLayer(layer) {
            group.layers = group.layers.filter((entry) => entry !== layer);
            return group;
        },
    };

    return group;
}

function createLayer() {
    return {
        popup: undefined as PopupMock | undefined,
        addTo(target: { addLayer: (layer: any) => unknown }) {
            target.addLayer(this);
            return this;
        },
        bindPopup(popup: PopupMock) {
            this.popup = popup;
            return this;
        },
        on: vi.fn(),
        setLatLngs: vi.fn(),
    };
}

function createLeafletMock(createdPopups: PopupMock[]): any {
    const controlFactory = {
        extend(definition: Record<string, any>) {
            function Measure(this: any, options?: Record<string, any>) {
                this.options = {
                    ...definition.options,
                    popupOptions: { ...definition.options.popupOptions },
                };
                definition.initialize.call(this, options);
            }

            Object.assign(Measure.prototype, definition, {
                addTo(map: MapMock) {
                    this.onAdd(map);
                    return this;
                },
                remove() {
                    if (this._map) {
                        this.onRemove(this._map);
                    }
                    return this;
                },
            });

            return Measure;
        },
    };

    return {
        Control: controlFactory,
        DomEvent: {
            disableClickPropagation: vi.fn(),
            disableScrollPropagation: vi.fn(),
            on: vi.fn(),
            stop: vi.fn(),
        },
        DomUtil: {
            create(tagName: string, className: string, parent?: HTMLElement) {
                const element = document.createElement(tagName);
                element.className = className;
                parent?.append(element);
                return element;
            },
        },
        GeometryUtil: {
            geodesicArea: vi.fn(() => 1234),
        },
        circleMarker: vi.fn(() => createLayer()),
        control: {},
        divIcon: vi.fn((options: unknown) => options),
        latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
        layerGroup: vi.fn(() => createLayerGroup()),
        marker: vi.fn(() => createLayer()),
        polygon: vi.fn(() => createLayer()),
        polyline: vi.fn(() => createLayer()),
        popup: vi.fn(() => {
            const popup: PopupMock = {
                remove: vi.fn(),
                setContent(content) {
                    popup.content = content;
                    return popup;
                },
            };
            createdPopups.push(popup);
            return popup;
        }),
        setOptions(instance: any, options?: Record<string, any>) {
            instance.options = {
                ...instance.options,
                ...options,
                popupOptions: {
                    ...instance.options.popupOptions,
                    ...options?.popupOptions,
                },
            };
        },
    };
}

function createMapMock(container: HTMLElement): MapMock {
    const map = {
        addLayer: vi.fn(() => map),
        closePopup: vi.fn(() => map),
        distance: vi.fn(() => 10),
        fire: vi.fn(),
        getContainer: () => container,
        off: vi.fn(),
        on: vi.fn(),
        removeLayer: vi.fn(() => map),
    };

    return map;
}

function openPopupDom(container: HTMLElement, popup: PopupMock): void {
    const popupElement = document.createElement("div");
    popupElement.className = "leaflet-popup";
    popupElement.append(popup.content ?? document.createElement("div"));
    container.append(popupElement);
}

describe("leafletMeasureLite", () => {
    beforeEach(() => {
        document.body.replaceChildren();
    });

    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it("clears multiple completed measurements and an open area popup", async () => {
        expect.assertions(8);

        const createdPopups: PopupMock[] = [];
        const mapContainer = document.createElement("div");
        document.body.append(mapContainer);
        const map = createMapMock(mapContainer);
        const leaflet = createLeafletMock(createdPopups);

        installLeafletMeasureLite(leaflet);
        const control = leaflet.control.measure();
        control.addTo(map);

        control._startMeasure();
        control._latlngs = [
            { lat: 0, lng: 0 },
            { lat: 0, lng: 1 },
            { lat: 1, lng: 1 },
        ];
        control._segmentMeters = [10, 10];
        control._finishMeasure();
        openPopupDom(mapContainer, createdPopups[0]);

        control._startMeasure();
        control._latlngs = [
            { lat: 2, lng: 2 },
            { lat: 2, lng: 3 },
        ];
        control._segmentMeters = [10];
        control._finishMeasure();

        expect(createdPopups).toHaveLength(2);
        expect(control._resultLayer.layers.length).toBeGreaterThan(0);
        expect(
            mapContainer.querySelector(".leaflet-measure-resultpopup")
        ).not.toBeNull();

        control.clearMeasurements();

        expect(control._resultLayer.layers).toStrictEqual([]);
        expect(map.closePopup).toHaveBeenCalledWith(createdPopups[0]);
        expect(map.closePopup).toHaveBeenCalledWith(createdPopups[1]);
        expect(map.removeLayer).toHaveBeenCalledWith(createdPopups[0]);
        expect(
            mapContainer.querySelector(".leaflet-measure-resultpopup")
        ).toBeNull();
    });
});

/* eslint-enable @typescript-eslint/no-explicit-any */
