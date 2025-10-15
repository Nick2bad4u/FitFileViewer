import { act } from "react-dom/test-utils";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("../../../../utils/maps/layers/mapDrawLaps.js", () => ({
    mapDrawLaps: vi.fn(),
}));
vi.mock("../../../../utils/maps/controls/mapLapSelector.js", () => ({
    addLapSelector: vi.fn(),
}));
vi.mock("../../../../utils/maps/controls/mapZoomSlider.js", () => ({
    addZoomSlider: vi.fn(() => () => {}),
}));
vi.mock("../../../../utils/maps/controls/mapFullscreenControl.js", () => ({
    addFullscreenControl: vi.fn(),
}));
vi.mock("../../../../utils/theming/specific/updateMapTheme.js", () => ({
    updateMapTheme: vi.fn(),
}));
vi.mock("../../../../utils/maps/layers/mapIcons.js", () => ({
    createEndIcon: vi.fn(() => ({ id: "end" })),
    createStartIcon: vi.fn(() => ({ id: "start" })),
}));
vi.mock("../../../../utils/maps/layers/mapBaseLayers.js", () => ({
    baseLayers: { OpenStreetMap: { id: "osm" } },
}));
vi.mock("../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

let mapStub: any;
let mapDrawLapsMock: Mock;
let addLapSelectorMock: Mock;
let addZoomSliderMock: Mock;
let addFullscreenControlMock: Mock;
let updateMapThemeMock: Mock;
let showNotificationMock: Mock;
let featureGroup: any;
/** @type {import("../../../../utils/state/core/appStateStore.js").appStateStore} */
let appStateStore: any;

describe("MapViewRoot", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        document.body.innerHTML = "";

        vi.doMock("../../../../utils/state/core/appStateStore.js", () => {
            const listeners = new Set<(state: any, prevState: any) => void>();
            const state = {
                globalData: {},
                overlays: {
                    loadedFitFiles: [],
                },
            };

            return {
                appStateStore: {
                    getState: () => state,
                    subscribe: (listener: (state: any, prevState: any) => void) => {
                        listeners.add(listener);
                        return () => {
                            listeners.delete(listener);
                        };
                    },
                    setState: (partial: any) => {
                        const nextState = typeof partial === "function" ? partial(state) : partial;
                        Object.assign(state, nextState);
                        listeners.forEach((listener) => listener(state, state));
                    },
                },
            };
        });

        const reactModule = await import("react");
        (globalThis as any).React = reactModule.default ?? reactModule;

    const mapDrawLapsModule = await import("../../../../utils/maps/layers/mapDrawLaps.js");
    mapDrawLapsMock = vi.mocked(mapDrawLapsModule.mapDrawLaps) as unknown as Mock;

    const lapSelectorModule = await import("../../../../utils/maps/controls/mapLapSelector.js");
    addLapSelectorMock = vi.mocked(lapSelectorModule.addLapSelector) as unknown as Mock;

    const zoomSliderModule = await import("../../../../utils/maps/controls/mapZoomSlider.js");
    addZoomSliderMock = vi.mocked(zoomSliderModule.addZoomSlider) as unknown as Mock;

    const fullscreenModule = await import("../../../../utils/maps/controls/mapFullscreenControl.js");
    addFullscreenControlMock = vi.mocked(fullscreenModule.addFullscreenControl) as unknown as Mock;

    const themeModule = await import("../../../../utils/theming/specific/updateMapTheme.js");
    updateMapThemeMock = vi.mocked(themeModule.updateMapTheme) as unknown as Mock;

    const notificationModule = await import("../../../../utils/ui/notifications/showNotification.js");
    showNotificationMock = vi.mocked(notificationModule.showNotification) as unknown as Mock;

    ({ appStateStore } = await import("../../../../utils/state/core/appStateStore.js"));

        const resizeObserverMock = vi.fn(() => ({
            observe: vi.fn(),
            disconnect: vi.fn(),
        }));
        (globalThis as any).ResizeObserver = resizeObserverMock;

        const layersPanel = document.createElement("div");
        layersPanel.className = "leaflet-control-layers";
        document.body.appendChild(layersPanel);

        const handlers: Record<string, Function[]> = {};
        mapStub = {
            invalidateSize: vi.fn(),
            distance: vi.fn(() => 0),
            whenReady: vi.fn((cb: Function) => {
                cb();
                return mapStub;
            }),
            off: vi.fn(),
            remove: vi.fn(),
            addLayer: vi.fn(),
            addControl: vi.fn(),
            on: vi.fn((evt: string, cb: Function) => {
                (handlers[evt] ||= []).push(cb);
                return mapStub;
            }),
        } as any;

        const layersControl = {
            addTo: vi.fn(),
            getContainer: vi.fn(() => layersPanel),
        };
        const scaleControl = { addTo: vi.fn() };
        const fullscreenControl = { addTo: vi.fn() };
        const locateControl = { addTo: vi.fn() };
        const measureControl = { addTo: vi.fn() };

        const miniMapInstance = {
            addTo: vi.fn(() => miniMapInstance),
            remove: vi.fn(),
            _miniMap: { invalidateSize: vi.fn() },
        };

        const drawControl = {
            addTo: vi.fn(),
        };

        featureGroup = {
            addLayer: vi.fn(),
            clearLayers: vi.fn(),
        };

        const L = {
            map: vi.fn(() => mapStub),
            control: {
                layers: vi.fn(() => layersControl),
                scale: vi.fn(() => scaleControl),
                fullscreen: vi.fn(() => fullscreenControl),
                locate: vi.fn(() => locateControl),
                measure: vi.fn(() => measureControl),
            },
            Control: {
                MiniMap: vi.fn(() => miniMapInstance),
                Draw: vi.fn(() => drawControl),
            },
            Draw: {
                Event: { CREATED: "draw:created" },
            },
            FeatureGroup: vi.fn(() => featureGroup),
            markerClusterGroup: vi.fn(() => ({ addLayer: vi.fn(), clearLayers: vi.fn() })),
            tileLayer: vi.fn(() => ({})),
        } as any;
        (globalThis as any).L = L;

        appStateStore.setState({
            globalData: {
                lapMesgs: [{ startTime: 0, endTime: 1 }],
            },
            overlays: {
                loadedFitFiles: [
                    {
                        data: {
                            recordMesgs: [],
                        },
                    },
                ],
            },
        });
    });

    afterEach(() => {
        vi.resetModules();
        delete (globalThis as any).React;
        vi.unmock("../../../../utils/state/core/appStateStore.js");
    });

    it("creates Leaflet map, mounts controls, and draws laps", async () => {
        const container = document.createElement("div");
        document.body.appendChild(container);

        const { MapViewRoot } = await import("../../../../utils/maps/components/MapViewRoot/MapViewRoot.jsx");
        const root = createRoot(container);

        await act(async () => {
            root.render(createElement(MapViewRoot));
        });

        expect(document.getElementById("leaflet-map")).toBeTruthy();
        expect(document.getElementById("map-controls")).toBeTruthy();
        expect(mapDrawLapsMock).toHaveBeenCalledWith("all", expect.any(Object));
        expect(addLapSelectorMock).toHaveBeenCalled();
    expect(addZoomSliderMock).toHaveBeenCalled();
        expect(addFullscreenControlMock).toHaveBeenCalled();
        expect(updateMapThemeMock).toHaveBeenCalled();
        expect(typeof (globalThis as any).__clearDrawnItems).toBe("function");
        (globalThis as any).__clearDrawnItems?.();
        expect(featureGroup.clearLayers).toHaveBeenCalled();

        const clearButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((btn) =>
            btn.textContent?.includes("Clear Marks")
        );
        expect(clearButton).toBeTruthy();
        const clearCountBefore = (featureGroup.clearLayers as Mock).mock.calls.length;
        await act(async () => {
            clearButton?.click();
        });
        expect((featureGroup.clearLayers as Mock).mock.calls.length).toBeGreaterThan(clearCountBefore);
        expect(showNotificationMock).toHaveBeenCalledWith(
            "Cleared drawn markers and measurements.",
            "success",
            2000,
        );

        await act(async () => {
            root.unmount();
        });

        expect(mapStub.remove).toHaveBeenCalled();
        expect(mapStub.off).toHaveBeenCalled();
    });

    it("redraws laps when overlay store changes", async () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const { MapViewRoot } = await import("../../../../utils/maps/components/MapViewRoot/MapViewRoot.jsx");
        const root = createRoot(container);

        await act(async () => {
            root.render(createElement(MapViewRoot));
        });

        mapDrawLapsMock.mockClear();
        await act(async () => {
            appStateStore.setState({
                overlays: {
                    loadedFitFiles: [
                        { data: { recordMesgs: [] } },
                        { data: { recordMesgs: [{ positionLat: 1, positionLong: 1 }] }, filePath: "overlay.fit" },
                    ],
                },
            });
        });

    expect(mapDrawLapsMock).toHaveBeenCalledWith("all", expect.any(Object));

        await act(async () => {
            root.unmount();
        });
    });
});
