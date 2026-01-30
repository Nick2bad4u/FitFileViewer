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
        // A few representative keys should exist and be plain objects from the shim
        expect(baseLayers).toBeDefined();
        expect(typeof baseLayers.OpenStreetMap).toBe("object");
        expect(typeof baseLayers.CartoDB_Positron).toBe("object");
        expect(typeof baseLayers.OpenFreeMap_Dark).toBe("object");
    });

    it("calls L.tileLayer and L.maplibreGL when present", async () => {
        (global as any).L = {
            tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
            maplibreGL: vi.fn(() => ({ addTo: vi.fn() })),
        };
        const mod =
            await import("../../../../../utils/maps/layers/mapBaseLayers.js");
        const { baseLayers } = mod;
        // Access a few keys to ensure creation occurred
        void baseLayers.OpenStreetMap;
        void baseLayers.CartoDB_DarkMatter;
        void baseLayers.OpenFreeMap_Bright;
        expect((global as any).L.tileLayer).toHaveBeenCalled();
        expect((global as any).L.maplibreGL).toHaveBeenCalled();
    });
});
