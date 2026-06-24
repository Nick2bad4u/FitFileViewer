import {
    previousChartState,
    updatePreviousChartState,
} from "../../charts/core/chartNotificationState.js";
import {
    getShowRenderNotificationRuntime,
    type ShowRenderNotificationRuntime,
} from "./showRenderNotificationRuntime.js";

const SIGNIFICANT_RENDER_GAP_MS = 10_000;
const SIGNIFICANT_CHART_COUNT_DELTA = 2;
const SIGNIFICANT_FIELD_COUNT_DELTA = 2;

/**
 * Determines whether a chart-render notification should be shown for the
 * current render pass.
 *
 * @param currentChartCount - Number of charts currently rendered.
 * @param currentVisibleFields - Number of visible fields.
 *
 * @returns Whether to show a render notification.
 */
export function showRenderNotification(
    currentChartCount: number,
    currentVisibleFields: number,
    runtime: ShowRenderNotificationRuntime = getShowRenderNotificationRuntime()
): boolean {
    const now = runtime.dateNow();

    if (
        now - previousChartState.lastRenderTimestamp >
        SIGNIFICANT_RENDER_GAP_MS
    ) {
        console.log(
            "[ChartJS] Showing notification due to time gap since last render"
        );
        updatePreviousChartState(currentChartCount, currentVisibleFields, now);
        return true;
    }

    const chartCountDiff = Math.abs(
        currentChartCount - previousChartState.chartCount
    );
    if (
        chartCountDiff > 0 &&
        (chartCountDiff > SIGNIFICANT_CHART_COUNT_DELTA ||
            previousChartState.chartCount === 0)
    ) {
        console.log(
            `[ChartJS] Showing notification due to significant chart count change: ${previousChartState.chartCount} -> ${currentChartCount}`
        );
        updatePreviousChartState(currentChartCount, currentVisibleFields, now);
        return true;
    }

    const fieldCountDiff = Math.abs(
        currentVisibleFields - previousChartState.fieldsRendered.length
    );
    if (fieldCountDiff > SIGNIFICANT_FIELD_COUNT_DELTA) {
        console.log(
            `[ChartJS] Showing notification due to significant field count change: ${previousChartState.fieldsRendered.length} -> ${currentVisibleFields}`
        );
        updatePreviousChartState(currentChartCount, currentVisibleFields, now);
        return true;
    }

    console.log(
        "[ChartJS] Suppressing notification - minor re-render detected"
    );
    updatePreviousChartState(currentChartCount, currentVisibleFields, now);
    return false;
}
