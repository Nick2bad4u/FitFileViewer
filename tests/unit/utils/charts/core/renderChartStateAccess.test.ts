import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import { callGetStateHistory } from "../../../../../electron-app/utils/charts/core/renderChartStateAccess.js";

describe("renderChartStateAccess", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
        stateManager.clearStateHistory();
    });

    it("reads state history through the chart state access boundary", () => {
        expect.assertions(1);

        stateManager.setState("charts.isRendered", true, { source: "test" });

        expect(callGetStateHistory()).not.toHaveLength(0);
    });

    it("keeps chart state history unavailable after state-history reset", () => {
        expect.assertions(2);

        stateManager.setState("charts.isRendered", true, { source: "test" });
        expect(callGetStateHistory()).not.toHaveLength(0);

        stateManager.clearStateHistory();
        expect(callGetStateHistory()).toStrictEqual([]);
    });
});
