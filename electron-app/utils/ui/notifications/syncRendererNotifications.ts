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
} from "./notificationTimerRuntime.js";

export type {
    NotificationType,
    RendererNotification,
} from "../../state/domain/rendererNotificationState.js";

const notificationTimerRuntime = getNotificationTimerRuntime();

let notificationHideTimeout: NotificationTimerHandle | undefined;

/**
 * Clear current notification.
 */
export function clearNotification(): void {
    clearNotificationHideTimeout();

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
    timeout = 5000
): void {
    const notificationElement = querySelectorByIdFlexible(
        document,
        "#notification"
    );

    if (!notificationElement) {
        console.warn("[RendererUtils] Notification element not found");
        return;
    }

    clearNotificationHideTimeout();

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
        notificationHideTimeout = notificationTimerRuntime.setTimeout(() => {
            notificationHideTimeout = undefined;
            notificationElement.style.display = "none";
            clearCurrentNotification({
                source: "showNotification",
            });
        }, timeout);
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

function clearNotificationHideTimeout(): void {
    if (notificationHideTimeout !== undefined) {
        notificationTimerRuntime.clearTimeout(notificationHideTimeout);
        notificationHideTimeout = undefined;
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
