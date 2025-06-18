/**
 * Displays a notification message in the UI.
 *
 * @param {string} message - The message to display in the notification.
 * @param {'error'|'success'|'info'|'warning'} [type='error'] - The type of notification, which determines its styling.
 * @param {number} [timeout=5000] - Duration in milliseconds before the notification disappears. Set to 0 to keep it visible.
 */

/**
 * Shows or hides a loading overlay and updates the cursor.
 *
 * @param {boolean} isLoading - If true, shows the loading overlay and sets the cursor to 'wait'. If false, hides the overlay and resets the cursor.
 */
// Utility functions for renderer.js
// Move showNotification and setLoading here

export function showNotification(message, type = "error", timeout = 5000) {
    const notif = document.getElementById("notification");
    if (!notif) return;
    notif.textContent = message;
    notif.className = `notification ${type}`;
    notif.style.display = "block";
    if (timeout > 0) {
        setTimeout(function () {
            notif.style.display = "none";
        }, timeout);
    }
}

/**
 * Shows or hides the loading overlay and updates the cursor style.
 *
 * @param {boolean} isLoading - If true, displays the loading overlay and sets the cursor to 'wait'. If false, hides the overlay and resets the cursor.
 */
export function setLoading(isLoading) {
    const overlay = document.getElementById("loadingOverlay");
    if (!overlay) return;
    overlay.style.display = isLoading ? "flex" : "none";
    document.body.style.cursor = isLoading ? "wait" : "";
}
