import {
    previousChartState,
    resetChartNotificationState as resetNotificationState,
    updatePreviousChartState as updateNotificationPreviousChartState,
} from "./chartNotificationState.js";

/**
 * Previous chart state exported through renderChartJS.
 */
export { previousChartState };

/**
 * Resets chart notification state.
 */
export function resetChartNotificationState(): void {
    try {
        resetNotificationState();
    } catch {
        // Ignore notification-state failures so chart cleanup remains best-effort.
    }
}

/**
 * Updates previous chart state.
 */
export function updatePreviousChartState(
    chartCount: number,
    visibleFields: number,
    timestamp: number
): void {
    try {
        updateNotificationPreviousChartState(
            chartCount,
            visibleFields,
            timestamp
        );
    } catch {
        // Ignore notification-state failures so chart cleanup remains best-effort.
    }
}
