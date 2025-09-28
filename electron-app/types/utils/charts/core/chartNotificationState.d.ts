/**
 * Resets the chart state tracking - call when loading a new FIT file
 * This ensures notifications are shown for the first render of a new file
 */
export function resetChartNotificationState(): void;
/**
 * Updates the previous chart state tracking
 * @param {number} chartCount - Current chart count
 * @param {number} visibleFields - Current visible field count
 * @param {number} timestamp - Current timestamp
 */
export function updatePreviousChartState(chartCount: number, visibleFields: number, timestamp: number): void;
export namespace previousChartState {
    let chartCount: number;
    let fieldsRendered: never[];
    let lastRenderTimestamp: number;
}
//# sourceMappingURL=chartNotificationState.d.ts.map