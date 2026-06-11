import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    areRendererChartsRendered,
    normalizeRendererChartsRendered,
    setRendererChartPreviousState,
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

    it("writes previous chart render state", () => {
        expect.assertions(1);

        setRendererChartPreviousState(
            {
                chartCount: 4,
                timestamp: 1234,
                visibleFields: 3,
            },
            { source: "test" }
        );

        expect(stateManager.getState("charts.previousState")).toEqual({
            chartCount: 4,
            timestamp: 1234,
            visibleFields: 3,
        });
    });
});
