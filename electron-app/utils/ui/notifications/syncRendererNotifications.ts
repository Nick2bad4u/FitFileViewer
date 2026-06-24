import {
    clearCurrentNotification,
    getCurrentRendererNotification,
    normalizeRendererNotification,
    setCurrentRendererNotification,
    type NotificationType,
    type RendererNotification,
} from "../../state/domain/rendererNotificationState.js";
import { querySelectorByIdFlexible } from "../dom/elementIdUtils.js";
import {
    getNotificationTimerRuntime,
    type NotificationTimerHandle,
    type NotificationTimerRuntime,
} from "./notificationTimerRuntime.js";

export type {
    NotificationType,
    RendererNotification,
} from "../../state/domain/rendererNotificationState.js";

let notificationHideTimeout: NotificationTimerHandle | undefined;
let notificationHideTimeoutRuntime: NotificationTimerRuntime | undefined;

/**
 * Clear current notification.
 */
export function clearNotification(
    timerRuntime: NotificationTimerRuntime = getNotificationTimerRuntime()
): void {
    clearNotificationHideTimeout(timerRuntime);

    const notificationElement = querySelectorByIdFlexible(
        document,
        "#notification"
    );

    if (notificationElement) {
        notificationElement.style.display = "none";
    }

    clearCurrentNotification({ source: "clearNotification" });
}

/**
 * Get current notification.
 */
export function getCurrentNotification(): null | RendererNotification {
    return getCurrentRendererNotification();
}

/**
 * Show error notification with standard styling.
 */
export function showError(message: string, timeout = 5000): void {
    showNotification(message, "error", timeout);
}

/**
 * Show info notification with standard styling.
 */
export function showInfo(message: string, timeout = 4000): void {
    showNotification(message, "info", timeout);
}

/**
 * Displays a notification message in the UI with state tracking.
 */
export function showNotification(
    message: string,
    type: NotificationType = "error",
    timeout = 5000,
    timerRuntime: NotificationTimerRuntime = getNotificationTimerRuntime()
): void {
    const notificationElement = querySelectorByIdFlexible(
        document,
        "#notification"
    );

    if (!notificationElement) {
        console.warn("[RendererUtils] Notification element not found");
        return;
    }

    clearNotificationHideTimeout(timerRuntime);

    notificationElement.textContent = message;
    notificationElement.className = `notification ${type}`;
    notificationElement.style.display = "block";

    setCurrentRendererNotification(
        {
            message,
            timestamp: Date.now(),
            type,
        } satisfies RendererNotification,
        { source: "showNotification" }
    );

    if (timeout > 0) {
        notificationHideTimeout = timerRuntime.setTimeout(() => {
            notificationHideTimeout = undefined;
            notificationHideTimeoutRuntime = undefined;
            notificationElement.style.display = "none";
            clearCurrentNotification({
                source: "showNotification",
            });
        }, timeout);
        notificationHideTimeoutRuntime = timerRuntime;
    }

    console.log(`[RendererUtils] Notification shown: ${type} - ${message}`);
}

/**
 * Show success notification with standard styling.
 */
export function showSuccess(message: string, timeout = 3000): void {
    showNotification(message, "success", timeout);
}

/**
 * Show warning notification with standard styling.
 */
export function showWarning(message: string, timeout = 4000): void {
    showNotification(message, "warning", timeout);
}

export function updateNotificationFromState(notification: unknown): void {
    const normalizedNotification = normalizeRendererNotification(notification);

    if (normalizedNotification) {
        updateNotificationUI(normalizedNotification);
    }
}

function clearNotificationHideTimeout(
    timerRuntime: NotificationTimerRuntime = getNotificationTimerRuntime()
): void {
    if (notificationHideTimeout !== undefined) {
        const runtime = notificationHideTimeoutRuntime ?? timerRuntime;
        runtime.clearTimeout(notificationHideTimeout);
        notificationHideTimeout = undefined;
        notificationHideTimeoutRuntime = undefined;
    }
}

function updateNotificationUI(notification: RendererNotification): void {
    const notificationElement = querySelectorByIdFlexible(
        document,
        "#notification"
    );

    if (!notificationElement) {
        return;
    }

    notificationElement.textContent = notification.message;
    notificationElement.className = `notification ${notification.type}`;
    notificationElement.style.display = "block";
    notificationElement.setAttribute("role", "alert");
    notificationElement.setAttribute("aria-live", "polite");
}
