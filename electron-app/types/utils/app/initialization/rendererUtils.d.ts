/**
 * Clear current notification
 */
export function clearNotification(): void;
/**
 * Get current notification
 * @returns {Object|null} Current notification object or null
 */
export function getCurrentNotification(): Object | null;
/**
 * Initialize renderer utilities with state management
 */
export function initializeRendererUtils(): void;
/**
 * Get current loading state
 * @returns {boolean} Current loading state
 */
export function isLoading(): boolean;
/**
 * Shows or hides the loading overlay and updates the cursor style with state integration.
 *
 * @param {boolean} isLoading - If true, displays the loading overlay and sets the cursor to 'wait'. If false, hides the overlay and resets the cursor.
 */
export function setLoading(loading: any): void;
/**
 * Show error notification with standard styling
 * @param {string} message - Error message
 * @param {number} [timeout=5000] - Display timeout
 */
export function showError(message: string, timeout?: number): void;
/**
 * Show info notification with standard styling
 * @param {string} message - Info message
 * @param {number} [timeout=4000] - Display timeout
 */
export function showInfo(message: string, timeout?: number): void;
/**
 * Displays a notification message in the UI with state tracking.
 *
 * @param {string} message - The message to display in the notification.
 * @param {'error'|'success'|'info'|'warning'} [type='error'] - The type of notification, which determines its styling.
 * @param {number} [timeout=5000] - Duration in milliseconds before the notification disappears. Set to 0 to keep it visible.
 */
export function showNotification(
    message: string,
    type?: "error" | "success" | "info" | "warning",
    timeout?: number
): void;
/**
 * Show success notification with standard styling
 * @param {string} message - Success message
 * @param {number} [timeout=3000] - Display timeout
 */
export function showSuccess(message: string, timeout?: number): void;
/**
 * Show warning notification with standard styling
 * @param {string} message - Warning message
 * @param {number} [timeout=4000] - Display timeout
 */
export function showWarning(message: string, timeout?: number): void;
//# sourceMappingURL=rendererUtils.d.ts.map
