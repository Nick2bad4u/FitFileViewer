/**
 * Renderer utility functions with state management integration
 * Enhanced utilities for renderer.js with centralized state support
 */

import { getState, setState, subscribe } from "../../state/core/stateManager.js";

/**
 * Clear current notification
 */
export function clearNotification() {
    const notif = document.querySelector("#notification");
    if (notif) {
        notif.style.display = "none";
    }

    setState("ui.currentNotification", null, { source: "clearNotification" });
}

/**
 * Get current notification
 * @returns {Object|null} Current notification object or null
 */
export function getCurrentNotification() {
    return getState("ui.currentNotification");
}

/**
 * Initialize renderer utilities with state management
 */
export function initializeRendererUtils() {
    // Subscribe to loading state changes to update UI
    subscribe("isLoading", (/** @type {boolean} */ loading) => {
        updateLoadingUI(loading);
    });

    // Subscribe to notification state changes
    subscribe("ui.currentNotification", (/** @type {{message:string,type:string}|null} */ notification) => {
        if (notification) {
            updateNotificationUI(notification);
        }
    });

    console.log("[RendererUtils] State management initialized");
}

/**
 * Get current loading state
 * @returns {boolean} Current loading state
 */
export function isLoading() {
    return getState("isLoading") || false;
}

/**
 * Shows or hides the loading overlay and updates the cursor style with state integration.
 *
 * @param {boolean} isLoading - If true, displays the loading overlay and sets the cursor to 'wait'. If false, hides the overlay and resets the cursor.
 */
export function setLoading(loading) {
    // Update state first
    setState("isLoading", loading, { source: "setLoading" });

    const overlay = document.querySelector("#loadingOverlay");
    if (!overlay) {
        console.warn("[RendererUtils] Loading overlay element not found");
        return;
    }

    overlay.style.display = loading ? "flex" : "none";
    document.body.style.cursor = loading ? "wait" : "";

    // Update aria attributes for accessibility
    overlay.setAttribute("aria-hidden", (!loading).toString());
    document.body.setAttribute("aria-busy", loading.toString());

    console.log(`[RendererUtils] Loading state: ${loading}`);
}

/**
 * Show error notification with standard styling
 * @param {string} message - Error message
 * @param {number} [timeout=5000] - Display timeout
 */
export function showError(message, timeout = 5000) {
    showNotification(message, "error", timeout);
}

/**
 * Show info notification with standard styling
 * @param {string} message - Info message
 * @param {number} [timeout=4000] - Display timeout
 */
export function showInfo(message, timeout = 4000) {
    showNotification(message, "info", timeout);
}

/**
 * Displays a notification message in the UI with state tracking.
 *
 * @param {string} message - The message to display in the notification.
 * @param {'error'|'success'|'info'|'warning'} [type='error'] - The type of notification, which determines its styling.
 * @param {number} [timeout=5000] - Duration in milliseconds before the notification disappears. Set to 0 to keep it visible.
 */
export function showNotification(message, type = "error", timeout = 5000) {
    const notif = document.querySelector("#notification");
    if (!notif) {
        console.warn("[RendererUtils] Notification element not found");
        return;
    }

    notif.textContent = message;
    notif.className = `notification ${type}`;
    notif.style.display = "block";

    // Track notification in state
    setState(
        "ui.currentNotification",
        {
            message,
            timestamp: Date.now(),
            type,
        },
        { source: "showNotification" }
    );

    if (timeout > 0) {
        setTimeout(() => {
            notif.style.display = "none";
            setState("ui.currentNotification", null, { source: "showNotification" });
        }, timeout);
    }

    console.log(`[RendererUtils] Notification shown: ${type} - ${message}`);
}

/**
 * Show success notification with standard styling
 * @param {string} message - Success message
 * @param {number} [timeout=3000] - Display timeout
 */
export function showSuccess(message, timeout = 3000) {
    showNotification(message, "success", timeout);
}

/**
 * Show warning notification with standard styling
 * @param {string} message - Warning message
 * @param {number} [timeout=4000] - Display timeout
 */
export function showWarning(message, timeout = 4000) {
    showNotification(message, "warning", timeout);
}

/**
 * Update loading UI based on state
 *
 * Shows/hides loading overlay and disables/enables interactive elements.
 * The Open File button (openFileBtn) is intentionally excluded from
 * being disabled to allow users to open new files at any time.
 *
 * @private
 * @param {boolean} isLoading - Loading state
 */
function updateLoadingUI(loading) {
    const overlay = document.querySelector("#loadingOverlay");
    if (overlay) {
        overlay.style.display = loading ? "flex" : "none";
        overlay.setAttribute("aria-hidden", (!loading).toString());
    }

    document.body.style.cursor = loading ? "wait" : "";
    document.body.setAttribute("aria-busy", loading.toString());

    // Disable/enable interactive elements during loading
    const interactiveElements = document.querySelectorAll("button, input, select, textarea");
    for (const element of interactiveElements) {
        // Never disable the Open File button - users should always be able to open new files
        if (element.id === "openFileBtn") {
            continue;
        }

        // Never disable tab buttons - users should always be able to navigate between tabs
        if (element.classList.contains("tab-button")) {
            continue;
        }

        if (
            element instanceof HTMLButtonElement ||
            element instanceof HTMLInputElement ||
            element instanceof HTMLSelectElement ||
            element instanceof HTMLTextAreaElement
        ) {
            if (loading) {
                element.dataset.wasDisabled = element.disabled.toString();
                element.disabled = true;
            } else {
                const wasDisabled = element.dataset.wasDisabled === "true";
                element.disabled = wasDisabled;
                delete element.dataset.wasDisabled;
            }
        }
    }
}

/**
 * Update notification UI based on state
 * @private
 * @param {Object} notification - Notification object
 */
/**
 * @param {{message:string,type:string}} notification
 */
function updateNotificationUI(notification) {
    const notif = document.querySelector("#notification");
    if (!notif) {
        return;
    }

    notif.textContent = notification.message;
    notif.className = `notification ${notification.type}`;
    notif.style.display = "block";

    // Set aria attributes for accessibility
    notif.setAttribute("role", "alert");
    notif.setAttribute("aria-live", "polite");
}
