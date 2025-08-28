/**
 * Update Notification Utility
 * Specialized utility for showing update-related notifications with actions
 */

// Constants for better maintainability
const NOTIFICATION_CONSTANTS = {
    DEFAULT_DURATION: 6000,
    DEFAULT_TYPE: "info",
    NOTIFICATION_ID: "notification",
    BUTTON_CLASS: "themed-btn",
    UPDATE_DOWNLOADED: "update-downloaded",
    BUTTON_MARGIN: "10px",
};

const BUTTON_TEXTS = {
    RESTART_UPDATE: "Restart & Update",
    LATER: "Later",
};

const LOG_PREFIX = "[ShowUpdateNotification]";

/**
 * Enhanced logging with context
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function logWithContext(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} ${LOG_PREFIX} ${message}`;

    if (context && Object.keys(context).length > 0) {
        /** @type {Record<string, any>} */ (console)[level](logMessage, context);
    } else {
        /** @type {Record<string, any>} */ (console)[level](logMessage);
    }
}

/**
 * Validate electronAPI availability
 * @returns {boolean} True if electronAPI is available
 */
function validateElectronAPI() {
    const hasAPI =
        /** @type {any} */ (window).electronAPI &&
        typeof (/** @type {any} */ (window).electronAPI.installUpdate) === "function";
    if (!hasAPI) {
        logWithContext("warn", "electronAPI.installUpdate not available");
    }
    return hasAPI;
}

/**
 * Get notification element with validation
 * @returns {HTMLElement|null} Notification element or null if not found
 */
function getNotificationElement() {
    const notification = document.getElementById(NOTIFICATION_CONSTANTS.NOTIFICATION_ID);
    if (!notification) {
        logWithContext("error", "Notification element not found in DOM");
        return null;
    }
    return notification;
}

/**
 * Clear notification content
 * @param {HTMLElement} notification - Notification element
 */
function clearNotificationContent(notification) {
    try {
        while (notification.firstChild) {
            notification.removeChild(notification.firstChild);
        }
    } catch (error) {
        logWithContext("error", "Failed to clear notification content", {
            error: /** @type {Error} */ (error).message,
        });
    }
}

/**
 * Create a themed button element
 * @param {string} text - Button text
 * @param {Function} clickHandler - Click event handler
 * @param {Object} styles - Additional styles
 * @returns {HTMLElement} Button element
 */
function createThemedButton(text, clickHandler, styles = {}) {
    try {
        const button = document.createElement("button");
        button.textContent = text;
        button.className = NOTIFICATION_CONSTANTS.BUTTON_CLASS;
        button.onclick = /** @type {(this: GlobalEventHandlers, ev: MouseEvent) => any} */ (clickHandler);

        // Apply additional styles
        Object.assign(button.style, styles);

        return button;
    } catch (error) {
        logWithContext("error", "Failed to create themed button", {
            text,
            error: /** @type {Error} */ (error).message,
        });
        return /** @type {HTMLElement} */ (/** @type {unknown} */ (null));
    }
}

/**
 * Handle update installation with validation
 */
function handleUpdateInstall() {
    try {
        if (validateElectronAPI()) {
            logWithContext("info", "Initiating update installation");
            /** @type {any} */ (window).electronAPI.installUpdate();
        } else {
            logWithContext("error", "Cannot install update - electronAPI not available");
        }
    } catch (error) {
        logWithContext("error", "Failed to install update", { error: /** @type {Error} */ (error).message });
    }
}

/**
 * Hide notification with validation
 * @param {HTMLElement} notification - Notification element
 */
function hideNotification(notification) {
    try {
        if (notification && notification.style) {
            notification.style.display = "none";
            logWithContext("info", "Notification hidden");
        }
    } catch (error) {
        logWithContext("error", "Failed to hide notification", { error: /** @type {Error} */ (error).message });
    }
}

/**
 * Create update downloaded action buttons
 * @param {HTMLElement} notification - Notification element
 */
function createUpdateDownloadedButtons(notification) {
    try {
        // Restart & Update button
        const restartBtn = createThemedButton(BUTTON_TEXTS.RESTART_UPDATE, handleUpdateInstall);

        // Later button
        const laterBtn = createThemedButton(BUTTON_TEXTS.LATER, () => hideNotification(notification), {
            marginLeft: NOTIFICATION_CONSTANTS.BUTTON_MARGIN,
        });

        if (restartBtn && laterBtn) {
            notification.appendChild(restartBtn);
            notification.appendChild(laterBtn);
            logWithContext("info", "Update downloaded buttons created");
        }
    } catch (error) {
        logWithContext("error", "Failed to create update downloaded buttons", {
            error: /** @type {Error} */ (error).message,
        });
    }
}

/**
 * Create simple update action button
 * @param {HTMLElement} notification - Notification element
 */
function createUpdateActionButton(notification) {
    try {
        const button = createThemedButton(BUTTON_TEXTS.RESTART_UPDATE, handleUpdateInstall);

        if (button) {
            notification.appendChild(button);
            logWithContext("info", "Update action button created");
        }
    } catch (error) {
        logWithContext("error", "Failed to create update action button", {
            error: /** @type {Error} */ (error).message,
        });
    }
}

/**
 * Set up auto-hide timeout for notification
 * @param {HTMLElement} notification - Notification element
 * @param {number} duration - Timeout duration in milliseconds
 */
function setupAutoHide(notification, duration) {
    try {
        setTimeout(() => {
            hideNotification(notification);
        }, duration);

        logWithContext("info", "Auto-hide timeout set", { duration });
    } catch (error) {
        logWithContext("error", "Failed to setup auto-hide", {
            error: /** @type {Error} */ (error).message,
            duration,
        });
    }
}

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
    message,
    type = NOTIFICATION_CONSTANTS.DEFAULT_TYPE,
    duration = NOTIFICATION_CONSTANTS.DEFAULT_DURATION,
    withAction = false
) {
    try {
        logWithContext("info", "Showing update notification", {
            message,
            type,
            duration,
            withAction,
        });

        // Get and validate notification element
        const notification = getNotificationElement();
        if (!notification) {
            return;
        }

        // Clear previous content
        clearNotificationContent(notification);

        // Set notification properties
        notification.className = `notification ${type}`;
        notification.style.display = "block";

        // Create message span
        const msgSpan = document.createElement("span");
        msgSpan.textContent = message;
        notification.appendChild(msgSpan);

        // Handle different action types
        if (withAction === NOTIFICATION_CONSTANTS.UPDATE_DOWNLOADED) {
            createUpdateDownloadedButtons(notification);
        } else if (withAction) {
            createUpdateActionButton(notification);
        }

        // Set up auto-hide if needed
        if (!withAction || withAction === true) {
            setupAutoHide(notification, duration);
        }

        logWithContext("info", "Update notification displayed successfully");
    } catch (error) {
        logWithContext("error", "Failed to show update notification", {
            message,
            type,
            duration,
            withAction,
            error: /** @type {Error} */ (error).message,
        });
    }
}
