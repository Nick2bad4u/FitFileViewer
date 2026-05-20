/**
 * Determines whether a chart-render notification should be shown for the
 * current render pass.
 *
 * @param currentChartCount - Number of charts currently rendered.
 * @param currentVisibleFields - Number of visible fields.
 * @returns Whether to show a render notification.
 */
export function showRenderNotification(
    currentChartCount: number,
    currentVisibleFields: number
): boolean;
