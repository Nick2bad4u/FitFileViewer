import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createRegisteredLeafletRuntime } from "../../../../fixtures/leafletRuntime.js";

async function loadLeafletRuntime() {
    return import("../../../../../electron-app/utils/maps/core/leafletRuntime.js");
}

async function loadMapLibreLayerRuntime() {
    return import("../../../../../electron-app/utils/maps/layers/mapLibreLayerRuntime.js");
}

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

    beforeEach(async () => {
        vi.resetModules();
        const { clearLeafletRuntimeForTests } = await loadLeafletRuntime();
        const { clearMapLibreLayerFactoryForTests } =
            await loadMapLibreLayerRuntime();
        clearLeafletRuntimeForTests();
        clearMapLibreLayerFactoryForTests();
    });

    afterEach(async () => {
        const { clearLeafletRuntimeForTests } = await loadLeafletRuntime();
        const { clearMapLibreLayerFactoryForTests } =
            await loadMapLibreLayerRuntime();
        clearLeafletRuntimeForTests();
        clearMapLibreLayerFactoryForTests();
    });

    it("uses shim when a Leaflet runtime is not registered", async () => {
        expect.assertions(4);

        const mod =
            await import("../../../../../electron-app/utils/maps/layers/mapBaseLayers.js");
        const { baseLayers } = mod;
        expect(Object.keys(baseLayers)).toEqual(EXPECTED_LAYER_NAMES);
        expect(baseLayers.OpenStreetMap).toStrictEqual({});
        expect(baseLayers.CartoDB_Positron).toStrictEqual({});
        expect(baseLayers.OpenFreeMap_Dark).toStrictEqual({});
    });

    it("calls L.tileLayer and registered MapLibre factory when present", async () => {
        expect.assertions(7);

        const rasterLayer = { kind: "raster" };
        const vectorLayer = { kind: "vector" };
        const mapLibreLayerFactory = vi.fn<() => MockLayer>(() => vectorLayer);
        const leaflet = {
            tileLayer: vi.fn<() => MockLayer>(() => rasterLayer),
        };
        const { registerLeafletRuntime } = await loadLeafletRuntime();
        const { setMapLibreLayerFactory } = await loadMapLibreLayerRuntime();
        registerLeafletRuntime(createRegisteredLeafletRuntime(leaflet));
        setMapLibreLayerFactory(mapLibreLayerFactory);
        const mod =
            await import("../../../../../electron-app/utils/maps/layers/mapBaseLayers.js");
        const { baseLayers } = mod;
        expect(baseLayers.OpenStreetMap).toBe(rasterLayer);
        expect(baseLayers.CartoDB_DarkMatter).toBe(rasterLayer);
        expect(baseLayers.OpenFreeMap_Bright).toBe(vectorLayer);
        expect(leaflet.tileLayer).toHaveBeenCalledTimes(28);
        expect(mapLibreLayerFactory).toHaveBeenCalledTimes(5);
        expect(leaflet.tileLayer).toHaveBeenCalledWith(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright" data-external-link="true" rel="noopener noreferrer">OpenStreetMap</a> contributors',
            }
        );
        expect(mapLibreLayerFactory).toHaveBeenCalledWith({
            style: "https://tiles.openfreemap.org/styles/bright",
        });
    });

    it("falls back to the shim when Leaflet is still unavailable", async () => {
        expect.assertions(3);

        const mapLibreLayerFactory = vi.fn<() => MockLayer>(() => ({
            kind: "unused",
        }));
        const { setMapLibreLayerFactory } = await loadMapLibreLayerRuntime();
        setMapLibreLayerFactory(mapLibreLayerFactory);
        const mod =
            await import("../../../../../electron-app/utils/maps/layers/mapBaseLayers.js");
        const { baseLayers } = mod;
        expect(baseLayers.OpenStreetMap).toStrictEqual({});
        expect(baseLayers.OpenFreeMap_Bright).toBeDefined();
        expect(mapLibreLayerFactory).toHaveBeenCalledTimes(5);
    });
});
