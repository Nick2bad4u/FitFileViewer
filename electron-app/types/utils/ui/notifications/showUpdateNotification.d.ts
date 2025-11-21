/**
 * Shows update notifications with enhanced features and error handling
 * Supports different update states and provides appropriate action buttons
 *
 * @param {string} message - The notification message to display
 * @param {string} type - Notification type ("info", "warning", "error", "success")
 * @param {number} duration - Auto-hide duration in milliseconds (0 = no auto-hide)
 * @param {boolean|string} withAction - Action type: false, true, or "update-downloaded"
 *
 * @example
 * // Basic notification
 * showUpdateNotification("Update available", "info");
 *
 * @example
 * // Update downloaded notification with restart option
 * showUpdateNotification("Update downloaded", "success", 0, "update-downloaded");
 *
 * @example
 * // Simple update available with action
 * showUpdateNotification("Update ready", "info", 6000, true);
 */
export function showUpdateNotification(
    message: string,
    type?: string,
    duration?: number,
    withAction?: boolean | string
): void;
//# sourceMappingURL=showUpdateNotification.d.ts.map
