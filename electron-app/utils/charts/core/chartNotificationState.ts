import { updateState } from "../../state/core/stateManager.js";

/**
 * Previous chart-render state used to decide whether render notifications are
 * meaningful for the current FIT file.
 */
export type PreviousChartState = {
    chartCount: number;
    fieldsRendered: boolean[];
    lastRenderTimestamp: number;
};

const emptyPreviousChartState = {
    chartCount: 0,
    fieldsRendered: [],
    lastRenderTimestamp: 0,
} as const satisfies PreviousChartState;

/**
 * Shared mutable notification state used by chart rendering and notification
 * helpers.
 */
export const previousChartState: PreviousChartState = {
    ...emptyPreviousChartState,
    fieldsRendered: [...emptyPreviousChartState.fieldsRendered],
};

/**
 * Reset chart notification tracking for a newly loaded FIT file.
 */
export function resetChartNotificationState(): void {
    previousChartState.chartCount = emptyPreviousChartState.chartCount;
    previousChartState.fieldsRendered = [
        ...emptyPreviousChartState.fieldsRendered,
    ];
    previousChartState.lastRenderTimestamp =
        emptyPreviousChartState.lastRenderTimestamp;

    updateState(
        "charts.previousState",
        {
            chartCount: 0,
            timestamp: 0,
            visibleFields: 0,
        },
        { silent: false, source: "resetChartNotificationState" }
    );

    console.log("[ChartJS] Chart notification state reset for new file");
}

/**
 * Update the previous chart-render state after a render pass.
 *
 * @param chartCount - Current chart count.
 * @param visibleFields - Current visible field count.
 * @param timestamp - Current render timestamp.
 */
export function updatePreviousChartState(
    chartCount: number,
    visibleFields: number,
    timestamp: number
): void {
    const normalizedVisibleFields = Math.max(
        0,
        Number.isFinite(visibleFields) ? Math.trunc(visibleFields) : 0
    );

    previousChartState.chartCount = chartCount;
    previousChartState.fieldsRendered = Array.from(
        { length: normalizedVisibleFields },
        () => true
    );
    previousChartState.lastRenderTimestamp = timestamp;

    updateState(
        "charts.previousState",
        {
            chartCount,
            timestamp,
            visibleFields,
        },
        { silent: false, source: "updatePreviousChartState" }
    );
}
