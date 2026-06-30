import { afterEach, describe, expect, it, vi } from "vitest";

import { createRegisteredLeafletRuntime } from "../../../fixtures/leafletRuntime.js";

async function loadLeafletRuntime() {
    return import("../../../../electron-app/utils/maps/core/leafletRuntime.js");
}

async function loadMapLibreLayerRuntime() {
    return import("../../../../electron-app/utils/maps/layers/mapLibreLayerRuntime.js");
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

async function importBaseLayersWithLeaflet(
    leaflet: unknown,
    mapLibreLayerFactory?: MockMaplibreFactory
) {
    vi.resetModules();
    const { clearLeafletRuntimeForTests, registerLeafletRuntime } =
        await loadLeafletRuntime();
    const { clearMapLibreLayerFactoryForTests, setMapLibreLayerFactory } =
        await loadMapLibreLayerRuntime();
    clearLeafletRuntimeForTests();
    clearMapLibreLayerFactoryForTests();
    registerLeafletRuntime(createRegisteredLeafletRuntime(leaflet));
    setMapLibreLayerFactory(mapLibreLayerFactory);

    return import("../../../../electron-app/utils/maps/layers/mapBaseLayers.js");
}

type MockLayer = {
    readonly options: Record<string, unknown>;
    readonly type: "raster" | "vector";
    readonly urlTemplate?: string;
};

type MockMaplibreFactory = (options: Record<string, unknown>) => MockLayer;
type MockTileLayerFactory = (
    urlTemplate: string,
    options: Record<string, unknown>
) => MockLayer;

describe("mapBaseLayers", () => {
    afterEach(async () => {
        vi.resetModules();
        const { clearLeafletRuntimeForTests } = await loadLeafletRuntime();
        const { clearMapLibreLayerFactoryForTests } =
            await loadMapLibreLayerRuntime();
        clearLeafletRuntimeForTests();
        clearMapLibreLayerFactoryForTests();
    });

    it("exports the full ordered base layer catalog", async () => {
        expect.assertions(2);

        const maplibreGL = vi.fn<MockMaplibreFactory>((options) => ({
            options,
            type: "vector",
        }));

        const { baseLayers } = await importBaseLayersWithLeaflet(
            {
                tileLayer: vi.fn<MockTileLayerFactory>(
                    (urlTemplate, options) => ({
                        options,
                        type: "raster",
                        urlTemplate,
                    })
                ),
            },
            maplibreGL
        );

        expect(Object.keys(baseLayers)).toStrictEqual(EXPECTED_LAYER_NAMES);
        expect(baseLayers).not.toHaveProperty("__missing_layer__");
    });

    it("creates representative raster and vector layers with expected source metadata", async () => {
        expect.assertions(7);

        const maplibreGL = vi.fn<MockMaplibreFactory>((options) => ({
            options,
            type: "vector",
        }));
        const tileLayer = vi.fn<MockTileLayerFactory>(
            (urlTemplate, options) => ({
                options,
                type: "raster",
                urlTemplate,
            })
        );

        const { baseLayers } = await importBaseLayersWithLeaflet(
            { tileLayer },
            maplibreGL
        );

        expect(tileLayer).toHaveBeenCalledTimes(28);
        expect(maplibreGL).toHaveBeenCalledTimes(5);
        expect(baseLayers["OpenStreetMap"]).toStrictEqual({
            options: {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright" data-external-link="true" rel="noopener noreferrer">OpenStreetMap</a> contributors',
            },
            type: "raster",
            urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        });
        expect(baseLayers["Satellite"]).toStrictEqual({
            options: {
                attribution:
                    'Tiles &copy; <a href="https://www.esri.com" data-external-link="true" rel="noopener noreferrer">Esri</a>',
            },
            type: "raster",
            urlTemplate:
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        });
        expect(baseLayers["OpenFreeMap_Dark"]).toStrictEqual({
            options: {
                style: "https://tiles.openfreemap.org/styles/dark",
            },
            type: "vector",
        });
        expect(
            tileLayer.mock.calls.find(
                ([urlTemplate]) =>
                    urlTemplate ===
                    "https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png"
            )
        ).toStrictEqual([
            "https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png",
            {
                attribution:
                    'Tiles &copy; <a href="https://www.openstreetmap.org/copyright" data-external-link="true" rel="noopener noreferrer">OpenStreetMap</a> contributors',
                subdomains: [
                    "a",
                    "b",
                    "c",
                ],
            },
        ]);
        expect(maplibreGL).toHaveBeenCalledWith({
            style: "https://tiles.openfreemap.org/styles/liberty",
        });
    });
});
