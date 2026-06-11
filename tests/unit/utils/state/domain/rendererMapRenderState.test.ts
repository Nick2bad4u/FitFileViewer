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
});
