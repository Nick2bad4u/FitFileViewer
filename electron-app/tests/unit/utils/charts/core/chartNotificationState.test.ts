import { describe, expect, it, vi } from "vitest";

import type { updateState } from "../../../../../utils/state/core/stateManager.js";

const updateStateMock = vi.hoisted(() => vi.fn<typeof updateState>());

vi.mock(import("../../../../../utils/state/core/stateManager.js"), () => ({
    updateState: updateStateMock,
}));

import {
    previousChartState,
    resetChartNotificationState,
    updatePreviousChartState,
} from "../../../../../utils/charts/core/chartNotificationState.js";

function seedPreviousChartState(): void {
    updateStateMock.mockClear();
    previousChartState.chartCount = 9;
    previousChartState.fieldsRendered = [true, true];
    previousChartState.lastRenderTimestamp = 1234;
}

describe("chartNotificationState", () => {
    it("resets the local and shared previous chart state", () => {
        expect.assertions(2);

        seedPreviousChartState();

        resetChartNotificationState();

        expect(previousChartState).toStrictEqual({
            chartCount: 0,
            fieldsRendered: [],
            lastRenderTimestamp: 0,
        });
        expect(updateStateMock).toHaveBeenCalledWith(
            "charts.previousState",
            {
                chartCount: 0,
                timestamp: 0,
                visibleFields: 0,
            },
            { silent: false, source: "resetChartNotificationState" }
        );
    });

    it("updates the local and shared previous chart state", () => {
        expect.assertions(2);

        seedPreviousChartState();

        updatePreviousChartState(4, 3, 9876);

        expect(previousChartState).toStrictEqual({
            chartCount: 4,
            fieldsRendered: [true, true, true],
            lastRenderTimestamp: 9876,
        });
        expect(updateStateMock).toHaveBeenCalledWith(
            "charts.previousState",
            {
                chartCount: 4,
                timestamp: 9876,
                visibleFields: 3,
            },
            { silent: false, source: "updatePreviousChartState" }
        );
    });

    it("clamps invalid visible field counts for local render tracking", () => {
        expect.assertions(2);

        seedPreviousChartState();

        updatePreviousChartState(2, Number.POSITIVE_INFINITY, 55);

        expect(previousChartState.fieldsRendered).toStrictEqual([]);
        expect(updateStateMock).toHaveBeenCalledWith(
            "charts.previousState",
            {
                chartCount: 2,
                timestamp: 55,
                visibleFields: Number.POSITIVE_INFINITY,
            },
            { silent: false, source: "updatePreviousChartState" }
        );
    });
});
