import { describe, expect, it, vi } from "vitest";

import { createOpenFreeMapVectorLayers } from "../../../../electron-app/utils/maps/layers/mapVectorLayers.js";

const expectedLayerNames = [
    "OpenFreeMap_Bright",
    "OpenFreeMap_Dark",
    "OpenFreeMap_Fiord",
    "OpenFreeMap_Liberty",
    "OpenFreeMap_Positron",
];

describe("mapVectorLayers.js", () => {
    it("creates OpenFreeMap vector layers through the MapLibre Leaflet bridge", () => {
        expect.assertions(4);

        const maplibreGL = vi.fn((options: Record<string, unknown>) => ({
            options,
            type: "vector",
        }));

        const layers = createOpenFreeMapVectorLayers(maplibreGL);

        expect(Object.keys(layers)).toStrictEqual(expectedLayerNames);
        expect(maplibreGL).toHaveBeenCalledTimes(5);
        expect(layers.OpenFreeMap_Dark).toStrictEqual({
            options: { style: "https://tiles.openfreemap.org/styles/dark" },
            type: "vector",
        });
        expect(maplibreGL).toHaveBeenCalledWith({
            style: "https://tiles.openfreemap.org/styles/liberty",
        });
    });

    it("creates empty placeholders when the MapLibre bridge is unavailable", () => {
        expect.assertions(2);

        const layers = createOpenFreeMapVectorLayers(null);

        expect(Object.keys(layers)).toStrictEqual(expectedLayerNames);
        expect(layers).toStrictEqual({
            OpenFreeMap_Bright: {},
            OpenFreeMap_Dark: {},
            OpenFreeMap_Fiord: {},
            OpenFreeMap_Liberty: {},
            OpenFreeMap_Positron: {},
        });
    });
});
