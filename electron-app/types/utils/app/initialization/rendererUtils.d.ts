/** Notification variants rendered by renderer utility helpers. */
export type NotificationType = "error" | "info" | "success" | "warning";

/** Notification state stored under ui.currentNotification. */
export type RendererNotification = {
    message: string;
    timestamp?: number;
    type: NotificationType;
};

/**
 * Clear current notification.
 */
export function clearNotification(): void;
/**
 * Get current notification.
 */
export function getCurrentNotification(): null | RendererNotification;
/**
 * Initialize renderer utilities with state management.
 */
export function initializeRendererUtils(): void;
/**
 * Get current loading state.
 */
export function isLoading(): boolean;
/**
 * Shows or hides the loading overlay and updates the cursor style with state
 * integration.
 *
 * @param loading - If true, displays the loading overlay and sets the cursor to
 *   'wait'. If false, hides the overlay and resets the cursor.
 */
export function setLoading(loading: boolean): void;
/**
 * Show error notification with standard styling.
 *
 * @param message - Error message.
 * @param timeout - Display timeout. Default is `5000`.
 */
export function showError(message: string, timeout?: number): void;
/**
 * Show info notification with standard styling.
 *
 * @param message - Info message.
 * @param timeout - Display timeout. Default is `4000`.
 */
export function showInfo(message: string, timeout?: number): void;
/**
 * Displays a notification message in the UI with state tracking.
 *
 * @param message - The message to display in the notification.
 * @param type - The notification type, which determines its styling. Default is
 *   `'error'`.
 * @param timeout - Duration in milliseconds before the notification disappears.
 *   Set to 0 to keep it visible. Default is `5000`.
 */
export function showNotification(
    message: string,
    type?: NotificationType,
    timeout?: number
): void;
/**
 * Show success notification with standard styling.
 *
 * @param message - Success message.
 * @param timeout - Display timeout. Default is `3000`.
 */
export function showSuccess(message: string, timeout?: number): void;
/**
 * Show warning notification with standard styling.
 *
 * @param message - Warning message.
 * @param timeout - Display timeout. Default is `4000`.
 */
export function showWarning(message: string, timeout?: number): void;
