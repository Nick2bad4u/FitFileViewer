import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const EXPECTED_LAYER_NAMES = [
    "CartoDB_DarkMatter",
    "CartoDB_Positron",
    "CartoDB_Voyager",
    "CyclOSM",
    "Esri_NatGeo",
    "Esri_Topo",
    "Esri_WorldGrayCanvas",
    "Esri_WorldImagery",
    "Esri_WorldImagery_Labels",
    "Esri_WorldPhysical",
    "Esri_WorldShadedRelief",
    "Esri_WorldStreetMap",
    "Esri_WorldStreetMap_Labels",
    "Esri_WorldTerrain",
    "Esri_WorldTopo_Labels",
    "Humanitarian",
    "OpenFreeMap_Bright",
    "OpenFreeMap_Dark",
    "OpenFreeMap_Fiord",
    "OpenFreeMap_Liberty",
    "OpenFreeMap_Positron",
    "OpenRailwayMap",
    "OpenSeaMap",
    "OpenStreetMap",
    "OSM_DE",
    "OSM_France",
    "Satellite",
    "Thunderforest_Cycle",
    "Thunderforest_Transport",
    "OpenTopoMap",
    "WaymarkedTrails_Cycling",
    "WaymarkedTrails_Hiking",
    "WaymarkedTrails_Slopes",
];

describe("mapBaseLayers", () => {
    type MockLayer = { readonly kind: string };

    let originalL: unknown;

    beforeEach(() => {
        originalL = (global as any).L;
        vi.resetModules();
    });

    afterEach(() => {
        (global as any).L = originalL;
    });

    it("uses shim when global L is not present", async () => {
        expect.assertions(4);

        delete (global as any).L;
        const mod =
            await import("../../../../../electron-app/utils/maps/layers/mapBaseLayers.js");
        const { baseLayers } = mod;
        expect(Object.keys(baseLayers)).toEqual(EXPECTED_LAYER_NAMES);
        expect(baseLayers.OpenStreetMap).toStrictEqual({});
        expect(baseLayers.CartoDB_Positron).toStrictEqual({});
        expect(baseLayers.OpenFreeMap_Dark).toStrictEqual({});
    });

    it("calls L.tileLayer and L.maplibreGL when present", async () => {
        expect.assertions(7);

        const rasterLayer = { kind: "raster" };
        const vectorLayer = { kind: "vector" };
        (global as any).L = {
            maplibreGL: vi.fn<() => MockLayer>(() => vectorLayer),
            tileLayer: vi.fn<() => MockLayer>(() => rasterLayer),
        };
        const mod =
            await import("../../../../../electron-app/utils/maps/layers/mapBaseLayers.js");
        const { baseLayers } = mod;
        expect(baseLayers.OpenStreetMap).toBe(rasterLayer);
        expect(baseLayers.CartoDB_DarkMatter).toBe(rasterLayer);
        expect(baseLayers.OpenFreeMap_Bright).toBe(vectorLayer);
        expect((global as any).L.tileLayer).toHaveBeenCalledTimes(28);
        expect((global as any).L.maplibreGL).toHaveBeenCalledTimes(5);
        expect((global as any).L.tileLayer).toHaveBeenCalledWith(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright" data-external-link="true" rel="noopener noreferrer">OpenStreetMap</a> contributors',
            }
        );
        expect((global as any).L.maplibreGL).toHaveBeenCalledWith({
            style: "https://tiles.openfreemap.org/styles/bright",
        });
    });

    it("falls back to the shim when global L lacks tileLayer", async () => {
        expect.assertions(3);

        const maplibreGL = vi.fn<() => MockLayer>(() => ({ kind: "unused" }));
        (global as any).L = {
            maplibreGL,
            tileLayer: "not-a-function",
        };
        const mod =
            await import("../../../../../electron-app/utils/maps/layers/mapBaseLayers.js");
        const { baseLayers } = mod;
        expect(baseLayers.OpenStreetMap).toStrictEqual({});
        expect(baseLayers.OpenFreeMap_Bright).toStrictEqual({});
        expect(maplibreGL).not.toHaveBeenCalled();
    });
});
