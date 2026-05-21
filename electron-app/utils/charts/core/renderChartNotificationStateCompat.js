import * as chartNotificationState from "./chartNotificationState.js";
const fallbackPreviousChartState = {
    chartCount: 0,
    fieldsRendered: [],
    lastRenderTimestamp: 0,
};
const notificationState = chartNotificationState;
/**
 * Previous chart state exported through renderChartJS for compatibility.
 */
export const previousChartState =
    notificationState.previousChartState ?? fallbackPreviousChartState;
/**
 * Resets chart notification state while tolerating injected empty test modules.
 */
export function resetChartNotificationState() {
    try {
        notificationState.resetChartNotificationState?.();
    } catch {
        // Ignore notification-state compatibility failures.
    }
}
/**
 * Updates previous chart state while tolerating injected empty test modules.
 */
export function updatePreviousChartState(chartCount, visibleFields, timestamp) {
    try {
        notificationState.updatePreviousChartState?.(
            chartCount,
            visibleFields,
            timestamp
        );
    } catch {
        // Ignore notification-state compatibility failures.
    }
}
