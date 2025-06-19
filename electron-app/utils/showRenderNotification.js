import { previousChartState, updatePreviousChartState } from "./renderChartJS.js";

/**
 * Determines if a render notification should be shown based on state changes
 * @param {number} currentChartCount - Number of charts currently rendered
 * @param {number} currentVisibleFields - Number of visible fields
 * @returns {boolean} Whether to show notification
 */
export function showRenderNotification(currentChartCount, currentVisibleFields) {
    const now = Date.now();

    // Always show notification if it's been more than 10 seconds since last render
    // This handles new file loads or significant time gaps
    if (now - previousChartState.lastRenderTimestamp > 10000) {
        console.log("[ChartJS] Showing notification due to time gap since last render");
        updatePreviousChartState(currentChartCount, currentVisibleFields, now);
        return true;
    }

    // Show notification if chart count significantly changed (more than just minor adjustments)
    const chartCountDiff = Math.abs(currentChartCount - previousChartState.chartCount);
    if (chartCountDiff > 0 && (chartCountDiff > 2 || previousChartState.chartCount === 0)) {
        console.log(
            `[ChartJS] Showing notification due to significant chart count change: ${previousChartState.chartCount} -> ${currentChartCount}`
        );
        updatePreviousChartState(currentChartCount, currentVisibleFields, now);
        return true;
    }

    // Show notification if visible fields changed significantly
    const fieldCountDiff = Math.abs(currentVisibleFields - previousChartState.fieldsRendered.length);
    if (fieldCountDiff > 2) {
        console.log(
            `[ChartJS] Showing notification due to significant field count change: ${previousChartState.fieldsRendered.length} -> ${currentVisibleFields}`
        );
        updatePreviousChartState(currentChartCount, currentVisibleFields, now);
        return true;
    }

    // Don't show notification for minor re-renders (like tab switches)
    console.log("[ChartJS] Suppressing notification - minor re-render detected");
    updatePreviousChartState(currentChartCount, currentVisibleFields, now);
    return false;
}
