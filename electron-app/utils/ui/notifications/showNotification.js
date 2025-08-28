// Enhanced notification utility with modern animations, icons, and queue management

/**
 * @typedef {Object} NotificationTypeConfig
 * @property {string} icon
 * @property {number} duration
 * @property {string} ariaLabel
 */
/**
 * @typedef {Object} NotificationAction
 * @property {string} text
 * @property {()=>void} [onClick]
 * @property {string} [className]
 */
/**
 * @typedef {Object} NotificationOptions
 * @property {string} [icon]
 * @property {boolean} [persistent]
 * @property {Function} [onClick]
 * @property {NotificationAction[]} [actions]
 */
/**
 * @typedef {Object} QueuedNotification
 * @property {string} message
 * @property {keyof typeof NOTIFICATION_TYPES} type
 * @property {number|null} duration
 * @property {string} icon
 * @property {string} ariaLabel
 * @property {Function|undefined} onClick
 * @property {NotificationAction[]} actions
 * @property {number} timestamp
 */
/**
 * @typedef {HTMLElement & { hideTimeout?: number }} NotificationElement
 */

// Notification queue for managing multiple notifications
/** @type {QueuedNotification[]} */
let notificationQueue = [];
let isShowingNotification = false;

// Notification type configurations with icons and default durations
/**
 * Notification type map
 * @type {{info:NotificationTypeConfig,success:NotificationTypeConfig,error:NotificationTypeConfig,warning:NotificationTypeConfig}}
 */
const NOTIFICATION_TYPES = {
    info: { icon: "ℹ️", duration: 4000, ariaLabel: "Information" },
    success: { icon: "✅", duration: 3000, ariaLabel: "Success" },
    error: { icon: "❌", duration: 6000, ariaLabel: "Error" },
    warning: { icon: "⚠️", duration: 5000, ariaLabel: "Warning" },
};

/**
 * Enhanced notification display with animations, icons, and queue management
 * @param {string} message - The message to display in the notification
 * @param {string} [type='info'] - The type of notification ('info', 'error', 'success', 'warning')
 * @param {number} [duration] - Duration in milliseconds (uses type default if not specified)
 * @param {Object} [options] - Additional options
 * @param {string} [options.icon] - Custom icon to override default
 * @param {boolean} [options.persistent] - If true, notification won't auto-hide
 * @param {Function} [options.onClick] - Callback when notification is clicked
 * @param {NotificationAction[]} [options.actions] - Action buttons
 * @returns {Promise<void>} Promise that resolves when notification is shown
 */
/**
 * @param {string} message
 * @param {keyof typeof NOTIFICATION_TYPES} [type="info"]
 * @param {number} [duration]
 * @param {NotificationOptions} [options]
 * @returns {Promise<void>}
 */
export async function showNotification(message, type = "info", duration, options = {}) {
    // Validate inputs
    if (!message || typeof message !== "string") {
        console.warn("showNotification: Invalid message provided");
        return;
    }

    if (!NOTIFICATION_TYPES[type]) {
        console.warn(`showNotification: Unknown notification type '${type}', falling back to 'info'`);
        type = "info";
    }

    /** @type {NotificationTypeConfig} */
    const config = NOTIFICATION_TYPES[type];
    const finalDuration = options.persistent ? null : (typeof duration === "number" ? duration : config.duration);

    // Create notification object
    /** @type {QueuedNotification} */
    const notification = {
        message,
        type,
        duration: finalDuration,
        icon: options.icon ?? config.icon,
        ariaLabel: config.ariaLabel,
        onClick: options.onClick,
        actions: options.actions || [],
        timestamp: Date.now(),
    };

    // Add to queue
    notificationQueue.push(notification);

    // Process queue if not already showing
    if (!isShowingNotification) {
        await processNotificationQueue();
    }
}

/**
 * Processes the notification queue, showing notifications one at a time
 */
