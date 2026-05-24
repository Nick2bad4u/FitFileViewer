import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("mapBaseLayers", () => {
    let originalL: any;

    beforeEach(() => {
        originalL = (global as any).L;
        vi.resetModules();
    });

    afterEach(() => {
        (global as any).L = originalL;
    });

    it("uses shim when global L is not present", async () => {
        delete (global as any).L;
        const mod =
            await import("../../../../../utils/maps/layers/mapBaseLayers.js");
        const { baseLayers } = mod;
        expect(Object.keys(baseLayers)).toEqual(
            expect.arrayContaining([
                "CartoDB_Positron",
                "OpenFreeMap_Dark",
                "OpenStreetMap",
            ])
        );
        expect(baseLayers.OpenStreetMap).toEqual({});
        expect(baseLayers.CartoDB_Positron).toEqual({});
        expect(baseLayers.OpenFreeMap_Dark).toEqual({});
    });

    it("calls L.tileLayer and L.maplibreGL when present", async () => {
        const rasterLayer = { kind: "raster" };
        const vectorLayer = { kind: "vector" };
        (global as any).L = {
            tileLayer: vi.fn(() => rasterLayer),
            maplibreGL: vi.fn(() => vectorLayer),
        };
        const mod =
            await import("../../../../../utils/maps/layers/mapBaseLayers.js");
        const { baseLayers } = mod;
        expect(baseLayers.OpenStreetMap).toBe(rasterLayer);
        expect(baseLayers.CartoDB_DarkMatter).toBe(rasterLayer);
        expect(baseLayers.OpenFreeMap_Bright).toBe(vectorLayer);
        expect((global as any).L.tileLayer).toHaveBeenCalled();
        expect((global as any).L.maplibreGL).toHaveBeenCalled();
        expect((global as any).L.tileLayer).toHaveBeenCalledWith(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            expect.objectContaining({
                attribution: expect.stringContaining("OpenStreetMap"),
            })
        );
        expect((global as any).L.maplibreGL).toHaveBeenCalledWith({
            style: "https://tiles.openfreemap.org/styles/bright",
        });
    });

    it("falls back to the shim when global L lacks tileLayer", async () => {
        const maplibreGL = vi.fn(() => ({ kind: "unused" }));
        (global as any).L = {
            maplibreGL,
            tileLayer: "not-a-function",
        };
        const mod =
            await import("../../../../../utils/maps/layers/mapBaseLayers.js");
        const { baseLayers } = mod;
        expect(baseLayers.OpenStreetMap).toEqual({});
        expect(baseLayers.OpenFreeMap_Bright).toEqual({});
        expect(maplibreGL).not.toHaveBeenCalled();
    });
});
