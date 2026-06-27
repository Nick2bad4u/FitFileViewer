import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    isRendererMapRendered,
    setRendererMapRendered,
} from "../../../../../electron-app/utils/state/domain/rendererMapRenderState.js";

describe("rendererMapRenderState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes renderer map render state", () => {
        expect.assertions(3);

        expect(isRendererMapRendered()).toBe(false);

        setRendererMapRendered(true, { source: "test" });
        expect(isRendererMapRendered()).toBe(true);

        setRendererMapRendered(false, { source: "test" });
        expect(isRendererMapRendered()).toBe(false);
    });

    it("stores normalized map render state through direct state writes", () => {
        expect.assertions(3);

        stateManager.setState("map.isRendered", "true", { source: "test" });
        expect(stateManager.getState("map.isRendered")).toBe(false);

        stateManager.setState("map.isRendered", true, { source: "test" });
        expect(stateManager.getState("map.isRendered")).toBe(true);

        stateManager.setState(
            "map",
            { baseLayer: "osm", isRendered: "yes", measurementMode: true },
            { source: "test" }
        );
        expect(stateManager.getState("map")).toMatchObject({
            baseLayer: "OpenStreetMap",
            isRendered: false,
            measurementMode: true,
        });
    });
});
