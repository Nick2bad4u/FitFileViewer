import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    areRendererChartsRendered,
    normalizeRendererChartsRendered,
    setRendererChartsRendered,
} from "../../../../../electron-app/utils/state/domain/rendererChartRenderState.js";

describe("rendererChartRenderState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes chart rendered state through typed helpers", () => {
        expect.assertions(3);

        expect(areRendererChartsRendered()).toBe(false);

        setRendererChartsRendered(true);
        expect(areRendererChartsRendered()).toBe(true);

        setRendererChartsRendered(false);
        expect(areRendererChartsRendered()).toBe(false);
    });

    it("normalizes chart rendered values", () => {
        expect.assertions(3);

        expect(normalizeRendererChartsRendered(true)).toBe(true);
        expect(normalizeRendererChartsRendered(false)).toBe(false);
        expect(normalizeRendererChartsRendered("true")).toBe(false);
    });
});
