// @vitest-environment jsdom

import type * as Leaflet from "leaflet";
import { describe, expect, it, vi } from "vitest";

import {
    addLeafletDrawPluginControl,
    addLeafletFullscreenPluginControl,
    addLeafletLocatePluginControl,
    addLeafletMeasurePluginControl,
    addLeafletMiniMapPluginControl,
    hasLeafletMeasurePluginControl,
    type LeafletPluginControlRuntime,
} from "../../../../electron-app/utils/maps/controls/leafletPluginControls.js";

describe("leafletPluginControls.js", () => {
    function createMap(): Leaflet.Map {
        return {
            addControl: vi.fn(),
            addLayer: vi.fn(),
            on: vi.fn(),
        } as unknown as Leaflet.Map;
    }

    it("adds the fullscreen plugin control when available", () => {
        expect.assertions(3);

        const map = createMap();
        const addTo = vi.fn();
        const fullscreen = vi.fn(() => ({ addTo }));
        const runtime = {
            control: { fullscreen },
        } as LeafletPluginControlRuntime;

        const result = addLeafletFullscreenPluginControl(runtime, map);

        expect(result).toBeUndefined();
        expect(fullscreen).toHaveBeenCalledWith({ position: "topleft" });
        expect(addTo).toHaveBeenCalledWith(map);
    });

    it("adds the locate plugin control when available", () => {
        expect.assertions(3);

        const map = createMap();
        const addTo = vi.fn();
        const locate = vi.fn(() => ({ addTo }));
        const runtime = {
            control: { locate },
        } as LeafletPluginControlRuntime;

        const result = addLeafletLocatePluginControl(runtime, map);

        expect(result).toBeUndefined();
        expect(locate).toHaveBeenCalledWith({
            flyTo: true,
            keepCurrentZoomLevel: true,
            position: "topleft",
        });
        expect(addTo).toHaveBeenCalledWith(map);
    });

    it("reports whether the measure plugin is available", () => {
        expect.assertions(2);

        expect(
            hasLeafletMeasurePluginControl({
                control: { measure: vi.fn() },
            })
        ).toBe(true);
        expect(hasLeafletMeasurePluginControl({ control: {} })).toBe(false);
    });

    it("adds the measure plugin control and resets running totals on measurestart", () => {
        expect.assertions(5);

        const map = createMap();
        const addTo = vi.fn();
        const measureControl = {
            _measurementRunningTotal: 120,
            addTo,
        };
        const measure = vi.fn(() => measureControl);
        const runtime = {
            control: { measure },
        } as LeafletPluginControlRuntime;

        const addedControl = addLeafletMeasurePluginControl(runtime, map);

        expect(measure).toHaveBeenCalledWith(
            expect.objectContaining({
                position: "topleft",
                primaryAreaUnit: "sqmeters",
                primaryLengthUnit: "meters",
            })
        );
        expect(addTo).toHaveBeenCalledWith(map);
        expect(map.on).toHaveBeenCalledWith(
            "measurestart",
            expect.any(Function)
        );

        const onMeasureStart = vi.mocked(map.on).mock.calls[0]?.[1];
        expect(onMeasureStart).toBeTypeOf("function");
        onMeasureStart?.({ type: "measurestart", target: map });

        expect(addedControl?._measurementRunningTotal).toBe(0);
    });

    it("does not add a measure control when the plugin is unavailable", () => {
        expect.assertions(1);

        const map = createMap();

        expect(addLeafletMeasurePluginControl({ control: {} }, map)).toBeNull();
    });

    it("adds the minimap plugin control and wires size invalidation", () => {
        expect.assertions(8);

        const map = createMap();
        const addTo = vi.fn();
        const invalidateSize = vi.fn();
        const tileLayer = vi.fn(() => ({ layer: "osm" }));
        const scheduleTimeout = vi.fn();
        class MiniMap {
            public _miniMap = { invalidateSize };

            public constructor(
                public readonly layer: unknown,
                public readonly options: unknown
            ) {}

            public addTo = addTo;
        }
        const runtime = {
            Control: { MiniMap },
            control: {},
            tileLayer,
        } as unknown as LeafletPluginControlRuntime;

        const miniMap = addLeafletMiniMapPluginControl(
            runtime,
            map,
            scheduleTimeout
        );

        expect(tileLayer).toHaveBeenCalledWith(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            expect.objectContaining({ maxZoom: 18, minZoom: 0 })
        );
        expect(miniMap).toBeInstanceOf(MiniMap);
        expect(addTo).toHaveBeenCalledWith(map);
        expect(scheduleTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
        expect(map.on).toHaveBeenCalledWith("moveend", expect.any(Function));
        expect(map.on).toHaveBeenCalledWith("zoomend", expect.any(Function));

        vi.mocked(scheduleTimeout).mock.calls[0]?.[0]();
        vi.mocked(map.on).mock.calls.find(
            ([eventName]) => eventName === "moveend"
        )?.[1]?.({ type: "moveend", target: map });

        expect(invalidateSize).toHaveBeenCalledTimes(2);
        expect((miniMap as MiniMap).options).toEqual(
            expect.objectContaining({ position: "bottomright" })
        );
    });

    it("returns null when the minimap plugin is unavailable", () => {
        expect.assertions(1);

        expect(
            addLeafletMiniMapPluginControl(
                { control: {} },
                createMap(),
                vi.fn()
            )
        ).toBeNull();
    });

    it("adds the draw plugin control and forwards created layers", () => {
        expect.assertions(8);

        const map = createMap();
        const onLayerCreated = vi.fn();
        const drawnLayer = { layer: "drawn" };
        class FeatureGroup {
            public getLayers = vi.fn(() => []);
        }
        class DrawControl {
            public _toolbars = {};

            public constructor(public readonly options: unknown) {}
        }
        const runtime = {
            Control: { Draw: DrawControl },
            Draw: { Event: { CREATED: "draw:created:test" } },
            FeatureGroup,
            control: {},
        } as unknown as LeafletPluginControlRuntime;

        const setup = addLeafletDrawPluginControl({
            leaflet: runtime,
            map,
            onLayerCreated,
        });

        expect(setup).not.toBeNull();
        expect(setup?.drawnItems).toBeInstanceOf(FeatureGroup);
        expect(setup?.drawControl).toBeInstanceOf(DrawControl);
        expect(map.addLayer).toHaveBeenCalledWith(setup?.drawnItems);
        expect(map.addControl).toHaveBeenCalledWith(setup?.drawControl);
        expect(map.on).toHaveBeenCalledWith(
            "draw:created:test",
            expect.any(Function)
        );

        const onDrawCreated = vi.mocked(map.on).mock.calls[0]?.[1];
        onDrawCreated?.({
            target: map,
            type: "draw:created:test",
        });
        expect(onLayerCreated).not.toHaveBeenCalled();

        onDrawCreated?.({
            layer: drawnLayer,
            target: map,
            type: "draw:created:test",
        });

        expect(onLayerCreated).toHaveBeenCalledWith(
            drawnLayer,
            setup?.drawnItems
        );
    });

    it("returns null when the draw plugin is unavailable", () => {
        expect.assertions(1);

        expect(
            addLeafletDrawPluginControl({
                leaflet: { control: {} },
                map: createMap(),
                onLayerCreated: vi.fn(),
            })
        ).toBeNull();
    });
});
