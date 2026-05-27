import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

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

async function importBaseLayersWithLeaflet(leaflet: unknown) {
    vi.resetModules();
    (globalThis as { L?: unknown }).L = leaflet;

    return import("../../../utils/maps/layers/mapBaseLayers.js");
}

describe("mapBaseLayers", () => {
    afterEach(() => {
        vi.resetModules();
        delete (globalThis as { L?: unknown }).L;
    });

    it("exports the full ordered base layer catalog", async () => {
        expect.assertions(1);

        const { baseLayers } = await importBaseLayersWithLeaflet({
            maplibreGL: vi.fn((options: Record<string, unknown>) => ({
                options,
                type: "vector",
            })),
            tileLayer: vi.fn(
                (urlTemplate: string, options: Record<string, unknown>) => ({
                    options,
                    type: "raster",
                    urlTemplate,
                })
            ),
        });

        expect(Object.keys(baseLayers)).toEqual(EXPECTED_LAYER_NAMES);
    });

    it("creates representative raster and vector layers with expected source metadata", async () => {
        expect.assertions(7);

        const maplibreGL = vi.fn((options: Record<string, unknown>) => ({
            options,
            type: "vector",
        }));
        const tileLayer = vi.fn(
            (urlTemplate: string, options: Record<string, unknown>) => ({
                options,
                type: "raster",
                urlTemplate,
            })
        );

        const { baseLayers } = await importBaseLayersWithLeaflet({
            maplibreGL,
            tileLayer,
        });

        expect(tileLayer).toHaveBeenCalledTimes(28);
        expect(maplibreGL).toHaveBeenCalledTimes(5);
        expect(baseLayers["OpenStreetMap"]).toMatchObject({
            type: "raster",
            urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        });
        expect(baseLayers["Satellite"]).toMatchObject({
            type: "raster",
            urlTemplate:
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        });
        expect(baseLayers["OpenFreeMap_Dark"]).toEqual({
            options: {
                style: "https://tiles.openfreemap.org/styles/dark",
            },
            type: "vector",
        });
        expect(tileLayer).toHaveBeenCalledWith(
            "https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png",
            expect.objectContaining({
                subdomains: [
                    "a",
                    "b",
                    "c",
                ],
            })
        );
        expect(maplibreGL).toHaveBeenCalledWith({
            style: "https://tiles.openfreemap.org/styles/liberty",
        });
    });
});
