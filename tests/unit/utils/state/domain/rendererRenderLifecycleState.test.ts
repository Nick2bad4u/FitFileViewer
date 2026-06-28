import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import { resetRendererRenderLifecycle } from "../../../../../electron-app/utils/state/domain/rendererRenderLifecycleState.js";

describe("rendererRenderLifecycleState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("resets chart, map, and table render flags together", () => {
        expect.assertions(3);

        stateManager.setState("charts.isRendered", true, { source: "test" });
        stateManager.setState("map.isRendered", true, { source: "test" });
        stateManager.setState("tables.isRendered", true, { source: "test" });

        resetRendererRenderLifecycle({ source: "test.reset" });

        expect(stateManager.getState("charts.isRendered")).toBe(false);
        expect(stateManager.getState("map.isRendered")).toBe(false);
        expect(stateManager.getState("tables.isRendered")).toBe(false);
    });
});
