// Centralized chart notification state and helpers
// Extracted to break circular dependencies between renderChartJS and showRenderNotification

import { updateState } from "../../state/core/stateManager.js";

// Track previous render state for notification logic
export const previousChartState = {
    chartCount: 0,
    fieldsRendered: [],
    lastRenderTimestamp: 0,
};

/**
 * Resets the chart state tracking - call when loading a new FIT file This
 * ensures notifications are shown for the first render of a new file
 */
export function resetChartNotificationState() {
    previousChartState.chartCount = 0;
    previousChartState.fieldsRendered = [];
    previousChartState.lastRenderTimestamp = 0;

    // Reset state-managed notification tracking using updateState
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
 * Updates the previous chart state tracking
 *
 * @param {number} chartCount - Current chart count
 * @param {number} visibleFields - Current visible field count
 * @param {number} timestamp - Current timestamp
 */
export function updatePreviousChartState(chartCount, visibleFields, timestamp) {
    previousChartState.chartCount = chartCount;
    previousChartState.fieldsRendered = /** @type {any} */ (
        Array.from({ length: visibleFields }, () => true)
    );
    previousChartState.lastRenderTimestamp = timestamp;

    // Update state for other components using updateState
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