async function processNotificationQueue() {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }

    if (isShowingNotification) {
        // If already showing, wait a bit and try again
        setTimeout(() => processNotificationQueue(), 500);
        return;
    }

    isShowingNotification = true;
    /** @type {QueuedNotification|undefined} */
    const notification = notificationQueue.shift();

    try {
        if (notification) {
            await displayNotification(notification);
        }
    } catch (error) {
        console.error("Error displaying notification:", error);
    }

    // Reset flag and process next notification
    isShowingNotification = false;

    // Process next notification after a short delay
    if (notificationQueue.length > 0) {
        setTimeout(() => processNotificationQueue(), 50);
    }
}

/**
 * Displays a single notification with animations
 * @param {Object} notification - Notification object to display
 * @returns {Promise<void>} Promise that resolves when notification is hidden
 */
/**
 * @param {QueuedNotification} notification
 */
async function displayNotification(notification) {
    /** @type {NotificationElement|null} */
    const notificationElement = /** @type {any} */(document.getElementById("notification"));
    if (!notificationElement) {
        console.warn("Notification element not found. Unable to display notification.");
        return;
    }

    // Clear any existing timeout
    if (notificationElement.hideTimeout) {
        clearTimeout(notificationElement.hideTimeout);
        delete notificationElement.hideTimeout;
    }

    // Build notification content
    await buildNotificationContent(notificationElement, notification);

    // Show notification with animation
    notificationElement.className = `notification ${notification.type}`;
    notificationElement.style.display = "flex";

    // Trigger animation on next frame for smooth effect
    requestAnimationFrame(() => {
        notificationElement.classList.add("show");
    });

    // Set up auto-hide if not persistent
    if (notification.duration) {
    // Cast via unknown to satisfy differing Node vs browser timer return types
    notificationElement.hideTimeout = /** @type {number} */(/** @type {unknown} */(setTimeout(function () {
            hideNotification(notificationElement);
    }, notification.duration)));
    }

    // Return a promise that resolves after the display duration + animation time
    const totalTime = notification.duration ? notification.duration + 500 : 1000; // Extra time for animations
    // Explicitly annotate resolve parameter for TS inference
    return new Promise((resolve) => {
        setTimeout(() => resolve(undefined), totalTime);
    });
}

/**
 * Builds the notification content with icon, message, and actions
 * @param {HTMLElement} element - Notification DOM element
 * @param {Object} notification - Notification configuration
 */
/**
 * @param {NotificationElement} element
 * @param {QueuedNotification} notification
 */
async function buildNotificationContent(element, notification) {
    // Clear previous content
    element.innerHTML = "";

    // Set accessibility attributes
    element.setAttribute("role", "alert");
    element.setAttribute("aria-label", `${notification.ariaLabel}: ${notification.message}`);
    element.setAttribute("aria-live", "polite");

    // Create main content container
    const contentContainer = document.createElement("div");
    contentContainer.className = "notification-content";
    contentContainer.style.cssText = "display: flex; align-items: center; gap: 12px; flex: 1;";

    // Add icon if provided
    if (notification.icon) {
        const iconElement = document.createElement("span");
        iconElement.className = "notification-icon";
        iconElement.textContent = notification.icon;
        iconElement.style.cssText = "font-size: 1.2rem; flex-shrink: 0;";
        contentContainer.appendChild(iconElement);
    }

    // Add message
    const messageElement = document.createElement("span");
    messageElement.className = "notification-message";
    messageElement.textContent = notification.message;
    messageElement.style.cssText = "flex: 1; text-align: left;";
    contentContainer.appendChild(messageElement);

    element.appendChild(contentContainer);

    // Add action buttons if provided
    if (notification.actions.length > 0) {
        const actionsContainer = document.createElement("div");
        actionsContainer.className = "notification-actions";
        actionsContainer.style.cssText = "display: flex; gap: 8px; margin-left: 12px;";

        notification.actions.forEach((action) => {
            const button = document.createElement("button");
            button.textContent = action.text;
            button.className = action.className || "themed-btn";
            button.style.cssText = "font-size: 0.9rem; padding: 6px 12px;";
            button.onclick = (e) => {
                e.stopPropagation();
                if (action.onClick) action.onClick();
                hideNotification(element);
            };
            actionsContainer.appendChild(button);
        });

        element.appendChild(actionsContainer);
    }

    // Add click handler for main notification
    if (notification.onClick) {
        element.style.cursor = "pointer";
        element.onclick = (e) => {
            const tgt = /** @type {HTMLElement|null} */(e.target instanceof HTMLElement ? e.target : null);
            if (tgt && !tgt.closest(".notification-actions") && notification.onClick) {
                notification.onClick();
                hideNotification(element);
            }
        };
    }

    // Add close button for persistent notifications
    if (!notification.duration) {
        const closeButton = document.createElement("button");
        closeButton.innerHTML = "×";
        closeButton.className = "notification-close";
        closeButton.style.cssText = `
			background: none;
			border: none;
			color: inherit;
			font-size: 1.5rem;
			cursor: pointer;
			padding: 0;
			margin-left: 12px;
			opacity: 0.7;
			transition: opacity 0.2s ease;
		`;
        closeButton.onmouseover = () => (closeButton.style.opacity = "1");
        closeButton.onmouseout = () => (closeButton.style.opacity = "0.7");
        closeButton.onclick = (e) => {
            e.stopPropagation();
            hideNotification(element);
        };
        element.appendChild(closeButton);
    }
}

