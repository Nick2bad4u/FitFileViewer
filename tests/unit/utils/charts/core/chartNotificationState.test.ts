import { describe, expect, it, vi } from "vitest";

import type { setRendererChartPreviousState } from "../../../../../electron-app/utils/state/domain/rendererChartRenderState.js";

const setRendererChartPreviousStateMock = vi.hoisted(() =>
    vi.fn<typeof setRendererChartPreviousState>()
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/rendererChartRenderState.js"),
    () => ({
        setRendererChartPreviousState: setRendererChartPreviousStateMock,
    })
);

import {
    previousChartState,
    resetChartNotificationState,
    updatePreviousChartState,
} from "../../../../../electron-app/utils/charts/core/chartNotificationState.js";

function seedPreviousChartState(): void {
    setRendererChartPreviousStateMock.mockClear();
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
        expect(setRendererChartPreviousStateMock).toHaveBeenCalledWith(
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
            fieldsRendered: [
                true,
                true,
                true,
            ],
            lastRenderTimestamp: 9876,
        });
        expect(setRendererChartPreviousStateMock).toHaveBeenCalledWith(
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
        expect(setRendererChartPreviousStateMock).toHaveBeenCalledWith(
            {
                chartCount: 2,
                timestamp: 55,
                visibleFields: Number.POSITIVE_INFINITY,
            },
            { silent: false, source: "updatePreviousChartState" }
        );
    });
});
