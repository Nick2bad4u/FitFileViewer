import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    appendRendererChartPerformanceHistory,
    getRendererChartPerformanceHistory as getChartPerformanceHistory,
    getRendererChartPerformanceTracking,
    updateRendererChartPerformanceTracking,
} from "../../../../../electron-app/utils/state/domain/rendererChartPerformanceState.js";

describe("rendererChartPerformanceState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("updates chart tracking records by tracking id", () => {
        expect.assertions(1);

        updateRendererChartPerformanceTracking(
            "chart-render-1",
            {
                operation: "render",
                startTime: 10,
                status: "running",
            },
            { source: "test" }
        );

        expect(getRendererChartPerformanceTracking("chart-render-1")).toEqual({
            operation: "render",
            startTime: 10,
            status: "running",
        });
    });

    it("appends and trims chart performance history", () => {
        expect.assertions(2);

        for (let index = 0; index < 55; index += 1) {
            appendRendererChartPerformanceHistory(
                {
                    duration: index,
                    operation: `render-${index}`,
                },
                { source: "test" }
            );
        }

        const history = getChartPerformanceHistory();
        expect(history).toHaveLength(50);
        expect(history[0]).toEqual({
            duration: 5,
            operation: "render-5",
        });
    });
});
