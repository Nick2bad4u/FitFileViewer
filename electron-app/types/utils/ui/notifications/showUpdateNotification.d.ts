/**
 * Shows update notifications with enhanced features and error handling.
 *
 * @example
 *     // Basic notification
 *     showUpdateNotification("Update available", "info");
 *
 * @example
 *     // Update downloaded notification with restart option
 *     showUpdateNotification(
 *         "Update downloaded",
 *         "success",
 *         0,
 *         "update-downloaded"
 *     );
 *
 * @example
 *     // Simple update available with action
 *     showUpdateNotification("Update ready", "info", 6000, true);
 *
 * @param message - The notification message to display.
 * @param type - Notification type.
 * @param duration - Auto-hide duration in milliseconds; 0 means no auto-hide.
 * @param withAction - Action type: false, true, or "update-downloaded".
 */
export function showUpdateNotification(
    message: string,
    type?: string,
    duration?: number,
    withAction?: boolean | string
): void;
