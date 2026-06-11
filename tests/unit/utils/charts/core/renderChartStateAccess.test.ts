import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    callGetStateHistory,
    callSubscribe,
} from "../../../../../electron-app/utils/charts/core/renderChartStateAccess.js";

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

    it("subscribes through the chart state access boundary", () => {
        expect.assertions(2);

        const values: unknown[] = [];
        const unsubscribe = callSubscribe("charts.isRendered", (nextValue) => {
            values.push(nextValue);
        });

        stateManager.setState("charts.isRendered", true, { source: "test" });
        expect(values).toStrictEqual([true]);

        unsubscribe();
        stateManager.setState("charts.isRendered", false, { source: "test" });
        expect(values).toStrictEqual([true]);
    });
});
