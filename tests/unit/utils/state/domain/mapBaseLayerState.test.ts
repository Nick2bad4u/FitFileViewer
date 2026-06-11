import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getMapBaseLayer,
    setMapBaseLayer,
} from "../../../../../electron-app/utils/state/domain/mapBaseLayerState.js";

describe("mapBaseLayerState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes the persisted map base-layer key", () => {
        expect.assertions(3);

        expect(getMapBaseLayer()).toBe("openstreetmap");

        setMapBaseLayer("Esri_WorldImagery", { source: "test" });
        expect(getMapBaseLayer()).toBe("Esri_WorldImagery");

        stateManager.setState("map.baseLayer", "", { source: "test" });
        expect(getMapBaseLayer()).toBe("OpenStreetMap");
    });
});