/**
 * Hides the notification with animation
 * @param {HTMLElement} element - Notification DOM element
 */
/**
 * @param {NotificationElement} element
 */
function hideNotification(element) {
    if (element.hideTimeout) {
        clearTimeout(element.hideTimeout);
        delete element.hideTimeout;
    }

    element.classList.remove("show");

    // Hide element after animation completes
    setTimeout(function () {
        element.style.display = "none";
        element.onclick = null;
        element.style.cursor = "default";
    }, 300); // Match CSS transition duration
}

/**
 * Clears all notifications from the queue and hides current notification
 */
export function clearAllNotifications() {
    notificationQueue = [];
    const notificationElement = document.getElementById("notification");
    if (notificationElement) {
        hideNotification(notificationElement);
    }
    isShowingNotification = false;
}

/**
 * Convenience methods for common notification types
 */
export const notify = {
    /**
     * Shows an info notification
     * @param {string} message - Message to display
     * @param {number} [duration] - Duration in milliseconds
     * @param {Object} [options] - Additional options
     */
    info: (message, duration, options) => showNotification(message, "info", duration, options),

    /**
     * Shows a success notification
     * @param {string} message - Message to display
     * @param {number} [duration] - Duration in milliseconds
     * @param {Object} [options] - Additional options
     */
    success: (message, duration, options) => showNotification(message, "success", duration, options),

    /**
     * Shows an error notification
     * @param {string} message - Message to display
     * @param {number} [duration] - Duration in milliseconds
     * @param {Object} [options] - Additional options
     */
    error: (message, duration, options) => showNotification(message, "error", duration, options),

    /**
     * Shows a warning notification
     * @param {string} message - Message to display
     * @param {number} [duration] - Duration in milliseconds
     * @param {Object} [options] - Additional options
     */
    warning: (message, duration, options) => showNotification(message, "warning", duration, options),

    /**
     * Shows a persistent notification that requires user interaction to dismiss
     * @param {string} message - Message to display
     * @param {string} [type='info'] - Notification type
     * @param {Object} [options] - Additional options
     */
    persistent: (message, type = "info", options = {}) =>
        showNotification(message, /** @type {keyof typeof NOTIFICATION_TYPES} */(type), undefined, { ...options, persistent: true }),

    /**
     * Shows a notification with action buttons
     * @param {string} message - Message to display
     * @param {string} [type='info'] - Notification type
    * @param {NotificationAction[]} actions - Action button definitions
     * @param {Object} [options] - Additional options
     */
    withActions: (message, type = "info", actions = [], options = {}) =>
        showNotification(message, /** @type {keyof typeof NOTIFICATION_TYPES} */(type), undefined, { ...options, actions, persistent: true }),
};
