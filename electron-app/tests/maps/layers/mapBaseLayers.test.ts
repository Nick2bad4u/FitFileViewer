import { describe, expect, it } from "vitest";

import { baseLayers } from "../../../utils/maps/layers/mapBaseLayers.js";

describe("mapBaseLayers", () => {
    it("exports the known base layer names", () => {
        expect.assertions(4);

        const layerNames = Object.keys(baseLayers);

        expect(layerNames).toContain("OpenStreetMap");
        expect(layerNames).toContain("Satellite");
        expect(layerNames).not.toContain("DefinitelyMissing");
        expect(baseLayers["OpenStreetMap"]).toBeTypeOf("object");
    });
});
