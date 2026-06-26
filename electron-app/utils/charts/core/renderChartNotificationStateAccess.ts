import type { PreviousChartState } from "./chartNotificationState.js";
import * as chartNotificationState from "./chartNotificationState.js";

type NotificationStateModule = Partial<typeof chartNotificationState>;

const fallbackPreviousChartState: PreviousChartState = {
    chartCount: 0,
    fieldsRendered: [],
    lastRenderTimestamp: 0,
};

const notificationState = chartNotificationState as NotificationStateModule;

/**
 * Previous chart state exported through renderChartJS.
 */
export const previousChartState =
    notificationState.previousChartState ?? fallbackPreviousChartState;

/**
 * Resets chart notification state while tolerating injected empty test modules.
 */
export function resetChartNotificationState(): void {
    try {
        notificationState.resetChartNotificationState?.();
    } catch {
        // Ignore injected notification-state test module failures.
    }
}

/**
 * Updates previous chart state while tolerating injected empty test modules.
 */
export function updatePreviousChartState(
    chartCount: number,
    visibleFields: number,
    timestamp: number
): void {
    try {
        notificationState.updatePreviousChartState?.(
            chartCount,
            visibleFields,
            timestamp
        );
    } catch {
        // Ignore injected notification-state test module failures.
    }
}
